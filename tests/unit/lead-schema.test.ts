import { describe, expect, it } from "vitest";
import { order } from "@/lib/content";
import { emptyAttribution, parseLead } from "@/lib/lead/schema";

const errors = order.form.errors;

const valid = {
  name: "Анна",
  phone: "+375 29 123-45-67",
  interest: "subscription",
  comment: "",
  website: "",
  idempotencyKey: "8f1c2a4e-5b6d-4c7e-9f80-1a2b3c4d5e6f",
  startedAt: 1_760_000_000_000,
  attribution: {
    utm_source: "instagram",
    utm_medium: "paid",
    utm_campaign: "autumn_sub",
    utm_content: "reels_roast",
    utm_term: null,
    click_id: "PAZXh0bgNhZW0",
    click_id_type: "fbclid",
    referrer: "https://l.instagram.com/",
    landing_url: "https://kvarta.vercel.app/?utm_source=instagram",
    page_url: "https://kvarta.vercel.app/#order",
    first_seen_at: "2026-10-16T09:12:00Z",
  },
};

function parse(patch: Record<string, unknown>) {
  return parseLead({ ...valid, ...patch });
}

function fieldsOf(patch: Record<string, unknown>) {
  const result = parse(patch);
  expect(result.ok).toBe(false);
  return result.ok ? {} : result.fields;
}

function dataOf(patch: Record<string, unknown>) {
  const result = parse(patch);
  if (!result.ok) throw new Error(JSON.stringify(result.fields));
  return result.data;
}

describe("leadSchema", () => {
  it("accepts the request from SPEC and normalizes the phone", () => {
    const data = dataOf({});
    expect(data.phone).toBe("+375291234567");
    expect(data.attribution).toEqual(valid.attribution);
  });

  it("applies defaults for optional fields", () => {
    const data = dataOf({
      interest: undefined,
      comment: undefined,
      website: undefined,
      attribution: undefined,
    });
    expect(data).toMatchObject({
      interest: "subscription",
      comment: "",
      website: "",
      attribution: emptyAttribution,
    });
  });

  describe("name", () => {
    it("trims and accepts 2–60 characters", () => {
      expect(dataOf({ name: "  Ян  " }).name).toBe("Ян");
      expect(dataOf({ name: "А".repeat(60) }).name).toHaveLength(60);
    });

    it.each([["А"], ["   "], [" А "], ["А".repeat(61)], [undefined], [42]])(
      "rejects %j",
      (name) => {
        expect(fieldsOf({ name })).toEqual({ name: errors.name });
      },
    );
  });

  describe("phone", () => {
    it.each([["+375 17 123-45-67"], [""], ["1".repeat(100)], [undefined]])(
      "rejects %j with the SPEC text",
      (phone) => {
        expect(fieldsOf({ phone })).toEqual({ phone: errors.phone });
      },
    );
  });

  describe("interest", () => {
    it.each([["subscription"], ["order"], ["question"]])("accepts %s", (v) => {
      expect(dataOf({ interest: v }).interest).toBe(v);
    });

    it("rejects unknown values", () => {
      expect(fieldsOf({ interest: "wholesale" })).toHaveProperty("interest");
    });
  });

  describe("comment", () => {
    it("trims and accepts up to 500 characters", () => {
      expect(dataOf({ comment: "  без сахара " }).comment).toBe("без сахара");
      expect(dataOf({ comment: "я".repeat(500) }).comment).toHaveLength(500);
    });

    it("rejects 501 characters", () => {
      expect(fieldsOf({ comment: "я".repeat(501) })).toEqual({
        comment: errors.comment,
      });
    });
  });

  it("collects errors for several fields at once", () => {
    expect(fieldsOf({ name: "", phone: "123" })).toEqual({
      name: errors.name,
      phone: errors.phone,
    });
  });

  it("keeps a filled honeypot valid – the server decides what to do", () => {
    expect(dataOf({ website: "https://spam.example" }).website).toBe(
      "https://spam.example",
    );
  });

  it.each([["not-a-uuid"], [""], [undefined]])(
    "rejects idempotencyKey %j",
    (idempotencyKey) => {
      expect(fieldsOf({ idempotencyKey })).toHaveProperty("idempotencyKey");
    },
  );

  it.each([[-1], [1.5], ["1760000000000"], [undefined]])(
    "rejects startedAt %j",
    (startedAt) => {
      expect(fieldsOf({ startedAt })).toHaveProperty("startedAt");
    },
  );

  it("rejects unknown top-level fields", () => {
    expect(fieldsOf({ isAdmin: true })).toHaveProperty("isAdmin");
  });

  it.each([[null], ["string"], [[]]])("rejects non-object body %j", (body) => {
    const result = parseLead(body);
    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.fields).toHaveProperty("_root");
  });
});

describe("attribution", () => {
  const attr = (patch: Record<string, unknown>) =>
    dataOf({ attribution: { ...valid.attribution, ...patch } }).attribution;

  it("truncates every field to 500 characters", () => {
    const long = "x".repeat(2000);
    const result = attr({ utm_campaign: long, page_url: long });
    expect(result.utm_campaign).toHaveLength(500);
    expect(result.page_url).toHaveLength(500);
  });

  it("turns empty and invalid values into null instead of failing", () => {
    expect(
      attr({
        utm_source: "  ",
        utm_medium: 42,
        click_id_type: "msclkid",
        first_seen_at: "вчера",
      }),
    ).toMatchObject({
      utm_source: null,
      utm_medium: null,
      click_id_type: null,
      first_seen_at: null,
    });
  });

  it("fills missing keys with null and drops unknown ones", () => {
    const data = dataOf({ attribution: { utm_source: "yandex", foo: "bar" } });
    expect(data.attribution).toEqual({
      ...emptyAttribution,
      utm_source: "yandex",
    });
  });

  it("replaces a non-object with empty attribution", () => {
    expect(dataOf({ attribution: "instagram" }).attribution).toEqual(
      emptyAttribution,
    );
  });
});
