alter table public.orders
add column if not exists currency text;

alter table public.orders
add column if not exists stripe_session_id text;

alter table public.orders
add column if not exists stripe_payment_intent_id text;

alter table public.orders
add column if not exists webhook_event_id text;

alter table public.orders
add column if not exists provider_response jsonb;

create unique index if not exists orders_stripe_session_id_idx on public.orders(stripe_session_id) where stripe_session_id is not null;
create unique index if not exists orders_stripe_payment_intent_id_idx on public.orders(stripe_payment_intent_id) where stripe_payment_intent_id is not null;
create unique index if not exists orders_webhook_event_id_idx on public.orders(webhook_event_id) where webhook_event_id is not null;

create table if not exists public.recharge_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  amount_usd numeric,
  amount_cny numeric,
  currency text,
  payment_method text not null,
  status text not null,
  provider_reference text,
  meta jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.payment_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  provider text not null,
  provider_event_id text unique,
  event_type text not null,
  status text not null,
  amount numeric,
  currency text,
  provider_response jsonb,
  created_at timestamptz not null default now()
);

alter table public.recharge_records
add column if not exists amount_usd numeric;

alter table public.recharge_records
add column if not exists amount_cny numeric;

alter table public.recharge_records
add column if not exists currency text;

alter table public.recharge_records
add column if not exists provider_reference text;

alter table public.recharge_records
add column if not exists meta jsonb;

alter table public.recharge_records
add column if not exists paid_at timestamptz;

alter table public.payment_logs
add column if not exists provider_response jsonb;

alter table public.payment_logs
add column if not exists amount numeric;

alter table public.payment_logs
add column if not exists currency text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payment_logs_provider_event_id_key'
      and conrelid = 'public.payment_logs'::regclass
  ) then
    alter table public.payment_logs
    add constraint payment_logs_provider_event_id_key unique (provider_event_id);
  end if;
end;
$$;

create index if not exists recharge_records_user_id_created_at_idx on public.recharge_records(user_id, created_at desc);
create index if not exists recharge_records_payment_method_status_idx on public.recharge_records(payment_method, status);
create index if not exists payment_logs_order_id_idx on public.payment_logs(order_id);
create index if not exists payment_logs_provider_created_at_idx on public.payment_logs(provider, created_at desc);

alter table public.recharge_records enable row level security;
alter table public.payment_logs enable row level security;

revoke all on table public.recharge_records from anon, authenticated;
revoke all on table public.payment_logs from anon, authenticated;

grant select on table public.recharge_records to authenticated;
grant select on table public.payment_logs to authenticated;

drop policy if exists "Users can read own recharge records" on public.recharge_records;
create policy "Users can read own recharge records"
on public.recharge_records
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admins can read all recharge records" on public.recharge_records;
create policy "Admins can read all recharge records"
on public.recharge_records
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  )
);

drop policy if exists "Users can read own payment logs" on public.payment_logs;
create policy "Users can read own payment logs"
on public.payment_logs
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admins can read all payment logs" on public.payment_logs;
create policy "Admins can read all payment logs"
on public.payment_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  )
);

drop function if exists public.complete_stripe_recharge_order(text, text, text, jsonb);
create or replace function public.complete_stripe_recharge_order(
  target_stripe_session_id text,
  target_stripe_payment_intent_id text,
  target_webhook_event_id text,
  target_provider_response jsonb default '{}'::jsonb
)
returns table (
  id uuid,
  user_id uuid,
  amount numeric,
  method text,
  status text,
  note text,
  created_at timestamptz,
  paid_at timestamptz,
  stripe_session_id text,
  stripe_payment_intent_id text,
  amount_usd numeric,
  amount_cny numeric,
  exchange_rate numeric,
  currency text,
  new_balance numeric,
  already_paid boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
  target_profile public.profiles%rowtype;
  was_already_paid boolean := false;
  normalized_session_id text := btrim(coalesce(target_stripe_session_id, ''));
  normalized_payment_intent_id text := nullif(btrim(coalesce(target_stripe_payment_intent_id, '')), '');
  normalized_webhook_event_id text := nullif(btrim(coalesce(target_webhook_event_id, '')), '');
  response_payload jsonb := coalesce(target_provider_response, '{}'::jsonb);
begin
  if normalized_session_id = '' then
    raise exception 'Stripe session id is required';
  end if;

  perform pg_advisory_xact_lock(hashtext('stripe'), hashtext(normalized_session_id));

  select *
  into target_order
  from public.orders
  where orders.stripe_session_id = normalized_session_id
  for update;

  if target_order.id is null then
    raise exception 'Order not found';
  end if;

  if coalesce(target_order.payment_method, target_order.method) <> 'stripe' then
    raise exception 'Order is not a Stripe order';
  end if;

  if target_order.amount_usd is null or target_order.amount_usd <= 0 then
    raise exception 'Stripe USD amount is missing';
  end if;

  if target_order.amount_cny is null or target_order.amount_cny <= 0 then
    raise exception 'Stripe CNY amount is missing';
  end if;

  if target_order.exchange_rate is null or target_order.exchange_rate <= 0 then
    raise exception 'Stripe exchange rate is missing';
  end if;

  if target_order.status = 'paid' then
    was_already_paid := true;
  elsif target_order.status in ('failed', 'rejected') then
    raise exception 'Order cannot be captured';
  else
    update public.profiles
    set balance = balance + target_order.amount_cny
    where profiles.id = target_order.user_id
    returning * into target_profile;

    if target_profile.id is null then
      raise exception 'User profile not found';
    end if;

    update public.orders
    set
      status = 'paid',
      amount = target_order.amount_cny,
      amount_usd = target_order.amount_usd,
      amount_cny = target_order.amount_cny,
      exchange_rate = target_order.exchange_rate,
      currency = coalesce(target_order.currency, 'usd'),
      payment_method = 'stripe',
      paid_at = now(),
      stripe_payment_intent_id = coalesce(normalized_payment_intent_id, target_order.stripe_payment_intent_id),
      webhook_event_id = coalesce(normalized_webhook_event_id, target_order.webhook_event_id),
      provider_response = response_payload
    where orders.id = target_order.id
    returning * into target_order;
  end if;

  if target_profile.id is null then
    select *
    into target_profile
    from public.profiles
    where profiles.id = target_order.user_id;
  end if;

  insert into public.recharge_records (
    order_id,
    user_id,
    amount,
    amount_usd,
    amount_cny,
    currency,
    payment_method,
    status,
    provider_reference,
    paid_at,
    meta
  )
  values (
    target_order.id,
    target_order.user_id,
    target_order.amount_cny,
    target_order.amount_usd,
    target_order.amount_cny,
    coalesce(target_order.currency, 'usd'),
    'stripe',
    target_order.status,
    target_order.stripe_session_id,
    target_order.paid_at,
    jsonb_build_object(
      'stripe_session_id', target_order.stripe_session_id,
      'stripe_payment_intent_id', target_order.stripe_payment_intent_id,
      'webhook_event_id', target_order.webhook_event_id,
      'exchange_rate', target_order.exchange_rate
    )
  )
  on conflict (order_id) do update
  set
    amount = excluded.amount,
    amount_usd = excluded.amount_usd,
    amount_cny = excluded.amount_cny,
    currency = excluded.currency,
    payment_method = excluded.payment_method,
    status = excluded.status,
    provider_reference = excluded.provider_reference,
    paid_at = excluded.paid_at,
    meta = excluded.meta;

  insert into public.payment_logs (
    order_id,
    user_id,
    provider,
    provider_event_id,
    event_type,
    status,
    amount,
    currency,
    provider_response
  )
  values (
    target_order.id,
    target_order.user_id,
    'stripe',
    normalized_webhook_event_id,
    'checkout.session.completed',
    case when was_already_paid then 'already_paid' else 'paid' end,
    target_order.amount_usd,
    coalesce(target_order.currency, 'usd'),
    response_payload
  )
  on conflict (provider_event_id) do update
  set
    order_id = excluded.order_id,
    user_id = excluded.user_id,
    status = excluded.status,
    amount = excluded.amount,
    currency = excluded.currency,
    provider_response = excluded.provider_response;

  return query
  select
    target_order.id,
    target_order.user_id,
    target_order.amount,
    target_order.method,
    target_order.status,
    target_order.note,
    target_order.created_at,
    target_order.paid_at,
    target_order.stripe_session_id,
    target_order.stripe_payment_intent_id,
    target_order.amount_usd,
    target_order.amount_cny,
    target_order.exchange_rate,
    coalesce(target_order.currency, 'usd'),
    target_profile.balance,
    was_already_paid;
end;
$$;

revoke all on function public.complete_stripe_recharge_order(text, text, text, jsonb) from public;
grant execute on function public.complete_stripe_recharge_order(text, text, text, jsonb) to service_role;

drop function if exists public.list_recharge_orders_admin();
drop function if exists public.list_recharge_orders_admin(text);
drop function if exists public.list_recharge_orders_admin(text, text, text, text, integer);
create or replace function public.list_recharge_orders_admin(
  payment_method_filter text default 'all',
  status_filter text default 'pending_submitted',
  search_order text default null,
  search_email text default null,
  limit_count integer default 100
)
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  amount numeric,
  method text,
  payment_method text,
  status text,
  note text,
  review_note text,
  created_at timestamptz,
  paid_at timestamptz,
  reviewed_at timestamptz,
  paypal_order_id text,
  paypal_capture_id text,
  stripe_session_id text,
  stripe_payment_intent_id text,
  amount_usd numeric,
  amount_cny numeric,
  exchange_rate numeric,
  currency text,
  webhook_event_id text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'not admin';
  end if;

  return query
  with review_orders as (
    select
      orders.*,
      coalesce(
        orders.payment_method,
        case
          when orders.method = 'manual_transfer' then 'manual'
          else orders.method
        end
      ) as normalized_payment_method
    from public.orders
  )
  select
    review_orders.id,
    review_orders.user_id,
    profiles.email,
    review_orders.amount,
    review_orders.method,
    review_orders.normalized_payment_method,
    review_orders.status,
    review_orders.note,
    review_orders.review_note,
    review_orders.created_at,
    review_orders.paid_at,
    review_orders.reviewed_at,
    review_orders.paypal_order_id,
    review_orders.paypal_capture_id,
    review_orders.stripe_session_id,
    review_orders.stripe_payment_intent_id,
    review_orders.amount_usd,
    review_orders.amount_cny,
    review_orders.exchange_rate,
    review_orders.currency,
    review_orders.webhook_event_id
  from review_orders
  left join public.profiles on profiles.id = review_orders.user_id
  where review_orders.normalized_payment_method in ('manual', 'alipay_manual', 'wechat_manual', 'paypal', 'stripe')
    and (
      coalesce(nullif(payment_method_filter, ''), 'all') = 'all'
      or review_orders.normalized_payment_method = payment_method_filter
      or (payment_method_filter = 'manual' and review_orders.method = 'manual_transfer')
    )
    and (
      coalesce(nullif(status_filter, ''), 'pending_submitted') in ('pending_submitted', 'reviewing')
        and review_orders.status in ('pending', 'submitted')
      or coalesce(nullif(status_filter, ''), 'pending_submitted') = 'all'
      or review_orders.status = status_filter
    )
    and (
      nullif(btrim(search_order), '') is null
      or review_orders.id::text ilike '%' || btrim(search_order) || '%'
      or coalesce(review_orders.paypal_order_id, '') ilike '%' || btrim(search_order) || '%'
      or coalesce(review_orders.paypal_capture_id, '') ilike '%' || btrim(search_order) || '%'
      or coalesce(review_orders.stripe_session_id, '') ilike '%' || btrim(search_order) || '%'
      or coalesce(review_orders.stripe_payment_intent_id, '') ilike '%' || btrim(search_order) || '%'
    )
    and (
      nullif(btrim(search_email), '') is null
      or profiles.email ilike '%' || btrim(search_email) || '%'
    )
  order by
    case when review_orders.status in ('pending', 'submitted') then 0 else 1 end,
    review_orders.created_at desc
  limit greatest(1, least(coalesce(limit_count, 100), 300));
end;
$$;

revoke all on function public.list_recharge_orders_admin(text, text, text, text, integer) from public;
grant execute on function public.list_recharge_orders_admin(text, text, text, text, integer) to authenticated;

drop function if exists public.list_user_orders_admin(uuid, integer);
create or replace function public.list_user_orders_admin(
  target_user_id uuid,
  limit_count integer default 20
)
returns table (
  id uuid,
  amount numeric,
  method text,
  payment_method text,
  status text,
  note text,
  review_note text,
  created_at timestamptz,
  paid_at timestamptz,
  reviewed_at timestamptz,
  amount_usd numeric,
  amount_cny numeric,
  exchange_rate numeric,
  paypal_order_id text,
  paypal_capture_id text,
  stripe_session_id text,
  stripe_payment_intent_id text,
  currency text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'Only admins can read user orders';
  end if;

  return query
  select
    orders.id,
    orders.amount,
    orders.method,
    coalesce(
      orders.payment_method,
      case
        when orders.method = 'manual_transfer' then 'manual'
        else orders.method
      end
    ),
    orders.status,
    orders.note,
    orders.review_note,
    orders.created_at,
    orders.paid_at,
    orders.reviewed_at,
    orders.amount_usd,
    orders.amount_cny,
    orders.exchange_rate,
    orders.paypal_order_id,
    orders.paypal_capture_id,
    orders.stripe_session_id,
    orders.stripe_payment_intent_id,
    orders.currency
  from public.orders
  where orders.user_id = target_user_id
  order by orders.created_at desc
  limit greatest(1, least(coalesce(limit_count, 20), 100));
end;
$$;

revoke all on function public.list_user_orders_admin(uuid, integer) from public;
grant execute on function public.list_user_orders_admin(uuid, integer) to authenticated;
