---
name: dadori-smoke
description: Seed a self-purgeable test population (talent, startups, projects, investors), run a ~5-minute functional test against production, then remove ALL seeded/test data. Use when the user wants to verify DADORI end-to-end with realistic data without leaving junk behind.
---

# DADORI smoke test (seed → test → purge)

A self-cleaning functional test. It (1) seeds a tagged test population directly into
production Firestore, (2) runs the Playwright E2E suite against https://dadori.com for
~5 minutes to exercise real flows, then (3) purges every seeded/test document. Nothing
real is ever touched.

## Safety model (read before running)
- All seeded docs carry BOTH an `@dadori-test.com` email AND a `test_run` field. Purge
  keys off those signatures plus the `Proj-<ts>` project-name pattern.
- **NEVER purge by "profile has no email"** — email-less profiles include real working
  accounts (e.g. the founder's own). `purge.cjs` deliberately excludes that signature.
- Always run `purge.cjs` WITHOUT `--delete` first and eyeball the counts before deleting.
- Requires owner access: `GCLOUD_TOKEN=$(gcloud auth print-access-token)` (bypasses rules).

## Steps
Run everything from the repo root `C:\Users\don\startup-incubator`. The scripts live in
`.claude/skills/dadori-smoke/`.

1. **Token + run id**
   ```bash
   export GCLOUD_TOKEN=$(gcloud auth print-access-token)
   export RUN_ID="smoke-$(date +%s)"
   ```

2. **Seed** the population (4 talent, 4 startups, 3 investors, 5 projects, 2 roles):
   ```bash
   node .claude/skills/dadori-smoke/seed.cjs
   ```
   Confirm it prints `Seeded N entities ... under test_run=<RUN_ID>`.

3. **Functional test (~5 min)** — run the E2E suite against production. This signs up its
   own `@dadori-test.com` accounts and exercises auth, persistence, tag-search, plan-gating,
   public view, pitch deck and plan builder end-to-end:
   ```bash
   BASE_URL=https://dadori.com npx playwright test \
     tests/e2e/auth.spec.ts tests/e2e/persistence.spec.ts tests/e2e/tag-search.spec.ts \
     tests/e2e/plan-gating.spec.ts tests/e2e/public-view.spec.ts tests/e2e/pitchdeck.spec.ts \
     tests/e2e/plan-builder.spec.ts --workers=3 --reporter=line
   ```
   (Also sanity-check that the seed is visible: query `startups` where `is_discoverable==true`
   and confirm the `Smoke Startup` names appear, or open /en/explore.)
   Report pass/fail counts. If something fails, capture the failing spec output before purging.

4. **Purge — dry run first**, then delete. Purge BOTH this run's seed and any leftover
   `@dadori-test.com` accounts the E2E created:
   ```bash
   node .claude/skills/dadori-smoke/purge.cjs                 # dry run — review counts
   node .claude/skills/dadori-smoke/purge.cjs --delete        # delete all test data
   ```
   To scope to only this run's seed instead, keep `RUN_ID` exported and it self-limits.

5. **Verify clean**: re-run the dry run; it should report ~0 docs. Report the final numbers
   to the user (seeded N, tests X/Y passed, purged M).

## Notes
- Seeded accounts are data-only (no Firebase Auth users) — they populate explore/search/
  dealflow but can't log in. The Playwright step creates real Auth accounts for login flows;
  those are `@dadori-test.com` and are removed by the purge (their Firestore docs). Orphaned
  Auth records (no Firestore doc) are harmless; delete via the Firebase console if desired.
- Rules/tsc are unaffected — this is a data + E2E harness only, no app code changes.
