import { describe, expect, it } from "vitest";
import * as content from "@/lib/content";

// Все строки из content.ts вместе с путём до них – для понятного сообщения об ошибке
function collectStrings(value: unknown, path: string, out: [string, string][]) {
  if (typeof value === "string") out.push([path, value]);
  else if (typeof value === "function") {
    out.push([path, String(value("{x}"))]);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      collectStrings(child, `${path}.${key}`, out);
    }
  }
}

const strings: [string, string][] = [];
collectStrings(content, "content", strings);
const texts = strings.filter(
  ([path]) => !/(src|href|Url|timeZone)$/.test(path),
);

// Пути строк, которые нарушают правило – пустой список значит «всё чисто»
const violations = (bad: RegExp) =>
  texts.filter(([, text]) => bad.test(text)).map(([path]) => path);

describe("lib/content typography", () => {
  it("has strings to check", () => {
    expect(texts.length).toBeGreaterThan(50);
  });

  it("uses en dash, not em dash", () => {
    expect(violations(/—/)).toEqual([]);
  });

  it("uses «» instead of straight quotes", () => {
    expect(violations(/["„“”]/)).toEqual([]);
  });

  it("has a non-breaking space before BYN, г and кг", () => {
    expect(violations(/ (BYN|кг|г)(?=$|[\s.,:;!?)])/)).toEqual([]);
  });

  it("uses … instead of three dots", () => {
    expect(violations(/\.\.\./)).toEqual([]);
  });
});

describe("lib/content data", () => {
  it("every photo has alt text and a local src", () => {
    for (const photo of Object.values(content.photos)) {
      expect(photo.alt.length).toBeGreaterThan(10);
      expect(photo.src).toMatch(/^\/images\/.+\.jpg$/);
    }
  });

  it("formats prices with a non-breaking space", () => {
    expect(content.formatPrice(54)).toBe("54 BYN");
  });

  it("derives the map link from the address", () => {
    expect(decodeURIComponent(content.business.mapUrl)).toContain(
      content.business.address,
    );
  });
});
