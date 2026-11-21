import { redirect } from "next/navigation";

/** Cycle setup was removed: members write their Amalnama every day. */
export default function LegacyAdminCyclesPage() {
  redirect("/dashboard/admin");
}
