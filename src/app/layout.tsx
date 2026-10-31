import type { Metadata, Viewport } from "next";
import "./globals.css";

import { PrayerReminder } from "@/components/prayer/prayer-reminder";
import { PwaInstall } from "@/components/pwa/pwa-install";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@400;500;600&family=Noto+Naskh+Arabic:wght@400;500;600&family=Scheherazade+New:wght@400;700&display=swap";

export const metadata: Metadata = {
  title: { default: "মুহাসাবাহ — আমল, কুরআন ও হাদীস", template: "%s | মুহাসাবাহ" },
  description: "প্রতিদিনের আমলনামা, আল-কুরআন, হাদীস ও উস্তাদের তত্ত্বাবধানে আত্মপর্যালোচনা।",
  applicationName: "মুহাসাবাহ",
  keywords: ["মুহাসাবাহ", "আমলনামা", "কুরআন", "হাদীস", "ইসলাম"],
  appleWebApp: { capable: true, title: "মুহাসাবাহ", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/images/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/images/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#08120f" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning on html/head/body: browser extensions (LocatorJS,
    // Grammarly, dark-reader …) add attributes to these tags before React loads.
    // It only ignores attribute differences on these three tags, not their children.
    <html lang="bn" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_URL} />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>
            <PwaProvider>{children}</PwaProvider>
            <PwaInstall />
            <PrayerReminder />
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
