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
  created_at timestamptz not null default now()
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  cost numeric not null default 0,
  status text not null default 'success',
  created_at timestamptz not null default now()
);

create index if not exists api_keys_user_id_idx on public.api_keys(user_id);
create index if not exists api_keys_user_id_revoked_idx on public.api_keys(user_id, revoked);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists usage_logs_user_id_idx on public.usage_logs(user_id);

alter table public.profiles enable row level security;
alter table public.api_keys enable row level security;
alter table public.orders enable row level security;
alter table public.usage_logs enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.api_keys from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.usage_logs from anon, authenticated;

grant select on table public.profiles to authenticated;
grant select on table public.api_keys to authenticated;
grant insert (user_id, name, key_prefix, key_hash) on table public.api_keys to authenticated;
grant update (revoked) on table public.api_keys to authenticated;
grant select on table public.orders to authenticated;
grant select on table public.usage_logs to authenticated;

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
