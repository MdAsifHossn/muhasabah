import { Gender, Role } from "@prisma/client";
import { CalendarDays, History, LayoutGrid, Mail, Shield, UserRound, WifiOff } from "lucide-react";
import Link from "next/link";

import { AmalPrivacyToggle } from "@/components/amalnama/privacy-toggle";
import { PageHeader, inputClass } from "@/components/dashboard/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateProfile } from "@/lib/actions/personal";
import { genderLabels } from "@/lib/amal-audience";
import { roleLabels } from "@/lib/constants";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await requireUser();
  const viewer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { gender: true, hideAmalnama: true } });
  const gender = viewer?.gender ?? Gender.OTHER;
  const hiddenAmalnama = viewer?.hideAmalnama ?? false;
  return <div className="mx-auto max-w-3xl space-y-7"><PageHeader title="Profile" description="আপনার account-এর মৌলিক তথ্য দেখুন ও নাম পরিবর্তন করুন।"/><Card><CardContent><div className="grid size-16 place-items-center rounded-2xl bg-emerald-950 text-2xl font-bold text-amber-300">{session.user.name.slice(0,1)}</div><h2 className="mt-4 text-2xl font-bold text-emerald-950">{session.user.name}</h2><div className="mt-4 grid gap-3 text-sm text-stone-600 sm:grid-cols-3"><p className="flex items-center gap-2"><Mail className="size-4"/>{session.user.email}</p><p className="flex items-center gap-2"><Shield className="size-4"/>{roleLabels[session.user.role as Role]}</p><p className="flex items-center gap-2"><UserRound className="size-4"/>লিঙ্গ: {genderLabels[gender]}</p><p className="flex items-center gap-2"><CalendarDays className="size-4"/>সক্রিয় সদস্য</p></div></CardContent></Card><Card><CardContent><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h2 className="font-bold text-emerald-950">আমলনামা প্রাইভেসি</h2><p className="mt-1 text-sm leading-6 text-stone-500">চালু রাখলে অ্যাডমিন ও উস্তাজি আমার আমলনামা দেখতে বা রিভিউ করতে পারবেন না; বন্ধ রাখলে আবার দেখতে ও রিভিউ করতে পারবেন। নিজের আমলনামা আপনি যেকোনো সময় দেখতে ও জমা দিতে পারবেন।</p></div><AmalPrivacyToggle initialHidden={hiddenAmalnama}/></div></CardContent></Card><Card><CardContent><h2 className="font-bold text-emerald-950">নাম পরিবর্তন</h2><form action={updateProfile} className="mt-4 flex flex-col gap-3 sm:flex-row"><input name="name" defaultValue={session.user.name} required minLength={2} className={inputClass}/><Button type="submit">সংরক্ষণ করুন</Button></form><p className="mt-3 text-xs text-stone-400">ইমেইল ও password পরিবর্তন পরবর্তী security module-এ যোগ হবে।</p></CardContent></Card><Card><CardContent><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-emerald-950">আমলনামা তালিকা</h2><p className="mt-1 text-sm leading-6 text-stone-500">দিনভিত্তিক আমলনামার রিপোর্ট দেখুন — কোন দিনে কোন আমল সম্পন্ন বা বাদ পড়েছে।</p></div><Button asChild variant="outline" className="w-full sm:w-auto"><Link href="/dashboard/amalnama/grid"><LayoutGrid className="size-4"/>গ্রিড আমলনামা</Link></Button><Button asChild className="w-full sm:w-auto"><Link href="/dashboard/amalnama/list"><History className="size-4"/>আমলনামা তালিকা</Link></Button></div></CardContent></Card><Card><CardContent><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-emerald-950">কুরআন অফলাইনে পড়া</h2><p className="mt-1 text-sm leading-6 text-stone-500">নেট ছাড়াই পড়ার জন্য সূরা সেভ করে রাখুন, তারপর অফলাইনেই আল-কুরআন পড়ুন।</p></div><Button asChild className="w-full sm:w-auto"><Link href="/dashboard/offline"><WifiOff className="size-4"/>অফলাইন পড়া</Link></Button></div></CardContent></Card></div>;
}