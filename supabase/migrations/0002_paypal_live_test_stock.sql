-- Stock temporaire du test PayPal Live. Aucune policy n'est créée : les tables sont
-- accessibles uniquement au service_role utilisé par les fonctions serverless.
create table public.paypal_test_inventory (
  product_id text primary key,
  stock integer not null check (stock between 0 and 2),
  initial_stock integer not null default 2 check (initial_stock = 2),
  updated_at timestamptz not null default now()
);

insert into public.paypal_test_inventory (product_id, stock)
values ('paypal-live-test-2026', 2)
on conflict (product_id) do nothing;

create table public.paypal_test_reservations (
  paypal_order_id text primary key,
  status text not null check (status in ('reserved', 'capturing', 'captured', 'released')),
  expires_at timestamptz not null,
  capture_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index paypal_test_reservations_active_idx
  on public.paypal_test_reservations (status, expires_at);

alter table public.paypal_test_inventory enable row level security;
alter table public.paypal_test_reservations enable row level security;

create or replace function public.get_paypal_test_availability()
returns table(stock integer, available integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inventory_stock integer;
  active_holds integer;
begin
  select i.stock into inventory_stock
  from public.paypal_test_inventory i
  where i.product_id = 'paypal-live-test-2026'
  for update;

  if inventory_stock is null then
    raise exception 'PayPal test inventory is not initialized';
  end if;

  update public.paypal_test_reservations
  set status = 'released', updated_at = now()
  where status = 'reserved' and expires_at <= now();

  select count(*)::integer into active_holds
  from public.paypal_test_reservations r
  where r.status = 'capturing'
     or (r.status = 'reserved' and r.expires_at > now());

  return query select inventory_stock, greatest(inventory_stock - active_holds, 0);
end;
$$;

create or replace function public.reserve_paypal_test_order(p_paypal_order_id text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inventory_stock integer;
  active_holds integer;
  existing_status text;
begin
  if nullif(trim(p_paypal_order_id), '') is null then return false; end if;

  select i.stock into inventory_stock
  from public.paypal_test_inventory i
  where i.product_id = 'paypal-live-test-2026'
  for update;

  update public.paypal_test_reservations
  set status = 'released', updated_at = now()
  where status = 'reserved' and expires_at <= now();

  select r.status into existing_status
  from public.paypal_test_reservations r
  where r.paypal_order_id = p_paypal_order_id;

  if existing_status in ('reserved', 'capturing', 'captured') then return true; end if;

  select count(*)::integer into active_holds
  from public.paypal_test_reservations r
  where r.status = 'capturing'
     or (r.status = 'reserved' and r.expires_at > now());

  if inventory_stock is null or inventory_stock <= active_holds then return false; end if;

  insert into public.paypal_test_reservations (paypal_order_id, status, expires_at)
  values (p_paypal_order_id, 'reserved', now() + interval '20 minutes')
  on conflict (paypal_order_id) do update
    set status = 'reserved', expires_at = excluded.expires_at, capture_id = null, updated_at = now();
  return true;
end;
$$;

create or replace function public.claim_paypal_test_order(p_paypal_order_id text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inventory_stock integer;
  reservation_status text;
  reservation_expiry timestamptz;
begin
  select i.stock into inventory_stock
  from public.paypal_test_inventory i
  where i.product_id = 'paypal-live-test-2026'
  for update;

  select r.status, r.expires_at into reservation_status, reservation_expiry
  from public.paypal_test_reservations r
  where r.paypal_order_id = p_paypal_order_id
  for update;

  if reservation_status in ('capturing', 'captured') then return true; end if;
  if inventory_stock is null or inventory_stock <= 0
     or reservation_status is distinct from 'reserved' or reservation_expiry <= now() then
    return false;
  end if;

  update public.paypal_test_reservations
  set status = 'capturing', updated_at = now()
  where paypal_order_id = p_paypal_order_id;
  return true;
end;
$$;

create or replace function public.release_paypal_test_claim(p_paypal_order_id text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.paypal_test_reservations
  set status = 'released', updated_at = now()
  where paypal_order_id = p_paypal_order_id and status = 'capturing';
$$;

create or replace function public.finalize_paypal_test_capture(
  p_paypal_order_id text,
  p_capture_id text
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inventory_stock integer;
  reservation_status text;
begin
  select i.stock into inventory_stock
  from public.paypal_test_inventory i
  where i.product_id = 'paypal-live-test-2026'
  for update;

  select r.status into reservation_status
  from public.paypal_test_reservations r
  where r.paypal_order_id = p_paypal_order_id
  for update;

  if reservation_status = 'captured' then return inventory_stock; end if;
  if reservation_status is distinct from 'capturing' then
    raise exception 'PayPal test order is not claimed for capture';
  end if;
  if inventory_stock is null or inventory_stock <= 0 then
    raise exception 'PayPal test stock is exhausted';
  end if;

  update public.paypal_test_inventory
  set stock = stock - 1, updated_at = now()
  where product_id = 'paypal-live-test-2026';

  update public.paypal_test_reservations
  set status = 'captured', capture_id = p_capture_id, updated_at = now()
  where paypal_order_id = p_paypal_order_id;

  return inventory_stock - 1;
end;
$$;

revoke all on table public.paypal_test_inventory from anon, authenticated;
revoke all on table public.paypal_test_reservations from anon, authenticated;
grant select on table public.paypal_test_reservations to service_role;
revoke all on function public.get_paypal_test_availability() from public;
revoke all on function public.reserve_paypal_test_order(text) from public;
revoke all on function public.claim_paypal_test_order(text) from public;
revoke all on function public.release_paypal_test_claim(text) from public;
revoke all on function public.finalize_paypal_test_capture(text, text) from public;
grant execute on function public.get_paypal_test_availability() to service_role;
grant execute on function public.reserve_paypal_test_order(text) to service_role;
grant execute on function public.claim_paypal_test_order(text) to service_role;
grant execute on function public.release_paypal_test_claim(text) to service_role;
grant execute on function public.finalize_paypal_test_capture(text, text) to service_role;
