import { test, expect } from "@playwright/test";
import { signup, uniqueEmail, waitForAuthReady } from "./helpers";

// Verifies that free-tier accounts see the promised perks LOCKED, and that the
// gating reads the persisted plan_tier. (Unlocked states require a paid
// subscription and are covered by the tier-agnostic webhook + planCaps matrix.)

test.describe("Perks gating (free tier locked)", () => {
  test("free creator: funding & traction section is locked behind Pro", async ({ page }) => {
    const email = uniqueEmail("perk-creator");
    await signup(page, "creator", email, "Perk Creator");
    await expect(page).toHaveURL(/\/de\/startup/, { timeout: 15_000 });

    await page.goto("/de/startup/profile");
    await waitForAuthReady(page);
    // The funding section shows a lock overlay with a Pro upgrade CTA for free tier.
    await expect(page.getByText(/Pro-Feature|Pro freischalten/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("free talent: portfolio shows the 1-item free limit", async ({ page }) => {
    const email = uniqueEmail("perk-talent");
    await signup(page, "talent", email, "Perk Talent");
    await expect(page).toHaveURL(/\/de\/talent/, { timeout: 15_000 });

    await page.goto("/de/talent/portfolio");
    await waitForAuthReady(page);
    // Free tier: 1 slot. The locked placeholder / Pro upsell must be present.
    await expect(page.getByText(/Pro-Plan|Pro für|Pro freischalten|weitere Einträge/i).first())
      .toBeVisible({ timeout: 15_000 });
  });

  test("free investor: deal flow is gated behind Angel+", async ({ page }) => {
    const email = uniqueEmail("perk-investor");
    await signup(page, "investor", email, "Perk Investor");
    await expect(page).toHaveURL(/\/de\/investor/, { timeout: 15_000 });

    await page.goto("/de/investor/dealflow");
    await waitForAuthReady(page);
    // Free (Scout) tier: deal flow feed is locked with an upgrade gate.
    await expect(page.getByText(/upgraden|Angel|ab Angel/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
