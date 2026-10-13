import { PageHeader } from "@/components/dashboard/common";
import { UserManager, type ManagedUser } from "@/components/admin/user-manager";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function MembersPage() {
  const session = await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      gender: true,
      isActive: true,
      hideAmalnama: true,
      joinedAt: true,
      _count: { select: { dailyEntries: true, books: true } },
    },
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
    <div className="mx-auto max-w-[1500px] space-y-7">
      <PageHeader
        eyebrow="Admin · User management"
        title="ব্যবহারকারী ব্যবস্থাপনা"
        description="নতুন সদস্য বা উস্তায তৈরি করুন, তথ্য ও password পরিবর্তন করুন, account সক্রিয়/নিষ্ক্রিয় করুন এবং প্রয়োজন হলে নিরাপদে delete করুন।"
      />
      <UserManager users={managedUsers} currentUserId={session.user.id} />
    </div>
  );
}