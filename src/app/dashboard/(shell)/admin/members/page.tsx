import { UserManager, type ManagedUser } from "@/components/admin/user-manager";
import { PageHeader } from "@/components/design/page-header";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "ব্যবহারকারী ও রোল" };

export default async function MembersPage() {
  const session = await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: { id: true, name: true, email: true, role: true, gender: true, isActive: true, hideAmalnama: true, joinedAt: true, _count: { select: { dailyEntries: true, books: true } } },
  });

  const managedUsers: ManagedUser[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    gender: user.gender,
    isActive: user.isActive,
    joinedAt: user.joinedAt.toISOString(),
    // A hidden Amalnama means the admin must not see how much was submitted.
    entryCount: user.hideAmalnama ? 0 : user._count.dailyEntries,
    bookCount: user._count.books,
    hideAmalnama: user.hideAmalnama,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="অ্যাডমিন"
        title="ব্যবহারকারী ও রোল"
        description="সদস্য, উস্তাদজি ও অ্যাডমিন অ্যাকাউন্ট তৈরি, রোল ও লিঙ্গ নির্ধারণ, পাসওয়ার্ড রিসেট এবং সক্রিয়/নিষ্ক্রিয় করুন।"
      />
      <UserManager users={managedUsers} currentUserId={session.user.id} />
    </div>
  );
}
