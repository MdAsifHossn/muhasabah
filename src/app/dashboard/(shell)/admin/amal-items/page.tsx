import { redirect } from "next/navigation";

/**
 * The amal-item manager moved to `/dashboard/amal-items` (shared by Ustadh & Admin).
 * This legacy admin URL keeps forwarding for old bookmarks.
 */
export default function LegacyAmalItemsPage() {
  redirect("/dashboard/amal-items");
}
