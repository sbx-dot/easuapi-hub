create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  balance numeric not null default 0,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  created_at timestamptz not null default now(),
  revoked boolean not null default false
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  method text not null,
  status text not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  paypal_order_id text,
  paypal_capture_id text
);

alter table public.orders
add column if not exists note text;

alter table public.orders
add column if not exists paid_at timestamptz;

alter table public.orders
add column if not exists paypal_order_id text;

alter table public.orders
add column if not exists paypal_capture_id text;

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  api_key_id uuid references public.api_keys(id) on delete set null,
  api_key_prefix text,
  model text not null,
  supplier_name text,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  cost numeric not null default 0,
  status text not null default 'success',
  error_code text,
  error_message text,
  http_status integer,
  request_id text,
  latency_ms integer,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

alter table public.usage_logs
alter column user_id drop not null;

alter table public.usage_logs
add column if not exists api_key_id uuid references public.api_keys(id) on delete set null;

alter table public.usage_logs
add column if not exists api_key_prefix text;

alter table public.usage_logs
add column if not exists supplier_name text;

alter table public.usage_logs
add column if not exists error_code text;

alter table public.usage_logs
add column if not exists error_message text;

alter table public.usage_logs
add column if not exists http_status integer;

alter table public.usage_logs
add column if not exists request_id text;

alter table public.usage_logs
add column if not exists latency_ms integer;

alter table public.usage_logs
add column if not exists ip_hash text;

alter table public.usage_logs
add column if not exists user_agent_hash text;

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_name text not null,
  base_url text not null,
  api_key_encrypted text,
  provider_type text not null default 'openai-compatible',
  enabled boolean not null default true,
  priority integer not null default 100,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  upstream_model text not null,
  display_name text not null,
  supplier_name text not null default 'deepseek',
  provider text not null default 'deepseek',
  input_price_per_1k numeric not null default 0,
  output_price_per_1k numeric not null default 0,
  input_cost_per_1k numeric not null default 0,
  output_cost_per_1k numeric not null default 0,
  enabled boolean not null default true,
  description text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.models
add column if not exists supplier_name text not null default 'deepseek';

alter table public.models
add column if not exists input_cost_per_1k numeric not null default 0;

alter table public.models
add column if not exists output_cost_per_1k numeric not null default 0;

create index if not exists api_keys_user_id_idx on public.api_keys(user_id);
create index if not exists api_keys_user_id_revoked_idx on public.api_keys(user_id, revoked);
create unique index if not exists api_keys_key_hash_idx on public.api_keys(key_hash);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_created_at_idx on public.orders(status, created_at);
create unique index if not exists orders_paypal_order_id_idx on public.orders(paypal_order_id) where paypal_order_id is not null;
create index if not exists usage_logs_user_id_idx on public.usage_logs(user_id);
create index if not exists usage_logs_supplier_name_idx on public.usage_logs(supplier_name);
create index if not exists usage_logs_api_key_id_idx on public.usage_logs(api_key_id);
create index if not exists usage_logs_status_http_status_idx on public.usage_logs(status, http_status);
create index if not exists usage_logs_created_at_idx on public.usage_logs(created_at);
create index if not exists usage_logs_error_code_idx on public.usage_logs(error_code);
create index if not exists suppliers_enabled_priority_idx on public.suppliers(enabled, priority);
create index if not exists models_enabled_sort_order_idx on public.models(enabled, sort_order);
create index if not exists models_supplier_name_idx on public.models(supplier_name);

alter table public.profiles enable row level security;
alter table public.api_keys enable row level security;
alter table public.orders enable row level security;
alter table public.usage_logs enable row level security;
alter table public.suppliers enable row level security;
alter table public.models enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.api_keys from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.usage_logs from anon, authenticated;
revoke all on table public.suppliers from anon, authenticated;
revoke all on table public.models from anon, authenticated;

grant select on table public.profiles to authenticated;
grant select on table public.api_keys to authenticated;
grant insert (user_id, name, key_prefix, key_hash) on table public.api_keys to authenticated;
grant update (revoked) on table public.api_keys to authenticated;
grant select on table public.orders to authenticated;
grant select on table public.usage_logs to authenticated;
grant select (
  id,
  name,
  display_name,
  base_url,
  provider_type,
  enabled,
  priority,
  notes,
  created_at,
  updated_at
) on table public.suppliers to authenticated;
grant insert (
  name,
  display_name,
  base_url,
  api_key_encrypted,
  provider_type,
  enabled,
  priority,
  notes
) on table public.suppliers to authenticated;
grant update (
  display_name,
  base_url,
  api_key_encrypted,
  provider_type,
  enabled,
  priority,
  notes
) on table public.suppliers to authenticated;
grant select on table public.models to anon, authenticated;
grant insert (
  name,
  upstream_model,
  display_name,
  supplier_name,
  provider,
  input_price_per_1k,
  output_price_per_1k,
  input_cost_per_1k,
  output_cost_per_1k,
  enabled,
  description,
  sort_order
) on table public.models to authenticated;
grant update (
  upstream_model,
  display_name,
  supplier_name,
  provider,
  input_price_per_1k,
  output_price_per_1k,
  input_cost_per_1k,
  output_cost_per_1k,
  enabled,
  description,
  sort_order
) on table public.models to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_models_updated_at on public.models;
create trigger set_models_updated_at
before update on public.models
for each row execute function public.set_updated_at();

drop trigger if exists set_suppliers_updated_at on public.suppliers;
create trigger set_suppliers_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

insert into public.suppliers (
  name,
  display_name,
  base_url,
  provider_type,
  enabled,
  priority
)
values
  (
    'deepseek',
    'DeepSeek 官方',
    'https://api.deepseek.com/v1',
    'openai-compatible',
    true,
    10
  )
on conflict (name) do update
set
  display_name = excluded.display_name,
  base_url = excluded.base_url,
  provider_type = excluded.provider_type,
  enabled = excluded.enabled,
  priority = excluded.priority;

insert into public.models (
  name,
  upstream_model,
  display_name,
  supplier_name,
  provider,
  input_price_per_1k,
  output_price_per_1k,
  enabled,
  description,
  sort_order
)
values
  (
    'deepseek-chat',
    'deepseek-chat',
    'DeepSeek Chat',
    'deepseek',
    'deepseek',
    0.01,
    0.01,
    true,
    '适合通用聊天、写作、代码和轻量分析。',
    10
  ),
  (
    'deepseek-reasoner',
    'deepseek-reasoner',
    'DeepSeek Reasoner',
    'deepseek',
    'deepseek',
    0.02,
    0.02,
    true,
    '适合复杂推理、规划和多步骤问题。',
    20
  ),
  (
    'deepseek-v4-pro',
    'deepseek-v4-pro',
    'DeepSeek V4 Pro',
    'deepseek',
    'deepseek',
    0.02,
    0.02,
    true,
    'DeepSeek V4 Pro 模型。',
    30
  )
on conflict (name) do update
set
  upstream_model = excluded.upstream_model,
  display_name = excluded.display_name,
  supplier_name = excluded.supplier_name,
  provider = excluded.provider,
  input_price_per_1k = excluded.input_price_per_1k,
  output_price_per_1k = excluded.output_price_per_1k,
  enabled = excluded.enabled,
  description = excluded.description,
  sort_order = excluded.sort_order;

drop function if exists public.manual_recharge(text, numeric, text);

drop function if exists public.create_recharge_order(numeric, text);
create or replace function public.create_recharge_order(
  recharge_amount numeric,
  recharge_note text default null
)
returns table (
  id uuid,
  user_id uuid,
  amount numeric,
  method text,
  status text,
  note text,
  created_at timestamptz,
  paid_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  inserted_order public.orders%rowtype;
begin
  if actor_id is null then
    raise exception 'not authenticated';
  end if;

  select profiles.role
  into actor_role
  from public.profiles
  where profiles.id = actor_id;

  if actor_role is null or actor_role not in ('admin', 'user') then
    raise exception 'User profile not found';
  end if;

  if recharge_amount is null or recharge_amount <= 0 then
    raise exception 'Recharge amount must be greater than 0';
  end if;

  insert into public.orders (user_id, amount, method, status, note)
  values (actor_id, recharge_amount, 'manual_transfer', 'pending', nullif(btrim(coalesce(recharge_note, '')), ''))
  returning * into inserted_order;

  return query
  select
    inserted_order.id,
    inserted_order.user_id,
    inserted_order.amount,
    inserted_order.method,
    inserted_order.status,
    inserted_order.note,
    inserted_order.created_at,
    inserted_order.paid_at;
end;
$$;

revoke all on function public.create_recharge_order(numeric, text) from public;
grant execute on function public.create_recharge_order(numeric, text) to authenticated;

drop function if exists public.submit_recharge_order(uuid);
create or replace function public.submit_recharge_order(target_order_id uuid)
returns table (
  id uuid,
  user_id uuid,
  amount numeric,
  method text,
  status text,
  note text,
  created_at timestamptz,
  paid_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  target_order public.orders%rowtype;
begin
  if actor_id is null then
    raise exception 'not authenticated';
  end if;

  select profiles.role
  into actor_role
  from public.profiles
  where profiles.id = actor_id;

  if actor_role is null or actor_role not in ('admin', 'user') then
    raise exception 'User profile not found';
  end if;

  select *
  into target_order
  from public.orders
  where orders.id = target_order_id
    and orders.user_id = actor_id
  for update;

  if target_order.id is null then
    raise exception 'Order not found';
  end if;

  if target_order.method <> 'manual_transfer' then
    raise exception 'Only manual transfer orders can be submitted';
  end if;

  if target_order.status = 'paid' then
    raise exception 'Order already paid';
  end if;

  if target_order.status = 'rejected' then
    raise exception 'Order already rejected';
  end if;

  if target_order.status not in ('pending', 'submitted') then
    raise exception 'Order cannot be submitted';
  end if;

  if target_order.status = 'pending' then
    update public.orders
    set status = 'submitted'
    where orders.id = target_order_id
    returning * into target_order;
  end if;

  return query
  select
    target_order.id,
    target_order.user_id,
    target_order.amount,
    target_order.method,
    target_order.status,
    target_order.note,
    target_order.created_at,
    target_order.paid_at;
end;
$$;

revoke all on function public.submit_recharge_order(uuid) from public;
grant execute on function public.submit_recharge_order(uuid) to authenticated;

drop function if exists public.list_recharge_orders_admin();
create or replace function public.list_recharge_orders_admin()
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  amount numeric,
  method text,
  status text,
  note text,
  created_at timestamptz,
  paid_at timestamptz
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
  select
    orders.id,
    orders.user_id,
    profiles.email,
    orders.amount,
    orders.method,
    orders.status,
    orders.note,
    orders.created_at,
    orders.paid_at
  from public.orders
  left join public.profiles on profiles.id = orders.user_id
  where orders.method = 'manual_transfer'
    and orders.status in ('pending', 'submitted')
  order by orders.created_at asc;
end;
$$;

revoke all on function public.list_recharge_orders_admin() from public;
grant execute on function public.list_recharge_orders_admin() to authenticated;

drop function if exists public.approve_recharge_order_admin(uuid);
create or replace function public.approve_recharge_order_admin(target_order_id uuid)
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  amount numeric,
  method text,
  status text,
  note text,
  created_at timestamptz,
  paid_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
  updated_order public.orders%rowtype;
  target_email text;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'not admin';
  end if;

  select *
  into target_order
  from public.orders
  where orders.id = target_order_id
  for update;

  if target_order.id is null then
    raise exception 'Order not found';
  end if;

  if target_order.method <> 'manual_transfer' then
    raise exception 'Only manual transfer orders can be approved here';
  end if;

  if target_order.status = 'paid' then
    raise exception 'Order already paid';
  end if;

  if target_order.status = 'rejected' then
    raise exception 'Order already rejected';
  end if;

  if target_order.status not in ('pending', 'submitted') then
    raise exception 'Order cannot be approved';
  end if;

  update public.profiles
  set balance = balance + target_order.amount
  where profiles.id = target_order.user_id
  returning profiles.email into target_email;

  if not found then
    raise exception 'User profile not found';
  end if;

  update public.orders
  set
    status = 'paid',
    note = 'admin approved',
    paid_at = now()
  where orders.id = target_order.id
  returning * into updated_order;

  return query
  select
    updated_order.id,
    updated_order.user_id,
    target_email,
    updated_order.amount,
    updated_order.method,
    updated_order.status,
    updated_order.note,
    updated_order.created_at,
    updated_order.paid_at;
end;
$$;

revoke all on function public.approve_recharge_order_admin(uuid) from public;
grant execute on function public.approve_recharge_order_admin(uuid) to authenticated;

drop function if exists public.reject_recharge_order_admin(uuid);
create or replace function public.reject_recharge_order_admin(target_order_id uuid)
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  amount numeric,
  method text,
  status text,
  note text,
  created_at timestamptz,
  paid_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
  updated_order public.orders%rowtype;
  target_email text;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'not admin';
  end if;

  select *
  into target_order
  from public.orders
  where orders.id = target_order_id
  for update;

  if target_order.id is null then
    raise exception 'Order not found';
  end if;

  if target_order.method <> 'manual_transfer' then
    raise exception 'Only manual transfer orders can be rejected here';
  end if;

  if target_order.status = 'paid' then
    raise exception 'Order already paid';
  end if;

  if target_order.status = 'rejected' then
    raise exception 'Order already rejected';
  end if;

  if target_order.status not in ('pending', 'submitted') then
    raise exception 'Order cannot be rejected';
  end if;

  select profiles.email
  into target_email
  from public.profiles
  where profiles.id = target_order.user_id;

  update public.orders
  set
    status = 'rejected',
    note = 'admin rejected'
  where orders.id = target_order.id
  returning * into updated_order;

  return query
  select
    updated_order.id,
    updated_order.user_id,
    target_email,
    updated_order.amount,
    updated_order.method,
    updated_order.status,
    updated_order.note,
    updated_order.created_at,
    updated_order.paid_at;
end;
$$;

revoke all on function public.reject_recharge_order_admin(uuid) from public;
grant execute on function public.reject_recharge_order_admin(uuid) to authenticated;

drop function if exists public.complete_paypal_recharge_order(text, text);
create or replace function public.complete_paypal_recharge_order(
  target_paypal_order_id text,
  target_paypal_capture_id text
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
  paypal_order_id text,
  paypal_capture_id text,
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
begin
  if nullif(btrim(coalesce(target_paypal_order_id, '')), '') is null then
    raise exception 'PayPal order id is required';
  end if;

  if nullif(btrim(coalesce(target_paypal_capture_id, '')), '') is null then
    raise exception 'PayPal capture id is required';
  end if;

  select *
  into target_order
  from public.orders
  where orders.paypal_order_id = btrim(target_paypal_order_id)
  for update;

  if target_order.id is null then
    raise exception 'Order not found';
  end if;

  if target_order.method <> 'paypal' then
    raise exception 'Order is not a PayPal order';
  end if;

  if target_order.status = 'paid' then
    was_already_paid := true;
  elsif target_order.status in ('failed', 'canceled', 'rejected') then
    raise exception 'Order cannot be captured';
  else
    update public.profiles
    set balance = balance + target_order.amount
    where profiles.id = target_order.user_id
    returning * into target_profile;

    if target_profile.id is null then
      raise exception 'User profile not found';
    end if;

    update public.orders
    set
      status = 'paid',
      paid_at = now(),
      paypal_capture_id = btrim(target_paypal_capture_id)
    where orders.id = target_order.id
    returning * into target_order;
  end if;

  if target_profile.id is null then
    select *
    into target_profile
    from public.profiles
    where profiles.id = target_order.user_id;
  end if;

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
    target_order.paypal_order_id,
    target_order.paypal_capture_id,
    target_profile.balance,
    was_already_paid;
end;
$$;

revoke all on function public.complete_paypal_recharge_order(text, text) from public;
grant execute on function public.complete_paypal_recharge_order(text, text) to service_role;

drop function if exists public.list_suppliers_admin();
create or replace function public.list_suppliers_admin()
returns table (
  id uuid,
  name text,
  display_name text,
  base_url text,
  provider_type text,
  enabled boolean,
  priority integer,
  notes text,
  api_key_configured boolean,
  created_at timestamptz,
  updated_at timestamptz
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
    raise exception 'Only admins can read suppliers';
  end if;

  return query
  select
    suppliers.id,
    suppliers.name,
    suppliers.display_name,
    suppliers.base_url,
    suppliers.provider_type,
    suppliers.enabled,
    suppliers.priority,
    suppliers.notes,
    nullif(btrim(coalesce(suppliers.api_key_encrypted, '')), '') is not null,
    suppliers.created_at,
    suppliers.updated_at
  from public.suppliers
  order by suppliers.priority asc, suppliers.created_at asc;
end;
$$;

revoke all on function public.list_suppliers_admin() from public;
grant execute on function public.list_suppliers_admin() to authenticated;

drop function if exists public.list_users_admin(text, text, text, text);
create or replace function public.list_users_admin(
  search_email text default null,
  role_filter text default 'all',
  sort_key text default 'created_at',
  sort_direction text default 'desc'
)
returns table (
  user_id uuid,
  email text,
  role text,
  balance numeric,
  api_key_count bigint,
  total_recharge_amount numeric,
  total_spend_amount numeric,
  last_usage_at timestamptz,
  created_at timestamptz
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
    raise exception 'Only admins can read users';
  end if;

  return query
  with key_summary as (
    select
      api_keys.user_id,
      count(*) filter (where api_keys.revoked = false) as api_key_count
    from public.api_keys
    group by api_keys.user_id
  ),
  order_summary as (
    select
      orders.user_id,
      coalesce(sum(orders.amount) filter (where orders.status = 'paid' and orders.amount > 0), 0) as total_recharge_amount
    from public.orders
    group by orders.user_id
  ),
  usage_summary as (
    select
      usage_logs.user_id,
      coalesce(sum(usage_logs.cost), 0) as total_spend_amount,
      max(usage_logs.created_at) as last_usage_at
    from public.usage_logs
    group by usage_logs.user_id
  )
  select
    profiles.id,
    profiles.email,
    profiles.role,
    profiles.balance,
    coalesce(key_summary.api_key_count, 0),
    coalesce(order_summary.total_recharge_amount, 0),
    coalesce(usage_summary.total_spend_amount, 0),
    usage_summary.last_usage_at,
    profiles.created_at
  from public.profiles
  left join key_summary on key_summary.user_id = profiles.id
  left join order_summary on order_summary.user_id = profiles.id
  left join usage_summary on usage_summary.user_id = profiles.id
  where
    (nullif(btrim(search_email), '') is null or profiles.email ilike '%' || btrim(search_email) || '%')
    and (
      coalesce(nullif(role_filter, ''), 'all') = 'all'
      or profiles.role = role_filter
    )
  order by
    case when sort_key = 'balance' and sort_direction = 'desc' then profiles.balance end desc nulls last,
    case when sort_key = 'balance' and sort_direction = 'asc' then profiles.balance end asc nulls last,
    case when sort_key = 'last_usage_at' and sort_direction = 'desc' then usage_summary.last_usage_at end desc nulls last,
    case when sort_key = 'last_usage_at' and sort_direction = 'asc' then usage_summary.last_usage_at end asc nulls last,
    profiles.created_at desc;
end;
$$;

revoke all on function public.list_users_admin(text, text, text, text) from public;
grant execute on function public.list_users_admin(text, text, text, text) to authenticated;

drop function if exists public.set_user_role_admin(uuid, text);
create or replace function public.set_user_role_admin(
  target_user_id uuid,
  target_role text
)
returns table (
  user_id uuid,
  email text,
  role text,
  balance numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles%rowtype;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'Only admins can update user roles';
  end if;

  if target_role not in ('admin', 'user') then
    raise exception 'Role must be admin or user';
  end if;

  update public.profiles
  set role = target_role
  where id = target_user_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'User profile not found';
  end if;

  return query
  select
    updated_profile.id,
    updated_profile.email,
    updated_profile.role,
    updated_profile.balance;
end;
$$;

revoke all on function public.set_user_role_admin(uuid, text) from public;
grant execute on function public.set_user_role_admin(uuid, text) to authenticated;

drop function if exists public.adjust_user_balance_admin(uuid, numeric, text);
create or replace function public.adjust_user_balance_admin(
  target_user_id uuid,
  adjustment_amount numeric,
  adjustment_note text
)
returns table (
  order_id uuid,
  user_id uuid,
  email text,
  new_balance numeric,
  amount numeric,
  note text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile public.profiles%rowtype;
  inserted_order public.orders%rowtype;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'Only admins can adjust user balances';
  end if;

  if adjustment_amount is null or adjustment_amount = 0 then
    raise exception 'Adjustment amount must not be 0';
  end if;

  if nullif(btrim(coalesce(adjustment_note, '')), '') is null then
    raise exception 'Adjustment note is required';
  end if;

  select *
  into target_profile
  from public.profiles
  where id = target_user_id
  for update;

  if target_profile.id is null then
    raise exception 'User profile not found';
  end if;

  if target_profile.balance + adjustment_amount < 0 then
    raise exception 'Balance cannot be negative';
  end if;

  update public.profiles
  set balance = balance + adjustment_amount
  where id = target_user_id
  returning * into target_profile;

  insert into public.orders (user_id, amount, method, status, note)
  values (target_user_id, adjustment_amount, 'admin_adjust', 'paid', btrim(adjustment_note))
  returning * into inserted_order;

  return query
  select
    inserted_order.id,
    target_profile.id,
    target_profile.email,
    target_profile.balance,
    inserted_order.amount,
    inserted_order.note;
end;
$$;

revoke all on function public.adjust_user_balance_admin(uuid, numeric, text) from public;
grant execute on function public.adjust_user_balance_admin(uuid, numeric, text) to authenticated;

drop function if exists public.list_user_api_keys_admin(uuid);
create or replace function public.list_user_api_keys_admin(target_user_id uuid)
returns table (
  id uuid,
  name text,
  key_prefix text,
  revoked boolean,
  created_at timestamptz
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
    raise exception 'Only admins can read user api keys';
  end if;

  return query
  select
    api_keys.id,
    api_keys.name,
    api_keys.key_prefix,
    api_keys.revoked,
    api_keys.created_at
  from public.api_keys
  where api_keys.user_id = target_user_id
  order by api_keys.created_at desc
  limit 50;
end;
$$;

revoke all on function public.list_user_api_keys_admin(uuid) from public;
grant execute on function public.list_user_api_keys_admin(uuid) to authenticated;

drop function if exists public.list_user_usage_logs_admin(uuid, integer);
create or replace function public.list_user_usage_logs_admin(
  target_user_id uuid,
  limit_count integer default 20
)
returns table (
  id uuid,
  model text,
  supplier_name text,
  prompt_tokens integer,
  completion_tokens integer,
  cost numeric,
  status text,
  created_at timestamptz
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
    raise exception 'Only admins can read user usage logs';
  end if;

  return query
  select
    usage_logs.id,
    usage_logs.model,
    usage_logs.supplier_name,
    usage_logs.prompt_tokens,
    usage_logs.completion_tokens,
    usage_logs.cost,
    usage_logs.status,
    usage_logs.created_at
  from public.usage_logs
  where usage_logs.user_id = target_user_id
  order by usage_logs.created_at desc
  limit greatest(1, least(coalesce(limit_count, 20), 100));
end;
$$;

revoke all on function public.list_user_usage_logs_admin(uuid, integer) from public;
grant execute on function public.list_user_usage_logs_admin(uuid, integer) to authenticated;

drop function if exists public.list_user_orders_admin(uuid, integer);
create or replace function public.list_user_orders_admin(
  target_user_id uuid,
  limit_count integer default 20
)
returns table (
  id uuid,
  amount numeric,
  method text,
  status text,
  note text,
  created_at timestamptz,
  paid_at timestamptz
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
    orders.status,
    orders.note,
    orders.created_at,
    orders.paid_at
  from public.orders
  where orders.user_id = target_user_id
  order by orders.created_at desc
  limit greatest(1, least(coalesce(limit_count, 20), 100));
end;
$$;

revoke all on function public.list_user_orders_admin(uuid, integer) from public;
grant execute on function public.list_user_orders_admin(uuid, integer) to authenticated;

drop function if exists public.get_finance_summary_admin(text);
create or replace function public.get_finance_summary_admin(range_filter text default 'today')
returns table (
  total_users bigint,
  total_balance numeric,
  total_recharge_amount numeric,
  total_consumption_amount numeric,
  today_consumption_amount numeric,
  today_call_count bigint,
  today_failed_count bigint,
  today_failure_rate numeric,
  average_cost_per_call numeric,
  cost_configured boolean,
  estimated_upstream_cost numeric,
  estimated_gross_profit numeric,
  range_call_count bigint,
  range_success_count bigint,
  range_failed_count bigint,
  range_consumption_amount numeric,
  range_recharge_amount numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  range_start timestamptz;
  today_start timestamptz := date_trunc('day', now());
  has_cost_config boolean;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'Only admins can read finance summary';
  end if;

  range_start := case coalesce(range_filter, 'today')
    when 'today' then today_start
    when '7d' then now() - interval '7 days'
    when '30d' then now() - interval '30 days'
    else null
  end;

  select exists (
    select 1
    from public.models
    where input_cost_per_1k > 0
       or output_cost_per_1k > 0
  )
  into has_cost_config;

  return query
  with usage_with_cost as (
    select
      usage_logs.*,
      coalesce(models.input_cost_per_1k, 0) as input_cost_per_1k,
      coalesce(models.output_cost_per_1k, 0) as output_cost_per_1k
    from public.usage_logs
    left join public.models on models.name = usage_logs.model
  ),
  all_usage as (
    select
      count(*) as call_count,
      count(*) filter (where status = 'success') as success_count,
      count(*) filter (where status <> 'success') as failed_count,
      coalesce(sum(cost) filter (where status = 'success'), 0) as consumption_amount,
      coalesce(
        sum(
          ((prompt_tokens::numeric / 1000) * input_cost_per_1k)
          + ((completion_tokens::numeric / 1000) * output_cost_per_1k)
        ) filter (where status = 'success'),
        0
      ) as upstream_cost
    from usage_with_cost
  ),
  today_usage as (
    select
      count(*) as call_count,
      count(*) filter (where status <> 'success') as failed_count,
      coalesce(sum(cost) filter (where status = 'success'), 0) as consumption_amount
    from public.usage_logs
    where created_at >= today_start
  ),
  range_usage as (
    select
      count(*) as call_count,
      count(*) filter (where status = 'success') as success_count,
      count(*) filter (where status <> 'success') as failed_count,
      coalesce(sum(cost) filter (where status = 'success'), 0) as consumption_amount
    from public.usage_logs
    where range_start is null or created_at >= range_start
  ),
  recharge_all as (
    select coalesce(sum(amount), 0) as amount
    from public.orders
    where amount > 0
      and (status = 'paid' or method in ('manual', 'admin_adjust'))
  ),
  recharge_range as (
    select coalesce(sum(amount), 0) as amount
    from public.orders
    where amount > 0
      and (status = 'paid' or method in ('manual', 'admin_adjust'))
      and (range_start is null or created_at >= range_start)
  )
  select
    (select count(*) from public.profiles)::bigint,
    (select coalesce(sum(balance), 0) from public.profiles),
    recharge_all.amount,
    all_usage.consumption_amount,
    today_usage.consumption_amount,
    today_usage.call_count::bigint,
    today_usage.failed_count::bigint,
    case
      when today_usage.call_count > 0 then round((today_usage.failed_count::numeric / today_usage.call_count::numeric) * 100, 2)
      else 0
    end,
    case
      when all_usage.success_count > 0 then round(all_usage.consumption_amount / all_usage.success_count::numeric, 6)
      else 0
    end,
    has_cost_config,
    case when has_cost_config then all_usage.upstream_cost else 0 end,
    case when has_cost_config then all_usage.consumption_amount - all_usage.upstream_cost else 0 end,
    range_usage.call_count::bigint,
    range_usage.success_count::bigint,
    range_usage.failed_count::bigint,
    range_usage.consumption_amount,
    recharge_range.amount
  from all_usage, today_usage, range_usage, recharge_all, recharge_range;
end;
$$;

revoke all on function public.get_finance_summary_admin(text) from public;
grant execute on function public.get_finance_summary_admin(text) to authenticated;

drop function if exists public.get_finance_rankings_admin(text);
create or replace function public.get_finance_rankings_admin(range_filter text default '30d')
returns table (
  ranking_type text,
  label text,
  email text,
  model text,
  supplier_name text,
  total_amount numeric,
  call_count bigint,
  success_count bigint,
  failed_count bigint,
  token_count bigint,
  order_count bigint,
  last_usage_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  range_start timestamptz;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'Only admins can read finance rankings';
  end if;

  range_start := case coalesce(range_filter, '30d')
    when 'today' then date_trunc('day', now())
    when '7d' then now() - interval '7 days'
    when '30d' then now() - interval '30 days'
    else null
  end;

  return query
  with filtered_usage as (
    select *
    from public.usage_logs
    where range_start is null or created_at >= range_start
  ),
  filtered_orders as (
    select *
    from public.orders
    where amount > 0
      and (status = 'paid' or method in ('manual', 'admin_adjust'))
      and (range_start is null or created_at >= range_start)
  ),
  top_spenders as (
    select
      'top_spenders'::text as ranking_type,
      coalesce(profiles.email, 'unknown') as label,
      profiles.email,
      null::text as model,
      null::text as supplier_name,
      coalesce(sum(filtered_usage.cost) filter (where filtered_usage.status = 'success'), 0) as total_amount,
      count(*)::bigint as call_count,
      count(*) filter (where filtered_usage.status = 'success')::bigint as success_count,
      count(*) filter (where filtered_usage.status <> 'success')::bigint as failed_count,
      coalesce(sum(filtered_usage.prompt_tokens + filtered_usage.completion_tokens), 0)::bigint as token_count,
      0::bigint as order_count,
      max(filtered_usage.created_at) as last_usage_at
    from filtered_usage
    left join public.profiles on profiles.id = filtered_usage.user_id
    group by profiles.email
    order by total_amount desc
    limit 10
  ),
  top_rechargers as (
    select
      'top_rechargers'::text as ranking_type,
      coalesce(profiles.email, 'unknown') as label,
      profiles.email,
      null::text as model,
      null::text as supplier_name,
      coalesce(sum(filtered_orders.amount), 0) as total_amount,
      0::bigint as call_count,
      0::bigint as success_count,
      0::bigint as failed_count,
      0::bigint as token_count,
      count(*)::bigint as order_count,
      null::timestamptz as last_usage_at
    from filtered_orders
    left join public.profiles on profiles.id = filtered_orders.user_id
    group by profiles.email
    order by total_amount desc
    limit 10
  ),
  model_rankings as (
    select
      'model_rankings'::text as ranking_type,
      filtered_usage.model as label,
      null::text as email,
      filtered_usage.model,
      null::text as supplier_name,
      coalesce(sum(filtered_usage.cost) filter (where filtered_usage.status = 'success'), 0) as total_amount,
      count(*)::bigint as call_count,
      count(*) filter (where filtered_usage.status = 'success')::bigint as success_count,
      count(*) filter (where filtered_usage.status <> 'success')::bigint as failed_count,
      coalesce(sum(filtered_usage.prompt_tokens + filtered_usage.completion_tokens), 0)::bigint as token_count,
      0::bigint as order_count,
      max(filtered_usage.created_at) as last_usage_at
    from filtered_usage
    group by filtered_usage.model
    order by total_amount desc, call_count desc
    limit 10
  ),
  supplier_rankings as (
    select
      'supplier_rankings'::text as ranking_type,
      coalesce(suppliers.display_name, filtered_usage.supplier_name, 'unknown') as label,
      null::text as email,
      null::text as model,
      coalesce(filtered_usage.supplier_name, 'unknown') as supplier_name,
      coalesce(sum(filtered_usage.cost) filter (where filtered_usage.status = 'success'), 0) as total_amount,
      count(*)::bigint as call_count,
      count(*) filter (where filtered_usage.status = 'success')::bigint as success_count,
      count(*) filter (where filtered_usage.status <> 'success')::bigint as failed_count,
      coalesce(sum(filtered_usage.prompt_tokens + filtered_usage.completion_tokens), 0)::bigint as token_count,
      0::bigint as order_count,
      max(filtered_usage.created_at) as last_usage_at
    from filtered_usage
    left join public.suppliers on suppliers.name = filtered_usage.supplier_name
    group by filtered_usage.supplier_name, suppliers.display_name
    order by call_count desc, total_amount desc
    limit 10
  )
  select * from top_spenders
  union all
  select * from top_rechargers
  union all
  select * from model_rankings
  union all
  select * from supplier_rankings;
end;
$$;

revoke all on function public.get_finance_rankings_admin(text) from public;
grant execute on function public.get_finance_rankings_admin(text) to authenticated;

drop function if exists public.get_recent_orders_admin();
create or replace function public.get_recent_orders_admin()
returns table (
  id uuid,
  user_email text,
  amount numeric,
  method text,
  status text,
  note text,
  created_at timestamptz
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
    raise exception 'Only admins can read recent orders';
  end if;

  return query
  select
    orders.id,
    profiles.email,
    orders.amount,
    orders.method,
    orders.status,
    orders.note,
    orders.created_at
  from public.orders
  left join public.profiles on profiles.id = orders.user_id
  order by orders.created_at desc
  limit 20;
end;
$$;

revoke all on function public.get_recent_orders_admin() from public;
grant execute on function public.get_recent_orders_admin() to authenticated;

drop function if exists public.get_error_summary_admin();
create or replace function public.get_error_summary_admin()
returns table (
  today_error_count bigint,
  today_401_count bigint,
  today_402_count bigint,
  today_429_count bigint,
  today_upstream_failed_count bigint,
  today_failure_rate numeric,
  last_hour_error_count bigint,
  top_error_user_email text,
  top_error_user_count bigint,
  top_error_model text,
  top_error_model_count bigint,
  top_error_supplier text,
  top_error_supplier_count bigint,
  high_frequency_key_prefix text,
  high_frequency_key_count bigint,
  frequent_402_email text,
  frequent_402_count bigint,
  failing_supplier_name text,
  failing_supplier_rate numeric,
  invalid_key_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  today_start timestamptz := date_trunc('day', now());
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'Only admins can read error summary';
  end if;

  return query
  with today_logs as (
    select *
    from public.usage_logs
    where created_at >= today_start
  ),
  today_error_logs as (
    select *
    from today_logs
    where status in ('failed', 'blocked', 'rate_limited')
       or coalesce(http_status, 200) >= 400
       or error_code is not null
  ),
  last_hour_error_logs as (
    select *
    from public.usage_logs
    where created_at >= now() - interval '1 hour'
      and (
        status in ('failed', 'blocked', 'rate_limited')
        or coalesce(http_status, 200) >= 400
        or error_code is not null
      )
  ),
  top_user as (
    select
      profiles.email,
      count(*)::bigint as error_count
    from today_error_logs
    left join public.profiles on profiles.id = today_error_logs.user_id
    where profiles.email is not null
    group by profiles.email
    order by error_count desc, profiles.email asc
    limit 1
  ),
  top_model as (
    select
      coalesce(models.display_name, today_error_logs.model, 'unknown') as model_name,
      count(*)::bigint as error_count
    from today_error_logs
    left join public.models on models.name = today_error_logs.model
    group by coalesce(models.display_name, today_error_logs.model, 'unknown')
    order by error_count desc, model_name asc
    limit 1
  ),
  top_supplier as (
    select
      coalesce(suppliers.display_name, today_error_logs.supplier_name, 'unknown') as supplier_name,
      count(*)::bigint as error_count
    from today_error_logs
    left join public.suppliers on suppliers.name = today_error_logs.supplier_name
    group by coalesce(suppliers.display_name, today_error_logs.supplier_name, 'unknown')
    order by error_count desc, supplier_name asc
    limit 1
  ),
  high_frequency_key as (
    select
      coalesce(api_key_prefix, 'unknown') as key_prefix,
      count(*)::bigint as error_count
    from public.usage_logs
    where created_at >= now() - interval '1 minute'
      and http_status = 429
    group by api_key_id, api_key_prefix
    having count(*) >= 3
    order by error_count desc
    limit 1
  ),
  frequent_402 as (
    select
      profiles.email,
      count(*)::bigint as error_count
    from public.usage_logs
    left join public.profiles on profiles.id = usage_logs.user_id
    where usage_logs.created_at >= now() - interval '1 hour'
      and usage_logs.http_status = 402
      and profiles.email is not null
    group by profiles.email
    having count(*) >= 3
    order by error_count desc
    limit 1
  ),
  supplier_health as (
    select
      coalesce(suppliers.display_name, usage_logs.supplier_name, 'unknown') as supplier_name,
      count(*)::bigint as call_count,
      count(*) filter (
        where usage_logs.status in ('failed', 'blocked', 'rate_limited')
           or coalesce(usage_logs.http_status, 200) >= 400
           or usage_logs.error_code is not null
      )::bigint as error_count
    from public.usage_logs
    left join public.suppliers on suppliers.name = usage_logs.supplier_name
    where usage_logs.created_at >= today_start
      and usage_logs.supplier_name is not null
    group by coalesce(suppliers.display_name, usage_logs.supplier_name, 'unknown')
    having count(*) >= 3
    order by (count(*) filter (
      where usage_logs.status in ('failed', 'blocked', 'rate_limited')
         or coalesce(usage_logs.http_status, 200) >= 400
         or usage_logs.error_code is not null
    )::numeric / nullif(count(*)::numeric, 0)) desc
    limit 1
  )
  select
    (select count(*)::bigint from today_error_logs),
    (select count(*)::bigint from today_error_logs where http_status = 401),
    (select count(*)::bigint from today_error_logs where http_status = 402),
    (select count(*)::bigint from today_error_logs where http_status = 429),
    (select count(*)::bigint from today_error_logs where error_code in ('upstream_error', 'upstream_timeout')),
    case
      when (select count(*) from today_logs) > 0 then round(((select count(*) from today_error_logs)::numeric / (select count(*) from today_logs)::numeric) * 100, 2)
      else 0
    end,
    (select count(*)::bigint from last_hour_error_logs),
    top_user.email,
    coalesce(top_user.error_count, 0),
    top_model.model_name,
    coalesce(top_model.error_count, 0),
    top_supplier.supplier_name,
    coalesce(top_supplier.error_count, 0),
    high_frequency_key.key_prefix,
    coalesce(high_frequency_key.error_count, 0),
    frequent_402.email,
    coalesce(frequent_402.error_count, 0),
    supplier_health.supplier_name,
    case
      when supplier_health.call_count > 0 then round((supplier_health.error_count::numeric / supplier_health.call_count::numeric) * 100, 2)
      else 0
    end,
    (select count(*)::bigint from today_error_logs where http_status = 401)
  from (select 1) seed
  left join top_user on true
  left join top_model on true
  left join top_supplier on true
  left join high_frequency_key on true
  left join frequent_402 on true
  left join supplier_health on true;
end;
$$;

revoke all on function public.get_error_summary_admin() from public;
grant execute on function public.get_error_summary_admin() to authenticated;

drop function if exists public.list_error_logs_admin(text, text, integer, text, text, text, integer);
create or replace function public.list_error_logs_admin(
  search_email text default null,
  status_filter text default 'all',
  http_status_filter integer default null,
  model_filter text default 'all',
  supplier_filter text default 'all',
  range_filter text default 'today',
  limit_count integer default 100
)
returns table (
  id uuid,
  created_at timestamptz,
  user_id uuid,
  email text,
  api_key_id uuid,
  api_key_prefix text,
  api_key_revoked boolean,
  model text,
  model_display_name text,
  supplier_name text,
  supplier_display_name text,
  http_status integer,
  error_code text,
  error_message text,
  latency_ms integer,
  cost numeric,
  prompt_tokens integer,
  completion_tokens integer,
  status text,
  request_id text,
  ip_hash text,
  user_agent_hash text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  range_start timestamptz;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'Only admins can read error logs';
  end if;

  range_start := case coalesce(range_filter, 'today')
    when 'today' then date_trunc('day', now())
    when '7d' then now() - interval '7 days'
    when '30d' then now() - interval '30 days'
    else null
  end;

  return query
  select
    usage_logs.id,
    usage_logs.created_at,
    usage_logs.user_id,
    profiles.email,
    usage_logs.api_key_id,
    coalesce(usage_logs.api_key_prefix, api_keys.key_prefix),
    api_keys.revoked,
    usage_logs.model,
    models.display_name,
    usage_logs.supplier_name,
    suppliers.display_name,
    usage_logs.http_status,
    usage_logs.error_code,
    case
      when usage_logs.error_message is null then null
      when length(usage_logs.error_message) > 220 then left(usage_logs.error_message, 220) || '...'
      else usage_logs.error_message
    end,
    usage_logs.latency_ms,
    usage_logs.cost,
    usage_logs.prompt_tokens,
    usage_logs.completion_tokens,
    usage_logs.status,
    usage_logs.request_id,
    usage_logs.ip_hash,
    usage_logs.user_agent_hash
  from public.usage_logs
  left join public.profiles on profiles.id = usage_logs.user_id
  left join public.api_keys on api_keys.id = usage_logs.api_key_id
  left join public.models on models.name = usage_logs.model
  left join public.suppliers on suppliers.name = usage_logs.supplier_name
  where
    (
      usage_logs.status in ('failed', 'blocked', 'rate_limited')
      or coalesce(usage_logs.http_status, 200) >= 400
      or usage_logs.error_code is not null
    )
    and (range_start is null or usage_logs.created_at >= range_start)
    and (nullif(btrim(search_email), '') is null or profiles.email ilike '%' || btrim(search_email) || '%')
    and (coalesce(nullif(status_filter, ''), 'all') = 'all' or usage_logs.status = status_filter)
    and (
      http_status_filter is null
      or (http_status_filter = 500 and coalesce(usage_logs.http_status, 0) >= 500)
      or usage_logs.http_status = http_status_filter
    )
    and (coalesce(nullif(model_filter, ''), 'all') = 'all' or usage_logs.model = model_filter)
    and (coalesce(nullif(supplier_filter, ''), 'all') = 'all' or usage_logs.supplier_name = supplier_filter)
  order by usage_logs.created_at desc
  limit greatest(1, least(coalesce(limit_count, 100), 200));
end;
$$;

revoke all on function public.list_error_logs_admin(text, text, integer, text, text, text, integer) from public;
grant execute on function public.list_error_logs_admin(text, text, integer, text, text, text, integer) to authenticated;

drop function if exists public.disable_api_key_admin(uuid);
create or replace function public.disable_api_key_admin(target_api_key_id uuid)
returns table (
  id uuid,
  key_prefix text,
  revoked boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_key public.api_keys%rowtype;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'Only admins can disable api keys';
  end if;

  update public.api_keys
  set revoked = true
  where api_keys.id = target_api_key_id
  returning * into updated_key;

  if updated_key.id is null then
    raise exception 'API Key not found';
  end if;

  return query
  select
    updated_key.id,
    updated_key.key_prefix,
    updated_key.revoked;
end;
$$;

revoke all on function public.disable_api_key_admin(uuid) from public;
grant execute on function public.disable_api_key_admin(uuid) to authenticated;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can read own api keys" on public.api_keys;
create policy "Users can read own api keys"
on public.api_keys
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own api keys" on public.api_keys;
create policy "Users can insert own api keys"
on public.api_keys
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can revoke own api keys" on public.api_keys;
create policy "Users can revoke own api keys"
on public.api_keys
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders"
on public.orders
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admins can read all orders" on public.orders;
create policy "Admins can read all orders"
on public.orders
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

drop policy if exists "Users can read own usage logs" on public.usage_logs;
create policy "Users can read own usage logs"
on public.usage_logs
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admins can read suppliers" on public.suppliers;
create policy "Admins can read suppliers"
on public.suppliers
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

drop policy if exists "Admins can insert suppliers" on public.suppliers;
create policy "Admins can insert suppliers"
on public.suppliers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  )
);

drop policy if exists "Admins can update suppliers" on public.suppliers;
create policy "Admins can update suppliers"
on public.suppliers
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  )
);

drop policy if exists "Enabled models are readable" on public.models;
create policy "Enabled models are readable"
on public.models
for select
to anon, authenticated
using (enabled = true);

drop policy if exists "Admins can read all models" on public.models;
create policy "Admins can read all models"
on public.models
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

drop policy if exists "Admins can insert models" on public.models;
create policy "Admins can insert models"
on public.models
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  )
);

drop policy if exists "Admins can update models" on public.models;
create policy "Admins can update models"
on public.models
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, balance, role)
  values (new.id, new.email, 0, 'user')
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, balance, role, created_at)
select id, email, 0, 'user', created_at
from auth.users
on conflict (id) do update
set email = excluded.email;

-- After running this file, promote your own account in Supabase SQL Editor:
-- update public.profiles
-- set role = 'admin'
-- where lower(email) = lower('your-email@example.com');
