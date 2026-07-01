import { test, expect } from "@playwright/test";
import { signup, uniqueEmail, waitForAuthReady } from "./helpers";

test("tag search: a talent tagged CTO is found by a startup searching CTO", async ({ page, baseURL }) => {
  // --- Talent tags themselves as CTO ---
  await signup(page, "talent", uniqueEmail("cto-talent"), "CTO Talent");
  await expect(page).toHaveURL(/\/de\/talent/, { timeout: 15_000 });
  await page.goto("/de/talent/skills");
  await waitForAuthReady(page);

  // Pick the "CTO / Tech-Lead" role via the SkillPicker search
  const picker = page.getByPlaceholder(/skill/i).first();
  await picker.fill("CTO");
  await page.getByText("CTO / Tech-Lead").first().click();
  await page.getByRole("button", { name: /profil speichern|speichern/i }).first().click();
  await expect(page.getByText(/gespeichert/i).first()).toBeVisible({ timeout: 15_000 });

  // --- Startup searches for CTO ---
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ baseURL });
  const startup = await ctx.newPage();
  await signup(startup, "creator", uniqueEmail("cto-startup"), "CTO Seeker");
  await expect(startup).toHaveURL(/\/de\/startup/, { timeout: 15_000 });
  await startup.goto("/de/startup/search");
  await waitForAuthReady(startup);

  await startup.getByPlaceholder(/skill/i).first().fill("CTO");
  await startup.getByText("CTO / Tech-Lead").first().click();

  // At least one match with the CTO skill highlighted appears.
  await expect(startup.getByText(/✓ CTO \/ Tech-Lead/).first()).toBeVisible({ timeout: 20_000 });
  await ctx.close();
  await browser.close();
});
