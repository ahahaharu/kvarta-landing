import { describe, expect, it } from "vitest";
import {
  ATTRIBUTION_MAX,
  ATTRIBUTION_STORAGE_KEY,
  ATTRIBUTION_TTL_MS,
  captureAttribution,
  parseMarks,
  readAttribution,
} from "@/lib/attribution";
import { parseLead } from "@/lib/lead/schema";

const SITE = "https://kvarta.vercel.app/";
const AD_URL = `${SITE}?utm_source=instagram&utm_medium=paid_social&utm_campaign=autumn_sub&utm_content=reels_roast&fbclid=PAZ123`;
const NOW = new Date("2026-10-16T09:12:00Z");

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

const throwingStorage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};

describe("parseMarks", () => {
  it("reads utm tags and click id", () => {
    expect(parseMarks(AD_URL)).toEqual({
      utm_source: "instagram",
      utm_medium: "paid_social",
      utm_campaign: "autumn_sub",
      utm_content: "reels_roast",
      utm_term: null,
      click_id: "PAZ123",
      click_id_type: "fbclid",
    });
  });

  it("returns null without tags", () => {
    expect(parseMarks(SITE)).toBeNull();
    expect(parseMarks(`${SITE}?ref=bookmark#order`)).toBeNull();
    expect(parseMarks(`${SITE}?utm_source=`)).toBeNull();
    expect(parseMarks("not a url")).toBeNull();
  });

  it("counts a lone click id as an ad visit", () => {
    expect(parseMarks(`${SITE}?yclid=42`)).toMatchObject({
      utm_source: null,
      click_id: "42",
      click_id_type: "yclid",
    });
  });

  it("prefers yclid, then fbclid, then gclid", () => {
    expect(parseMarks(`${SITE}?gclid=g&fbclid=f`)).toMatchObject({
      click_id: "f",
      click_id_type: "fbclid",
    });
    expect(parseMarks(`${SITE}?gclid=g&yclid=y`)).toMatchObject({
      click_id: "y",
      click_id_type: "yclid",
    });
  });

  it("clips long values", () => {
    const marks = parseMarks(`${SITE}?utm_term=${"x".repeat(2000)}`);
    expect(marks?.utm_term).toHaveLength(ATTRIBUTION_MAX);
  });
});

describe("captureAttribution + readAttribution", () => {
  it("keeps the ad visit for a later bookmark visit", () => {
    const storage = memoryStorage();
    captureAttribution(AD_URL, "https://l.instagram.com/", storage, NOW);

    // Через неделю – по закладке, без меток
    const later = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000);
    captureAttribution(SITE, "", storage, later);
    const result = readAttribution(`${SITE}#order`, "", storage, later);

    expect(result).toEqual({
      utm_source: "instagram",
      utm_medium: "paid_social",
      utm_campaign: "autumn_sub",
      utm_content: "reels_roast",
      utm_term: null,
      click_id: "PAZ123",
      click_id_type: "fbclid",
      referrer: "https://l.instagram.com/",
      landing_url: AD_URL,
      page_url: `${SITE}#order`,
      first_seen_at: NOW.toISOString(),
    });
  });

  it("overwrites the stored visit with a newer ad visit", () => {
    const storage = memoryStorage();
    captureAttribution(AD_URL, "", storage, NOW);
    const yandex = `${SITE}?utm_source=yandex&utm_medium=cpc&yclid=777`;
    captureAttribution(yandex, "https://yandex.by/", storage, NOW);

    expect(readAttribution(SITE, "", storage, NOW)).toMatchObject({
      utm_source: "yandex",
      utm_campaign: null,
      click_id: "777",
      click_id_type: "yclid",
      landing_url: yandex,
    });
  });

  it("forgets the visit after 30 days", () => {
    const storage = memoryStorage();
    captureAttribution(AD_URL, "", storage, NOW);
    const expired = new Date(NOW.getTime() + ATTRIBUTION_TTL_MS);

    expect(readAttribution(SITE, "", storage, expired).utm_source).toBeNull();
    expect(storage.data.has(ATTRIBUTION_STORAGE_KEY)).toBe(false);
  });

  it("falls back to the current URL when storage throws", () => {
    captureAttribution(AD_URL, "", throwingStorage, NOW);
    expect(readAttribution(AD_URL, "", throwingStorage, NOW)).toMatchObject({
      utm_source: "instagram",
      click_id_type: "fbclid",
      landing_url: AD_URL,
      page_url: AD_URL,
    });
  });

  it("falls back to the current URL without storage", () => {
    expect(readAttribution(AD_URL, "", null, NOW).utm_campaign).toBe(
      "autumn_sub",
    );
  });

  it("sends only referrer and page for a direct visit", () => {
    expect(
      readAttribution(SITE, "https://google.com/", memoryStorage(), NOW),
    ).toEqual({
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
      click_id: null,
      click_id_type: null,
      referrer: "https://google.com/",
      landing_url: null,
      page_url: SITE,
      first_seen_at: null,
    });
  });

  it("ignores broken stored data", () => {
    const storage = memoryStorage({ [ATTRIBUTION_STORAGE_KEY]: "{oops" });
    expect(readAttribution(SITE, "", storage, NOW).utm_source).toBeNull();

    const tampered = memoryStorage({
      [ATTRIBUTION_STORAGE_KEY]: JSON.stringify({
        utm_source: 42,
        click_id_type: "evilclid",
        expires_at: NOW.getTime() + 1000,
      }),
    });
    expect(readAttribution(SITE, "", tampered, NOW)).toMatchObject({
      utm_source: null,
      click_id_type: null,
    });
  });

  it("produces attribution the server schema accepts as is", () => {
    const storage = memoryStorage();
    captureAttribution(AD_URL, "https://l.instagram.com/", storage, NOW);
    const attribution = readAttribution(`${SITE}#order`, "", storage, NOW);

    const parsed = parseLead({
      name: "Анна",
      phone: "+375 29 123-45-67",
      idempotencyKey: "8f1c2b5e-3d4a-4e6f-9a8b-7c6d5e4f3a2b",
      startedAt: NOW.getTime(),
      attribution,
    });
    expect(parsed.ok && parsed.data.attribution).toEqual(attribution);
  });
});
