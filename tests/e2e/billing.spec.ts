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

    await expect(page.getByRole("heading", { name: "Projekt" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Startup" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Startup Pro" })).toBeVisible();
  });

  test("current plan shows 'Aktueller Plan' badge", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/startup/billing");

    await expect(page.getByText("Aktueller Plan")).toBeVisible();
  });

  test("clicking upgrade opens Stripe Checkout", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/startup/billing");

    const upgradeBtn = page.getByRole("button", { name: /zu startup upgraden/i });
    await expect(upgradeBtn).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/billing/checkout"), { timeout: 15_000 }),
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

    await expect(page.getByRole("heading", { name: "Free" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Plus" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pro" })).toBeVisible();
  });

  test("clicking Plus upgrade opens Stripe Checkout", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/talent/billing");

    const upgradeBtn = page.getByRole("button", { name: /plus freischalten/i });
    await expect(upgradeBtn).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/billing/checkout"), { timeout: 15_000 }),
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

    await expect(page.getByRole("heading", { name: "Scout" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Angel" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Investor Pro" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lead Investor" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /VC.*Elite/ })).toBeVisible();
  });

  test("clicking Angel upgrade opens Stripe Checkout", async ({ page }) => {
    await login(page, email);
    await page.goto("/de/investor/billing");

    const upgradeBtn = page.getByRole("button", { name: /angel werden/i });
    await expect(upgradeBtn).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/billing/checkout"), { timeout: 15_000 }),
      upgradeBtn.click(),
    ]);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.url).toContain("stripe.com");
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
