import { test, expect } from "@playwright/test";
import { signup, login, signout, uniqueEmail, TEST_PASSWORD } from "./helpers";

// ── SIGNUP ───────────────────────────────────────────────────────────────────

test.describe("Signup", () => {
  test("Creator: registers and lands on startup dashboard", async ({ page }) => {
    const email = uniqueEmail("creator");
    await signup(page, "creator", email, "Test Creator");

    await expect(page).toHaveURL(/\/de\/startup/, { timeout: 15_000 });
  });

  test("Talent: registers and lands on talent dashboard", async ({ page }) => {
    const email = uniqueEmail("talent");
    await signup(page, "talent", email, "Test Talent");

    await expect(page).toHaveURL(/\/de\/talent/, { timeout: 10_000 });
    await expect(page.getByText("Test Talent")).toBeVisible();
  });

  test("Investor: registers and lands on investor dashboard", async ({ page }) => {
    const email = uniqueEmail("investor");
    await signup(page, "investor", email, "Test Investor");

    await expect(page).toHaveURL(/\/de\/investor/, { timeout: 10_000 });
    await expect(page.getByText("Test Investor")).toBeVisible();
  });
});

// ── LOGIN / LOGOUT ────────────────────────────────────────────────────────────

test.describe("Login & Logout", () => {
  // We register once, then test login with those credentials
  let creatorEmail: string;

  test.beforeAll(async ({ browser }) => {
    creatorEmail = uniqueEmail("login-creator");
    const page = await browser.newPage();
    await signup(page, "creator", creatorEmail, "Login Creator");
    await page.waitForURL(/\/de\/startup/);
    await page.close();
  });

  test("can log in with existing credentials", async ({ page }) => {
    await login(page, creatorEmail);

    await expect(page).toHaveURL(/\/de\/startup/, { timeout: 10_000 });
    await expect(page.getByText("Login Creator")).toBeVisible();
  });

  test("after logout, name disappears and homepage shows login button", async ({ page }) => {
    await login(page, creatorEmail);
    await page.waitForURL(/\/de\/startup/);

    await signout(page);

    // Should land on homepage
    await expect(page).toHaveURL(/\/de\/?$/, { timeout: 10_000 });
    // Name should NOT be visible
    await expect(page.getByText("Login Creator")).not.toBeVisible();
    // Login button should be visible
    await expect(page.getByRole("link", { name: /einloggen|sign in/i })).toBeVisible();
  });

  test("logged-in user visiting homepage gets redirected to dashboard", async ({ page }) => {
    await login(page, creatorEmail);
    await page.waitForURL(/\/de\/startup/);

    // Navigate to homepage
    await page.goto("/de");

    // Should be redirected back to startup dashboard
    await expect(page).toHaveURL(/\/de\/startup/, { timeout: 10_000 });
  });

  test("wrong password shows error", async ({ page }) => {
    await page.goto("/de/login");
    await page.getByLabel("E-Mail").fill(creatorEmail);
    await page.getByLabel("Passwort").fill("wrongpassword");
    await page.getByRole("button", { name: /anmelden|einloggen/i }).click();

    await expect(page.getByText(/falsch|invalid|wrong|fehler/i)).toBeVisible({ timeout: 8_000 });
  });
});
