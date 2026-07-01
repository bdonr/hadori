import { test, expect } from "@playwright/test";
import { signup, uniqueEmail, waitForAuthReady } from "./helpers";

const TOKEN = process.env.GCLOUD_TOKEN ?? "";
const FS = "https://firestore.googleapis.com/v1/projects/hadori-7665f/databases/(default)/documents";

test("roles page plan note reflects the actual tier (rule #7)", async ({ page }) => {
  test.skip(!TOKEN, "needs GCLOUD_TOKEN");

  const email = uniqueEmail("gating");
  await signup(page, "creator", email, "Gating Tester");
  await expect(page).toHaveURL(/\/de\/startup/, { timeout: 15_000 });

  // Free tier → the plan/allowance note IS shown.
  await page.goto("/de/startup/roles");
  await waitForAuthReady(page);
  await expect(page.getByText(/Dein Plan:/).first()).toBeVisible({ timeout: 15_000 });

  // Elevate to startup_pro (unlimited roles) → the note must disappear.
  const q = await page.request.post(`${FS}:runQuery`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    data: { structuredQuery: { from: [{ collectionId: "profiles" }], where: { fieldFilter: { field: { fieldPath: "email" }, op: "EQUAL", value: { stringValue: email } } }, limit: 1 } },
  }).then((r) => r.json());
  const uid = q.find((r: { document?: { name: string } }) => r.document)?.document?.name?.split("/").pop();
  expect(uid).toBeTruthy();
  await page.request.patch(`${FS}/profiles/${uid}?updateMask.fieldPaths=plan_tier`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    data: { fields: { plan_tier: { stringValue: "startup_pro" } } },
  });

  await page.goto("/de/startup/roles");
  await waitForAuthReady(page);
  await page.waitForTimeout(2000); // let the client read the new tier
  await expect(page.getByText(/Dein Plan:/)).toHaveCount(0);
});
