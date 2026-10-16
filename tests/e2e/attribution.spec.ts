// Метки рекламы из ссылки доходят до API вместе с заявкой (ТЗ, раздел 8)
import {
  expect,
  isLeadRequest,
  leadForm,
  leadPayload,
  openLanding,
  test,
  uniquePhone,
} from "./fixtures";
import type { Page } from "@playwright/test";

const AD_LINK =
  "/?utm_source=instagram&utm_medium=paid_social&utm_campaign=autumn_sub&utm_content=reels_roast&fbclid=PAZXh0bgNhZW0";

async function submitLead(page: Page) {
  const lead = leadForm(page);
  await lead.name.fill("Анна");
  await lead.phone.fill(uniquePhone());
  const request = page.waitForRequest(isLeadRequest);
  await lead.submit.click();
  const payload = leadPayload(await request);
  await expect(lead.success).toBeVisible();
  return payload.attribution;
}

test("UTM и click id из рекламной ссылки – в теле заявки", async ({
  page,
  baseURL,
}) => {
  await openLanding(page, AD_LINK);
  // Человек ушёл к форме по якорю – page_url это покажет
  await page.evaluate(() => history.replaceState(null, "", "/#order"));

  expect(await submitLead(page)).toMatchObject({
    utm_source: "instagram",
    utm_medium: "paid_social",
    utm_campaign: "autumn_sub",
    utm_content: "reels_roast",
    utm_term: null,
    click_id: "PAZXh0bgNhZW0",
    click_id_type: "fbclid",
    landing_url: new URL(AD_LINK, baseURL).href,
    page_url: new URL("/#order", baseURL).href,
  });
});

test("вернулся без меток – заявка помнит рекламный переход", async ({
  page,
}) => {
  await openLanding(page, AD_LINK);
  await openLanding(page, "/");

  expect(await submitLead(page)).toMatchObject({
    utm_source: "instagram",
    utm_campaign: "autumn_sub",
    click_id_type: "fbclid",
  });
});

test("прямой заход – меток нет", async ({ page }) => {
  await openLanding(page);

  expect(await submitLead(page)).toMatchObject({
    utm_source: null,
    click_id: null,
    landing_url: null,
  });
});
