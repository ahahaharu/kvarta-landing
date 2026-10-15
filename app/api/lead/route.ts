// POST /api/lead (ТЗ, разделы 6, 10). Сервер не доверяет клиенту: Origin,
// размер и тип тела, схема, боты, дубли и лимит по IP проверяются здесь.
import { randomUUID } from "node:crypto";
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
import { parseLead } from "@/lib/lead/schema";
import { createLead } from "@/lib/lead/service";

type LogEntry = {
  outcome: string;
  id?: string;
  phone?: string;
  code?: string;
  message?: string;
};

// Одна JSON-строка на исход; номер – только с маской
function log(entry: LogEntry) {
  const line = JSON.stringify({ event: "lead", ...entry });
  if (entry.outcome === "error") console.error(line);
  else console.info(line);
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
