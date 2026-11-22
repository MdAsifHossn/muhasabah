import type { Metadata } from "next";

import { PageHeader } from "@/components/design/page-header";
import { NamesOfAllahViewer } from "@/components/islamic/names-of-allah-viewer";

export const metadata: Metadata = {
  title: "আল্লাহর ৯৯টি গুণবাচক নাম (আসমাউল হুসনা)",
  description: "আল্লাহ তা'আলার ৯৯টি পবিত্র নাম, আরবি লিপি, বাংলা অর্থ এবং বিশদ ব্যাখ্যা ও তাৎপর্য।",
};

export default function NamesOfAllahPublicPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="আসমাউল হুসনা"
        title="আল্লাহর ৯৯টি পবিত্র নাম"
        description="“আল্লাহর ৯৯টি নাম রয়েছে; যে ব্যক্তি এগুলো মুখস্থ করবে (এবং এর ওপর বিশ্বাস রেখে আমল করবে), সে জান্নাতে প্রবেশ করবে।” — সহীহ বুখারী ২৭৩৬"
      />
      <NamesOfAllahViewer />
    </div>
  );
}
