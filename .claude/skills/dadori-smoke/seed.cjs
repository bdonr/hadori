// DADORI smoke seed — creates a tagged, self-purgeable test population via
// Firestore REST (owner token, bypasses rules). NO Firebase Auth users are
// created (these are data-only docs to populate explore/search/dealflow).
// Every doc carries email @dadori-test.com AND a `test_run` field so purge.cjs
// can remove it unambiguously. Never touches real data.
//
// Usage: GCLOUD_TOKEN=$(gcloud auth print-access-token) RUN_ID=smoke-<ts> node seed.cjs
const TOKEN = process.env.GCLOUD_TOKEN;
const RUN_ID = process.env.RUN_ID || `smoke-${Date.now()}`;
if (!TOKEN) { console.error("GCLOUD_TOKEN missing"); process.exit(1); }
const BASE = "https://firestore.googleapis.com/v1/projects/hadori-7665f/databases/(default)/documents";
const H = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
const s = (v) => ({ stringValue: v });
const b = (v) => ({ booleanValue: v });
const arr = (xs) => ({ arrayValue: { values: xs.map(s) } });
const now = new Date().toISOString();

async function put(path, fields) {
  fields.test_run = s(RUN_ID);
  fields.created_at = s(now);
  fields.updated_at = s(now);
  const r = await fetch(`${BASE}/${path}`, { method: "PATCH", headers: H, body: JSON.stringify({ fields }) });
  if (!r.ok) console.error("put", path, r.status, await r.text());
  return r.ok;
}
const uid = (kind, i) => `testrun_${RUN_ID}_${kind}${i}`;
async function account(u, role, name) {
  await put(`profiles/${u}`, { uid: s(u), role: s(role), full_name: s(name), email: s(`test+${u}@dadori-test.com`), plan_tier: s("free") });
  await put(`publicProfiles/${u}`, { uid: s(u), full_name: s(name), role: s(role), avatar_url: s("") });
}

(async () => {
  console.log("Seeding run:", RUN_ID);
  let n = 0;
  // Talent (skilled users)
  const talentSkills = [["role_cto", "backend", "ai_ml"], ["role_frontend_dev", "figma", "ui_ux"], ["video_editing", "motion_design"], ["role_growth_marketer", "seo", "ads"]];
  for (let i = 0; i < talentSkills.length; i++) {
    const u = uid("talent", i); await account(u, "talent", `Smoke Talent ${i + 1}`);
    await put(`talent/${u}`, { headline: s(`Smoke talent ${i + 1}`), bio: s("Seeded test talent."), skills: arr(talentSkills[i]), experience: s("experienced"), availability: s("immediately"), regions: arr(["de"]), languages: arr(["de", "en"]), publicFields: { mapValue: { fields: { skills: b(true), bio: b(true) } } } }); n++;
  }
  // Startups (discoverable)
  const startupNeeds = [["role_cto", "backend"], ["role_growth_marketer", "seo"], ["video_editing"], ["role_frontend_dev", "figma"]];
  for (let i = 0; i < startupNeeds.length; i++) {
    const u = uid("startup", i); await account(u, "creator", `Smoke Startup ${i + 1}`);
    await put(`startups/${u}`, { owner_uid: s(u), name: s(`Smoke Startup ${i + 1}`), tagline: s("A seeded test startup."), description: s("Seeded for smoke test."), industry: s("saas"), region: s("de"), stage: s("seed"), mrrRange: s("1k_10k"), teamSize: s("2–5"), neededSkills: arr(startupNeeds[i]), is_discoverable: b(true), seekingInvestors: b(true), featured: b(false) }); n++;
  }
  // Investors
  const focuses = [["saas", "fintech"], ["deep_tech"], ["creator", "consumer"]];
  for (let i = 0; i < focuses.length; i++) {
    const u = uid("investor", i); await account(u, "investor", `Smoke Investor ${i + 1}`);
    await put(`investors/${u}`, { name: s(`Smoke Investor ${i + 1}`), firm: s(`Smoke Capital ${i + 1}`), role: s("angel"), bio: s("Seeded test investor."), focus: arr(focuses[i]), stages: arr(["seed"]), checkSize: s("angel"), region: s("de"), openToIntros: b(true) }); n++;
  }
  // Projects (creator projects) — Proj-<ts> naming so they're also caught by name
  const cats = ["gaming", "music", "app", "creator", "ecommerce"];
  for (let i = 0; i < cats.length; i++) {
    const ownerU = uid("startup", i % startupNeeds.length);
    const pid = `Proj-${Date.now()}${i}`;
    await put(`projects/${pid}`, { name: s(pid), tagline: s(`Seeded ${cats[i]} project`), description: s("Seeded for smoke test."), category: s(cats[i]), stage: s("pre_seed"), region: s("de"), ownerId: s(ownerU), skills: arr(["role_cto", "figma"]), investorVisible: b(true) }); n++;
  }
  // A couple of open roles on a startup
  for (let i = 0; i < 2; i++) {
    await put(`roles/testrun_${RUN_ID}_role${i}`, { ownerId: s(uid("startup", 0)), title: s(i === 0 ? "CTO / Tech-Lead" : "Growth Marketer"), category: s("roles"), description: s("Seeded role."), is_open: b(true), skills: arr([i === 0 ? "role_cto" : "role_growth_marketer"]) }); n++;
  }
  console.log(`Seeded ${n} entities (4 talent, 4 startups, 3 investors, 5 projects, 2 roles) under test_run=${RUN_ID}.`);
})();
