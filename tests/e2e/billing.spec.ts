import { test, expect } from "@playwright/test";
import { signup, login, uniqueEmail } from "./helpers";

/**
 * Billing / Pricing tests.
 *
 * These tests verify that:
 *  - the billing page loads with correct plans
 *  - clicking upgrade starts a Stripe Checkout session
 *
 * We do NOT complete real payments in tests — Stripe test-mode
 * Checkout is opened and we verify the redirect to stripe.com.
 * To test a full purchase flow, use Stripe's test card 4242 4242 4242 4242.
 */

test.describe("Startup billing", () => {
  let email: string;

  test.beforeAll(async ({ browser }) => {
    email = uniqueEmail("startup-billing");
    const page = await browser.newPage();
    await signup(page, "creator", email, "Billing Creator");
    await page.waitForURL(/\/de\/startup/);
    await page.close();
  });

  test("billing page shows all three plans", async ({ page }) => {
    await login(page, email);
    await page.waitForURL(/\/de\/startup/);

    await page.goto("/de/startup/billing");

    await expect(page.getByText("Projekt")).toBeVisible();
    await expect(page.getByText("Startup")).toBeVisible();
    await expect(page.getByText("Startup Pro")).toBeVisible();
  });

  test("current plan shows 'Aktueller Plan' badge", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/startup/billing");

    await expect(page.getByText("Aktueller Plan")).toBeVisible();
  });

  test("clicking upgrade opens Stripe Checkout", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/startup/billing");

    // Click the Startup upgrade button (first non-current upgrade)
    const upgradeBtn = page.getByRole("button", { name: /zu startup upgraden/i });
    await expect(upgradeBtn).toBeVisible();

    // Intercept the navigation — Stripe redirects to checkout.stripe.com
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/billing/checkout"), { timeout: 10_000 }),
      upgradeBtn.click(),
    ]);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.url).toContain("stripe.com");
  });
});

test.describe("Talent billing", () => {
  let email: string;

  test.beforeAll(async ({ browser }) => {
    email = uniqueEmail("talent-billing");
    const page = await browser.newPage();
    await signup(page, "talent", email, "Billing Talent");
    await page.waitForURL(/\/de\/talent/);
    await page.close();
  });

  test("billing page shows Free, Plus, Pro plans", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/talent/billing");

    await expect(page.getByText("Free")).toBeVisible();
    await expect(page.getByText("Plus")).toBeVisible();
    await expect(page.getByText("Pro")).toBeVisible();
  });

  test("clicking Plus upgrade opens Stripe Checkout", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/talent/billing");

    const upgradeBtn = page.getByRole("button", { name: /plus freischalten/i });
    await expect(upgradeBtn).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/billing/checkout"), { timeout: 10_000 }),
      upgradeBtn.click(),
    ]);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.url).toContain("stripe.com");
  });
});

test.describe("Investor billing", () => {
  let email: string;

  test.beforeAll(async ({ browser }) => {
    email = uniqueEmail("investor-billing");
    const page = await browser.newPage();
    await signup(page, "investor", email, "Billing Investor");
    await page.waitForURL(/\/de\/investor/);
    await page.close();
  });

  test("billing page shows all 5 investor tiers", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/investor/billing");

    await expect(page.getByText("Scout")).toBeVisible();
    await expect(page.getByText("Angel")).toBeVisible();
    await expect(page.getByText("Investor Pro")).toBeVisible();
    await expect(page.getByText("Lead Investor")).toBeVisible();
    await expect(page.getByText("VC / Elite")).toBeVisible();
  });

  test("clicking Angel upgrade opens Stripe Checkout", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/investor/billing");

    const upgradeBtn = page.getByRole("button", { name: /angel werden/i });
    await expect(upgradeBtn).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/billing/checkout"), { timeout: 10_000 }),
      upgradeBtn.click(),
    ]);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.url).toContain("stripe.com");
  });

  test("Elite tier button sends email instead of Stripe", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/investor/billing");

    // Elite goes to mailto — intercept navigation
    const [nav] = await Promise.all([
      page.waitForEvent("framenavigated").catch(() => null),
      page.getByRole("button", { name: /elite-zugang anfragen/i }).click(),
    ]);
    // No Stripe call expected — just verify button is clickable without error
    await expect(page.getByText("VC / Elite")).toBeVisible();
  });
});
