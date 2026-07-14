# Agrawal Plywoods — Prototype Build Plan

**Stack:** Expo (React Native) mobile app · Supabase free tier (Postgres + Storage) · Vite/React admin page on Vercel free tier.
**Scope tier:** Prototype. No auth. Dummy data. Shared 4-digit PIN for the owner page.

> Paste the relevant phase section (plus the "Global context" section) into each Claude Code session.

---

## Global context (paste into every session)

- Mobile app lives in `mobile/` (Expo + expo-router + TypeScript). Admin page lives in `admin/` (Vite + React + TS). SQL lives in `supabase/`.
- Backend is Supabase. The mobile app and admin page both use only the **anon key**. All privileged behavior goes through **SECURITY DEFINER RPCs**; the anon role has **no direct SELECT on the `listings` table** — raw seller contact never leaves the server unmasked except via the approval-gated RPCs.
- Buyer grid: `FlatList` with `numColumns={2}` (virtualized — works at 10, 100, 1000 rows). Query `public_listings` view with `{ count: 'exact' }` + `.range()`. If total count ≤ 10, render everything and hide pagination controls; if > 10, page at 10/page with numbered page controls (no infinite scroll).
- "Live" new listings = refetch on screen focus + pull-to-refresh. No realtime subscription.
- Contact unlock: when a buyer submits a contact request, the app stores the returned `request_id` in AsyncStorage keyed by `listing_id`. The detail screen calls `check_contact_request(request_id)` — it returns status, and the real contact **only if approved**. Request IDs are UUIDs (unguessable) — acceptable for prototype tier.
- Env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (mobile); `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (admin). Never commit keys; use `.env` + `.env.example`.
- All content is placeholder/dummy for now.

---

## 1. Project structure

```
agrawal-plywoods/
├── mobile/                          # Expo app (npx create-expo-app, expo-router template)
│   ├── app/
│   │   ├── _layout.tsx              # root stack
│   │   ├── index.tsx                # splash (logo fade/scale → role picker)
│   │   ├── role-picker.tsx          # Buyer / Seller
│   │   ├── buyer/
│   │   │   ├── index.tsx            # listings grid + conditional pagination
│   │   │   └── [listingId].tsx      # detail + masked contact + Request Contact form
│   │   └── seller/
│   │       └── index.tsx            # Add Listing form + photo upload
│   ├── src/
│   │   ├── lib/
│   │   │   ├── supabase.ts          # client init
│   │   │   └── api.ts               # all queries/RPC calls in one place
│   │   ├── components/
│   │   │   ├── ListingCard.tsx
│   │   │   ├── PaginationControls.tsx
│   │   │   ├── PhotoPicker.tsx
│   │   │   └── FormField.tsx
│   │   └── types.ts                 # Listing, ContactRequest, etc.
│   ├── assets/logo.png              # placeholder logo
│   ├── .env / .env.example
│   └── package.json
├── admin/                           # Vite + React + TS, deployed to Vercel
│   ├── src/
│   │   ├── App.tsx                  # PIN gate → tabs
│   │   ├── PinGate.tsx
│   │   ├── PendingListings.tsx
│   │   ├── PendingRequests.tsx
│   │   └── lib/supabase.ts
│   ├── .env / .env.example
│   └── package.json
└── supabase/
    ├── schema.sql                   # tables + functions + views + RLS (the block below)
    └── seed.sql                     # dummy listings
```

---

## 2. Supabase schema (full SQL — `supabase/schema.sql`)

```sql
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
-- Create bucket 'listing-photos' (public) in the dashboard, then:
create policy "anon uploads listing photos"
  on storage.objects for insert to anon
  with check (bucket_id = 'listing-photos');
-- Public bucket => photos readable via public URL. No update/delete for anon.
```

### Security model, honestly stated (tell the client this)
- Raw seller contact is unreachable with the anon key except via `check_contact_request` (needs an approved request's UUID) and the PIN-gated admin RPCs. Masking happens **in the database**, never on the client.
- The admin surface is capability-scoped by design: the RPCs can list pendings and flip `status` — nothing else. There is no admin "select * from listings" path.
- Known prototype-tier weaknesses (accepted): a 4-digit PIN is brute-forceable via RPC (~10k tries); anyone can insert junk pending listings/requests (owner rejects them); the storage bucket accepts anon uploads. All fine for a demo, all documented for later hardening.

### Seed data (`supabase/seed.sql`)
~15 dummy listings: 12 approved + 2 pending + 1 rejected (so pagination >10 triggers and the admin page has content). Fake names ("18mm Marine Ply 8x4"), fake phones, placeholder `photo_url`s.

---

## 3. Phase-by-phase build order

Each phase = one Claude Code session. Start each session by pasting: **Global context + that phase's block**. Each phase ends with a working, testable state.

---

### Phase 1 — Supabase setup: schema, RLS, RPCs, seed
**Model: Opus** (this is the security/masking phase — everything else depends on it being right).

Do:
1. Create Supabase project (manual, dashboard). Create `listing-photos` public bucket.
2. Run `schema.sql` (above) in the SQL editor; run `seed.sql`.
3. Verify from a scratch script (plain `curl` or a tiny Node script with anon key):
   - `select * from listings` as anon → **empty/denied**.
   - `select * from public_listings` → 12 approved rows, phone shows `******1234` style, email shows `j***@gmail.com` style.
   - `insert` a pending listing as anon → succeeds; inserting with `status='approved'` → fails.
   - `admin_pending_listings('wrong')` → error; with correct PIN → pending rows.
   - Approve a seeded contact request via RPC, then `check_contact_request(id)` → real contact appears.

Hands off to Phase 2: a live Supabase URL + anon key, verified schema, `supabase/*.sql` files committed.

---

### Phase 2 — Expo scaffold, splash, role picker
**Model: Haiku** (boilerplate: scaffold, navigation, a simple animation).

Do:
1. `npx create-expo-app mobile` (expo-router + TS template). Install `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `expo-image-picker`, `base64-arraybuffer`.
2. `src/lib/supabase.ts` reading `EXPO_PUBLIC_*` env vars; `.env.example`.
3. Splash (`app/index.tsx`): placeholder logo, fade+scale via `Animated` (or Reanimated if already in template), ~1.5s, then `router.replace('/role-picker')`.
4. Role picker: two big buttons → `/buyer`, `/seller`. Stub both target screens ("Buyer flow — Phase 3").
5. `src/types.ts` with `PublicListing`, `Listing`, `ContactRequest` types matching the schema.

Hands off to Phase 3: running app, navigation shell, supabase client, types.

---

### Phase 3 — Buyer flow (grid, conditional pagination, detail, request form)
**Model: Sonnet** (main app logic: pagination state, unlock flow).

Do:
1. `src/lib/api.ts`:
   - `fetchListings(page)` → `from('public_listings').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(page*10, page*10+9)` → `{ rows, totalCount }`.
   - `createContactRequest(listingId, buyerName, buyerPhone)` → insert, `.select('id').single()` to get the request id back.
   - `checkContactRequest(requestId)` → `rpc('check_contact_request', ...)`.
2. Grid (`app/buyer/index.tsx`): 2-column `FlatList`, `ListingCard` (photo, name, price/unit). **Conditional pagination:** render `PaginationControls` (numbered pages, prev/next) only when `totalCount > 10`. Refetch on focus (`useFocusEffect`) + `RefreshControl`. Empty state + loading state.
3. Detail (`app/buyer/[listingId].tsx`): full fields + masked contact from the view row (pass via params or refetch single row from the view).
   - On mount, read AsyncStorage `contact_request:<listingId>`; if a request id exists, call `checkContactRequest`: approved → show real contact; pending → "Request pending approval"; rejected → allow re-request.
   - "Request Contact" → inline form (buyer name + phone, both required) → insert → store returned id in AsyncStorage → show pending state.

Test: with seed data (12 approved) pagination shows; temporarily reject 3 in the dashboard → controls disappear.

Hands off to Phase 4: complete buyer flow, `api.ts` established as the pattern.

---

### Phase 4 — Seller flow (Add Listing form + photo upload)
**Model: Sonnet** (forms are boilerplate, but Expo→Supabase Storage upload has real gotchas).

Do:
1. `app/seller/index.tsx`: form — name, price per unit (numeric), unit picker (sheet/sq ft/piece), quantity (integer), notes (multiline), seller name, seller phone, optional email, photo.
2. `PhotoPicker`: `expo-image-picker` (media library, quality ~0.6). **Upload gotcha:** React Native `Blob` doesn't work with supabase-js — read the file as base64 (`FileSystem.readAsStringAsync` or picker's `base64: true`) and upload `decode(base64)` from `base64-arraybuffer` with the correct `contentType`. Path: `listing-photos/<uuid>.jpg`; store the public URL in `photo_url`.
3. Submit → insert into `listings` (status defaults to pending; do not send status). Success screen: "Submitted for approval." Basic validation + disabled-while-submitting.
4. Verify the new listing does NOT appear in the buyer grid (it's pending).

Hands off to Phase 5: complete mobile app; pendings accumulating in the DB waiting for an approval UI.

---

### Phase 5 — Admin approval page + Vercel deploy
**Model: Sonnet** (small app, but it exercises the security surface end-to-end).

Do:
1. `npm create vite@latest admin` (React + TS). Minimal styling (plain CSS is fine).
2. `PinGate`: 4-digit input → `rpc('admin_pin_ok', { p_pin })` → on success keep the PIN in React state (memory only — not localStorage) and pass it to every admin RPC call. Wrong PIN → error message.
3. Two tabs:
   - **Pending Listings**: `admin_pending_listings(pin)` → rows with photo thumbnail, name, price, qty, seller name+phone (owner may see raw contact here — it's their approval flow). Approve / Reject → `admin_set_listing_status` → optimistic remove from list.
   - **Pending Contact Requests**: `admin_pending_requests(pin)` → listing name, buyer name, buyer phone. Approve / Reject → `admin_set_request_status`.
4. Refresh button per tab (no realtime needed).
5. Deploy to Vercel (`vercel` CLI or GitHub import), set `VITE_*` env vars in Vercel dashboard.
6. End-to-end check: seller submits in app → appears in admin → approve → shows in buyer grid on pull-to-refresh. Buyer requests contact → approve in admin → detail screen shows real contact.

Hands off to Phase 6: full loop working in dev + deployed admin URL.

---

### Phase 6 — Polish, edge cases, test pass
**Model: Sonnet.**

Do:
1. Edge cases: empty grid ("No listings yet"), network error states with retry, form validation messages, image-less listings (placeholder image), long names/notes truncation, keyboard avoiding on forms.
2. Pagination edge check: exactly 10 (no controls), 11 (controls appear), last-page partial row.
3. Loading skeletons or simple spinners; disable double-submits everywhere.
4. Re-run the Phase 1 security checks against production data once real-ish content goes in.
5. App icon/splash config in `app.json`; a `README.md` covering: env setup, running the app (Expo Go), running/deploying admin, changing the admin PIN (one SQL update in the dashboard), and the documented prototype-tier security caveats.
6. Manual test script: full buyer/seller/owner loop on a physical phone via Expo Go.

**Done =** client can demo: seller posts → owner approves on the Vercel page from their phone browser → buyer sees it, requests contact, owner approves, buyer sees the number.

---

## Model-tier summary

| Phase | Content | Model |
|---|---|---|
| 1 | Schema, RLS, masking view, PIN RPCs | **Opus** |
| 2 | Expo scaffold, splash, role picker | **Haiku** |
| 3 | Buyer grid, conditional pagination, contact unlock | **Sonnet** |
| 4 | Seller form, storage upload | **Sonnet** |
| 5 | Admin page + Vercel deploy | **Sonnet** |
| 6 | Polish, edge cases, README | **Sonnet** |

## Deferred (out of scope, note for the client)
Real auth, rate limiting / abuse protection, image moderation & size limits, editing/deleting listings, notifications to buyers when a request is approved (currently: buyer re-opens the detail screen), search/filters, real branding.
