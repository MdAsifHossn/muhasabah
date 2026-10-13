import type { MetadataRoute } from "next";

/**
 * Next's bundled `Manifest` type still models the icon `purpose` as a closed
 * union and predates the Web App Manifest spec's combined `"any maskable"`
 * token. The value is serialized verbatim into the JSON response, so we only
 * need to widen it at the type level.
 */
const ANY_MASKABLE = "any maskable" as unknown as "any" | "maskable";

const ICON_192 = "/images/icon-192.png";
const ICON_512 = "/images/icon-512.png";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "মুহাসাবাহ — প্রতিদিনের আত্মপর্যালোচনা",
    short_name: "মুহাসাবাহ",
    description:
      "Daily Amal Tracking & Self Review — প্রতিদিনের আমল, আত্মপর্যালোচনা ও ধারাবাহিকতা।",
    lang: "bn",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait",
    background_color: "#faf8f2",
    theme_color: "#064e3b",
    categories: ["lifestyle", "education", "productivity"],
    icons: [
      { src: ICON_192, sizes: "192x192", type: "image/png", purpose: ANY_MASKABLE },
      { src: ICON_512, sizes: "512x512", type: "image/png", purpose: ANY_MASKABLE },
      // Explicit `maskable` duplicates: Chrome's installability check wants an
      // icon whose purpose token *is* "maskable" and does not always honour the
      // combined "any maskable" list form. Same art, full-bleed background, so
      // it survives the circular/squircle mask (all marks sit inside the 40%
      // safe zone).
      { src: ICON_192, sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: ICON_512, sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/images/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      {
        name: "আজকের আমলনামা",
        short_name: "আমলনামা",
        description: "আজকের আমল ও অর্জন লিখুন",
        url: "/dashboard/amalnama",
        icons: [{ src: ICON_192, sizes: "192x192", type: "image/png" }],
      },
      {
        name: "অগ্রগতি",
        short_name: "অগ্রগতি",
        description: "ধারাবাহিকতা ও অগ্রগতি দেখুন",
        url: "/dashboard/progress",
        icons: [{ src: ICON_192, sizes: "192x192", type: "image/png" }],
      },
      {
        name: "পর্যালোচনা",
        short_name: "পর্যালোচনা",
        description: "সাপ্তাহিক আত্মপর্যালোচনা",
        url: "/dashboard/reviews",
        icons: [{ src: ICON_192, sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
