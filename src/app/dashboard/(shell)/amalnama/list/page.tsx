import { redirect } from "next/navigation";

/** Old bookmarks now land on the single grid-based member report surface. */
export default async function LegacyAmalnamaListPage({ searchParams }: { searchParams: Promise<{ member?: string; range?: string }> }) {
  const params = await searchParams;
  const days = params.range === "30" || params.range === "40" || params.range === "all" ? params.range : "7";
  const query = new URLSearchParams({ days, ...(typeof params.member === "string" ? { member: params.member } : {}) });
  redirect(`/dashboard/amalnama/grid?${query.toString()}`);
}
