import { test, expect } from "@playwright/test";
import { signup, uniqueEmail, waitForAuthReady } from "./helpers";

const TOKEN = process.env.GCLOUD_TOKEN ?? "";
const FS = "https://firestore.googleapis.com/v1/projects/hadori-7665f/databases/(default)/documents";

test("AI plan-to-board generates real sprints/tasks in production", async ({ page }) => {
  test.skip(!TOKEN, "needs GCLOUD_TOKEN");

  const email = uniqueEmail("ai-plan");
  await signup(page, "creator", email, "AI Plan Tester");
  await expect(page).toHaveURL(/\/de\/startup/, { timeout: 15_000 });

  // Create a workspace
  await page.goto("/de/startup");
  await waitForAuthReady(page);
  await page.getByRole("button", { name: /workspace erstellen/i }).first().click();
  await page.getByPlaceholder(/Name deines Workspace/).fill(`AI-WS-${Date.now()}`);
  await page.getByRole("button", { name: /^Erstellen$/ }).click();
  await page.waitForURL(/\/de\/workspace\/([A-Za-z0-9]{15,})/, { timeout: 25_000 });
  const wsId = page.url().match(/\/workspace\/([A-Za-z0-9]+)/)![1];

  // Find the owner uid (member doc id) and elevate to startup_pro so the AI gate passes
  const members = await page.request.get(`${FS}/workspaces/${wsId}/members`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  }).then((r) => r.json());
  const uid = members.documents?.[0]?.name?.split("/").pop();
  expect(uid, "member uid").toBeTruthy();

  await page.request.patch(
    `${FS}/profiles/${uid}?updateMask.fieldPaths=plan_tier`,
    { headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      data: { fields: { plan_tier: { stringValue: "startup_pro" } } } }
  );

  // Reload so the client picks up the new tier, open the AI dialog, generate.
  // (The workspace board has its own layout — no global navbar — so wait for
  // the AI button itself instead of the navbar auth signal.)
  await page.reload();
  const aiBtn = page.getByRole("button", { name: /Plan → Board|AI: Plan|KI: Plan/i });
  await aiBtn.waitFor({ timeout: 20_000 });
  await aiBtn.click();
  await page.getByPlaceholder(/Main goal|Hauptziel/i).fill("Launch MVP and get first users");
  await page.getByRole("button", { name: /^Generate$|^Generieren$/ }).click();

  // The result panel confirms the AI produced a plan (requires the real API key)
  await expect(page.getByText(/Plan created|Plan erstellt/i)).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText(/sprints? ·|Sprints ·/i)).toBeVisible({ timeout: 5_000 });
});
