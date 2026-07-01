# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Login & Logout >> after logout, homepage shows login link
- Location: tests\e2e\auth.spec.ts:47:7

# Error details

```
TimeoutError: locator.waitFor: Timeout 20000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /abmelden|ausloggen|sign out|logout/i }) to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - img [ref=e4]
    - heading "This page couldn’t load" [level=1] [ref=e6]
    - paragraph [ref=e7]: A server error occurred. Reload to try again.
    - button "Reload" [ref=e10] [cursor=pointer]
  - paragraph [ref=e11]: ERROR 3358692536
```

# Test source

```ts
  1  | import { Page } from "@playwright/test";
  2  | 
  3  | // Unique email per test run so Firebase doesn't complain about duplicates
  4  | export function uniqueEmail(prefix: string) {
  5  |   return `test+${prefix}+${Date.now()}@dadori-test.com`;
  6  | }
  7  | 
  8  | export const TEST_PASSWORD = "Test1234!";
  9  | 
  10 | export async function signup(
  11 |   page: Page,
  12 |   role: "creator" | "talent" | "investor",
  13 |   email: string,
  14 |   name: string
  15 | ) {
  16 |   await page.goto("/de/signup");
  17 | 
  18 |   // Step 1: pick role
  19 |   const roleLabels: Record<string, string> = {
  20 |     creator:  "Gründer / Creator",
  21 |     talent:   "Talent",
  22 |     investor: "Investor",
  23 |   };
  24 |   await page.getByText(roleLabels[role]).click();
  25 |   await page.getByRole("button", { name: /weiter/i }).click();
  26 | 
  27 |   // Step 2: fill form
  28 |   await page.getByLabel("Name").fill(name);
  29 |   await page.getByLabel("E-Mail").fill(email);
  30 |   await page.getByLabel("Passwort").fill(TEST_PASSWORD);
  31 |   await page.getByRole("button", { name: /konto erstellen/i }).click();
  32 | }
  33 | 
  34 | export async function login(page: Page, email: string) {
  35 |   await page.goto("/de/login");
  36 |   await page.getByLabel("E-Mail").fill(email);
  37 |   await page.getByLabel("Passwort").fill(TEST_PASSWORD);
  38 |   await page.getByRole("button", { name: /anmelden|einloggen/i }).click();
  39 |   // Wait until session cookie is set and redirect completes
  40 |   await page.waitForURL(/\/(startup|talent|investor)/, { timeout: 20_000 });
  41 | }
  42 | 
  43 | export async function signout(page: Page) {
  44 |   // Navbar loads user async — wait for signout button to appear first
> 45 |   await page.getByRole("button", { name: /abmelden|ausloggen|sign out|logout/i }).waitFor({ timeout: 20_000 });
     |                                                                                   ^ TimeoutError: locator.waitFor: Timeout 20000ms exceeded.
  46 |   await page.getByRole("button", { name: /abmelden|ausloggen|sign out|logout/i }).click();
  47 | }
  48 | 
```