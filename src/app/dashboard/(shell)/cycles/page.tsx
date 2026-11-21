import { redirect } from "next/navigation";

/** The ৪০-দিনের মেয়াদ is gone — Amalnama is daily now. Old links land on progress. */
export default function LegacyCyclesPage() {
  redirect("/dashboard/progress");
}
