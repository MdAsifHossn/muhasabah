import type { Metadata } from "next";
import { PageHeader } from "@/components/design/page-header";
import { MahramsViewer } from "@/components/islamic/mahrams-viewer";

export const metadata: Metadata = { title: "মাহরাম ও গায়রে মাহরাম", description: "পুরুষ ও নারীর জন্য সম্পর্কভিত্তিক মাহরাম তালিকা, শর্ত ও কুরআন-হাদীসের সূত্র।" };
export default function MahramPage() {
  return <div className="space-y-5"><PageHeader eyebrow="পরিবার ও সম্পর্ক" title="মাহরাম ও গায়রে মাহরাম" description="কাছের মানুষ, ভিন্ন সম্পর্ক। নারী ও পুরুষের জন্য সম্পর্কের তালিকা, প্রয়োজনীয় শর্ত ও দলিল একসঙ্গে।" /><MahramsViewer /></div>;
}
