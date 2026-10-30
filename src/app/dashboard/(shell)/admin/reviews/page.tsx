import { redirect } from "next/navigation";

/** Reviews moved to the Ustad panel (Ustadh and Admin share it). Old bookmarks keep working. */
export default function LegacyAdminReviewsPage() {
  redirect("/dashboard/ustad/reviews");
}
