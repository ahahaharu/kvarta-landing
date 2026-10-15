// Скриншот секции для сверки с макетом: node scripts/shot.mjs <id> [url]
// Результат: .shots/<id>-390.png и .shots/<id>-1440.png
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [id, url = 'http://localhost:3000'] = process.argv.slice(2);
if (!id) { console.error('usage: node scripts/shot.mjs <section-id> [url]'); process.exit(1); }
mkdirSync('.shots', { recursive: true });

const browser = await chromium.launch();
for (const width of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const el = page.locator(`#${id}`);
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  // Секция выше вьюпорта снимается прокруткой – фиксированные шапка и MobileBar
  // иначе попадают в кадр поверх неё. Прячем всё fixed/sticky вне секции
  // и индикатор next dev (он в shadow DOM, обход его не видит)
  await page.evaluate((id) => {
    const target = document.getElementById(id);
    document.querySelectorAll('nextjs-portal').forEach((n) => { n.style.display = 'none'; });
    for (const node of document.querySelectorAll('body *')) {
      const { position } = getComputedStyle(node);
      if ((position === 'fixed' || position === 'sticky') && !target.contains(node) && !node.contains(target)) {
        node.style.visibility = 'hidden';
      }
    }
  }, id);
  await el.screenshot({ path: `.shots/${id}-${width}.png`, animations: 'disabled' });
  await page.close();
}
await browser.close();
console.log(`.shots/${id}-390.png .shots/${id}-1440.png`);
