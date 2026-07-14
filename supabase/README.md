# Supabase setup — Phase 1

Backend for the Agrawal Plywoods prototype. Prototype tier: no auth, anon key only,
all privileged behavior via `SECURITY DEFINER` RPCs. Seller contact is masked **in the
database** — the anon role has no direct `SELECT` on `listings`.

## Manual dashboard steps (do these first — they can't be scripted)

1. **Create a Supabase project** at https://supabase.com/dashboard (free tier is fine).
2. **Create a Storage bucket** named `listing-photos` and mark it **Public**.
   (Do this *before* running `schema.sql` — the storage policy at the bottom references it.)
3. **Run the SQL**, in this order, in the SQL editor:
   - `schema.sql` — tables, masking functions, `public_listings` view, RLS, RPCs, storage policy.
   - `seed.sql` — 12 approved + 2 pending + 1 rejected listings, and 3 contact requests.
4. **Grab your keys** from Project Settings → API:
   - Project URL → used as `SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `anon` `public` key → used as the `*_ANON_KEY` vars.
5. **(Recommended) change the admin PIN** — it seeds as `4321`:
   ```sql
   update public.app_config set value = '<your-4-digit-pin>' where key = 'admin_pin';
   ```

## Verify the security model

The anon key is safe to use here — every check below runs with it.

```powershell
$env:SUPABASE_URL="https://xxxx.supabase.co"
$env:SUPABASE_ANON_KEY="eyJ...anon..."
$env:ADMIN_PIN="4321"          # only if you changed it from the default
node supabase/verify.mjs
```

Expected: all checks PASS —
- raw `listings` unreadable by anon (0 rows),
- `public_listings` returns 12 rows with masked phone (`******1234`) and email (`j***@gmail.com`),
- anon can insert a `pending` listing but **not** an `approved` one,
- admin RPC rejects a wrong PIN and returns pendings for the right one,
- approving a contact request then reveals the real seller phone via `check_contact_request`.

`verify.mjs` inserts two throwaway `VERIFY temp …` pending listings and approves one seeded
request. Re-run `seed.sql` to reset to a clean state (it clears both tables first).

## Files

| File | Purpose |
|---|---|
| `schema.sql` | Tables, masking, view, RLS, RPCs, storage policy. Run once. |
| `seed.sql` | Dummy data. Idempotent — clears then re-seeds. |
| `verify.mjs` | Anon-key security checks (Node 18+, no install). |

## Security notes (prototype tier — tell the client)

- Masking happens in the DB, never on the client. Raw contact is reachable only via
  `check_contact_request` (needs an approved request's UUID) or the PIN-gated admin RPCs.
- Accepted weaknesses for the demo: the 4-digit PIN is brute-forceable (~10k tries via RPC);
  anyone can insert junk pending listings/requests (owner rejects them); the storage bucket
  accepts anon uploads. All fine for a prototype, documented for later hardening.
