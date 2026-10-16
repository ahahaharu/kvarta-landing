import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { order } from "@/lib/content";
import {
  createIdempotencyKey,
  LEAD_ENDPOINT,
  submitLead,
  type LeadPayload,
} from "@/lib/lead/submit";

const payload: LeadPayload = {
  name: "Анна",
  phone: "+375 29 123-45-67",
  interest: "subscription",
  comment: "",
  website: "",
  idempotencyKey: "8f1c2b5e-3d4a-4e6f-9a8b-7c6d5e4f3a2b",
  startedAt: 1_760_000_000_000,
  attribution: {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    click_id: null,
    click_id_type: null,
    referrer: null,
    landing_url: null,
    page_url: "https://kvarta.vercel.app/#order",
    first_seen_at: null,
  },
};

function respond(status: number, body?: unknown) {
  return vi.fn<typeof fetch>(async () =>
    body === undefined
      ? new Response("<html>", { status })
      : Response.json(body, { status }),
  );
}

describe("submitLead", () => {
  it("posts JSON to the lead endpoint", async () => {
    const doFetch = respond(201, { ok: true, id: "x", duplicate: false });
    await submitLead(payload, { fetch: doFetch });

    const [url, init] = doFetch.mock.calls[0]!;
    expect(url).toBe(LEAD_ENDPOINT);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(init?.body as string)).toEqual(payload);
  });

  it.each([
    [201, { ok: true, id: "x", duplicate: false }, false],
    [200, { ok: true, id: "x", duplicate: true }, true],
  ])("maps %i to success", async (status, body, duplicate) => {
    await expect(
      submitLead(payload, { fetch: respond(status, body) }),
    ).resolves.toEqual({ kind: "success", duplicate });
  });

  it("treats an unreadable 2xx body as success: the lead is saved", async () => {
    await expect(submitLead(payload, { fetch: respond(201) })).resolves.toEqual(
      { kind: "success", duplicate: false },
    );
  });

  it("keeps only form field errors from a 400", async () => {
    const doFetch = respond(400, {
      ok: false,
      error: "validation",
      fields: { phone: order.form.errors.phone, idempotencyKey: "Invalid" },
    });
    await expect(submitLead(payload, { fetch: doFetch })).resolves.toEqual({
      kind: "validation",
      fields: { phone: order.form.errors.phone },
    });
  });

  it("maps a 400 with no form field errors to server", async () => {
    const doFetch = respond(400, {
      ok: false,
      error: "validation",
      fields: { attribution: "Invalid" },
    });
    await expect(submitLead(payload, { fetch: doFetch })).resolves.toEqual({
      kind: "server",
    });
  });

  it("maps 429 to rate_limited", async () => {
    const doFetch = respond(429, { ok: false, error: "rate_limited" });
    await expect(submitLead(payload, { fetch: doFetch })).resolves.toEqual({
      kind: "rate_limited",
    });
  });

  it.each([403, 413, 500, 502])("maps %i to server", async (status) => {
    await expect(
      submitLead(payload, { fetch: respond(status) }),
    ).resolves.toEqual({ kind: "server" });
  });

  it("maps a failed request to network", async () => {
    const doFetch = vi.fn<typeof fetch>(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(submitLead(payload, { fetch: doFetch })).resolves.toEqual({
      kind: "network",
    });
  });

  it("aborts after the timeout and maps it to network", async () => {
    const doFetch = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    await expect(
      submitLead(payload, { fetch: doFetch, timeoutMs: 20 }),
    ).resolves.toEqual({ kind: "network" });
  });
});

describe("createIdempotencyKey", () => {
  const uuid = z.uuid();

  it("uses randomUUID when available", () => {
    expect(uuid.safeParse(createIdempotencyKey()).success).toBe(true);
  });

  it("builds a v4 UUID without randomUUID (http in LAN)", () => {
    const source = { getRandomValues: crypto.getRandomValues.bind(crypto) };
    const keys = new Set(
      Array.from({ length: 50 }, () => createIdempotencyKey(source)),
    );
    expect(keys.size).toBe(50);
    for (const key of keys) {
      expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab]/);
      expect(uuid.safeParse(key).success).toBe(true);
    }
  });
});
