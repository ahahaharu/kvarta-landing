import { describe, expect, it } from "vitest";
import { BODY_MAX_BYTES, readJsonBody } from "@/lib/lead/request";

const url = "http://localhost:3000/api/lead";

function post(body: BodyInit, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

describe("readJsonBody", () => {
  it("разбирает JSON, в том числе с charset", async () => {
    const result = await readJsonBody(
      post('{"name":"Анна"}', {
        "content-type": "application/json; charset=utf-8",
      }),
    );
    expect(result).toEqual({ ok: true, value: { name: "Анна" } });
  });

  it("не JSON по Content-Type → 415", async () => {
    const result = await readJsonBody(
      post("name=x", { "content-type": "application/x-www-form-urlencoded" }),
    );
    expect(result).toEqual({ ok: false, status: 415 });
  });

  it("битый JSON → 400", async () => {
    expect(await readJsonBody(post("{name"))).toEqual({
      ok: false,
      status: 400,
    });
  });

  it("тело больше 10 КБ → 413", async () => {
    const big = JSON.stringify({ comment: "x".repeat(BODY_MAX_BYTES) });
    expect(await readJsonBody(post(big))).toEqual({ ok: false, status: 413 });
  });

  it("413 по заявленному Content-Length, не читая тело", async () => {
    const result = await readJsonBody(
      post("{}", { "content-length": String(BODY_MAX_BYTES + 1) }),
    );
    expect(result).toEqual({ ok: false, status: 413 });
  });

  it("считает байты, а не символы: кириллица – 2 байта", async () => {
    const half = "ж".repeat(BODY_MAX_BYTES / 2);
    const result = await readJsonBody(post(JSON.stringify(half)));
    expect(result).toEqual({ ok: false, status: 413 });
  });

  it("тело из потока без Content-Length тоже ограничено", async () => {
    const chunk = new TextEncoder().encode("x".repeat(4096));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < 4; i++) controller.enqueue(chunk);
        controller.close();
      },
    });
    const request = new Request(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: stream,
      duplex: "half",
    } as RequestInit);
    expect(await readJsonBody(request)).toEqual({ ok: false, status: 413 });
  });
});
