import { Role } from "@prisma/client";
import { CalendarDays, Mail, Shield } from "lucide-react";

import { PageHeader, inputClass } from "@/components/dashboard/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateProfile } from "@/lib/actions/personal";
import { roleLabels } from "@/lib/constants";
import { requireUser } from "@/lib/permissions";

export default async function ProfilePage() {
  const session = await requireUser();
  return <div className="mx-auto max-w-3xl space-y-7"><PageHeader title="Profile" description="আপনার account-এর মৌলিক তথ্য দেখুন ও নাম পরিবর্তন করুন।"/><Card><CardContent><div className="grid size-16 place-items-center rounded-2xl bg-emerald-950 text-2xl font-bold text-amber-300">{session.user.name.slice(0,1)}</div><h2 className="mt-4 text-2xl font-bold text-emerald-950">{session.user.name}</h2><div className="mt-4 grid gap-3 text-sm text-stone-600 sm:grid-cols-3"><p className="flex items-center gap-2"><Mail className="size-4"/>{session.user.email}</p><p className="flex items-center gap-2"><Shield className="size-4"/>{roleLabels[session.user.role as Role]}</p><p className="flex items-center gap-2"><CalendarDays className="size-4"/>সক্রিয় সদস্য</p></div></CardContent></Card><Card><CardContent><h2 className="font-bold text-emerald-950">নাম পরিবর্তন</h2><form action={updateProfile} className="mt-4 flex flex-col gap-3 sm:flex-row"><input name="name" defaultValue={session.user.name} required minLength={2} className={inputClass}/><Button type="submit">সংরক্ষণ করুন</Button></form><p className="mt-3 text-xs text-stone-400">ইমেইল ও password পরিবর্তন পরবর্তী security module-এ যোগ হবে।</p></CardContent></Card></div>;
}