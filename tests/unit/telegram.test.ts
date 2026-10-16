import { describe, expect, it, vi } from "vitest";
import { emptyAttribution } from "@/lib/lead/schema";
import {
  describeDevice,
  escapeHtml,
  formatLeadMessage,
  getTelegramConfig,
  notifyTelegram,
  type LeadNotice,
} from "@/lib/lead/telegram";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15";
const TOKEN = "123456:secret-token";
const env = { TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHAT_ID: "-1001234567890" };

function notice(patch: Partial<LeadNotice> = {}): LeadNotice {
  return {
    name: "Анна",
    phone: "+375291234567",
    interest: "subscription",
    comment: "",
    attribution: emptyAttribution,
    userAgent: IPHONE,
    ...patch,
  };
}

const fromInstagram = {
  ...emptyAttribution,
  utm_source: "instagram",
  utm_medium: "paid_social",
  utm_campaign: "autumn_sub",
  utm_content: "reels_roast",
  click_id: "PAZXh0bgNhZW0",
  click_id_type: "fbclid" as const,
  referrer: "https://l.instagram.com/",
  landing_url: "https://kvarta.vercel.app/?utm_source=instagram",
  page_url: "https://kvarta.vercel.app/?utm_source=instagram#order",
};

describe("formatLeadMessage", () => {
  it("совпадает с форматом из ТЗ", () => {
    expect(formatLeadMessage(notice({ attribution: fromInstagram }))).toBe(
      [
        "<b>☕ Новая заявка – Подписка</b>",
        "Анна · +375 29 123-45-67",
        "Комментарий: –",
        "",
        "Откуда: instagram / paid_social",
        "Кампания: autumn_sub · Объявление: reels_roast",
        "Страница: /#order · Телефон (iOS)",
      ].join("\n"),
    );
  });

  it("экранирует имя, комментарий и метки", () => {
    const text = formatLeadMessage(
      notice({
        name: "<b>x</b>",
        comment: "Зёрна & <a href='x'>турка</a>",
        attribution: { ...emptyAttribution, utm_campaign: "<i>sale</i>" },
      }),
    );
    expect(text).toContain("&lt;b&gt;x&lt;/b&gt; · +375");
    expect(text).toContain("Зёрна &amp; &lt;a href='x'&gt;турка&lt;/a&gt;");
    expect(text).toContain("Кампания: &lt;i&gt;sale&lt;/i&gt;");
    // Единственный тег – наш заголовок
    expect(text.match(/<[^>]+>/g)).toEqual(["<b>", "</b>"]);
  });

  it("без меток – прямой заход и хост referrer", () => {
    const text = formatLeadMessage(
      notice({
        interest: "order",
        attribution: {
          ...emptyAttribution,
          referrer: "https://www.google.com/search?q=кварта",
          page_url: "https://kvarta.vercel.app/",
        },
      }),
    );
    expect(text).toContain("Новая заявка – Разовый заказ");
    expect(text).toContain("Откуда: прямой заход / www.google.com\n");
    expect(text).not.toContain("Кампания");
    expect(text).toContain("Страница: / · Телефон (iOS)");
  });

  it("без меток и referrer – просто прямой заход", () => {
    const text = formatLeadMessage(notice({ userAgent: null }));
    expect(text.endsWith("Откуда: прямой заход")).toBe(true);
  });

  it("click id без UTM – реклама, а не прямой заход", () => {
    const text = formatLeadMessage(
      notice({
        attribution: {
          ...emptyAttribution,
          click_id: "abc",
          click_id_type: "yclid",
        },
      }),
    );
    expect(text).toContain("Откуда: реклама (yclid)");
  });

  it("комментарий показывает как есть", () => {
    const text = formatLeadMessage(notice({ comment: "Позвоните после 18" }));
    expect(text).toContain("Комментарий: Позвоните после 18\n");
  });
});

describe("describeDevice", () => {
  it.each([
    [IPHONE, "Телефон (iOS)"],
    [
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36",
      "Телефон (Android)",
    ],
    [
      "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/129.0 Safari/537.36",
      "Планшет (Android)",
    ],
    ["Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)", "Планшет (iPadOS)"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Компьютер (Windows)"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "Компьютер (macOS)"],
    ["curl/8.7.1", null],
    [null, null],
  ])("%s → %s", (userAgent, expected) => {
    expect(describeDevice(userAgent)).toBe(expected);
  });
});

describe("escapeHtml", () => {
  it("экранирует & < > и не трогает остальное", () => {
    expect(escapeHtml(`a & <b> "c"`)).toBe(`a &amp; &lt;b&gt; "c"`);
  });
});

describe("getTelegramConfig", () => {
  it.each([
    {},
    { TELEGRAM_BOT_TOKEN: TOKEN },
    { TELEGRAM_CHAT_ID: "-100" },
    { TELEGRAM_BOT_TOKEN: " ", TELEGRAM_CHAT_ID: "-100" },
  ])("нет токена или чата → null: %o", (partial) => {
    expect(getTelegramConfig(partial)).toBeNull();
  });
});

function reply(status: number, body: object = { ok: status === 200 }) {
  return new Response(JSON.stringify(body), { status });
}

describe("notifyTelegram", () => {
  it("без env – skipped, в сеть не ходит", async () => {
    const fetch = vi.fn();
    expect(await notifyTelegram(notice(), { env: {}, fetch })).toEqual({
      status: "skipped",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("шлёт sendMessage с HTML и без превью ссылок", async () => {
    const fetch = vi.fn().mockResolvedValue(reply(200));
    expect(await notifyTelegram(notice(), { env, fetch })).toEqual({
      status: "sent",
    });

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe(`https://api.telegram.org/bot${TOKEN}/sendMessage`);
    expect(init.method).toBe("POST");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init.body)).toEqual({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: formatLeadMessage(notice()),
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
  });

  it("сеть упала – один повтор", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(reply(200));
    expect(await notifyTelegram(notice(), { env, fetch })).toEqual({
      status: "sent",
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("две неудачи – failed, токена в ошибке нет", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValue(new TypeError(`fetch failed: bot${TOKEN}`));
    const result = await notifyTelegram(notice(), { env, fetch });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.status).toBe("failed");
    expect(result.error).toContain("TypeError: fetch failed");
    expect(result.error).not.toContain("secret-token");
  });

  it("5xx и 429 повторяет, ошибку берёт из ответа Telegram", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(reply(502, { ok: false }))
      .mockResolvedValueOnce(
        reply(429, { ok: false, description: "Too Many Requests" }),
      );
    expect(await notifyTelegram(notice(), { env, fetch })).toEqual({
      status: "failed",
      error: "HTTP 429: Too Many Requests",
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("4xx не повторяет: неверный чат повтором не исправить", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        reply(400, { ok: false, description: "Bad Request: chat not found" }),
      );
    expect(await notifyTelegram(notice(), { env, fetch })).toEqual({
      status: "failed",
      error: "HTTP 400: Bad Request: chat not found",
    });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("таймаут прерывает зависший запрос", async () => {
    // fetch, который ждёт, пока его не отменят по signal
    const hanging = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_, reject) =>
          init.signal!.addEventListener("abort", () =>
            reject(init.signal!.reason),
          ),
        ),
    );
    const result = await notifyTelegram(notice(), {
      env,
      fetch: hanging as unknown as typeof fetch,
      timeoutMs: 20,
    });

    expect(result).toEqual({
      status: "failed",
      error: expect.stringContaining("TimeoutError"),
    });
    expect(hanging).toHaveBeenCalledTimes(2);
  });
});
