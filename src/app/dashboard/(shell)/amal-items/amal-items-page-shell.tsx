import { Role } from "@prisma/client";

import { AmalItemsManager } from "@/components/amal-items/amal-items-manager";
import { loadAmalItemsForPage } from "@/components/amal-items/amal-items-data";
import type { AmalItemsPageKey } from "@/components/amal-items/amal-item-view";
import { requireUstadhOrAdmin } from "@/lib/permissions";

/**
 * Shared server wrapper for the three amal-item management surfaces
 * (`/dashboard/amal-items`, `/men`, `/women`) — same manager component,
 * only the item scope and the default audience for new items differ.
 */
export async function AmalItemsPageShell({ page }: { page: AmalItemsPageKey }) {
  const session = await requireUstadhOrAdmin();
  const items = await loadAmalItemsForPage(page);

  return (
    <AmalItemsManager
      page={page}
      items={items}
      currentUserId={session.user.id}
      isAdmin={(session.user.role as Role) === Role.ADMIN}
    />
  );
}
