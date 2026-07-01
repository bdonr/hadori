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
  await expect(page.getByText(/Gespeichert/i).first()).toBeVisible({ timeout: 15_000 });

  await page.reload();
  await waitForAuthReady(page);
  await expect(page.locator("textarea, input[type=text]").first()).toHaveValue(value, { timeout: 20_000 });
});
