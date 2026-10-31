"use client";

import { Gender, Role } from "@prisma/client";
import { EyeOff, KeyRound, Pencil, Search, Trash2, UserPlus, UserRound, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Segmented, Sheet } from "@/components/ustad/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { createManagedUser, deleteManagedUser, resetManagedUserPassword, updateManagedUser, type UserActionResult } from "@/lib/actions/admin-users";
import { genderLabels } from "@/lib/amal-audience";
import { roleLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  gender: Gender;
  isActive: boolean;
  joinedAt: string;
  entryCount: number;
  bookCount: number;
  /** The member hid their Amalnama — supervisors must not see any of its data. */
  hideAmalnama: boolean;
};

type Editor = { mode: "create" } | { mode: "edit"; user: ManagedUser } | { mode: "password"; user: ManagedUser } | { mode: "delete"; user: ManagedUser } | null;
type RoleFilter = "ALL" | Role;
type GenderFilter = "ALL" | Gender;

function initials(name: string) {
  return name.trim().slice(0, 1) || "?";
}

export function UserManager({ users, currentUserId }: { users: ManagedUser[]; currentUserId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("ALL");
  const [editor, setEditor] = useState<Editor>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter(
      (user) =>
        (roleFilter === "ALL" || user.role === roleFilter) &&
        (genderFilter === "ALL" || user.gender === genderFilter) &&
        (!needle || `${user.name} ${user.email}`.toLowerCase().includes(needle)),
    );
  }, [users, query, roleFilter, genderFilter]);

  const counts = {
    all: users.length,
    USTADH: users.filter((user) => user.role === Role.USTADH).length,
    MEMBER: users.filter((user) => user.role === Role.MEMBER).length,
    inactive: users.filter((user) => !user.isActive).length,
    unsetGender: users.filter((user) => user.gender === Gender.OTHER).length,
  };

  function close() {
    if (!isPending) setEditor(null);
  }

  function run(action: () => Promise<UserActionResult>) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(result.message);
        setEditor(null);
        router.refresh();
      } else toast.error(result.message);
    });
  }

  function submit(event: FormEvent<HTMLFormElement>, action: (data: FormData) => Promise<UserActionResult>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    run(() => action(data));
  }

  const editing = editor?.mode === "edit" ? editor.user : null;
  const isSelf = editing?.id === currentUserId;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "মোট ব্যবহারকারী", value: counts.all },
          { label: "উস্তাদজি", value: counts.USTADH },
          { label: "সাধারণ সদস্য", value: counts.MEMBER },
          { label: "নিষ্ক্রিয়", value: counts.inactive },
        ].map((stat) => (
          <div key={stat.label} className="surface rounded-card p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{stat.value.toLocaleString("bn-BD")}</p>
          </div>
        ))}
      </div>

      {counts.unsetGender ? (
        <p className="rounded-card bg-warning-soft px-4 py-3 text-sm leading-6 text-warning">
          {counts.unsetGender.toLocaleString("bn-BD")} জন ব্যবহারকারীর লিঙ্গ নির্ধারিত নেই — তারা শুধু “সবার” আমল পাচ্ছেন। সম্পাদনা করে পুরুষ/নারী নির্বাচন করুন।
        </p>
      ) : null}

      <div className="surface space-y-3 rounded-card p-3 sm:p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="নাম বা ইমেইল দিয়ে খুঁজুন" className="pl-9" aria-label="খুঁজুন" />
          </div>
          <Button onClick={() => setEditor({ mode: "create" })} className="shrink-0">
            <UserPlus className="size-4" />
            <span className="hidden sm:inline">নতুন ব্যবহারকারী</span>
          </Button>
        </div>
        <Segmented<RoleFilter>
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: "ALL", label: "সব রোল", count: counts.all },
            { value: Role.MEMBER, label: roleLabels.MEMBER, count: counts.MEMBER },
            { value: Role.USTADH, label: roleLabels.USTADH, count: counts.USTADH },
          ]}
        />
        <Segmented<GenderFilter>
          value={genderFilter}
          onChange={setGenderFilter}
          options={[
            { value: "ALL", label: "সবাই" },
            { value: Gender.MALE, label: "ভাই (পুরুষ)" },
            { value: Gender.FEMALE, label: "বোন (নারী)" },
            { value: Gender.OTHER, label: "লিঙ্গ নির্ধারিত নয়" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="surface rounded-card p-8 text-center text-sm text-muted-foreground">কোনো ব্যবহারকারী পাওয়া যায়নি।</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {filtered.map((user) => (
            <li key={user.id} className={cn("surface rounded-card p-4", !user.isActive && "opacity-70")}>
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-full text-base font-bold",
                    user.gender === Gender.FEMALE ? "bg-female-soft text-female" : "bg-primary-soft text-primary",
                  )}
                >
                  {initials(user.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-bold text-foreground">
                    {user.name}
                    {user.id === currentUserId ? <span className="text-xs font-medium text-muted-foreground">(আপনি)</span> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={user.role === Role.USTADH ? "gold" : "secondary"}>
                      <UserRound className="size-3" />
                      {roleLabels[user.role]}
                    </Badge>
                    <Badge variant={user.gender === Gender.FEMALE ? "female" : user.gender === Gender.MALE ? "soft" : "warning"}>{genderLabels[user.gender]}</Badge>
                    {!user.isActive ? <Badge variant="danger">নিষ্ক্রিয়</Badge> : null}
                    {user.hideAmalnama ? (
                      <Badge variant="secondary">
                        <EyeOff className="size-3" /> আমলনামা গোপন
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[11px] text-subtle-foreground">
                    যোগদান {new Date(user.joinedAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                    {user.hideAmalnama ? "" : ` • ${user.entryCount.toLocaleString("bn-BD")} দিনের আমলনামা`}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 border-t border-hairline pt-3">
                <Button size="sm" variant="soft" className="flex-1" onClick={() => setEditor({ mode: "edit", user })}>
                  <Pencil className="size-3.5" /> সম্পাদনা
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditor({ mode: "password", user })}>
                  <KeyRound className="size-3.5" /> পাসওয়ার্ড
                </Button>
                <Button
                  size="icon-sm"
                  variant="danger-soft"
                  disabled={user.id === currentUserId}
                  onClick={() => setEditor({ mode: "delete", user })}
                  aria-label={`${user.name} মুছে ফেলুন`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Create / edit */}
      <Sheet
        open={editor?.mode === "create" || editor?.mode === "edit"}
        onClose={close}
        title={editing ? "ব্যবহারকারী সম্পাদনা" : "নতুন ব্যবহারকারী"}
        description={editing ? editing.email : "সদস্য বা উস্তাদজি অ্যাকাউন্ট তৈরি করুন।"}
      >
        <form key={editing?.id ?? "new"} onSubmit={(event) => submit(event, editing ? updateManagedUser : createManagedUser)} className="space-y-4">
          {editing ? <input type="hidden" name="userId" value={editing.id} /> : null}
          <Field label="নাম" htmlFor="u-name">
            <Input id="u-name" name="name" required minLength={2} defaultValue={editing?.name} autoComplete="off" />
          </Field>
          <Field label="ইমেইল" htmlFor="u-email">
            <Input id="u-email" name="email" type="email" required defaultValue={editing?.email} autoComplete="off" />
          </Field>
          {!editing ? (
            <Field label="পাসওয়ার্ড" htmlFor="u-password" hint="কমপক্ষে ৮ অক্ষর। ব্যবহারকারী পরে প্রোফাইল থেকে পরিবর্তন করতে পারবেন।">
              <Input id="u-password" name="password" type="text" required minLength={8} autoComplete="new-password" />
            </Field>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Field label="রোল" htmlFor="u-role">
              <Select id="u-role" name="role" defaultValue={editing?.role ?? Role.MEMBER} disabled={isSelf}>
                <option value={Role.MEMBER}>{roleLabels.MEMBER}</option>
                <option value={Role.USTADH}>{roleLabels.USTADH}</option>
              </Select>
              {isSelf ? <input type="hidden" name="role" value={editing?.role ?? Role.USTADH} /> : null}
            </Field>
            <Field label="লিঙ্গ" htmlFor="u-gender">
              <Select id="u-gender" name="gender" required defaultValue={editing && editing.gender !== Gender.OTHER ? editing.gender : ""}>
                <option value="" disabled>
                  নির্বাচন করুন
                </option>
                <option value={Gender.MALE}>পুরুষ</option>
                <option value={Gender.FEMALE}>নারী</option>
              </Select>
            </Field>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-hairline bg-surface-sunken p-3">
            <input type="checkbox" name="isActive" defaultChecked={editing?.isActive ?? true} disabled={isSelf} className="mt-0.5 size-4" />
            {isSelf ? <input type="hidden" name="isActive" value="on" /> : null}
            <span>
              <span className="block text-sm font-semibold text-foreground">অ্যাকাউন্ট সক্রিয়</span>
              <span className="block text-xs leading-5 text-muted-foreground">নিষ্ক্রিয় করলে সব ডিভাইস থেকে সাথে সাথে লগআউট হয়ে যাবে।</span>
            </span>
          </label>
          <p className="rounded-xl bg-surface-sunken px-3 py-2 text-xs leading-5 text-muted-foreground">
            <UsersRound className="mr-1 inline size-3.5" />
            সদস্য: নিজের আমলনামা • উস্তাদজি: সদস্যদের আমলনামা দেখা, মন্তব্য, রিভিউ, নোটিশ, আমল আইটেম ও সম্পূর্ণ ব্যবস্থাপনা।
          </p>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "সংরক্ষণ হচ্ছে…" : editing ? "পরিবর্তন সংরক্ষণ" : "ব্যবহারকারী তৈরি করুন"}
          </Button>
        </form>
      </Sheet>

      {/* Password reset */}
      <Sheet open={editor?.mode === "password"} onClose={close} title="পাসওয়ার্ড রিসেট" description={editor?.mode === "password" ? `${editor.user.name} — ${editor.user.email}` : undefined}>
        {editor?.mode === "password" ? (
          <form onSubmit={(event) => submit(event, resetManagedUserPassword)} className="space-y-4">
            <input type="hidden" name="userId" value={editor.user.id} />
            <Field label="নতুন পাসওয়ার্ড" htmlFor="u-newpass" hint="কমপক্ষে ৮ অক্ষর। ব্যবহারকারী সব ডিভাইস থেকে লগআউট হবেন।">
              <Input id="u-newpass" name="password" type="text" required minLength={8} autoComplete="new-password" />
            </Field>
            <Button type="submit" className="w-full" disabled={isPending}>
              <KeyRound className="size-4" /> {isPending ? "সেট হচ্ছে…" : "পাসওয়ার্ড সেট করুন"}
            </Button>
          </form>
        ) : null}
      </Sheet>

      {/* Delete confirm */}
      <Sheet open={editor?.mode === "delete"} onClose={close} title="অ্যাকাউন্ট মুছে ফেলবেন?">
        {editor?.mode === "delete" ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              <strong className="text-foreground">{editor.user.name}</strong>-এর অ্যাকাউন্ট, আমলনামা, বই, রিভিউ ও মন্তব্য স্থায়ীভাবে মুছে যাবে। এটি আর ফেরানো যাবে না। শুধু সাময়িক বন্ধ রাখতে চাইলে “সম্পাদনা” থেকে নিষ্ক্রিয় করুন।
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={close} disabled={isPending}>
                বাতিল
              </Button>
              <Button variant="danger" className="flex-1" disabled={isPending} onClick={() => run(() => deleteManagedUser(editor.user.id))}>
                <Trash2 className="size-4" /> {isPending ? "মুছছে…" : "স্থায়ীভাবে মুছুন"}
              </Button>
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
