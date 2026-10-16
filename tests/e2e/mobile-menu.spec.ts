// Мобильная шапка: липкая, меню закрывается пунктом, затемнением, бургером
// и Esc – с анимацией закрытия (components/MobileMenu.tsx)
import type { Page } from "@playwright/test";
import { nav } from "@/lib/content";
import { expect, openLanding, test } from "./fixtures";

test.skip(({ isMobile }) => !isMobile, "меню только < lg");

function menu(page: Page) {
  return {
    toggle: page.locator("#header summary"),
    panel: page.locator("[data-menu-panel]"),
    scrim: page.locator("[data-menu-scrim]"),
    link: (label: string) =>
      page.locator("[data-menu-panel]").getByRole("link", { name: label }),
  };
}

const pageLocked = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).overflow);

test("шапка остаётся наверху при прокрутке", async ({ page }) => {
  await openLanding(page);
  await page.locator("#coffee").scrollIntoViewIfNeeded();

  const header = page.locator("#header");
  await expect(header).toBeInViewport();
  expect((await header.boundingBox())!.y).toBe(0);
});

test("пункт меню закрывает его и ставит раздел под шапку", async ({ page }) => {
  await openLanding(page);
  const m = menu(page);

  await m.toggle.click();
  await expect(m.panel).toBeVisible();
  expect(await pageLocked(page)).toBe("hidden");

  await m.link(nav.links[1]!.label).click();
  await expect(m.panel).toBeHidden();
  expect(await pageLocked(page)).not.toBe("hidden");

  const headerHeight = (await page.locator("#header").boundingBox())!.height;
  await expect
    .poll(async () =>
      Math.round((await page.locator("#subscription").boundingBox())!.y),
    )
    .toBe(Math.round(headerHeight));
});

test("затемнение, бургер и Esc закрывают меню", async ({ page }) => {
  await openLanding(page);
  const m = menu(page);

  await m.toggle.click();
  await expect(m.panel).toBeVisible();
  const viewport = page.viewportSize()!;
  await page.mouse.click(viewport.width / 2, viewport.height - 10);
  await expect(m.panel).toBeHidden();

  await m.toggle.click();
  await expect(m.panel).toBeVisible();
  await m.toggle.click();
  await expect(m.panel).toBeHidden();

  await m.toggle.click();
  await expect(m.panel).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(m.panel).toBeHidden();
  await expect(m.toggle).toBeFocused();
});
