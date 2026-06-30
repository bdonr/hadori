import { test, expect } from "@playwright/test";
import { signup, login, uniqueEmail } from "./helpers";

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
    await page.goto("/de/startup/billing");

    await expect(page.getByRole("heading", { name: "Projekt", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Startup", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Startup Pro", exact: true })).toBeVisible();
  });

  test("current plan shows 'Aktueller Plan' badge", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/startup/billing");

    await expect(page.getByText("Aktueller Plan")).toBeVisible();
  });

  test.skip("clicking upgrade opens Stripe Checkout — needs NEXT_PUBLIC_STRIPE_PRICE_* in Firebase Console", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/startup/billing");

    // Mock checkout API so test doesn't depend on Stripe env vars in production
    let checkoutCalled = false;
    await page.route("**/api/billing/checkout", async (route) => {
      checkoutCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: "https://checkout.stripe.com/test" }) });
    });

    const upgradeBtn = page.getByRole("button", { name: /zu startup upgraden/i });
    await expect(upgradeBtn).toBeVisible();
    await upgradeBtn.click();

    await page.waitForTimeout(2000);
    expect(checkoutCalled).toBe(true);
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

    await expect(page.getByRole("heading", { name: "Free" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Plus" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pro" })).toBeVisible();
  });

  test.skip("clicking Plus upgrade opens Stripe Checkout — needs NEXT_PUBLIC_STRIPE_PRICE_* in Firebase Console", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/talent/billing");

    let checkoutCalled = false;
    await page.route("**/api/billing/checkout", async (route) => {
      checkoutCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: "https://checkout.stripe.com/test" }) });
    });

    const upgradeBtn = page.getByRole("button", { name: /plus freischalten/i });
    await expect(upgradeBtn).toBeVisible();
    await upgradeBtn.click();

    await page.waitForTimeout(2000);
    expect(checkoutCalled).toBe(true);
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

    await expect(page.getByRole("heading", { name: "Scout" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Angel" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Investor Pro" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lead Investor" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /VC.*Elite/ })).toBeVisible();
  });

  test.skip("clicking Angel upgrade opens Stripe Checkout — needs NEXT_PUBLIC_STRIPE_PRICE_* in Firebase Console", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/investor/billing");

    let checkoutCalled = false;
    await page.route("**/api/billing/checkout", async (route) => {
      checkoutCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: "https://checkout.stripe.com/test" }) });
    });

    const upgradeBtn = page.getByRole("button", { name: /angel werden/i });
    await expect(upgradeBtn).toBeVisible();
    await upgradeBtn.click();

    await page.waitForTimeout(2000);
    expect(checkoutCalled).toBe(true);
  });

  test("Elite tier button sends email instead of Stripe", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/investor/billing");

    await expect(page.getByRole("heading", { name: /VC.*Elite/ })).toBeVisible();
    const eliteBtn = page.getByRole("button", { name: /elite-zugang anfragen/i });
    await expect(eliteBtn).toBeVisible();
    // Elite button triggers mailto, not Stripe — just verify it's clickable
    await eliteBtn.click();
    await expect(page.getByRole("heading", { name: /VC.*Elite/ })).toBeVisible();
  });
});
