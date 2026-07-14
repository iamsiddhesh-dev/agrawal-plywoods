-- ============================================================================
-- Agrawal Plywoods — Supabase schema (Phase 1)
-- Prototype tier. No auth. All access via the anon key.
-- Privileged behavior goes through SECURITY DEFINER RPCs; anon has NO direct
-- SELECT on public.listings. Raw seller contact is masked in the DATABASE.
--
-- Run this in the Supabase SQL editor, then run seed.sql.
-- ============================================================================

-- ============ TABLES ============

create table public.listings (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  price_per_unit     numeric(10,2) not null check (price_per_unit >= 0),
  unit               text not null default 'sheet',
  quantity_available integer not null default 0 check (quantity_available >= 0),
  notes              text,
  photo_url          text,
  seller_name        text not null,
  seller_phone       text not null,          -- RAW, never exposed to anon directly
  seller_email       text,                   -- RAW, never exposed to anon directly
  status             text not null default 'pending'
                       check (status in ('pending','approved','rejected')),
  created_at         timestamptz not null default now()
);

create table public.contact_requests (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  buyer_name  text not null,
  buyer_phone text not null,
  status      text not null default 'pending'
                check (status in ('pending','approved','rejected')),
  created_at  timestamptz not null default now()
);

create table public.app_config (
  key   text primary key,
  value text not null
);
insert into public.app_config (key, value) values ('admin_pin', '4321'); -- change in dashboard

create index on public.listings (status, created_at desc);
create index on public.contact_requests (status, created_at desc);

-- ============ MASKING FUNCTIONS ============

create or replace function public.mask_phone(p text)
returns text language sql immutable as $$
  select case when p is null or length(p) < 4 then '****'
              else repeat('*', greatest(length(p) - 4, 2)) || right(p, 4) end;
$$;

create or replace function public.mask_email(e text)
returns text language sql immutable as $$
  select case when e is null or position('@' in e) = 0 then null
              else left(split_part(e, '@', 1), 1) || '***@' || split_part(e, '@', 2) end;
$$;

-- ============ PUBLIC VIEW (server-side masking) ============
-- security_invoker = off (definer semantics): the view runs with owner rights,
-- so anon can read it even though anon has no SELECT on listings itself.
create or replace view public.public_listings
with (security_invoker = off) as
select
  id, name, price_per_unit, unit, quantity_available, notes, photo_url,
  seller_name,
  public.mask_phone(seller_phone) as seller_phone_masked,
  public.mask_email(seller_email) as seller_email_masked,
  created_at
from public.listings
where status = 'approved';

grant select on public.public_listings to anon;

-- ============ RLS ============

alter table public.listings         enable row level security;
alter table public.contact_requests enable row level security;
alter table public.app_config       enable row level security;

-- No SELECT/UPDATE/DELETE policies on listings for anon => denied.
-- Sellers (anon) may only INSERT pending rows:
create policy "anon inserts pending listings"
  on public.listings for insert to anon
  with check (status = 'pending');

-- Buyers (anon) may only INSERT pending contact requests:
create policy "anon inserts pending contact requests"
  on public.contact_requests for insert to anon
  with check (status = 'pending');

-- app_config: no policies at all => nobody but definer functions can read it.

-- ============ BUYER RPC: check request / unlock contact ============

create or replace function public.check_contact_request(p_request_id uuid)
returns table (
  request_status text,
  seller_name    text,
  seller_phone   text,
  seller_email   text
)
language sql stable security definer set search_path = public as $$
  select
    r.status,
    case when r.status = 'approved' then l.seller_name  end,
    case when r.status = 'approved' then l.seller_phone end,
    case when r.status = 'approved' then l.seller_email end
  from contact_requests r
  join listings l on l.id = r.listing_id
  where r.id = p_request_id;
$$;

-- ============ ADMIN RPCs (PIN-gated, SECURITY DEFINER) ============

create or replace function public.admin_pin_ok(p_pin text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_config where key = 'admin_pin' and value = p_pin);
$$;

create or replace function public.admin_pending_listings(p_pin text)
returns setof public.listings
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.admin_pin_ok(p_pin) then raise exception 'invalid pin'; end if;
  return query select * from listings where status = 'pending' order by created_at;
end $$;

create or replace function public.admin_pending_requests(p_pin text)
returns table (id uuid, listing_name text, buyer_name text, buyer_phone text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.admin_pin_ok(p_pin) then raise exception 'invalid pin'; end if;
  return query
    select r.id, l.name, r.buyer_name, r.buyer_phone, r.created_at
    from contact_requests r join listings l on l.id = r.listing_id
    where r.status = 'pending' order by r.created_at;
end $$;

create or replace function public.admin_set_listing_status(p_pin text, p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.admin_pin_ok(p_pin) then raise exception 'invalid pin'; end if;
  if p_status not in ('approved','rejected') then raise exception 'invalid status'; end if;
  update listings set status = p_status where id = p_id;
end $$;

create or replace function public.admin_set_request_status(p_pin text, p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.admin_pin_ok(p_pin) then raise exception 'invalid pin'; end if;
  if p_status not in ('approved','rejected') then raise exception 'invalid status'; end if;
  update contact_requests set status = p_status where id = p_id;
end $$;

-- ============ STORAGE ============
-- Create bucket 'listing-photos' (public) in the dashboard FIRST, then run:
create policy "anon uploads listing photos"
  on storage.objects for insert to anon
  with check (bucket_id = 'listing-photos');
-- Public bucket => photos readable via public URL. No update/delete for anon.
