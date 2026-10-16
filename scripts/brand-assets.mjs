// OG-картинка и иконки: node scripts/brand-assets.mjs
// Тексты – из lib/content.ts (Node 24 сам снимает типы), цвета – design/tokens.md.
// Результат – статичные файлы в app/, теги для них Next ставит сам:
// opengraph-image.jpg + .alt.txt (1200×630), icon.svg, apple-icon.png, favicon.ico.
// Шрифты берутся с Google Fonts – нужен интернет. Запускать при смене текстов.
import { chromium } from "@playwright/test";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { business, hero, photos, seo } from "../lib/content.ts";

const INK = "#1A1411";
const PAPER = "#F2ECE0";
const ORANGE = "#E4572E";

// «К» из прямоугольников: шрифт в SVG-иконке зависел бы от системы
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${ORANGE}"/>
  <path fill="${INK}" d="M16 10h11v44H16z"/>
  <path fill="${INK}" d="M26 27 37 10h12L37.5 31.5 50 54H38L26 36z"/>
</svg>
`;

const FONTS =
  "https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Onest:wght@500&family=JetBrains+Mono:wght@500&display=block";

const dataUrl = (path, type) =>
  `data:${type};base64,${readFileSync(path).toString("base64")}`;

const OG_HTML = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONTS}">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; background: ${PAPER}; color: ${INK};
    font-family: Onest, sans-serif; position: relative; overflow: hidden; }
  .text { position: absolute; left: 64px; top: 56px; bottom: 56px; width: 640px;
    display: flex; flex-direction: column; }
  .tags { display: flex; gap: 10px; }
  .tag { font: 500 18px/1 'JetBrains Mono', monospace; letter-spacing: .08em;
    text-transform: uppercase; padding: 9px 14px; }
  .tag.orange { background: ${ORANGE}; }
  /* Ширина – чтобы строки легли как в макете: «…уже / у вас.» */
  h1 { margin-top: 28px; max-width: 600px; font: 700 86px/0.98 Oswald, sans-serif; letter-spacing: .02em;
    text-transform: uppercase; }
  h1 span { color: ${ORANGE}; }
  .bottom { margin-top: auto; display: flex; align-items: center; gap: 24px;
    border-top: 3px solid ${INK}; padding-top: 22px; }
  .logo { font: 700 44px/1 Oswald, sans-serif; letter-spacing: .04em; text-transform: uppercase; }
  .badge { font: 700 26px/1 Oswald, sans-serif; letter-spacing: .04em; text-transform: uppercase;
    background: ${ORANGE}; border: 3px solid ${INK}; padding: 10px 16px; }
  .photo { position: absolute; right: 72px; top: 44px; width: 396px; height: 528px;
    border: 3px solid ${INK}; box-shadow: 12px 12px 0 ${INK};
    background: url('${dataUrl(`public${photos.hero.src}`, "image/jpeg")}') center / cover; }
</style></head>
<body>
  <div class="text">
    <div class="tags">
      <span class="tag orange">${hero.tags[0].full}</span>
      <span class="tag">${hero.tags[1].full}</span>
    </div>
    <h1>${hero.title.before} <span>${hero.title.accent}</span> ${hero.title.after}</h1>
    <div class="bottom">
      <span class="logo">${business.name}</span>
      <span class="badge">${seo.ogBadge}</span>
    </div>
  </div>
  <div class="photo"></div>
</body></html>`;

const browser = await chromium.launch();

async function render(html, { width, height }, options) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const buffer = await page.screenshot(options);
  await page.close();
  return buffer;
}

// Через canvas, а не скриншот: скриншот непрозрачной картинки – PNG без
// альфа-канала, а ICO-декодер Next принимает только RGBA
async function iconPng(size) {
  const page = await browser.newPage();
  const base64 = await page.evaluate(
    async ({ svg, size }) => {
      const img = new Image();
      img.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      canvas.getContext("2d").drawImage(img, 0, 0, size, size);
      return canvas.toDataURL("image/png").split(",")[1];
    },
    { svg: ICON_SVG, size },
  );
  await page.close();
  return Buffer.from(base64, "base64");
}

// ICO с PNG внутри – так умеют все браузеры: заголовок, каталог, картинки
function toIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.png)]);
}

const og = await render(
  OG_HTML,
  { width: 1200, height: 630 },
  { type: "jpeg", quality: 85 },
);
writeFileSync("app/opengraph-image.jpg", og);
writeFileSync("app/opengraph-image.alt.txt", seo.ogAlt);
writeFileSync("app/icon.svg", ICON_SVG);
writeFileSync("app/apple-icon.png", await iconPng(180));
const ico = [];
for (const size of [16, 32, 48]) ico.push({ size, png: await iconPng(size) });
writeFileSync("app/favicon.ico", toIco(ico));
await browser.close();

for (const file of ["opengraph-image.jpg", "apple-icon.png", "favicon.ico"]) {
  console.log(
    `app/${file}: ${Math.round(statSync(`app/${file}`).size / 1024)} КБ`,
  );
}
