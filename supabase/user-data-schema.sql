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
  created_at timestamptz not null default now()
);

alter table public.orders
add column if not exists note text;

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model text not null,
  supplier_name text,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  cost numeric not null default 0,
  status text not null default 'success',
  created_at timestamptz not null default now()
);

alter table public.usage_logs
add column if not exists supplier_name text;

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
  enabled boolean not null default true,
  description text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.models
add column if not exists supplier_name text not null default 'deepseek';

create index if not exists api_keys_user_id_idx on public.api_keys(user_id);
create index if not exists api_keys_user_id_revoked_idx on public.api_keys(user_id, revoked);
create unique index if not exists api_keys_key_hash_idx on public.api_keys(key_hash);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists usage_logs_user_id_idx on public.usage_logs(user_id);
create index if not exists usage_logs_supplier_name_idx on public.usage_logs(supplier_name);
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
create or replace function public.manual_recharge(
  target_email text,
  recharge_amount numeric,
  recharge_note text default null
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
  actor_role text;
  target_profile public.profiles%rowtype;
  inserted_order public.orders%rowtype;
begin
  select role
  into actor_role
  from public.profiles
  where id = auth.uid();

  if actor_role is distinct from 'admin' then
    raise exception 'Only admins can manually recharge users';
  end if;

  if recharge_amount is null or recharge_amount <= 0 then
    raise exception 'Recharge amount must be greater than 0';
  end if;

  select *
  into target_profile
  from public.profiles
  where lower(email) = lower(trim(target_email))
  limit 1;

  if target_profile.id is null then
    raise exception 'User profile not found for email %', target_email;
  end if;

  update public.profiles
  set balance = balance + recharge_amount
  where id = target_profile.id
  returning * into target_profile;

  insert into public.orders (user_id, amount, method, status, note)
  values (target_profile.id, recharge_amount, 'manual', 'paid', nullif(trim(recharge_note), ''))
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

revoke all on function public.manual_recharge(text, numeric, text) from public;
grant execute on function public.manual_recharge(text, numeric, text) to authenticated;

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
    raise exception 'Only admins can read user orders';
  end if;

  return query
  select
    orders.id,
    orders.amount,
    orders.method,
    orders.status,
    orders.note,
    orders.created_at
  from public.orders
  where orders.user_id = target_user_id
  order by orders.created_at desc
  limit greatest(1, least(coalesce(limit_count, 20), 100));
end;
$$;

revoke all on function public.list_user_orders_admin(uuid, integer) from public;
grant execute on function public.list_user_orders_admin(uuid, integer) to authenticated;

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
