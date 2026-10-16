// Сбои отправки через page.route: понятный текст, данные на месте,
// «Повторить» шлёт тот же idempotencyKey и доводит заявку до конца
import { order } from "@/lib/content";
import {
  expect,
  isLeadRequest,
  leadForm,
  leadPayload,
  openLanding,
  test,
  uniquePhone,
} from "./fixtures";
import type { Page, Route } from "@playwright/test";

const { form } = order;

const failures = {
  "ответ 500": {
    fail: (route: Route) =>
      route.fulfill({ status: 500, json: { ok: false, error: "server" } }),
    text: form.status.server,
    instagram: true,
  },
  "обрыв сети": {
    fail: (route: Route) => route.abort("internetdisconnected"),
    text: form.status.network,
    instagram: false,
  },
};

async function collectKeys(page: Page) {
  const keys: string[] = [];
  page.on("request", (r) => {
    if (isLeadRequest(r)) keys.push(leadPayload(r).idempotencyKey);
  });
  return keys;
}

for (const [title, failure] of Object.entries(failures)) {
  test(`${title} – сообщение, данные на месте, «Повторить» работает`, async ({
    page,
  }) => {
    const phone = uniquePhone();
    await openLanding(page);
    const lead = leadForm(page);
    const keys = await collectKeys(page);
    await page.route("**/api/lead", failure.fail, { times: 1 });

    await lead.name.fill("Анна");
    await lead.phone.fill(phone);
    await lead.chip(form.interest.options.order).click();
    await lead.comment.fill("Колумбия, в зёрнах");
    await lead.submit.click();

    await expect(lead.error).toContainText(failure.text);
    await expect(
      lead.error.getByRole("link", { name: form.status.instagram.label }),
    ).toHaveCount(failure.instagram ? 1 : 0);
    await expect(lead.name).toHaveValue("Анна");
    await expect(lead.phone).toHaveValue(phone);
    await expect(lead.interest(form.interest.options.order)).toBeChecked();
    await expect(lead.comment).toHaveValue("Колумбия, в зёрнах");

    // Второй раз запрос доходит до настоящего API
    await lead.retry.click();
    await expect(lead.success).toContainText(form.status.successText(phone));
    expect(keys).toHaveLength(2);
    expect(keys[1]).toBe(keys[0]);
  });
}

test("лимит заявок – текст из ТЗ и Instagram, без «Повторить»", async ({
  page,
}) => {
  await openLanding(page);
  const lead = leadForm(page);
  await page.route("**/api/lead", (route) =>
    route.fulfill({ status: 429, json: { ok: false, error: "rate_limited" } }),
  );

  await lead.name.fill("Анна");
  await lead.phone.fill(uniquePhone());
  await lead.submit.click();

  await expect(lead.error).toContainText(form.status.rateLimited);
  await expect(
    lead.error.getByRole("link", { name: form.status.instagram.label }),
  ).toBeVisible();
  await expect(lead.retry).toHaveCount(0);
});
