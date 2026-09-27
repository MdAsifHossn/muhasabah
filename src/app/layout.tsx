import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "মুহাসাবাহ — প্রতিদিনের আত্মপর্যালোচনা", template: "%s | মুহাসাবাহ" },
  description: "Daily Amal Tracking & Self Review — প্রতিদিনের আমল, আত্মপর্যালোচনা ও ধারাবাহিকতা।",
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn">
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
