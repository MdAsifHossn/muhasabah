import { Role } from "@prisma/client";

import { PageHeader, StatusBadge, inputClass } from "@/components/dashboard/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateMember } from "@/lib/actions/admin";
import { roleLabels } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function MembersPage() {
  const members=await prisma.user.findMany({orderBy:{createdAt:"desc"},include:{_count:{select:{dailyEntries:true}}}});
  return <div className="mx-auto max-w-6xl space-y-7"><PageHeader eyebrow="Admin" title="Members" description="নিবন্ধিত সদস্য সক্রিয়/নিষ্ক্রিয় করুন এবং প্রয়োজন হলে role পরিবর্তন করুন।"/><Card><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-stone-50 text-stone-500"><tr><th className="px-5 py-4">সদস্য</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Entries</th><th className="px-5 py-4">Actions</th></tr></thead><tbody className="divide-y divide-stone-100">{members.map((member)=><tr key={member.id}><td className="px-5 py-4"><p className="font-semibold">{member.name}</p><p className="text-xs text-stone-400">{member.email}</p></td><td className="px-5 py-4"><form action={updateMember} className="flex gap-2"><input type="hidden" name="userId" value={member.id}/><input type="hidden" name="operation" value="role"/><select name="role" defaultValue={member.role} className={`${inputClass} w-32`}>{Object.values(Role).map((role)=><option key={role} value={role}>{roleLabels[role]}</option>)}</select><Button size="sm" variant="outline">Save</Button></form></td><td className="px-5 py-4"><StatusBadge tone={member.isActive?"green":"red"}>{member.isActive?"Active":"Inactive"}</StatusBadge></td><td className="px-5 py-4">{member._count.dailyEntries}</td><td className="px-5 py-4"><form action={updateMember}><input type="hidden" name="userId" value={member.id}/><input type="hidden" name="operation" value="toggle"/><Button size="sm" variant="outline">{member.isActive?"Deactivate":"Activate"}</Button></form></td></tr>)}</tbody></table></CardContent></Card></div>;
}