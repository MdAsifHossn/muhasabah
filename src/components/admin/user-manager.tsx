"use client";

import { Gender, Role } from "@prisma/client";
import { CheckCircle2, Pencil, Plus, Search, ShieldCheck, Trash2, UserRound, Users, X } from "lucide-react";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createManagedUser, deleteManagedUser, updateManagedUser } from "@/lib/actions/admin-users";
import { genderLabels } from "@/lib/amal-audience";
import { roleLabels } from "@/lib/constants";

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

type EditorMode = "create" | "edit" | null;

const fieldClass = "h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10";

export function UserManager({ users, currentUserId }: { users: ManagedUser[]; currentUserId: string }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<EditorMode>(null);
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(needle));
  }, [query, users]);

  const stats = {
    total: users.length,
    active: users.filter((user) => user.isActive).length,
    admins: users.filter((user) => user.role === Role.ADMIN).length,
    pending: users.filter((user) => !user.isActive).length,
  };

  function openEdit(user: ManagedUser) {
    setSelected(user);
    setMode("edit");
  }

  function closeEditor() {
    if (isPending) return;
    setMode(null);
    setSelected(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const result = mode === "create" ? await createManagedUser(data) : await updateManagedUser(data);
      if (result.success) {
        toast.success(result.message);
        form.reset();
        closeEditor();
      } else {
        toast.error(result.message);
      }
    });
  }

  function remove(user: ManagedUser) {
    if (user.id === currentUserId) {
      toast.error("নিজের admin account delete করা যাবে না।");
      return;
    }
    if (!window.confirm(`${user.name}-এর account এবং সংশ্লিষ্ট তথ্য স্থায়ীভাবে delete করবেন?`)) return;
    startTransition(async () => {
      const result = await deleteManagedUser(user.id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="মোট ব্যবহারকারী" value={stats.total} icon={Users} tone="emerald" />
        <Stat label="সক্রিয়" value={stats.active} icon={CheckCircle2} tone="sky" />
        <Stat label="Admin" value={stats.admins} icon={ShieldCheck} tone="violet" />
        <Stat label="নিষ্ক্রিয়" value={stats.pending} icon={UserRound} tone="amber" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-emerald-950">ব্যবহারকারীদের তালিকা</h2>
            <p className="mt-1 text-sm text-stone-500">নাম, ইমেইল, role, status ও password পরিচালনা করুন।</p>
          </div>
          <Button onClick={() => { setSelected(null); setMode("create"); }}>
            <Plus className="size-4" /> নতুন ব্যবহারকারী
          </Button>
        </div>

        <div className="border-b border-stone-100 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 size-4 text-stone-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="নাম, ইমেইল বা role দিয়ে খুঁজুন" className={`${fieldClass} pl-9`} />
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-5 py-4">ব্যবহারকারী</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">কার্যক্রম</th>
                <th className="px-5 py-4">যোগদান</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((user) => (
                <tr key={user.id} className="transition hover:bg-emerald-50/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-100 font-black text-emerald-900">{user.name.slice(0, 1).toUpperCase()}</span>
                      <div><p className="font-bold text-stone-900">{user.name}{user.id === currentUserId ? <span className="ml-2 text-xs text-emerald-700">(আপনি)</span> : null}</p><p className="text-xs text-stone-500">{user.email}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><div className="flex flex-wrap items-center gap-1.5"><RoleBadge role={user.role} /><GenderBadge gender={user.gender} /></div></td>
                  <td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${user.isActive ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{user.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}</span></td>
                  <td className="px-5 py-4 text-stone-600">{user.hideAmalnama ? <span className="font-semibold text-stone-500">আমলনামা লুকানো</span> : <><b>{user.entryCount}</b> আমলনামা · <b>{user.bookCount}</b> বই</>}</td>
                  <td className="px-5 py-4 text-stone-500">{new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium" }).format(new Date(user.joinedAt))}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(user)} disabled={isPending}><Pencil className="size-3.5" /> Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => remove(user)} disabled={isPending || user.id === currentUserId} className="border-red-200 text-red-700 hover:bg-red-50"><Trash2 className="size-3.5" /> Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? <tr><td colSpan={6} className="px-5 py-14 text-center text-stone-500">কোনো ব্যবহারকারী পাওয়া যায়নি।</td></tr> : null}
            </tbody>
          </table>
        </div>

        {/* ── Phone layout: one compact card per user (no sideways scrolling) ── */}
        <ul className="divide-y divide-stone-100 md:hidden">
          {filtered.map((user) => (
            <li key={user.id} className="p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-100 font-black text-emerald-900">{user.name.slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-stone-900">
                    {user.name}
                    {user.id === currentUserId ? <span className="ml-2 text-xs text-emerald-700">(আপনি)</span> : null}
                  </p>
                  <p className="truncate text-xs text-stone-500">{user.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RoleBadge role={user.role} />
                    <GenderBadge gender={user.gender} />
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${user.isActive ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{user.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[11px] leading-5 text-stone-500">
                  {user.hideAmalnama ? "আমলনামা লুকানো হয়েছে" : <><b>{user.entryCount}</b> আমলনামা · <b>{user.bookCount}</b> বই</>}
                  <br />
                  {new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium" }).format(new Date(user.joinedAt))}
                </p>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(user)} disabled={isPending}><Pencil className="size-3.5" /> Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => remove(user)} disabled={isPending || user.id === currentUserId} className="border-red-200 text-red-700 hover:bg-red-50" aria-label="Delete"><Trash2 className="size-3.5" /></Button>
                </div>
              </div>
            </li>
          ))}
          {filtered.length === 0 ? <li className="px-4 py-10 text-center text-sm text-stone-500">কোনো ব্যবহারকারী পাওয়া যায়নি।</li> : null}
        </ul>
      </section>

      {mode ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-emerald-950/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="user-editor-title">
          <form onSubmit={submit} className="my-8 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">Admin control</p><h2 id="user-editor-title" className="mt-1 text-2xl font-black text-emerald-950">{mode === "create" ? "নতুন ব্যবহারকারী" : "ব্যবহারকারী সম্পাদনা"}</h2></div>
              <button type="button" onClick={closeEditor} className="grid size-9 place-items-center rounded-full text-stone-500 hover:bg-stone-100" aria-label="বন্ধ করুন"><X className="size-5" /></button>
            </div>
            {selected ? <input type="hidden" name="userId" value={selected.id} /> : null}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="পূর্ণ নাম"><input name="name" required minLength={2} maxLength={100} defaultValue={selected?.name} className={fieldClass} /></Field>
              <Field label="ইমেইল"><input name="email" type="email" required defaultValue={selected?.email} className={fieldClass} /></Field>
              <Field label="Role"><select name="role" defaultValue={selected?.role ?? Role.MEMBER} className={fieldClass}>{Object.values(Role).map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></Field>
              <Field label="লিঙ্গ"><select name="gender" required defaultValue={([Gender.MALE, Gender.FEMALE] as Gender[]).includes(selected?.gender as Gender) ? selected?.gender : ""} className={fieldClass}><option value="" disabled>লিঙ্গ নির্বাচন করুন</option>{([Gender.MALE, Gender.FEMALE] as Gender[]).map((value) => <option key={value} value={value}>{genderLabels[value]}</option>)}</select></Field>
              <Field label={mode === "create" ? "পাসওয়ার্ড" : "নতুন পাসওয়ার্ড (ঐচ্ছিক)"}><input name="password" type="password" required={mode === "create"} minLength={8} maxLength={128} autoComplete="new-password" placeholder={mode === "create" ? "কমপক্ষে ৮ অক্ষর" : "পরিবর্তন না করলে খালি রাখুন"} className={fieldClass} /></Field>
            </div>
            <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4"><input name="isActive" type="checkbox" defaultChecked={selected?.isActive ?? true} className="size-4 accent-emerald-800" /><span><b className="block text-sm text-stone-800">Account সক্রিয়</b><small className="text-stone-500">বন্ধ থাকলে ব্যবহারকারী login করতে পারবেন না।</small></span></label>
            {selected?.id === currentUserId ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">নিজের admin role ও active status পরিবর্তন করা যাবে না। নাম, ইমেইল ও password পরিবর্তন করা যাবে।</p> : null}
            <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={closeEditor} disabled={isPending}>বাতিল</Button><Button disabled={isPending}>{isPending ? "সংরক্ষণ হচ্ছে…" : mode === "create" ? "ব্যবহারকারী তৈরি করুন" : "পরিবর্তন সংরক্ষণ করুন"}</Button></div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="block text-sm font-bold text-stone-700">{label}</span>{children}</label>;
}

function RoleBadge({ role }: { role: Role }) {
  const style = role === Role.ADMIN ? "bg-violet-100 text-violet-800" : role === Role.USTADH ? "bg-sky-100 text-sky-800" : "bg-stone-100 text-stone-700";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${style}`}>{roleLabels[role]}</span>;
}

function GenderBadge({ gender }: { gender: Gender }) {
  // Legacy rows can still hold `OTHER` (never set) — flag them loudly so the
  // admin sets পুরুষ/নারী: an unset gender means the member only sees the
  // general (ALL) amals, not the men's/women's amalnama.
  if (gender === Gender.OTHER) return <span className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800" title="এই সদস্যের লিঙ্গ নির্ধারিত হয়নি — Edit করে পুরুষ/নারী নির্বাচন করুন">লিঙ্গ নির্ধারিত নয়</span>;
  const style = gender === Gender.FEMALE ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${style}`}>{genderLabels[gender]}</span>;
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Users; tone: "emerald" | "sky" | "violet" | "amber" }) {
  const colors = { emerald: "bg-emerald-100 text-emerald-900", sky: "bg-sky-100 text-sky-900", violet: "bg-violet-100 text-violet-900", amber: "bg-amber-100 text-amber-900" };
  return <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className={`grid size-11 place-items-center rounded-2xl ${colors[tone]}`}><Icon className="size-5" /></div><p className="mt-4 text-3xl font-black text-emerald-950">{value.toLocaleString("bn-BD")}</p><p className="mt-1 text-sm text-stone-500">{label}</p></div>;
}