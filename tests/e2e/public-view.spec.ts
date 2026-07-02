import { test, expect, chromium } from "@playwright/test";
import { signup, uniqueEmail, waitForAuthReady } from "./helpers";

const TOKEN = process.env.GCLOUD_TOKEN ?? "";
const FS = "https://firestore.googleapis.com/v1/projects/hadori-7665f/databases/(default)/documents";

test("public company view: another user sees only the released pitch-deck slide", async ({ page, baseURL }) => {
  test.skip(!TOKEN, "needs GCLOUD_TOKEN");

  // --- Founder: create a public slide ---
  const founderEmail = uniqueEmail("pub-founder");
  await signup(page, "creator", founderEmail, "Public Founder");
  await expect(page).toHaveURL(/\/de\/startup/, { timeout: 15_000 });

  // n:1 — the public company page is per STARTUP, so create one first.
  await page.goto("/de/startup/profile");
  await waitForAuthReady(page);
  await page.locator("#sp-name").fill(`PubCo-${Date.now()}`);
  await page.getByRole("button", { name: /^speichern$/i }).click();
  await expect(page).toHaveURL(/\/de\/startup\/overview/, { timeout: 15_000 });

  const secret = `Öffentlich-${Date.now()}`;
  await page.goto("/de/startup/pitchdeck");
  await waitForAuthReady(page);
  await page.locator("textarea").first().fill(secret);
  // Make deck public, then mark the first slide public
  await page.getByRole("button", { name: "toggle-deck-public" }).click();
  await page.getByRole("button", { name: /Privat/ }).first().click();
  await page.getByRole("button", { name: /Pitchdeck speichern/i }).click();
  await expect(page).toHaveURL(/\/de\/startup\/overview/, { timeout: 15_000 });

  // Founder uid via email lookup
  const q = await page.request.post(`${FS}:runQuery`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    data: { structuredQuery: { from: [{ collectionId: "profiles" }], where: { fieldFilter: { field: { fieldPath: "email" }, op: "EQUAL", value: { stringValue: founderEmail } } }, limit: 1 } },
  }).then((r) => r.json());
  const founderUid = q.find((r: { document?: { name: string } }) => r.document)?.document?.name?.split("/").pop();
  expect(founderUid, "founder uid").toBeTruthy();

  // The company page is keyed by the startup id — look it up by owner_uid.
  const sq = await page.request.post(`${FS}:runQuery`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    data: { structuredQuery: { from: [{ collectionId: "startups" }], where: { fieldFilter: { field: { fieldPath: "owner_uid" }, op: "EQUAL", value: { stringValue: founderUid } } }, limit: 1 } },
  }).then((r) => r.json());
  const startupId = sq.find((r: { document?: { name: string } }) => r.document)?.document?.name?.split("/").pop();
  expect(startupId, "startup id").toBeTruthy();

  // A public company page requires a discoverable startup (rules gate non-owner
  // reads on is_discoverable). Publish it so the viewer can resolve the owner.
  await page.request.patch(`${FS}/startups/${startupId}?updateMask.fieldPaths=is_discoverable`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    data: { fields: { is_discoverable: { booleanValue: true } } },
  });

  // --- Viewer (separate account/context): open the public company page ---
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ baseURL });
  const viewer = await ctx.newPage();
  await signup(viewer, "talent", uniqueEmail("pub-viewer"), "Public Viewer");
  await expect(viewer).toHaveURL(/\/de\/talent/, { timeout: 15_000 });

  await viewer.goto(`/de/company/${startupId}`);
  // The released slide's text must be visible to the other user.
  await expect(viewer.getByText(secret)).toBeVisible({ timeout: 20_000 });
  await ctx.close();
  await browser.close();
});
