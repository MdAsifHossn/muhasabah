import type { AmalItemsPageKey } from "@/components/amal-items/amal-item-view";
import { loadAmalItems } from "@/components/amal-items/amal-items-data";
import { AmalItemsManager } from "@/components/amal-items/amal-items-manager";
import { PageHeader } from "@/components/design/page-header";
import { isAdminRole, requireUstadhOrAdmin } from "@/lib/permissions";

/** Shared server wrapper for `/dashboard/amal-items`, `/men` and `/women` — only the opening tab differs. */
export async function AmalItemsPageShell({ page }: { page: AmalItemsPageKey }) {
  const session = await requireUstadhOrAdmin();
  const { items, preview } = await loadAmalItems();
  const isAdmin = isAdminRole(session.user.role);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="উস্তাদ প্যানেল"
        title="আমল আইটেম ব্যবস্থাপনা"
        description={
          isAdmin
            ? "ভাই ও বোনদের আমলনামার আমল, পয়েন্ট, দিন ও ওজর-অব্যাহতি নির্ধারণ করুন। উস্তাদজি হিসেবে আপনি সব আমল সম্পাদনা করতে পারবেন।"
            : "নতুন আমল যোগ করুন এবং নিজের যোগ করা আমল সম্পাদনা করুন। মূল (ডিফল্ট) তালিকা শুধু উস্তাদজি পরিবর্তন করতে পারেন।"
        }
      />
      <AmalItemsManager initialTab={page} items={items} preview={preview} currentUserId={session.user.id} isAdmin={isAdmin} />
    </div>
  );
}
