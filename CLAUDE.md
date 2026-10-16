# Кварта – лендинг обжарки

Одностраничный лендинг вымышленной обжарки «Кварта» (Минск) с формой заявки. Цель страницы – заявка на подписку или разовый заказ с телефона. Тестовое задание, дедлайн пн 19.10, 18:00 МСК.

ТЗ – `docs/SPEC.md`. Читай только нужный раздел (поиск по `## N.`), не весь файл.

## Стек

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 · zod · Drizzle ORM + postgres.js · PostgreSQL 17 (Docker локально, Neon на Vercel) · Vitest · Playwright · pnpm.

## Команды

```bash
pnpm dev              # localhost:3000
pnpm build            # прод-сборка; страница должна быть ○ (static)
pnpm lint && pnpm typecheck
pnpm test             # Vitest unit + integration (нужна БД: pnpm db:up)
pnpm test:e2e         # Playwright
pnpm lhci             # Lighthouse mobile по прод-сборке (сначала pnpm build), отчёты в .lighthouseci/
pnpm db:up / db:down  # Postgres в Docker (порт 5433)
pnpm db:generate / db:migrate / db:studio
```

## Как работаем

- Пользователь пишет «шаг N» → найди строку N в таблице «План веток» (`docs/SPEC.md`, раздел 12), прочитай связанные разделы ТЗ, создай ветку из свежего `main`, сделай шаг, закоммить по-частям (Conventional Commits на английском), запушь и открой PR через `gh pr create`.
- Описание PR – по `.github/pull_request_template.md` (образец – PR #6).
- Крупные шаги (7, 8) – сначала план, потом код.
- Не коммить в `main`, не делай force push, не мержи PR сам – это делает пользователь.
- Шаг готов, когда: `pnpm lint`, `pnpm typecheck`, тесты зелёные; вёрстка проверена на 390 px.
- Ошибки ИИ, которые заметил пользователь, и решения по ходу – коротко в `NOTES.md`.

## Правила кода

- Server Components по умолчанию. `"use client"` – только LeadForm, MobileBar, Reveal и CTA, которые предзаполняют форму.
- Новые зависимости – только после вопроса пользователю.
- Все тексты, цены, адрес, часы – только из `lib/content.ts`.
- Типографика: тире «–» (не «—»), кавычки «», неразрывный пробел перед BYN и «г».
- Логика заявки (`lib/lead/*`) не зависит от React и покрыта тестами.
- SQL только через Drizzle с параметрами. Никакого `dangerouslySetInnerHTML`, кроме JSON-LD из констант.
- Номера телефонов в логах – только с маской. Клиенту не отдаём стек ошибок.

## Дизайн

- Референс – `design/`. Верстаешь секцию → открой ТОЛЬКО её два скриншота `design/screens/{mobile,desktop}-NN-*.png`.
- Значения – из `design/tokens.md`, тексты и alt – из `design/content.md`. Не подбирай цвета и размеры по картинке.
- Mobile-first от 390 px, брейкпоинты md 768 / lg 1024, контейнер 1280.
- Запрещено: градиенты, скругления, мягкие тени с blur, эмодзи-иконки.
- id секций: `header`, `hero`, `freshness`, `founders`, `coffee`, `subscription`, `order`, `footer` (номера скриншотов 01–08 в том же порядке).
- Сверка с макетом: `node scripts/shot.mjs <id>` → `.shots/<id>-390.png` и `-1440.png`.

## Экономия контекста

- Ищи через grep/glob, потом открывай конкретный файл.
- Тесты запускай с тихим выводом: `pnpm test --reporter=dot`, `pnpm test:e2e --reporter=line`.
- Не читай `pnpm-lock.yaml`, `.next/`, `node_modules/`, `design/screens/*-full.jpg`.

## Безопасность

Не читай и не выводи `.env`, `.env.local`. Секреты – только в env. Детали – раздел 10 ТЗ.
