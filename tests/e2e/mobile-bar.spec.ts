// Нижняя плашка на мобильном: появляется после hero и не закрывает
// кнопку отправки (ТЗ, раздел 4)
import { mobileBar, order } from "@/lib/content";
import { expect, leadForm, openLanding, test } from "./fixtures";

const { options } = order.form.interest;

test.skip(({ isMobile }) => !isMobile, "плашка только < md");

test("плашка ведёт к форме и прячется, пока форма на экране", async ({
  page,
}) => {
  await openLanding(page);
  const lead = leadForm(page);
  const bar = page.getByRole("link", { name: mobileBar.cta, exact: true });

  await expect(bar).toBeHidden();
  await page.locator("#coffee").scrollIntoViewIfNeeded();
  await expect(bar).toBeVisible();

  // Плашка – тоже CTA подписки
  await lead.chip(options.question).click();
  await page.locator("#coffee").scrollIntoViewIfNeeded();
  await bar.click();
  await expect(lead.name).toBeInViewport();
  await expect(lead.interest(options[mobileBar.interest])).toBeChecked();
  await expect(bar).toBeHidden();

  // Кнопка у нижнего края экрана – в этом месте плашка была бы поверх неё
  await lead.submit.evaluate((node) =>
    node.scrollIntoView({ block: "end", behavior: "instant" }),
  );
  await expect(lead.submit).toBeInViewport({ ratio: 1 });
  await expect(bar).toBeHidden();
  const box = (await lead.submit.boundingBox())!;
  const topmost = await page.evaluate(
    ([x, y]) => document.elementFromPoint(x!, y!)?.closest("button")?.type,
    [box.x + box.width / 2, box.y + box.height - 4],
  );
  expect(topmost).toBe("submit");
});
