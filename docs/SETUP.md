# Первичная настройка: Mac, GitHub, Vercel, Neon, Telegram

Порядок важен: сначала репозиторий со стартовыми файлами, потом шаг 1 (Next.js) в Claude Code, и только потом Vercel – без `package.json` Vercel нечего собирать.

## 0. Что должно стоять на маке

```bash
node -v            # нужен 20.9+; если нет: brew install node
brew install pnpm gh
gh auth login      # GitHub → HTTPS → войти через браузер
docker info        # Docker Desktop должен быть запущен
claude --version   # Claude Code
```

## 1. Репозиторий со стартовыми файлами

```bash
mkdir -p ~/Projects && cd ~/Projects
unzip ~/Downloads/kvarta-landing-starter.zip   # получится папка kvarta-landing
cd kvarta-landing
git init -b main
git add -A
git commit -m "chore: add spec, design reference and Claude Code config"
gh repo create kvarta-landing --public --source=. --remote=origin --push
```

Настройки репозитория на GitHub (Settings):

1. **General → Pull Requests**: оставить включёнными «Allow merge commits» и «Allow rebase merging», выключить «Allow squash merging» – иначе пошаговые коммиты схлопнутся.
2. **Advanced Security** (или Code security): проверить, что включены Secret scanning и Push protection; включить Dependabot alerts и security updates.
3. **Rules → Rulesets → New branch ruleset** для `main`: Restrict deletions, Block force pushes, Require a pull request before merging (Required approvals: 0 – вы работаете один). Пункт «Require status checks to pass» добавить после шага 2, когда появится CI.

## 2. Шаг 1 – Next.js (Claude Code)

```bash
cd ~/Projects/kvarta-landing
docker compose up -d --wait   # Postgres на 5433
claude
```

Первое сообщение в сессии:

```text
шаг 1. В корне уже лежат CLAUDE.md, docs/, design/, public/images/, .claude/, docker/, docker-compose.yml, .env.example – их не трогай, кроме .gitignore.
Создай ветку chore/bootstrap. Разверни Next.js через `pnpm create next-app@latest` во временной папке (TypeScript, ESLint, Tailwind, App Router, без src/, alias @/*) и перенеси файлы в корень, ничего из существующего не затирая.
Разрешаю поставить: zod, drizzle-orm, postgres; dev: drizzle-kit, vitest, @playwright/test, prettier, eslint-config-prettier. Других зависимостей не добавляй.
Скрипты package.json: dev, build, start, lint (eslint .), typecheck (tsc --noEmit), test (vitest run), test:e2e (playwright test), db:up (docker compose up -d --wait), db:down, db:generate, db:migrate, db:studio (drizzle-kit), vercel-build (drizzle-kit migrate && next build).
.gitignore: добавь .shots/ и исключение !.env.example. drizzle.config.ts берёт DATABASE_URL_UNPOOLED, а если его нет – DATABASE_URL. Скопируй .env.example в .env.local.
Главная пока – заглушка «Кварта» со шрифтами из ТЗ, без вёрстки секций. Установи браузер для Playwright: pnpm exec playwright install chromium.
Проверь pnpm lint, pnpm typecheck, pnpm build. Коммить по частям, запушь ветку, открой PR.
```

Дальше вы смотрите PR и сливаете его через «Rebase and merge». После слияния: `/export` → сохранить в `ai-log/01-bootstrap.md`, затем `/clear`.

## 3. Vercel: проект из GitHub

1. vercel.com → Sign Up → **Continue with GitHub** (тариф Hobby). Разрешить доступ к репозиторию `kvarta-landing` (можно только к нему).
2. **Add New → Project → Import** `kvarta-landing`. Framework Preset определится как Next.js.
3. **Build Command → Override**: пока `pnpm build` – базы ещё нет. → **Deploy**, переменные пока не добавлять.
4. После подключения Neon (раздел 4) вернуться в **Settings → Build and Deployment** и поменять Build Command на `pnpm vercel-build`: миграции будут применяться перед каждой сборкой.
5. **Settings → Functions → Function Region**: Frankfurt (`fra1`) – ближе к Минску и к базе.
6. **Settings → Deployment Protection**: Vercel Authentication = **Standard Protection** (превью закрыты, прод открыт).

## 4. Neon: база через Vercel

1. В проекте → вкладка **Storage → Create Database → Neon** (Marketplace) → Create New Neon Account → регион **Europe (Frankfurt)** → план **Free** → имя `kvarta`.
2. После создания: **Connect Project** → `kvarta-landing`, окружения Development, Preview, Production.
3. В **Advanced Options → Deployments Configuration** включить **Preview** (Preview branching) и **Resource must be active before deployment**. Тогда на каждый PR Neon делает ветку `preview/<git-ветка>` и превью не трогает прод-данные.
4. Проверить в **Settings → Environment Variables**: появились `DATABASE_URL` (pooled) и `DATABASE_URL_UNPOOLED`.
5. Поменять Build Command на `pnpm vercel-build` (см. раздел 3, п. 4) и сделать **Redeploy**.
6. Если упрётесь в лимит веток на Free – удалить старые `preview/*` в Neon Console (кнопка «Open in Neon» на вкладке Storage).

## 5. Остальные переменные (Settings → Environment Variables)

| Переменная | Окружения | Значение |
| --- | --- | --- |
| `IP_HASH_SALT` | Production, Preview | вывод `openssl rand -hex 32` (свой для каждого окружения) |
| `NEXT_PUBLIC_SITE_URL` | Production | `https://kvarta-landing.vercel.app` (точный адрес – на странице проекта) |
| `TELEGRAM_BOT_TOKEN` | только Production | после шага 7 этой инструкции |
| `TELEGRAM_CHAT_ID` | только Production | после шага 7 этой инструкции |

После изменения переменных – **Deployments → … → Redeploy**: новые значения применяются только к новым деплоям.

## 6. Проверка

- Прод открывается по `https://kvarta-landing.vercel.app`.
- В PR от Claude Code появляется комментарий Vercel со ссылкой на превью.
- После шага 7 плана (API): отправить заявку на превью → строка в Neon (вкладка Tables в Neon Console).

## 7. Telegram-бот (к шагу 10 плана)

1. В Telegram → @BotFather → `/newbot` → имя «Кварта заявки» → username вида `kvarta_leads_xxx_bot` → получить токен.
2. Создать группу «Кварта – заявки», добавить в неё бота.
3. Написать в группе `/start@<username_бота>` – команды доходят до бота даже в приватном режиме.
4. Открыть в браузере `https://api.telegram.org/bot<ТОКЕН>/getUpdates` → найти `"chat":{"id":-100…}` – это `TELEGRAM_CHAT_ID` (отрицательное число).
5. Записать токен и id в Vercel (только Production) и в `.env.local`, если хотите проверить локально. Для локальных тестов лучше отдельная группа, чтобы не засорять основную.
6. Токен утёк (например, попал в лог) → @BotFather → `/revoke`, обновить переменную в Vercel.

## 8. Ритм работы в Claude Code

1. `git switch main && git pull` → `claude` → «шаг N».
2. Claude делает ветку, коммиты, PR. Вы смотрите превью и сливаете через «Rebase and merge».
3. Перед слиянием шагов 7 и 8: «запусти code-reviewer». После вёрстки: «запусти design-qa для hero и freshness».
4. В конце: `/export` → `ai-log/NN-ветка.md` (проверить, что внутри нет токенов); `/clear`.
