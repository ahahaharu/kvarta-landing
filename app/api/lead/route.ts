// POST /api/lead (ТЗ, разделы 6, 10). Сервер не доверяет клиенту: Origin,
// размер и тип тела, схема, боты, дубли и лимит по IP проверяются здесь.
// Уведомление в Telegram уходит после ответа и не влияет на приём заявки.
import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { getDb } from "@/db/client";
import {
  getClientIp,
  getIpSalt,
  hashIp,
  isAllowedOrigin,
  isBot,
  trimUserAgent,
} from "@/lib/lead/guard";
import { maskPhone } from "@/lib/lead/phone";
import { readJsonBody } from "@/lib/lead/request";
import { parseLead, type Lead } from "@/lib/lead/schema";
import { createLead, setTelegramStatus } from "@/lib/lead/service";
import { notifyTelegram } from "@/lib/lead/telegram";

type LogEntry = {
  event?: "lead" | "telegram";
  outcome: string;
  id?: string;
  phone?: string;
  code?: string;
  message?: string;
};

const ERROR_OUTCOMES = new Set(["error", "failed"]);

// Одна JSON-строка на исход; номер – только с маской
function log({ event = "lead", ...entry }: LogEntry) {
  const line = JSON.stringify({ event, ...entry });
  if (ERROR_OUTCOMES.has(entry.outcome)) console.error(line);
  else console.info(line);
}

// Дубли и ботов сюда не пускаем: сообщение – только о новой заявке
async function notifyManager(
  id: string,
  lead: Lead,
  userAgent: string | null,
) {
  const { status, error } = await notifyTelegram({ ...lead, userAgent });
  log({ event: "telegram", outcome: status, id, message: error });
  try {
    await setTelegramStatus(getDb(), id, status);
  } catch (cause) {
    const { code, message } = cause as { code?: string; message?: string };
    log({ event: "telegram", outcome: "error", id, code, message });
  }
}

function json(status: number, body: object) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request.headers.get("origin"))) {
    return json(403, { ok: false, error: "forbidden" });
  }

  const body = await readJsonBody(request);
  if (!body.ok) return json(body.status, { ok: false, error: "bad_request" });

  const parsed = parseLead(body.value);
  if (!parsed.ok) {
    return json(400, { ok: false, error: "validation", fields: parsed.fields });
  }
  const lead = parsed.data;
  const phone = maskPhone(lead.phone);

  // Боту отвечаем как человеку, чтобы он не подбирал обход
  if (isBot(lead)) {
    log({ outcome: "bot", phone });
    return json(201, { ok: true, id: randomUUID(), duplicate: false });
  }

  try {
    const ipHash = hashIp(getClientIp(request.headers), getIpSalt());
    const userAgent = trimUserAgent(request.headers.get("user-agent"));
    const result = await createLead(getDb(), lead, { ipHash, userAgent });

    log({
      outcome: result.kind,
      phone,
      id: "id" in result ? result.id : undefined,
    });
    switch (result.kind) {
      case "created":
        after(() => notifyManager(result.id, lead, userAgent));
        return json(201, { ok: true, id: result.id, duplicate: false });
      case "duplicate":
        return json(200, { ok: true, id: result.id, duplicate: true });
      case "rate_limited":
        return json(429, { ok: false, error: "rate_limited" });
    }
  } catch (error) {
    // Только код и текст: у ошибки postgres.js есть поле parameters с номером
    const { code, message } = error as { code?: string; message?: string };
    log({ outcome: "error", phone, code, message });
    return json(500, { ok: false, error: "server" });
  }
}
