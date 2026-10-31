import { CalendarClock, Database, KeyRound, ListChecks, LockKeyhole, MapPin, UsersRound } from "lucide-react";

import { CatalogSyncButton } from "@/components/admin/catalog-sync-button";
import { PageHeader } from "@/components/design/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "সেটিংস" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [systemItems, customItems] = await Promise.all([prisma.amalItem.count({ where: { createdById: null } }), prisma.amalItem.count({ where: { createdById: { not: null } } })]);

  const settings = [
    { icon: MapPin, title: "সময় অঞ্চল", value: "বাংলাদেশ (Asia/Dhaka)", note: "দিনের শুরু-শেষ, সপ্তাহের দিন (জুমা) ও সাইকেলের দিন এই সময় অনুযায়ী গণনা হয়।" },
    { icon: UsersRound, title: "নিবন্ধন", value: "সবার জন্য খোলা", note: "নতুন নিবন্ধন সাধারণ সদস্য (MEMBER) হিসেবে শুরু হয়। একমাত্র উস্তাদজি রোল থেকে পূর্ণ নিয়ন্ত্রণ করা যায়।" },
    { icon: CalendarClock, title: "আমলনামা সম্পাদনা", value: "আজ ও গতকাল", note: "সদস্য আজকের ও গতকালের আমলনামা পূরণ/সংশোধন করতে পারেন। জমা দেওয়ার পরও সংশোধন করা যায়।" },
    { icon: LockKeyhole, title: "গোপনীয়তা", value: "সদস্য নিয়ন্ত্রিত", note: "সদস্য আমলনামা গোপন করলে উস্তাদজি কোনো তথ্য দেখতে, মন্তব্য বা রিভিউ করতে পারবেন না।" },
    { icon: KeyRound, title: "পাসওয়ার্ড", value: "প্রোফাইল ও উস্তাদজি রিসেট", note: "সদস্য নিজে প্রোফাইল থেকে বদলাতে পারেন; উস্তাদজি রিসেট করলে সব ডিভাইস থেকে লগআউট হয়।" },
    { icon: Database, title: "ডাটাবেস", value: "MongoDB Atlas", note: "পাসওয়ার্ড, secret ও ডাটাবেস URL কখনো UI-তে দেখানো হয় না।" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="উস্তাদ প্যানেল" title="সিস্টেম সেটিংস" description="সিস্টেমের বর্তমান নীতি ও রক্ষণাবেক্ষণ।" />

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <ListChecks className="size-5" />
            </span>
            <div>
              <h2 className="font-bold text-foreground">মূল আমল তালিকা</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                ভাইদের জন্য তাকবীরে উলা, বোনদের জন্য আউয়াল ওয়াক্ত এবং শুক্রবারের জুমার আমলসহ ডিফল্ট তালিকা। এখন {systemItems.toLocaleString("bn-BD")}টি মূল ও {customItems.toLocaleString("bn-BD")}টি উস্তাদদের যোগ করা আমল আছে।
              </p>
            </div>
          </div>
          <CatalogSyncButton />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {settings.map(({ icon: Icon, title, value, note }) => (
          <Card key={title}>
            <CardContent className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-sunken text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{title}</p>
                <p className="mt-0.5 font-bold text-foreground">{value}</p>
                <p className="mt-1.5 text-xs leading-5 text-subtle-foreground">{note}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
