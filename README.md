# Agrawal Plywoods — Prototype

A plywood marketplace prototype: buyers browse listings and request seller contact info,
sellers post listings, and the owner approves both from a web admin page. Built as a
demoable prototype — see [Security caveats](#security-caveats-prototype-tier) before
treating this as production-ready.

**Stack:** Expo (React Native) mobile app · Supabase (Postgres + Storage) · Vite/React admin
page on Vercel.

```
mobile/     Expo app (buyer + seller flows)
admin/      Vite + React owner approval page, deployed to Vercel
supabase/   schema.sql, seed.sql, verify.mjs (schema + security checks)
```

See [BUILD_PLAN.md](BUILD_PLAN.md) for the full phase-by-phase build history and the
original schema design rationale.

---

## 1. Env setup

Backend is a Supabase project. Both apps talk to it using **only the anon key** — every
privileged action goes through a `SECURITY DEFINER` RPC (see
[Security caveats](#security-caveats-prototype-tier)).

If you're standing up a fresh Supabase project, follow [supabase/README.md](supabase/README.md)
first (create the project, the `listing-photos` storage bucket, run `schema.sql` then
`seed.sql`). If you already have a live project, just grab its URL and anon key from
Project Settings → API.

**Mobile** — create `mobile/.env` (gitignored):
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Admin** — create `admin/.env` (gitignored):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Never commit either `.env` file — both are already in `.gitignore`.

---

## 2. Running the mobile app (Expo Go)

```
cd mobile
npm install
npm start
```

This opens the Expo dev tools in your terminal. Scan the QR code with the **Expo Go** app
(iOS/Android) on a physical phone — the app connects to your Supabase project directly, no
separate backend server to run.

Flow: splash → role picker → **Buyer** (grid, pagination, listing detail, request contact)
or **Seller** (add-listing form with photo upload).

## 3. Running / deploying the admin page

**Local dev:**
```
cd admin
npm install
npm run dev
```
Opens at `http://localhost:5173`. Enter the admin PIN to unlock the two tabs (Pending
Listings, Pending Contact Requests).

**Deploy to Vercel:**
```
cd admin
vercel
```
Or import the repo in the Vercel dashboard, set the project root to `admin/`. Either way,
set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the Vercel
project settings (Settings → Environment Variables) — the build reads them at build time,
so redeploy after changing them.

Current deployment: https://admin-omega-pink.vercel.app

## 4. Changing the admin PIN

The PIN lives in the `app_config` table, not in code. Change it with one SQL statement in
the Supabase dashboard's SQL editor:

```sql
update public.app_config set value = '<new-4-digit-pin>' where key = 'admin_pin';
```

Takes effect immediately — no redeploy needed on either app.

---

## 5. Manual test script — full buyer/seller/owner loop

Run this end-to-end before a demo. You need: a phone with Expo Go connected to the app,
and a browser open on the Vercel admin URL (or `localhost:5173`).

1. **Seller posts a listing.**
   In the app: role picker → Seller → fill in product name, price, unit, quantity, optional
   notes/photo, your name + phone → Submit. Expect "Submitted for approval."
2. **Confirm it's NOT visible to buyers yet.**
   Role picker → Buyer → the new listing should not appear in the grid (it's `pending`).
3. **Owner approves the listing.**
   Open the admin page → enter PIN → Pending Listings tab → find the listing (seller name/
   phone visible here, raw — this is the owner's approval view) → Approve.
4. **Buyer sees it appear.**
   Back in the app, Buyer tab → pull down to refresh (or leave and re-enter the screen) →
   the new listing now shows with masked seller contact (e.g. `******1234`).
5. **Buyer requests contact.**
   Tap the listing → Request Contact → enter buyer name + phone → Submit. Expect "Request
   pending approval."
6. **Owner approves the request.**
   Admin page → Pending Contact Requests tab → find the request (buyer name/phone + listing
   name) → Approve.
7. **Buyer sees the real number.**
   Back in the app, reopen the same listing's detail screen (or come back to the tab) — the
   contact box now shows the real, unmasked seller name/phone/email instead of "Request
   pending approval."

**Edge cases worth spot-checking alongside the happy path:**
- Empty buyer grid (before any listings are approved) shows "No listings yet", not a blank
  screen or crash.
- Turn off wifi/mobile data mid-load → error text + a **Retry** button appears (buyer grid,
  buyer detail); re-enabling network and tapping Retry recovers.
- Submit the seller form with a missing required field → inline validation message, no
  network call made.
- Tap Submit/Approve/Reject twice quickly → button disables after the first tap, no
  duplicate row/duplicate status change.
- A listing with no photo shows the "No photo" placeholder instead of a broken image.
- A very long product name or notes field wraps/truncates instead of breaking the layout
  (buyer card clips to 2 lines; admin card clips the title to 2 lines).
- Buyer grid pagination: with exactly 10 approved listings, no page controls show; add an
  11th and controls appear; check the last page renders a partial (non-full) row correctly.

---

## Security caveats (prototype tier)

This is a demo-grade build, not production-hardened. Explicitly accepted for now:

- **PIN gate is brute-forceable.** A 4-digit PIN checked via RPC has ~10,000 possible
  values and no rate limiting — fine for a private demo link, not for a public admin URL
  you'd want to keep secret long-term.
- **No real authentication.** Anyone with the anon key (visible in any client bundle) can
  call the same RPCs a legitimate buyer/seller would. The RPCs are scoped tightly (insert
  pending rows only, or PIN-gated status flips) but there's no per-user identity.
- **Anyone can insert junk pending listings or contact requests.** The owner reviews and
  rejects them — there's no spam/abuse filtering.
- **The storage bucket accepts anonymous uploads.** No file-size or content-type
  enforcement beyond what the client sets.
- **Raw seller contact is masked in the database**, not the client — the anon role has no
  direct `SELECT` on `listings` or `contact_requests`; every path to raw contact info goes
  through a `SECURITY DEFINER` RPC that checks either an approved request UUID or the admin
  PIN. This part *is* solid for the threat model of "don't leak seller phone numbers to
  random scraping," which was the main ask.

**Deferred / explicitly out of scope** (tell the client if asked): real auth, rate limiting
/ abuse protection, image moderation & size limits, editing/deleting listings, push
notifications on approval, search/filters, and branding beyond the current app icon/logo.
