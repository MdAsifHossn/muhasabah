import type { Metadata } from "next";

import { BookmarksList } from "@/components/hadith/bookmarks-list";
import { HadithBreadcrumb } from "@/components/hadith/breadcrumb";
import { PageHeader } from "@/components/design/page-header";

export const metadata: Metadata = { title: "সংরক্ষিত হাদীস" };

export default function HadithBookmarksPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <HadithBreadcrumb items={[{ label: "বুকমার্ক" }]} />
      <PageHeader title="সংরক্ষিত হাদীস" description="আপনার বুকমার্ক করা হাদীসগুলো এই ডিভাইসে সংরক্ষিত থাকে।" />
      <BookmarksList />
    </div>
  );
}
