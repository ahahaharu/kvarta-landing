// Уведомление в Telegram после ответа (ТЗ, разделы 6, 11, 14): Telegram замокан,
// его падение не ломает 201, статус пишется в telegram_status.
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/lead/route";
import { getDb } from "@/db/client";
import { leads } from "@/db/schema";
import { runAfter } from "./after-queue";
import { leadRequest, validLead, withCleanDb } from "./helpers";

withCleanDb();

const TOKEN = "123456:secret-token";
const telegram = vi.fn<typeof fetch>();

beforeEach(() => {
  telegram.mockReset();
  vi.stubGlobal("fetch", telegram);
  vi.stubEnv("TELEGRAM_BOT_TOKEN", TOKEN);
  vi.stubEnv("TELEGRAM_CHAT_ID", "-1001234567890");
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function send(body: unknown, ip?: string) {
  const response = await POST(leadRequest(body, { ip }));
  return { status: response.status, body: await response.json() };
}

async function statusOf(id: string) {
  const [row] = await getDb()
    .select({ status: leads.telegramStatus })
    .from(leads)
    .where(eq(leads.id, id));
  return row?.status;
}

function sentTexts(): string[] {
  return telegram.mock.calls.map(
    ([, init]) => JSON.parse(String(init?.body)).text,
  );
}

describe("уведомление в Telegram", () => {
  it("ответ не ждёт Telegram; после него – sent", async () => {
    telegram.mockResolvedValue(Response.json({ ok: true }));

    const res = await send(validLead({ name: "<b>x</b>" }));
    expect(res.status).toBe(201);
    // Ответ уже готов, а сообщение ещё не отправлено
    expect(telegram).not.toHaveBeenCalled();
    expect(await statusOf(res.body.id)).toBe("pending");

    await runAfter();
    expect(telegram).toHaveBeenCalledOnce();
    expect(String(telegram.mock.calls[0]![0])).toContain(TOKEN);
    expect(sentTexts()[0]).toContain(
      "&lt;b&gt;x&lt;/b&gt; · +375 29 123-45-67",
    );
    expect(await statusOf(res.body.id)).toBe("sent");
  });

  it("Telegram недоступен – заявка 201, статус failed, в логе без токена и номера", async () => {
    telegram.mockRejectedValue(new TypeError("fetch failed"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await send(validLead());
    expect(res.status).toBe(201);

    await runAfter();
    // Один повтор
    expect(telegram).toHaveBeenCalledTimes(2);
    expect(await statusOf(res.body.id)).toBe("failed");

    const logged = errorLog.mock.calls.flat().join("\n");
    expect(logged).toContain('"event":"telegram"');
    expect(logged).toContain(res.body.id);
    expect(logged).not.toContain("secret-token");
    expect(logged).not.toContain("1234567");
  });

  it("без токена – skipped, в сеть не ходит", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");

    const res = await send(validLead());
    await runAfter();

    expect(telegram).not.toHaveBeenCalled();
    expect(await statusOf(res.body.id)).toBe("skipped");
  });

  it("дубль не шлёт второе сообщение", async () => {
    telegram.mockResolvedValue(Response.json({ ok: true }));

    const first = await send(validLead());
    const second = await send(validLead());
    expect(second.body).toMatchObject({ duplicate: true, id: first.body.id });

    await runAfter();
    expect(telegram).toHaveBeenCalledOnce();
  });

  it("бот и ошибка валидации не шлют сообщение", async () => {
    await send(validLead({ website: "https://spam.example" }));
    await send(validLead({ phone: "123" }));
    await runAfter();

    expect(telegram).not.toHaveBeenCalled();
  });
});
