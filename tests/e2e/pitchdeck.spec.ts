import { test, expect } from "@playwright/test";
import { signup, uniqueEmail, waitForAuthReady } from "./helpers";

test("pitch deck: text, dropdown & multiselect all persist after save + reload", async ({ page }) => {
  const email = uniqueEmail("deck");
  await signup(page, "creator", email, "Deck Tester");
  await expect(page).toHaveURL(/\/de\/startup/, { timeout: 15_000 });

  await page.goto("/de/startup/pitchdeck");
  await waitForAuthReady(page);

  const value = `Persistenz-Test ${Date.now()}`;
  await page.locator("textarea").first().waitFor({ timeout: 15_000 });
  await page.locator("textarea").first().fill(value);
  // Multi-select chip (audience) + single-select dropdown (revenue model)
  await page.getByRole("button", { name: "KMU" }).click();
  await page.locator("select").first().selectOption({ label: "Abo (SaaS)" });
  // Visibility: make the deck public
  await page.getByRole("button", { name: "toggle-deck-public" }).click();
  await expect(page.getByText(/Pitchdeck ist öffentlich/)).toBeVisible();

  await page.getByRole("button", { name: /Pitchdeck speichern/i }).click();
  await expect(page).toHaveURL(/\/de\/startup\/overview/, { timeout: 15_000 });

  // Back to the deck — every input type + visibility must have survived.
  await page.goto("/de/startup/pitchdeck");
  await waitForAuthReady(page);
  await expect(page.locator("textarea").first()).toHaveValue(value, { timeout: 20_000 });
  await expect(page.locator("select").first()).toHaveValue("subscription");
  await expect(page.getByRole("button", { name: "KMU" })).toHaveClass(/bg-indigo-600/, { timeout: 10_000 });
  await expect(page.getByText(/Pitchdeck ist öffentlich/)).toBeVisible();
});
