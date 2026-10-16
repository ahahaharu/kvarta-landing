// Превью ссылки, JSON-LD, robots/sitemap, /privacy, 404 и заголовки ответа (ТЗ, разделы 4, 10, 11)
import { business, footer, notFound, privacy, seo } from "@/lib/content";
import { securityHeaders } from "../../next.config";
import { expect, openLanding, test } from "./fixtures";

// next.config.ts ставит заголовки только в прод-сборке: в CI это next start
const isProdServer = !!process.env.CI || !!process.env.PLAYWRIGHT_BASE_URL;

test("заголовки безопасности и CSP не ломает страницу", async ({ page }) => {
  test.skip(!isProdServer, "заголовки есть только в прод-сборке");
  const cspErrors: string[] = [];
  page.on("console", (msg) => {
    if (/Content Security Policy/i.test(msg.text())) cspErrors.push(msg.text());
  });

  const response = await page.goto("/");
  const headers = response!.headers();
  for (const { key, value } of securityHeaders) {
    expect(headers[key.toLowerCase()], key).toBe(value);
  }

  // Форма гидратируется – значит, скрипты Next не заблокированы
  await openLanding(page);
  expect(cspErrors).toEqual([]);
});

test("превью ссылки и JSON-LD на главной", async ({ page, request }) => {
  await page.goto("/");
  const meta = (property: string) =>
    page.locator(`meta[property="${property}"], meta[name="${property}"]`);

  await expect(page).toHaveTitle(seo.title);
  await expect(meta("og:title")).toHaveAttribute("content", seo.title);
  await expect(meta("og:locale")).toHaveAttribute("content", "ru_RU");
  await expect(meta("twitter:card")).toHaveAttribute(
    "content",
    "summary_large_image",
  );

  // Адрес картинки – от metadataBase; запрашиваем путь у тестируемого сервера
  const ogUrl = new URL((await meta("og:image").getAttribute("content"))!);
  const image = await request.get(ogUrl.pathname + ogUrl.search);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/jpeg");

  const jsonLd = JSON.parse(
    (await page
      .locator('script[type="application/ld+json"]')
      .textContent()) as string,
  );
  expect(jsonLd["@type"]).toBe("CafeOrCoffeeShop");
  expect(jsonLd.address.streetAddress).toBe(business.street);
});

test("robots.txt ведёт на sitemap со всеми страницами", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap:");
  expect(robots).toContain("Disallow: /api/");

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toMatch(/<loc>[^<]+\/<\/loc>/);
  expect(sitemap).toMatch(/<loc>[^<]+\/privacy<\/loc>/);
});

test("политика открывается из подвала", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: footer.privacy.label }).click();

  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    privacy.title,
  );
});

test("404 с кнопкой на главную", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response!.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    notFound.title,
  );

  await page
    .getByRole("main")
    .getByRole("link", { name: notFound.cta })
    .click();
  await expect(page).toHaveURL(/\/$/);
});
