// Анимации и prefers-reduced-motion (ТЗ, разделы 9 и 11)
import { expect, leadForm, openLanding, test } from "./fixtures";

const hidden = "[data-reveal=pending]";

test("блоки ниже первого экрана появляются при прокрутке, hero – нет", async ({
  page,
}) => {
  await openLanding(page);
  await expect(page.locator("#hero [data-reveal]")).toHaveCount(0);

  const card = page.locator("#coffee li").first();
  await expect(card).toHaveAttribute("data-reveal", "pending");
  await expect(card).toHaveCSS("opacity", "0");

  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveAttribute("data-reveal", "shown");
  await expect(card).toHaveCSS("opacity", "1");
});

test("поле с ошибкой вздрагивает при отправке", async ({ page }) => {
  await openLanding(page);
  const lead = leadForm(page);
  await lead.submit.click();
  await expect(lead.name).toBeFocused();
  expect(await lead.name.evaluate((node) => node.getAnimations().length)).toBe(
    1,
  );
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("ничего не прячется и не двигается", async ({ page }) => {
    await openLanding(page);
    await expect(page.locator(hidden)).toHaveCount(0);
    await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
    await expect(page.locator("#coffee li").first()).toHaveCSS(
      "transition-duration",
      "0s",
    );

    const lead = leadForm(page);
    await lead.submit.click();
    await expect(lead.name).toBeFocused();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });
});

test.describe("без JS", () => {
  test.use({ javaScriptEnabled: false });

  test("контент виден", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(hidden)).toHaveCount(0);
    await expect(page.locator("#coffee li").first()).toHaveCSS("opacity", "1");
  });
});
