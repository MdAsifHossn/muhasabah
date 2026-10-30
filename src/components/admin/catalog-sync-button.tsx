"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { resyncAmalCatalog } from "@/lib/actions/admin";
import { actionErrorMessage } from "@/lib/action-error";

export function CatalogSyncButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("মূল আমল তালিকা (ভাই/বোন/জুমা) পুনরায় প্রয়োগ করবেন? মূল আমলগুলোর নাম, পয়েন্ট ও ক্রম ডিফল্টে ফিরবে; উস্তাদদের যোগ করা আমল অপরিবর্তিত থাকবে।")) return;
        startTransition(async () => {
          try {
            const result = await resyncAmalCatalog();
            toast.success(`সম্পন্ন: ${result.updated}টি আপডেট, ${result.created}টি নতুন, ${result.removed}টি ডুপ্লিকেট সরানো হয়েছে।`);
            router.refresh();
          } catch (error) {
            toast.error(actionErrorMessage(error, "সিঙ্ক করা যায়নি।"));
          }
        });
      }}
    >
      <RefreshCw className={isPending ? "size-4 animate-spin" : "size-4"} />
      {isPending ? "সিঙ্ক হচ্ছে…" : "মূল আমল তালিকা সিঙ্ক করুন"}
    </Button>
  );
}
