// CTA на странице ведут к форме и предзаполняют её (ТЗ, раздел 4)
import { coffee, order, subscription } from "@/lib/content";
import { expect, leadForm, openLanding, test } from "./fixtures";

const { options } = order.form.interest;

test("CTA подписки ставит «Подписка» и ведёт к форме", async ({ page }) => {
  await openLanding(page);
  const lead = leadForm(page);
  // Сначала уводим выбор с подписки по умолчанию
  await lead.chip(options.question).click();

  await page
    .locator("#subscription")
    .getByRole("link", { name: subscription.cta.label })
    .click();

  await expect(lead.interest(options.subscription)).toBeChecked();
  await expect(lead.name).toBeInViewport();
});

test("«Заказать» на карточке сорта – разовый заказ и сорт в комментарии", async ({
  page,
}) => {
  await openLanding(page);
  const lead = leadForm(page);
  const item = coffee.items[1];

  await page
    .locator("#coffee")
    // Имя ссылки – «Заказать: {сорт}», сорт виден только скринридеру
    .getByRole("link", { name: item.name })
    .click();

  await expect(lead.interest(options.order)).toBeChecked();
  await expect(lead.comment).toHaveValue(item.orderComment);
  await expect(lead.name).toBeInViewport();
});
