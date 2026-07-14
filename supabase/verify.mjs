// ============================================================================
// Agrawal Plywoods — Phase 1 verification script
// Runs the anon-key security checks from BUILD_PLAN.md against a live project.
//
// Usage (PowerShell):
//   $env:SUPABASE_URL="https://xxxx.supabase.co"
//   $env:SUPABASE_ANON_KEY="eyJ...anon..."
//   $env:ADMIN_PIN="4321"        # optional, defaults to 4321
//   node supabase/verify.mjs
//
// Requires Node 18+ (built-in fetch). No npm install needed.
// Exits non-zero if any check fails.
// ============================================================================

const URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const ANON = process.env.SUPABASE_ANON_KEY;
const PIN = process.env.ADMIN_PIN || "4321";

if (!URL || !ANON) {
  console.error("ERROR: set SUPABASE_URL and SUPABASE_ANON_KEY env vars first.");
  process.exit(2);
}

const base = `${URL}/rest/v1`;
const headers = { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" };

let passed = 0,
  failed = 0;

function ok(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function rest(path, init = {}) {
  const res = await fetch(`${base}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  let body = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function rpc(fn, args) {
  return rest(`/rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });
}

async function main() {
  console.log(`\nVerifying ${URL}\n`);

  // 1. select * from listings as anon → empty/denied (RLS, no select policy → 0 rows)
  {
    const r = await rest(`/listings?select=*`);
    ok(
      "anon cannot read raw listings",
      r.status === 200 && Array.isArray(r.body) && r.body.length === 0,
      `status=${r.status} rows=${Array.isArray(r.body) ? r.body.length : "n/a"}`
    );
  }

  // 2. select * from public_listings → 12 approved rows, masked contact
  {
    const r = await rest(`/public_listings?select=*`);
    const rows = Array.isArray(r.body) ? r.body : [];
    ok("public_listings returns 12 approved rows", rows.length === 12, `rows=${rows.length}`);
    const sample = rows.find((x) => x.seller_phone_masked) || rows[0] || {};
    ok(
      "phone is masked (******1234 style)",
      typeof sample.seller_phone_masked === "string" && /^\*+\d{4}$/.test(sample.seller_phone_masked),
      sample.seller_phone_masked
    );
    const withEmail = rows.find((x) => x.seller_email_masked);
    ok(
      "email is masked (j***@domain style)",
      !!withEmail && /^.\*\*\*@/.test(withEmail.seller_email_masked),
      withEmail?.seller_email_masked || "(no emails in set)"
    );
    ok(
      "raw seller_phone/email never present in view",
      rows.every((x) => x.seller_phone === undefined && x.seller_email === undefined),
      "view exposes only *_masked columns"
    );
  }

  // 3a. insert a pending listing as anon → succeeds
  {
    const r = await rest(`/listings`, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        name: "VERIFY temp pending",
        price_per_unit: 1,
        seller_name: "Verify Bot",
        seller_phone: "0000000000",
        status: "pending",
      }),
    });
    ok("anon can insert a pending listing", r.status === 201, `status=${r.status}`);
  }

  // 3b. insert with status='approved' → denied by RLS with-check
  {
    const r = await rest(`/listings`, {
      method: "POST",
      body: JSON.stringify({
        name: "VERIFY temp approved",
        price_per_unit: 1,
        seller_name: "Verify Bot",
        seller_phone: "0000000000",
        status: "approved",
      }),
    });
    ok("anon CANNOT insert an approved listing", r.status === 401 || r.status === 403, `status=${r.status}`);
  }

  // 4a. admin_pending_listings('wrong') → error
  {
    const r = await rpc("admin_pending_listings", { p_pin: "wrong" });
    ok("admin RPC rejects a wrong PIN", r.status >= 400, `status=${r.status}`);
  }

  // 4b. admin_pending_listings(correct PIN) → pending rows (2 seeded)
  {
    const r = await rpc("admin_pending_listings", { p_pin: PIN });
    const rows = Array.isArray(r.body) ? r.body : [];
    ok("admin RPC with correct PIN returns pending listings", r.status === 200 && rows.length >= 2, `status=${r.status} rows=${rows.length}`);
  }

  // 5. Approve a seeded contact request, then check_contact_request → real contact
  {
    const pend = await rpc("admin_pending_requests", { p_pin: PIN });
    const reqs = Array.isArray(pend.body) ? pend.body : [];
    ok("admin_pending_requests returns pending requests", reqs.length >= 1, `count=${reqs.length}`);
    if (reqs.length) {
      const id = reqs[0].id;
      // Before approval: check_contact_request returns status but no contact
      const before = await rpc("check_contact_request", { p_request_id: id });
      const b = Array.isArray(before.body) ? before.body[0] : before.body;
      ok("before approval, contact is withheld", b && b.seller_phone == null, `phone=${b?.seller_phone ?? "null"}`);

      // Approve via admin RPC
      const upd = await rpc("admin_set_request_status", { p_pin: PIN, p_id: id, p_status: "approved" });
      ok("admin can approve a contact request", upd.status === 200 || upd.status === 204, `status=${upd.status}`);

      // After approval: real contact appears
      const after = await rpc("check_contact_request", { p_request_id: id });
      const a = Array.isArray(after.body) ? after.body[0] : after.body;
      ok(
        "after approval, real seller_phone is revealed",
        a && a.request_status === "approved" && typeof a.seller_phone === "string" && a.seller_phone.length >= 4,
        `phone=${a?.seller_phone ?? "null"}`
      );
    }
  }

  console.log(`\n${passed} passed, ${failed} failed.\n`);
  console.log("NOTE: re-run seed.sql to reset state (it clears both tables and re-seeds).");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("Verification crashed:", e);
  process.exit(2);
});
