// Разбор тела POST /api/lead (ТЗ, раздел 6): только JSON и не больше 10 КБ.
// Content-Length может отсутствовать или врать, поэтому считаем байты по ходу чтения.

export const BODY_MAX_BYTES = 10 * 1024;

export type ReadJsonResult =
  { ok: true; value: unknown } | { ok: false; status: 400 | 413 | 415 };

export function isJsonContentType(value: string | null): boolean {
  return value?.split(";")[0]?.trim().toLowerCase() === "application/json";
}

export async function readJsonBody(
  request: Request,
  maxBytes: number = BODY_MAX_BYTES,
): Promise<ReadJsonResult> {
  if (!isJsonContentType(request.headers.get("content-type"))) {
    return { ok: false, status: 415 };
  }

  const declared = Number(request.headers.get("content-length"));
  if (declared > maxBytes) return { ok: false, status: 413 };
  if (!request.body) return { ok: false, status: 400 };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return { ok: false, status: 413 };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { ok: false, status: 400 };
  }
}
