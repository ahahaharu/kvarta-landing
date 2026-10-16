// Общие фикстуры e2e: каждый тест – со своего IP и со своим номером,
// чтобы лимит 5 заявок в час и дедуп за 10 минут не задевали соседей.
import { randomInt } from "node:crypto";
import {
  test as base,
  expect,
  type Page,
  type Request,
} from "@playwright/test";
import { LEAD_FORM_ID, order } from "@/lib/content";
import { LEAD_ENDPOINT, type LeadPayload } from "@/lib/lead/submit";

export { expect };

const { form } = order;

export const test = base.extend({
  page: async ({ page }, provide) => {
    // Локально и в CI сервер берёт IP из x-forwarded-for (lib/lead/guard.ts)
    const ip = [10, randomInt(256), randomInt(256), randomInt(256)].join(".");
    await page.setExtraHTTPHeaders({ "x-forwarded-for": ip });
    // Форму «открыли» 10 с назад: иначе сервер примет быстрый Playwright
    // за бота и ответит тихим 201 без записи (ТЗ, раздел 10)
    await page.clock.setFixedTime(Date.now() - 10_000);
    await provide(page);
  },
});

/** Мобильный BY-номер, которого ещё нет в базе */
export function uniquePhone(): string {
  const digits = String(randomInt(10_000_000)).padStart(7, "0");
  return `+375 29 ${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

/**
 * Открыть страницу и дождаться гидратации формы: до неё клик по кнопке –
 * обычный POST формы, а клик по CTA не предзаполняет поля.
 */
export async function openLanding(page: Page, path = "/") {
  await page.goto(path);
  await page.waitForFunction((id) => {
    const node = document.querySelector(`#${id} form`);
    return (
      !!node && Object.keys(node).some((k) => k.startsWith("__reactProps"))
    );
  }, LEAD_FORM_ID);
  // Эффекты формы (атрибуция, слушатель CTA) React запускает отдельной задачей
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 50)));
}

export function leadForm(page: Page) {
  const root = page.locator(`#${LEAD_FORM_ID}`);
  return {
    root,
    name: root.getByLabel(form.name.label),
    phone: root.getByLabel(form.phone.label),
    comment: root.getByLabel(form.comment.label),
    interest: (label: string) => root.getByRole("radio", { name: label }),
    // Сам radio скрыт (sr-only) – человек нажимает на чип-label
    chip: (label: string) => root.locator("label").filter({ hasText: label }),
    submit: root.getByRole("button", { name: form.submit }),
    retry: root.getByRole("button", { name: form.retry }),
    error: root.getByRole("alert"),
    success: root.getByRole("status"),
  };
}

export function isLeadRequest(request: Request): boolean {
  return (
    request.method() === "POST" &&
    new URL(request.url()).pathname === LEAD_ENDPOINT
  );
}

export function leadPayload(request: Request): LeadPayload {
  return request.postDataJSON() as LeadPayload;
}
