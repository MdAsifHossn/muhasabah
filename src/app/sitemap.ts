import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";

const PAGES = ["", "/quran", "/dua", "/names-of-allah", "/prayer/duas", "/mahram", "/library", "/calendar"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((path) => ({ url: `${siteUrl()}${path}`, changeFrequency: path === "" ? "daily" : "monthly", priority: path === "" ? 1 : 0.7 }));
}
