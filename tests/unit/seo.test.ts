import { describe, expect, it } from "vitest";
import { business } from "@/lib/content";
import { coffeeShopJsonLd, serializeJsonLd } from "@/lib/jsonld";
import { siteUrl } from "@/lib/site";

describe("siteUrl", () => {
  it("prefers NEXT_PUBLIC_SITE_URL", () => {
    const url = siteUrl({
      NEXT_PUBLIC_SITE_URL: "https://kvarta.by/",
      VERCEL_PROJECT_PRODUCTION_URL: "kvarta-landing.vercel.app",
    });
    expect(url.href).toBe("https://kvarta.by/");
  });

  it("falls back to the Vercel production host without a protocol", () => {
    const url = siteUrl({
      VERCEL_PROJECT_PRODUCTION_URL: "kvarta-landing.vercel.app",
    });
    expect(url.href).toBe("https://kvarta-landing.vercel.app/");
  });

  it("skips a broken value and ends at localhost", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "::bad" }).href).toBe(
      "http://localhost:3000/",
    );
  });
});

describe("coffeeShopJsonLd", () => {
  const data = coffeeShopJsonLd(new URL("https://kvarta.by"));

  it("takes the address and hours from content", () => {
    expect(data.address.streetAddress).toBe(business.street);
    expect(data.openingHoursSpecification).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "10:00",
        closes: "18:00",
      },
    ]);
  });

  it("uses absolute URLs", () => {
    expect(data.url).toBe("https://kvarta.by/");
    expect(data.image).toBe("https://kvarta.by/images/photo-1-hero.jpg");
  });
});

describe("serializeJsonLd", () => {
  it("cannot close the script tag", () => {
    const json = serializeJsonLd({ name: "</script><script>alert(1)" });
    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toEqual({ name: "</script><script>alert(1)" });
  });
});
