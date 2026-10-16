import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = siteUrl();
  return [
    { url: site.href, changeFrequency: "weekly", priority: 1 },
    { url: new URL("/privacy", site).href, changeFrequency: "yearly" },
  ];
}
