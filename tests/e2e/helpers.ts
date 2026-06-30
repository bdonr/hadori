import { Page } from "@playwright/test";

// Unique email per test run so Firebase doesn't complain about duplicates
export function uniqueEmail(prefix: string) {
  return `test+${prefix}+${Date.now()}@dadori-test.com`;
}

export const TEST_PASSWORD = "Test1234!";

export async function signup(
  page: Page,
  role: "creator" | "talent" | "investor",
  email: string,
  name: string
) {
  await page.goto("/de/signup");

  // Step 1: pick role
  const roleLabels: Record<string, string> = {
    creator:  "Gründer / Creator",
    talent:   "Talent",
    investor: "Investor",
  };
  await page.getByText(roleLabels[role]).click();
  await page.getByRole("button", { name: /weiter/i }).click();

  // Step 2: fill form
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /konto erstellen/i }).click();
}

export async function login(page: Page, email: string) {
  await page.goto("/de/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /anmelden|einloggen/i }).click();
  // Wait until session cookie is set and redirect completes
  await page.waitForURL(/\/(startup|talent|investor)/, { timeout: 20_000 });
}

export async function signout(page: Page) {
  // Navbar loads user async — wait for signout button to appear first
  await page.getByRole("button", { name: /abmelden|ausloggen|sign out|logout/i }).waitFor({ timeout: 20_000 });
  await page.getByRole("button", { name: /abmelden|ausloggen|sign out|logout/i }).click();
}
