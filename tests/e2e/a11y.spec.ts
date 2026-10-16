// axe: 0 нарушений serious/critical на страницах и в состояниях формы (ТЗ, раздел 14)
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, leadForm, openLanding, test } from "./fixtures";

// Без анимаций: блок, который ещё не появился (opacity 0), axe пропускает
// как скрытый, а на середине появления считает контраст полупрозрачного текста
test.use({ reducedMotion: "reduce" });

async function seriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    // Оверлей и индикатор next dev – не наша страница
    .exclude("nextjs-portal")
    .analyze();
  return violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => ({
      id: v.id,
      help: v.help,
      targets: v.nodes.map((n) => n.target.join(" ")),
    }));
}

test("страница", async ({ page }) => {
  await openLanding(page);
  expect(await seriousViolations(page)).toEqual([]);
});

test("политика и 404", async ({ page }) => {
  await page.goto("/privacy");
  expect(await seriousViolations(page)).toEqual([]);
  await page.goto("/no-such-page");
  expect(await seriousViolations(page)).toEqual([]);
});

test("форма с ошибками полей", async ({ page }) => {
  await openLanding(page);
  const lead = leadForm(page);
  await lead.phone.fill("123");
  await lead.submit.click();
  await expect(lead.name).toBeFocused();

  expect(await seriousViolations(page)).toEqual([]);
});

test("ошибка отправки", async ({ page }) => {
  await openLanding(page);
  const lead = leadForm(page);
  await page.route("**/api/lead", (route) =>
    route.fulfill({ status: 500, json: { ok: false, error: "server" } }),
  );
  await lead.name.fill("Анна");
  await lead.phone.fill("+375 29 123-45-67");
  await lead.submit.click();
  await expect(lead.error).toBeVisible();

  expect(await seriousViolations(page)).toEqual([]);
});
