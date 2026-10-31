import { Gender, Role } from "@prisma/client";
import { CalendarDays, KeyRound, Mail, Palette, ShieldCheck, UserRound } from "lucide-react";

import { AmalPrivacyToggle } from "@/components/amalnama/privacy-toggle";
import { ToastForm } from "@/components/dashboard/toast-form";
import { CardSection } from "@/components/design/card-section";
import { PageHeader } from "@/components/design/page-header";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { ThemePicker } from "@/components/theme/theme-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setOwnGender, updateProfile } from "@/lib/actions/personal";
import { genderLabels } from "@/lib/amal-audience";
import { roleLabels } from "@/lib/constants";
import { formatBanglaDate } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await requireUser();
  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, gender: true, hideAmalnama: true, joinedAt: true, role: true },
  });
  const gender = viewer?.gender ?? Gender.OTHER;
  const role = (viewer?.role ?? session.user.role) as Role;
  const name = viewer?.name ?? session.user.name;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader eyebrow="অ্যাকাউন্ট" title="প্রোফাইল ও নিরাপত্তা" description="নাম, পাসওয়ার্ড, প্রাইভেসি ও থিম — সব এখানে।" />

      <section className="hero-surface overflow-hidden rounded-card p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/12 text-2xl font-bold text-amber-200 ring-1 ring-white/20">{name.trim().slice(0, 1)}</span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold">{name}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge className="bg-white/12 text-on-hero">{roleLabels[role]}</Badge>
              <Badge className="bg-white/12 text-on-hero">{genderLabels[gender]}</Badge>
            </div>
          </div>
        </div>
        <dl className="mt-5 grid gap-2 text-sm text-on-hero-muted sm:grid-cols-2">
          <div className="flex items-center gap-2 truncate">
            <Mail className="size-4 shrink-0" /> <dd className="truncate">{viewer?.email}</dd>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0" /> <dd>যোগদান: {viewer ? formatBanglaDate(viewer.joinedAt) : "—"}</dd>
          </div>
        </dl>
      </section>

      {gender === Gender.OTHER ? (
      <CardSection title="আপনি ভাই নাকি বোন?" description="এটি ঠিক না করা পর্যন্ত আপনি শুধু সাধারণ আমলগুলো দেখবেন। একবার নির্ধারণের পর শুধু উস্তাদজি পরিবর্তন করতে পারবেন।">
          <ToastForm action={setOwnGender} successMessage="সংরক্ষিত হয়েছে — এখন আপনার জন্য নির্ধারিত আমল দেখানো হবে।" className="grid grid-cols-2 gap-2">
            <Button type="submit" name="gender" value={Gender.MALE} variant="outline" size="lg">
              পুরুষ
            </Button>
            <Button type="submit" name="gender" value={Gender.FEMALE} variant="outline" size="lg">
              নারী
            </Button>
          </ToastForm>
        </CardSection>
      ) : null}

      <CardSection title={<span className="flex items-center gap-2"><UserRound className="size-[18px] text-primary" /> নাম পরিবর্তন</span>}>
        <ToastForm action={updateProfile} successMessage="নাম আপডেট হয়েছে।" className="flex flex-col gap-3 sm:flex-row">
          <Input name="name" defaultValue={name} required minLength={2} maxLength={100} aria-label="নাম" />
          <Button type="submit" className="sm:w-40">সংরক্ষণ</Button>
        </ToastForm>
      </CardSection>

      <CardSection
        title={<span className="flex items-center gap-2"><KeyRound className="size-[18px] text-primary" /> পাসওয়ার্ড পরিবর্তন</span>}
        description="পরিবর্তনের পর অন্য সব ডিভাইস থেকে স্বয়ংক্রিয়ভাবে লগআউট হবে।"
      >
        <ChangePasswordForm />
      </CardSection>

      <CardSection title={<span className="flex items-center gap-2"><ShieldCheck className="size-[18px] text-primary" /> আমলনামা প্রাইভেসি</span>}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-muted-foreground">
            চালু করলে উস্তাদজি আপনার আমলনামা দেখতে বা রিভিউ করতে পারবেন না। নিজের আমলনামা আপনি সবসময় দেখতে ও জমা দিতে পারবেন।
          </p>
          <AmalPrivacyToggle initialHidden={viewer?.hideAmalnama ?? false} />
        </div>
      </CardSection>

      <CardSection title={<span className="flex items-center gap-2"><Palette className="size-[18px] text-primary" /> থিম</span>} description="রাতে পড়ার জন্য ডার্ক মোড চোখের জন্য আরামদায়ক।">
        <ThemePicker />
      </CardSection>
    </div>
  );
}
