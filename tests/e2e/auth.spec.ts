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
    await expect(page.getByRole("heading", { name: /Test Talent/ })).toBeVisible({ timeout: 10_000 });
  });

  test("Investor: registers and lands on investor dashboard", async ({ page }) => {
    const email = uniqueEmail("investor");
    await signup(page, "investor", email, "Test Investor");
    await expect(page).toHaveURL(/\/de\/investor/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: /Test Investor/ })).toBeVisible({ timeout: 10_000 });
  });
});

// ── LOGIN / LOGOUT ────────────────────────────────────────────────────────────

test.describe("Login & Logout", () => {
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
    // URL reaching /startup proves login succeeded and role was resolved
    await expect(page).toHaveURL(/\/de\/startup/, { timeout: 10_000 });
  });

  test("after logout, homepage shows login link", async ({ page }) => {
    await login(page, creatorEmail);
    await expect(page).toHaveURL(/\/de\/startup/, { timeout: 10_000 });

    await signout(page);

    // Should land on homepage with login link visible
    await expect(page).toHaveURL(/\/de\/?$/, { timeout: 10_000 });
    await expect(page.getByRole("link", { name: /einloggen|anmelden|sign in/i })).toBeVisible({ timeout: 10_000 });
  });

  test("wrong password shows error", async ({ page }) => {
    await page.goto("/de/login");
    await page.getByLabel("E-Mail").fill(creatorEmail);
    await page.getByLabel("Passwort").fill("wrongpassword");
    await page.getByRole("button", { name: /anmelden|einloggen/i }).click();
    await expect(page.getByText(/falsch|invalid|wrong|fehler/i)).toBeVisible({ timeout: 8_000 });
  });
});
