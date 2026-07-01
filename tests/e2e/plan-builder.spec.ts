import { test, expect } from "@playwright/test";
import { signup, uniqueEmail, waitForAuthReady } from "./helpers";

const TOKEN = process.env.GCLOUD_TOKEN ?? "";
const FS = "https://firestore.googleapis.com/v1/projects/hadori-7665f/databases/(default)/documents";

test("AI business plan builder: 5 questions -> 2 versions, persisted", async ({ page }) => {
  test.skip(!TOKEN, "needs GCLOUD_TOKEN");

  const email = uniqueEmail("plan-builder");
  await signup(page, "creator", email, "Plan Builder");
  await expect(page).toHaveURL(/\/de\/startup/, { timeout: 15_000 });

  // Find uid via Firestore query on the email we stored at signup, elevate to paid.
  const q = await page.request.post(`${FS}:runQuery`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    data: { structuredQuery: { from: [{ collectionId: "profiles" }], where: { fieldFilter: { field: { fieldPath: "email" }, op: "EQUAL", value: { stringValue: email } } }, limit: 1 } },
  }).then((r) => r.json());
  const uid = q.find((row: { document?: { name: string } }) => row.document)?.document?.name?.split("/").pop();
  expect(uid, "uid").toBeTruthy();
  await page.request.patch(`${FS}/profiles/${uid}?updateMask.fieldPaths=plan_tier`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    data: { fields: { plan_tier: { stringValue: "startup_pro" } } },
  });

  // Fill the param form
  await page.goto("/de/startup/plan");
  await waitForAuthReady(page);
  await page.getByPlaceholder(/DADORI/).fill("TestCo");
  await page.getByRole("button", { name: "💻 B2B SaaS" }).click();
  await page.getByRole("button", { name: "Zu langsame Prozesse" }).click();
  await page.getByRole("button", { name: /KMU/ }).click();
  await page.getByRole("button", { name: "🔄 SaaS-Abo" }).click();
  await page.getByRole("button", { name: /Weiter zu den Fragen/ }).click();

  // 5 AI questions appear
  await expect(page.getByRole("heading", { name: /5 Fragen/ })).toBeVisible({ timeout: 40_000 });
  const answers = page.locator("textarea");
  const count = await answers.count();
  expect(count).toBeGreaterThanOrEqual(3);
  for (let i = 0; i < count; i++) await answers.nth(i).fill("Ein konkreter Testsatz zur Beantwortung.");

  // Generate the two versions
  await page.getByRole("button", { name: /^Plan erstellen$/ }).click();
  await expect(page.getByText(/Gespeichert/).first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("heading", { name: /Außenansicht/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Innenansicht/ })).toBeVisible();

  // Persisted?
  const bp = await page.request.get(`${FS}/businessplans/${uid}`, { headers: { Authorization: `Bearer ${TOKEN}` } }).then((r) => r.json());
  expect(bp.fields?.internal, "internal plan persisted").toBeTruthy();
});
