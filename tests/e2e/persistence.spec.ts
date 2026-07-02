import { test, expect } from "@playwright/test";
import { signup, uniqueEmail, waitForAuthReady } from "./helpers";

const TOKEN = process.env.GCLOUD_TOKEN ?? "";
const FS = "https://firestore.googleapis.com/v1/projects/hadori-7665f/databases/(default)/documents";

// Grant a paid startup-family capability to a freshly-signed-up test account so
// it can create (creation is gated to paid accounts in the n:m model).
async function grantProjectCap(page: import("@playwright/test").Page, email: string) {
  const q = await page.request.post(`${FS}:runQuery`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    data: { structuredQuery: { from: [{ collectionId: "profiles" }], where: { fieldFilter: { field: { fieldPath: "email" }, op: "EQUAL", value: { stringValue: email } } }, limit: 1 } },
  }).then((r) => r.json());
  const uid = q.find((r: { document?: { name: string } }) => r.document)?.document?.name?.split("/").pop();
  await page.request.patch(`${FS}/profiles/${uid}?updateMask.fieldPaths=plan_tier`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    data: { fields: { plan_tier: { stringValue: "project" } } },
  });
}

// These tests verify that data actually persists to Firestore in production —
// the whole point of the rules/secrets fixes. Each test writes something,
// reloads (fresh server render / fresh client read), and asserts it survived.

test.describe("Persistence — Startup", () => {
  test("startup profile: name persists after save + reload", async ({ page }) => {
    const email = uniqueEmail("persist-startup");
    await signup(page, "creator", email, "Persist Creator");
    await expect(page).toHaveURL(/\/de\/startup/, { timeout: 15_000 });

    const startupName = `Acme-${Date.now()}`;
    await page.goto("/de/startup/profile");
    await waitForAuthReady(page);
    const nameInput = page.locator("#sp-name");
    await nameInput.waitFor({ timeout: 15_000 });
    await nameInput.fill(startupName);

    await page.getByRole("button", { name: /^speichern$/i }).click();
    // After saving, the profile redirects to the overview (standing rule #6).
    await expect(page).toHaveURL(/\/de\/startup\/overview/, { timeout: 15_000 });

    // Navigate back to the profile — the value must come back from Firestore.
    await page.goto("/de/startup/profile");
    await waitForAuthReady(page);
    await expect(page.locator("#sp-name")).toHaveValue(startupName, { timeout: 20_000 });
  });

  test("project create: publishes and lands on persisted project page", async ({ page }) => {
    test.skip(!TOKEN, "needs GCLOUD_TOKEN to grant the create capability");
    const email = uniqueEmail("persist-project");
    await signup(page, "creator", email, "Project Creator");
    await expect(page).toHaveURL(/\/de\/startup/, { timeout: 15_000 });

    // Creating is gated to paid accounts — grant the project capability first.
    await grantProjectCap(page, email);

    const projectName = `Proj-${Date.now()}`;
    await page.goto("/de/project/create");
    await waitForAuthReady(page);

    await page.getByRole("button", { name: "🎮 Gaming" }).click();
    await page.getByPlaceholder(/StreamerXY/).fill(projectName);
    await page.getByRole("button", { name: /veröffentlichen/i }).click();

    // Should navigate to the created project's page (real Firestore id)
    await page.waitForURL(/\/de\/project\/[A-Za-z0-9]{15,}/, { timeout: 20_000 });
    await expect(page.getByText(projectName).first()).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(page.getByText(projectName).first()).toBeVisible({ timeout: 20_000 });
  });

  test("logged-in user on homepage is redirected to dashboard (no marketing/signup)", async ({ page }) => {
    const email = uniqueEmail("home-redirect");
    await signup(page, "creator", email, "Home Creator");
    await expect(page).toHaveURL(/\/de\/startup/, { timeout: 15_000 });

    // Visiting the homepage must bounce a logged-in user to their dashboard,
    // NOT show the "Start for free" landing page.
    await page.goto("/de");
    await expect(page).toHaveURL(/\/de\/startup/, { timeout: 15_000 });
    // The marketing signup CTA must not be present
    await expect(page.getByRole("link", { name: /start for free|kostenlos starten|jetzt registrieren/i }))
      .toHaveCount(0);
  });

  test("workspace create: server API persists and redirects to workspace", async ({ page }) => {
    const email = uniqueEmail("persist-ws");
    await signup(page, "creator", email, "WS Creator");
    await expect(page).toHaveURL(/\/de\/startup/, { timeout: 15_000 });

    await page.goto("/de/startup");
    await waitForAuthReady(page);
    await page.getByRole("button", { name: /workspace erstellen/i }).first().click();
    await page.getByPlaceholder(/Name deines Workspace/).fill(`WS-${Date.now()}`);
    await page.getByRole("button", { name: /^Erstellen$/ }).click();

    await page.waitForURL(/\/de\/workspace\/[A-Za-z0-9]{15,}/, { timeout: 25_000 });
  });
});

test.describe("Persistence — Talent", () => {
  test("talent skills: bio persists after save + reload", async ({ page }) => {
    const email = uniqueEmail("persist-talent");
    await signup(page, "talent", email, "Persist Talent");
    await expect(page).toHaveURL(/\/de\/talent/, { timeout: 15_000 });

    const bio = `Ich bin Tester ${Date.now()}`;
    await page.goto("/de/talent/skills");
    await waitForAuthReady(page);

    const bioField = page.locator("textarea").first();
    await bioField.waitFor({ timeout: 15_000 });
    await bioField.fill(bio);

    // Must select at least one skill or save is blocked
    const skillSearch = page.getByPlaceholder(/skill/i).first();
    if (await skillSearch.isVisible().catch(() => false)) {
      await skillSearch.click();
      await skillSearch.fill("React");
      const firstOption = page.getByRole("button", { name: /React/ }).first();
      if (await firstOption.isVisible().catch(() => false)) await firstOption.click();
    }

    await page.getByRole("button", { name: /profil speichern|speichern/i }).first().click();
    await expect(page.getByText(/gespeichert/i).first()).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await waitForAuthReady(page);
    await expect(page.locator("textarea").first()).toHaveValue(bio, { timeout: 20_000 });
  });
});
