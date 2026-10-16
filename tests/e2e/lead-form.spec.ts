// Заявка через настоящий API и базу: успех, дубль, валидация, двойной клик
import { order } from "@/lib/content";
import {
  expect,
  isLeadRequest,
  leadForm,
  openLanding,
  test,
  uniquePhone,
} from "./fixtures";

const { form } = order;

test("заявка уходит, повтор того же номера – карточка дубля", async ({
  page,
}) => {
  const phone = uniquePhone();
  await openLanding(page);
  const lead = leadForm(page);

  await lead.name.fill("Анна");
  // Номер без кода страны – на blur форма приводит его к +375
  await lead.phone.fill(phone.replace("+375 ", "8 0"));
  await lead.phone.blur();
  await expect(lead.phone).toHaveValue(phone);

  const response = page.waitForResponse((r) => isLeadRequest(r.request()));
  await lead.submit.click();
  expect((await response).status()).toBe(201);

  await expect(
    lead.success.getByRole("heading", {
      name: form.status.successTitle("Анна"),
    }),
  ).toBeFocused();
  await expect(lead.success).toContainText(form.status.successText(phone));

  // Тот же номер ещё раз – сервер нашёл заявку в базе, ошибки нет
  await openLanding(page);
  await lead.name.fill("Анна");
  await lead.phone.fill(phone);
  const repeat = page.waitForResponse((r) => isLeadRequest(r.request()));
  await lead.submit.click();
  expect((await repeat).status()).toBe(200);
  await expect(lead.success).toContainText(form.status.duplicate);
});

test("неверный номер – подсказка, ошибка и фокус на поле, запроса нет", async ({
  page,
}) => {
  await openLanding(page);
  const lead = leadForm(page);
  let requests = 0;
  page.on("request", (r) => {
    if (isLeadRequest(r)) requests++;
  });

  // Подсказка о формате видна до ошибки
  await expect(lead.phone).toHaveAccessibleDescription(form.phone.hint);

  await lead.name.fill("Анна");
  await lead.phone.fill("+375 17 123-45-67");
  await lead.submit.click();

  await expect(lead.phone).toBeFocused();
  await expect(lead.phone).toHaveAttribute("aria-invalid", "true");
  await expect(lead.phone).toHaveAccessibleDescription(
    `${form.phone.hint} ${form.errors.phone}`,
  );
  expect(requests).toBe(0);

  // Исправили номер – ошибка уходит сразу, без blur
  await lead.phone.fill(uniquePhone());
  await expect(lead.phone).not.toHaveAttribute("aria-invalid");
});

test("пустая форма – фокус на первое неверное поле", async ({ page }) => {
  await openLanding(page);
  const lead = leadForm(page);

  await lead.submit.click();

  await expect(lead.name).toBeFocused();
  await expect(lead.root.getByText(form.errors.name)).toBeVisible();
  await expect(lead.root.getByText(form.errors.phone)).toBeVisible();
});

test("двойной клик – один запрос", async ({ page }) => {
  await openLanding(page);
  const lead = leadForm(page);
  const requests: string[] = [];
  page.on("request", (r) => {
    if (isLeadRequest(r)) requests.push(r.url());
  });
  // Медленный ответ: второй клик точно попадает в «Отправляем…»
  await page.route("**/api/lead", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });

  await lead.name.fill("Анна");
  await lead.phone.fill(uniquePhone());
  await lead.submit.dblclick();

  await expect(
    lead.root.getByRole("button", { name: form.submitting }),
  ).toBeDisabled();
  await expect(lead.success).toBeVisible();
  expect(requests).toHaveLength(1);
});
