import { describe, expect, it } from "vitest";
import {
  getClientIp,
  getIpSalt,
  hashIp,
  isAllowedOrigin,
  isBot,
  trimUserAgent,
} from "@/lib/lead/guard";

describe("isAllowedOrigin", () => {
  const vercel = {
    NODE_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://kvarta-landing.vercel.app",
    VERCEL_PROJECT_PRODUCTION_URL: "kvarta-landing.vercel.app",
    VERCEL_URL: "kvarta-landing-abc123-andrey.vercel.app",
    VERCEL_BRANCH_URL: "kvarta-landing-git-feat-lead-api-andrey.vercel.app",
  };

  it.each([
    "https://kvarta-landing.vercel.app",
    "https://kvarta-landing-abc123-andrey.vercel.app",
    "https://kvarta-landing-git-feat-lead-api-andrey.vercel.app",
  ])("пропускает свой домен и превью: %s", (origin) => {
    expect(isAllowedOrigin(origin, vercel)).toBe(true);
  });

  it.each([
    "https://evil.example",
    "http://kvarta-landing.vercel.app",
    "https://kvarta-landing.vercel.app.evil.example",
    "https://other-project.vercel.app",
    "http://localhost:3000",
    "null",
  ])("отклоняет чужой Origin: %s", (origin) => {
    expect(isAllowedOrigin(origin, vercel)).toBe(false);
  });

  it("отклоняет запрос без Origin", () => {
    expect(isAllowedOrigin(null, vercel)).toBe(false);
  });

  it("в dev пропускает localhost", () => {
    const dev = { NODE_ENV: "development" };
    expect(isAllowedOrigin("http://localhost:3000", dev)).toBe(true);
    expect(isAllowedOrigin("http://localhost:4000", dev)).toBe(false);
  });

  it("не падает на кривом NEXT_PUBLIC_SITE_URL", () => {
    const env = { NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "::bad" };
    expect(isAllowedOrigin("https://evil.example", env)).toBe(false);
  });
});

describe("getClientIp", () => {
  it("берёт первый адрес из x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": " 203.0.113.7 , 10.0.0.1",
    });
    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("откатывается на x-real-ip, потом на unknown", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "203.0.113.8" }))).toBe(
      "203.0.113.8",
    );
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("hashIp и соль", () => {
  it("один IP и соль – один хеш, сам IP в хеш не попадает", () => {
    const a = hashIp("203.0.113.7", "salt");
    expect(a).toBe(hashIp("203.0.113.7", "salt"));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(hashIp("203.0.113.7", "other"));
  });

  it("без соли в production – ошибка, в dev – запасная соль", () => {
    expect(() => getIpSalt({ NODE_ENV: "production" })).toThrow("IP_HASH_SALT");
    expect(getIpSalt({ NODE_ENV: "development" })).toBeTruthy();
    expect(getIpSalt({ NODE_ENV: "production", IP_HASH_SALT: "s" })).toBe("s");
  });
});

describe("isBot", () => {
  const now = 1_760_000_010_000;

  it("заполненный honeypot – бот", () => {
    expect(
      isBot({ website: "http://spam", startedAt: now - 60_000 }, now),
    ).toBe(true);
  });

  it("отправка быстрее 3 с – бот", () => {
    expect(isBot({ website: "", startedAt: now - 2_999 }, now)).toBe(true);
  });

  it("3 с и дольше – человек", () => {
    expect(isBot({ website: "", startedAt: now - 3_000 }, now)).toBe(false);
  });

  it("startedAt в будущем (часы телефона спешат) – не бот", () => {
    expect(isBot({ website: "", startedAt: now + 60_000 }, now)).toBe(false);
  });

  it("пробелы в honeypot не считаем", () => {
    expect(isBot({ website: "  ", startedAt: now - 60_000 }, now)).toBe(false);
  });
});

describe("trimUserAgent", () => {
  it("обрезает до 200 символов, пустое → null", () => {
    expect(trimUserAgent("a".repeat(300))).toHaveLength(200);
    expect(trimUserAgent("")).toBeNull();
    expect(trimUserAgent(null)).toBeNull();
  });
});
