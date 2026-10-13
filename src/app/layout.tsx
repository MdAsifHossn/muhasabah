import type { Metadata, Viewport } from "next";
import "./globals.css";

import { PwaInstall } from "@/components/pwa/pwa-install";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: { default: "মুহাসাবাহ — প্রতিদিনের আত্মপর্যালোচনা", template: "%s | মুহাসাবাহ" },
  description: "Daily Amal Tracking & Self Review — প্রতিদিনের আমল, আত্মপর্যালোচনা ও ধারাবাহিকতা।",
  applicationName: "মুহাসাবাহ",
  keywords: ["মুহাসাবাহ", "আমলনামা", "কুরআন", "ইসলাম"],
  appleWebApp: {
    capable: true,
    title: "মুহাসাবাহ",
    statusBarStyle: "default",
  },
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
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#064e3b",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Amiri:wght@400;700&display=swap"
        />
      </head>
      <body className="canvas-warm antialiased">
        <PwaProvider>{children}</PwaProvider>
        <PwaInstall />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
