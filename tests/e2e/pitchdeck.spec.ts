import { test, expect } from "@playwright/test";
import { signup, uniqueEmail, waitForAuthReady } from "./helpers";

test("pitch deck: a slide field persists after save + reload", async ({ page }) => {
  const email = uniqueEmail("deck");
  await signup(page, "creator", email, "Deck Tester");
  await expect(page).toHaveURL(/\/de\/startup/, { timeout: 15_000 });

  await page.goto("/de/startup/pitchdeck");
  await waitForAuthReady(page);

  const value = `Persistenz-Test ${Date.now()}`;
  const firstField = page.locator("textarea, input[type=text]").first();
  await firstField.waitFor({ timeout: 15_000 });
  await firstField.fill(value);

  await page.getByRole("button", { name: /Pitchdeck speichern/i }).click();
  // After saving, the page redirects to the overview (standing rule #6).
  await expect(page).toHaveURL(/\/de\/startup\/overview/, { timeout: 15_000 });

  // Navigate back to the deck — the saved value must still be there.
  await page.goto("/de/startup/pitchdeck");
  await waitForAuthReady(page);
  await expect(page.locator("textarea, input[type=text]").first()).toHaveValue(value, { timeout: 20_000 });
});
