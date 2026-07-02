// DADORI smoke purge — removes ONLY unambiguous test data via Firestore REST
// (owner token). Safe signatures ONLY:
//   - profiles/publicProfiles/startups/talent/investors/... whose email is
//     @dadori-test.com OR which carry a `test_run` field
//   - projects whose name matches ^Proj-\d+  OR carry `test_run`
// NEVER deletes email-less profiles (those include real working accounts).
// Pass RUN_ID=<id> to scope to a single seed run; omit to purge ALL test data.
// DRY-RUN unless --delete.
//
// Usage: GCLOUD_TOKEN=$(gcloud auth print-access-token) node purge.cjs [--delete] [RUN_ID=...]
const TOKEN = process.env.GCLOUD_TOKEN;
if (!TOKEN) { console.error("GCLOUD_TOKEN missing"); process.exit(1); }
const DELETE = process.argv.includes("--delete");
const RUN_ID = process.env.RUN_ID || "";
const BASE = "https://firestore.googleapis.com/v1/projects/hadori-7665f/databases/(default)/documents";
const H = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
const val = (f) => (f ? (f.stringValue ?? f.integerValue ?? f.booleanValue) : undefined);

async function listAll(coll) {
  const out = []; let tok = "";
  do {
    const r = await fetch(`${BASE}/${coll}?pageSize=300${tok ? `&pageToken=${tok}` : ""}`, { headers: H });
    if (!r.ok) break;
    const j = await r.json();
    (j.documents || []).forEach((d) => out.push({ id: d.name.split("/").pop(), fields: d.fields || {} }));
    tok = j.nextPageToken || "";
  } while (tok);
  return out;
}
let deleted = 0, failed = 0;
async function del(path) { if (!DELETE) { deleted++; return; } const r = await fetch(`${BASE}/${path}`, { method: "DELETE", headers: H }); if (r.ok) deleted++; else failed++; }
async function delSub(parent, sub) { for (const d of await listAll(`${parent}/${sub}`)) await del(`${parent}/${sub}/${d.id}`); }
const runMatch = (f) => !RUN_ID || val(f.test_run) === RUN_ID;

(async () => {
  console.log(DELETE ? "=== DELETING ===" : "=== DRY RUN ===", RUN_ID ? `run=${RUN_ID}` : "(all test data)");
  const profiles = await listAll("profiles");
  const testUids = new Set(
    profiles.filter((p) => {
      const email = val(p.fields.email) || "";
      return (email.includes("@dadori-test.com") || val(p.fields.test_run)) && runMatch(p.fields);
    }).map((p) => p.id)
  );
  console.log("test accounts:", testUids.size);

  for (const c of ["startups", "talent", "investors", "pitchdecks", "businessplans", "publicProfiles", "profiles"]) {
    for (const d of await listAll(c)) if (testUids.has(d.id)) await del(`${c}/${d.id}`);
  }
  for (const p of await listAll("portfolios")) if (testUids.has(p.id)) { await delSub(`portfolios/${p.id}`, "items"); await del(`portfolios/${p.id}`); }
  for (const u of testUids) { await delSub(`investors/${u}`, "watchlist"); await delSub(`investors/${u}`, "portfolio"); }

  const projects = await listAll("projects");
  const testProjects = projects.filter((p) => (/^Proj-\d+/.test(val(p.fields.name) || "") || val(p.fields.test_run)) && runMatch(p.fields));
  for (const p of testProjects) await del(`projects/${p.id}`);
  console.log("projects:", testProjects.length);

  const ws = await listAll("workspaces");
  const testWs = ws.filter((w) => (testUids.has(val(w.fields.ownerId)) || val(w.fields.test_run)) && runMatch(w.fields));
  for (const w of testWs) { for (const sub of ["members", "tasks", "sprints", "milestones", "ailog", "dataroom"]) await delSub(`workspaces/${w.id}`, sub); await del(`workspaces/${w.id}`); }
  console.log("workspaces:", testWs.length);

  for (const a of await listAll("applications")) if ((testUids.has(val(a.fields.fromUid)) || testUids.has(val(a.fields.toUid)) || val(a.fields.test_run)) && runMatch(a.fields)) await del(`applications/${a.id}`);
  for (const r of await listAll("roles")) if ((testUids.has(val(r.fields.ownerId)) || val(r.fields.test_run)) && runMatch(r.fields)) await del(`roles/${r.id}`);

  console.log(DELETE ? `\nDELETED ${deleted} docs (failed ${failed}).` : `\nWOULD delete ~${deleted} docs (dry run).`);
})();
