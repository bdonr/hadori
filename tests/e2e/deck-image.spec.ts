import { test, expect } from "@playwright/test";
import { signup, uniqueEmail, waitForAuthReady } from "./helpers";

// 1x1 transparent PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

test("pitch deck: image upload works and persists", async ({ page }) => {
  const email = uniqueEmail("deck-img");
  await signup(page, "creator", email, "Deck Img");
  await expect(page).toHaveURL(/\/de\/startup/, { timeout: 15_000 });

  await page.goto("/de/startup/pitchdeck");
  await waitForAuthReady(page);

  // Upload into the first slide's image dropzone (hidden file input).
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "slide.png", mimeType: "image/png", buffer: PNG,
  });

  // The uploaded image renders (remove button appears) and no error shows.
  await expect(page.getByRole("button", { name: /Entfernen/i }).first()).toBeVisible({ timeout: 25_000 });
  await expect(page.getByText(/Upload fehlgeschlagen/i)).toHaveCount(0);

  // Save the deck, then come back — the image must persist.
  await page.getByRole("button", { name: /Pitchdeck speichern/i }).click();
  await expect(page).toHaveURL(/\/de\/startup\/overview/, { timeout: 15_000 });
  await page.goto("/de/startup/pitchdeck");
  await waitForAuthReady(page);
  await expect(page.locator("img").first()).toBeVisible({ timeout: 20_000 });
});
