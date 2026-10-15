// POST /api/lead против настоящего Postgres (ТЗ, разделы 6, 10, 14)
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/lead/route";
import { getDb } from "@/db/client";
import { leads } from "@/db/schema";
import { order } from "@/lib/content";
import { BODY_MAX_BYTES } from "@/lib/lead/request";
import {
  countLeads,
  leadRequest,
  withCleanDb,
  validLead,
  warmPool,
} from "./helpers";

withCleanDb();

async function send(
  body: unknown,
  options?: Parameters<typeof leadRequest>[1],
) {
  const response = await POST(leadRequest(body, options));
  return { status: response.status, body: await response.json() };
}

async function allLeads() {
  return getDb().select().from(leads);
}

describe("создание заявки", () => {
  it("201 и строка в БД с нормализованным номером", async () => {
    const res = await send(validLead({ comment: "  Позвоните после 18  " }));

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      ok: true,
      id: expect.any(String),
      duplicate: false,
    });

    const [row] = await allLeads();
    expect(row).toMatchObject({
      id: res.body.id,
      name: "Анна",
      phone: "+375291234567",
      interest: "subscription",
      comment: "Позвоните после 18",
      telegramStatus: "pending",
      userAgent: expect.stringContaining("iPhone"),
    });
    // IP не храним – только хеш
    expect(row?.ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(row?.ipHash).not.toContain("203.0.113.1");
  });

  it("пустой комментарий – null", async () => {
    await send(validLead());
    const [row] = await allLeads();
    expect(row?.comment).toBeNull();
  });

  it("атрибуция сохраняется, длинные поля обрезаются до 500", async () => {
    const res = await send(
      validLead({
        attribution: {
          utm_source: "instagram",
          utm_medium: "paid",
          utm_campaign: "autumn_sub",
          utm_content: "reels_roast",
          utm_term: null,
          click_id: "PAZXh0bgNhZW0",
          click_id_type: "fbclid",
          referrer: "https://l.instagram.com/",
          landing_url: `https://kvarta.vercel.app/?q=${"x".repeat(600)}`,
          page_url: "https://kvarta.vercel.app/#order",
          first_seen_at: "2026-10-16T09:12:00Z",
        },
      }),
    );
    expect(res.status).toBe(201);

    const [row] = await allLeads();
    expect(row).toMatchObject({
      utmSource: "instagram",
      utmMedium: "paid",
      utmCampaign: "autumn_sub",
      utmContent: "reels_roast",
      utmTerm: null,
      clickId: "PAZXh0bgNhZW0",
      clickIdType: "fbclid",
      referrer: "https://l.instagram.com/",
      pageUrl: "https://kvarta.vercel.app/#order",
      firstSeenAt: new Date("2026-10-16T09:12:00Z"),
    });
    expect(row?.landingUrl).toHaveLength(500);
  });
});

describe("валидация и разбор запроса", () => {
  it("400 с текстом ошибки из общей схемы", async () => {
    const res = await send(validLead({ phone: "+7 999 123-45-67", name: "" }));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: "validation",
      fields: { phone: order.form.errors.phone, name: order.form.errors.name },
    });
    expect(await countLeads()).toBe(0);
  });

  it("лишнее поле → 400", async () => {
    const res = await send(validLead({ isAdmin: true }));
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty("isAdmin");
  });

  it("не JSON → 415", async () => {
    const res = await send("name=x", {
      contentType: "application/x-www-form-urlencoded",
    });
    expect(res).toEqual({
      status: 415,
      body: { ok: false, error: "bad_request" },
    });
  });

  it("битый JSON → 400 bad_request", async () => {
    const res = await send("{name");
    expect(res).toEqual({
      status: 400,
      body: { ok: false, error: "bad_request" },
    });
  });

  it("тело больше 10 КБ → 413", async () => {
    const res = await send(validLead({ comment: "x".repeat(BODY_MAX_BYTES) }));
    expect(res).toEqual({
      status: 413,
      body: { ok: false, error: "bad_request" },
    });
    expect(await countLeads()).toBe(0);
  });
});

describe("Origin", () => {
  it.each([["https://evil.example"], [null]])(
    "чужой или пустой Origin (%s) → 403 без записи",
    async (origin) => {
      const res = await send(validLead(), { origin });
      expect(res).toEqual({
        status: 403,
        body: { ok: false, error: "forbidden" },
      });
      expect(await countLeads()).toBe(0);
    },
  );
});

describe("боты", () => {
  it("заполненный honeypot → тихий 201 без записи", async () => {
    const res = await send(validLead({ website: "https://spam.example" }));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ ok: true, duplicate: false });
    expect(await countLeads()).toBe(0);
  });

  it("форму отправили быстрее 3 с → тихий 201 без записи", async () => {
    const res = await send(validLead({ startedAt: Date.now() - 1_000 }));
    expect(res.status).toBe(201);
    expect(await countLeads()).toBe(0);
  });
});

describe("дубли", () => {
  it("тот же номер за 10 минут → 200 duplicate с id первой заявки", async () => {
    const first = await send(validLead());
    const second = await send(validLead({ phone: "80291234567", name: "Аня" }));

    expect(second.status).toBe(200);
    expect(second.body).toEqual({
      ok: true,
      id: first.body.id,
      duplicate: true,
    });
    expect(await countLeads()).toBe(1);
  });

  it("заявка 11-минутной давности не мешает новой", async () => {
    const first = await send(validLead());
    await getDb()
      .update(leads)
      .set({ createdAt: sql`now() - interval '11 minutes'` })
      .where(eq(leads.id, first.body.id));

    const second = await send(validLead());
    expect(second.status).toBe(201);
    expect(second.body.id).not.toBe(first.body.id);
    expect(await countLeads()).toBe(2);
  });

  it("тот же idempotencyKey → тот же id, даже с другим номером", async () => {
    const lead = validLead();
    const first = await send(lead);
    const second = await send({ ...lead, phone: "+375 33 765-43-21" });

    expect(second.status).toBe(200);
    expect(second.body).toEqual({
      ok: true,
      id: first.body.id,
      duplicate: true,
    });
    expect(await countLeads()).toBe(1);
  });

  it("10 параллельных запросов с одним номером → одна строка", async () => {
    await warmPool();
    // Разные IP (телефон переключился с Wi-Fi на мобильную сеть): блокировка
    // по IP их не сериализует, держит только блокировка по номеру
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        send(validLead(), { ip: `198.51.100.${i + 1}` }),
      ),
    );

    const created = results.filter((r) => r.status === 201);
    expect(created).toHaveLength(1);
    expect(results.filter((r) => r.status === 200)).toHaveLength(9);
    expect(new Set(results.map((r) => r.body.id))).toEqual(
      new Set([created[0]?.body.id]),
    );
    expect(await countLeads()).toBe(1);
  });

  it("один idempotencyKey с разными номерами параллельно → одна строка", async () => {
    const key = randomUUID();
    await warmPool();
    const phones = ["+375291111111", "+375292222222", "+375293333333"];
    const results = await Promise.all(
      phones.map((phone) => send(validLead({ phone, idempotencyKey: key }))),
    );

    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(new Set(results.map((r) => r.body.id)).size).toBe(1);
    expect(await countLeads()).toBe(1);
  });
});

describe("лимит по IP", () => {
  const phone = (i: number) => `+375 29 000-00-${String(i).padStart(2, "0")}`;

  it("6-я заявка с одного IP за час → 429, другой IP проходит", async () => {
    for (let i = 1; i <= 5; i++) {
      expect((await send(validLead({ phone: phone(i) }))).status).toBe(201);
    }

    const sixth = await send(validLead({ phone: phone(6) }));
    expect(sixth).toEqual({
      status: 429,
      body: { ok: false, error: "rate_limited" },
    });

    const otherIp = await send(validLead({ phone: phone(7) }), {
      ip: "203.0.113.2",
    });
    expect(otherIp.status).toBe(201);
    expect(await countLeads()).toBe(6);
  });

  it("повтор уже отправленной заявки после лимита – 200, а не 429", async () => {
    const leadsSent = Array.from({ length: 5 }, (_, i) =>
      validLead({ phone: phone(i + 1) }),
    );
    for (const lead of leadsSent) await send(lead);

    const retry = await send(leadsSent[0]);
    expect(retry.status).toBe(200);
    expect(retry.body.duplicate).toBe(true);
  });

  it("заявки старше часа не считаются", async () => {
    for (let i = 1; i <= 5; i++) await send(validLead({ phone: phone(i) }));
    await getDb()
      .update(leads)
      .set({ createdAt: sql`now() - interval '61 minutes'` });

    expect((await send(validLead({ phone: phone(6) }))).status).toBe(201);
  });

  it("параллельный флуд с разными номерами не обходит лимит", async () => {
    // 3 уже есть, 5 параллельно: без блокировки по IP все 5 увидят «3 < 5»
    for (let i = 1; i <= 3; i++) await send(validLead({ phone: phone(i) }));
    await warmPool();
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        send(validLead({ phone: phone(i + 4) })),
      ),
    );

    expect(results.filter((r) => r.status === 201)).toHaveLength(2);
    expect(results.filter((r) => r.status === 429)).toHaveLength(3);
    expect(await countLeads()).toBe(5);
  });
});
