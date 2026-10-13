import { requireUser } from "@/lib/permissions";

/**
 * Route-level gate for everything under `/dashboard`.
 *
 * The visual shell (sidebar / top bar / mobile bottom bar) lives in
 * `(shell)/layout.tsx` so that full-screen routes such as the Quran reader can
 * opt out of the chrome without losing authentication.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
