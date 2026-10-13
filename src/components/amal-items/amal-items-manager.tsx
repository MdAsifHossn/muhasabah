"use client";

import { AmalAudience, AmalCategory, AmalInputType, Weekday } from "@prisma/client";
import { Lock, Pencil, Plus, Power, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import type { AmalItemView, AmalItemsPageKey } from "@/components/amal-items/amal-item-view";
import { AMAL_ITEMS_PAGES } from "@/components/amal-items/amal-item-view";
import { EmptyState, StatusBadge } from "@/components/dashboard/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createAmalItem, deleteAmalItem, updateAmalItem } from "@/lib/actions/admin";
import { actionErrorMessage } from "@/lib/action-error";
import { audienceLabels } from "@/lib/amal-audience";
import { categoryLabels, inputTypeLabels, weekdayLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 sm:text-sm";
const selectClass = fieldClass;

function errorText(error: unknown) {
  return actionErrorMessage(error, "দুঃখিত, কাজটি সম্পন্ন হয়নি।");
}

function audienceChipClass(scope: AmalAudience) {
  if (scope === AmalAudience.FEMALE) return "bg-rose-50 text-rose-700 border border-rose-200";
  if (scope === AmalAudience.MALE) return "bg-sky-50 text-sky-700 border border-sky-200";
  return "bg-stone-100 text-stone-600 border border-stone-200";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="block text-xs font-bold text-stone-600">{label}</span>
      {children}
    </label>
  );
}

function CheckField({ name, label, helper, defaultChecked }: { name: string; label: string; helper?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-emerald-800" />
      <span>
        <span className="block text-sm font-bold text-stone-800">{label}</span>
        {helper ? <small className="mt-0.5 block text-xs leading-5 text-stone-500">{helper}</small> : null}
      </span>
    </label>
  );
}

function DaySelect({ defaultValue }: { defaultValue?: Weekday | null }) {
  return (
    <select name="specificDay" defaultValue={defaultValue ?? ""} className={selectClass}>
      <option value="">প্রতিদিন</option>
      {Object.values(Weekday).map((value) => (
        <option key={value} value={value}>
          {weekdayLabels[value]}
        </option>
      ))}
    </select>
  );
}

/** কার জন্য: সবার (ALL) / পুরুষ (MALE) / নারী (FEMALE). */
function AudienceSelect({ defaultValue }: { defaultValue?: AmalAudience }) {
  return (
    <select name="genderScope" defaultValue={defaultValue ?? AmalAudience.ALL} className={selectClass}>
      {Object.values(AmalAudience).map((value) => (
        <option key={value} value={value}>
          {audienceLabels[value]}
        </option>
      ))}
    </select>
  );
}

/** Shared manager for /dashboard/amal-items, /men and /women. */
export function AmalItemsManager({
  page,
  items,
  currentUserId,
  isAdmin,
}: {
  page: AmalItemsPageKey;
  items: AmalItemView[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const config = AMAL_ITEMS_PAGES[page];
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      `${item.titleBn} ${item.titleEn ?? ""} ${item.description ?? ""} ${categoryLabels[item.category]}`.toLowerCase().includes(needle),
    );
  }, [items, query]);

  const canEdit = (item: AmalItemView) => isAdmin || item.createdById === currentUserId;

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      try {
        await createAmalItem(data);
        toast.success("নতুন আমল আইটেম যোগ হয়েছে।");
        form.reset();
        setCreateOpen(false);
      } catch (error) {
        toast.error(errorText(error));
      }
    });
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("operation", "edit");
    startTransition(async () => {
      try {
        await updateAmalItem(data);
        toast.success("আমল আইটেম আপডেট হয়েছে।");
        setEditingId(null);
      } catch (error) {
        toast.error(errorText(error));
      }
    });
  }

  function toggle(item: AmalItemView) {
    const data = new FormData();
    data.set("itemId", item.id);
    data.set("operation", "toggle");
    startTransition(async () => {
      try {
        await updateAmalItem(data);
        toast.success(item.isActive ? "আইটেমটি নিষ্ক্রিয় করা হয়েছে।" : "আইটেমটি সক্রিয় করা হয়েছে।");
      } catch (error) {
        toast.error(errorText(error));
      }
    });
  }

  function remove(item: AmalItemView) {
    if (!window.confirm(`“${item.titleBn}” আইটেমটি স্থায়ীভাবে মুছে ফেলবেন?`)) return;
    const data = new FormData();
    data.set("itemId", item.id);
    startTransition(async () => {
      try {
        await deleteAmalItem(data);
        toast.success("আমল আইটেম মুছে ফেলা হয়েছে।");
      } catch (error) {
        toast.error(errorText(error));
      }
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{config.eyebrow}</p>
        <h1 className="mt-1 text-3xl font-bold text-emerald-950">{config.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">{config.description}</p>
      </div>

      {/* Switcher between the combined / men's / women's list */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="navigation" aria-label="আমল তালিকা নির্বাচন">
        {Object.values(AMAL_ITEMS_PAGES).map((option) => (
          <Link
            key={option.key}
            href={option.href}
            aria-current={option.key === page ? "page" : undefined}
            className={cn(
              "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
              option.key === page
                ? "border-emerald-950 bg-emerald-950 text-white shadow-sm"
                : "border-stone-300 bg-white text-stone-600 hover:border-emerald-700 hover:text-emerald-800",
            )}
          >
            {option.switcherLabel}
          </Link>
        ))}
      </div>

      {/* Sticky action bar — stays anchored while scrolling the list */}
      <div className="sticky top-14 z-10 lg:top-16">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
          <p className="truncate text-sm font-semibold text-stone-600">{filtered.length} টি আমল আইটেম</p>
          <Button
            size="sm"
            className="h-10 shrink-0"
            onClick={() => setCreateOpen((value) => !value)}
            aria-expanded={createOpen}
          >
            {createOpen ? <X className="size-4" /> : <Plus className="size-4" />}
            {createOpen ? "ফর্ম বন্ধ করুন" : "নতুন আমল যোগ করুন"}
          </Button>
        </div>
      </div>

      {createOpen ? (
        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold text-emerald-950">নতুন আমল আইটেম</h2>
            <form onSubmit={submitCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="বাংলা শিরোনাম">
                  <input name="titleBn" required minLength={2} maxLength={160} placeholder="যেমন: সকালের নামাজ সময়মতো" className={fieldClass} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="বিবরণ (ঐচ্ছিক)">
                  <input name="description" maxLength={500} placeholder="আইটেমটি সম্পর্কে সংক্ষিপ্ত নির্দেশনা" className={fieldClass} />
                </Field>
              </div>
              <Field label="Category">
                <select name="category" className={selectClass}>
                  {Object.values(AmalCategory).map((value) => (
                    <option key={value} value={value}>
                      {categoryLabels[value]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Input type">
                <select name="inputType" className={selectClass}>
                  {Object.values(AmalInputType).map((value) => (
                    <option key={value} value={value}>
                      {inputTypeLabels[value]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="পয়েন্ট">
                <input name="points" type="number" min={0.1} max={100} step="0.1" defaultValue="1" required className={fieldClass} />
              </Field>
              <Field label="ক্রম (order)">
                <input name="order" type="number" min={1} step={1} placeholder="সবার শেষে" className={fieldClass} />
              </Field>
              <Field label="লক্ষ্য (ঐচ্ছিক)">
                <input name="targetValue" type="number" min={0} step="0.1" placeholder="যেমন: ৩০" className={fieldClass} />
              </Field>
              <Field label="একক (ঐচ্ছিক)">
                <input name="unit" maxLength={40} placeholder="যেমন: মিনিট" className={fieldClass} />
              </Field>
              <Field label="বিশেষ দিন">
                <DaySelect />
              </Field>
              <Field label="কার জন্য">
                <AudienceSelect defaultValue={config.defaultAudience} />
              </Field>
              <CheckField name="isActive" label="সক্রিয়" defaultChecked />
              <CheckField name="isRequired" label="বাধ্যতামূলক" helper="চালু রাখলে সদস্যদের জন্য পূরণ করা বাধ্যতামূলক আমল হিসেবে চিহ্নিত হবে।" />
              <div className="sm:col-span-2">
                <CheckField
                  name="exemptOnPeriod"
                  label="মাসিকের দিনে প্রযোজ্য নয়"
                  helper="মাসিকের দিনে এই আমল প্রযোজ্য নয় — সদস্যের রিপোর্টে “—” দেখাবে এবং মিস হিসেব গণনা করা হবে না।"
                />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? "সংরক্ষণ হচ্ছে…" : "আমল যোগ করুন"}
                </Button>
                <Button type="button" variant="outline" className="h-11" onClick={() => setCreateOpen(false)} disabled={isPending}>
                  বাতিল
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="relative">
        <Search className="absolute left-3 top-3 size-5 text-stone-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="আমল খুঁজুন…"
          aria-label="আমল খুঁজুন"
          className={cn(fieldClass, "pl-10")}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="কোনো আমল আইটেম নেই"
          description={
            page === "all"
              ? "উপরের “নতুন আমল যোগ করুন” বাটন চেপে প্রথম আমল আইটেম তৈরি করুন।"
              : "এই তালিকায় এখনো কোনো আমল যোগ করা হয়নি — “নতুন আমল যোগ করুন” চেপে এখানে আমল যোগ করুন।"
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="কিছু পাওয়া যায়নি" description="অন্য শব্দ দিয়ে খুঁজে দেখুন।" />
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => {
            const owned = item.createdById === currentUserId;
            const editable = canEdit(item);
            return (
              <li key={item.id}>
                <Card className={cn(!item.isActive && "opacity-70")}>
                  <CardContent className="p-4 sm:p-5">
                    {editingId === item.id ? (
                      <form onSubmit={submitEdit} className="space-y-3">
                        <input type="hidden" name="itemId" value={item.id} />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <Field label="বাংলা শিরোনাম">
                              <input name="titleBn" required minLength={2} maxLength={160} defaultValue={item.titleBn} className={fieldClass} />
                            </Field>
                          </div>
                          <div className="sm:col-span-2">
                            <Field label="বিবরণ (ঐচ্ছিক)">
                              <input name="description" maxLength={500} defaultValue={item.description ?? ""} className={fieldClass} />
                            </Field>
                          </div>
                          <Field label="Category">
                            <select name="category" defaultValue={item.category} className={selectClass}>
                              {Object.values(AmalCategory).map((value) => (
                                <option key={value} value={value}>
                                  {categoryLabels[value]}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Input type">
                            <select name="inputType" defaultValue={item.inputType} className={selectClass}>
                              {Object.values(AmalInputType).map((value) => (
                                <option key={value} value={value}>
                                  {inputTypeLabels[value]}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="পয়েন্ট">
                            <input name="points" type="number" min={0.1} max={100} step="0.1" defaultValue={item.points} required className={fieldClass} />
                          </Field>
                          <Field label="ক্রম (order)">
                            <input name="order" type="number" min={1} step={1} defaultValue={item.order} className={fieldClass} />
                          </Field>
                          <Field label="লক্ষ্য (ঐচ্ছিক)">
                            <input name="targetValue" type="number" min={0} step="0.1" defaultValue={item.targetValue ?? ""} className={fieldClass} />
                          </Field>
                          <Field label="একক (ঐচ্ছিক)">
                            <input name="unit" maxLength={40} defaultValue={item.unit ?? ""} className={fieldClass} />
                          </Field>
                          <Field label="বিশেষ দিন">
                            <DaySelect defaultValue={item.specificDay} />
                          </Field>
                          <Field label="কার জন্য">
                            <AudienceSelect defaultValue={item.genderScope} />
                          </Field>
                          <CheckField name="isActive" label="সক্রিয়" defaultChecked={item.isActive} />
                          <CheckField name="isRequired" label="বাধ্যতামূলক" defaultChecked={item.isRequired} />
                          <div className="sm:col-span-2">
                            <CheckField
                              name="exemptOnPeriod"
                              label="মাসিকের দিনে প্রযোজ্য নয়"
                              helper="মাসিকের দিনে এই আমল প্রযোজ্য নয় — সদস্যের রিপোর্টে “—” দেখাবে এবং মিস হিসেব গণনা করা হবে না।"
                              defaultChecked={item.exemptOnPeriod}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" className="h-10 flex-1" disabled={isPending}>
                            সংরক্ষণ করুন
                          </Button>
                          <Button type="button" size="sm" variant="outline" className="h-10" onClick={() => setEditingId(null)} disabled={isPending}>
                            বাতিল
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="break-words font-bold text-emerald-950">{item.titleBn}</h2>
                            {owned ? (
                              <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                আপনার যোগ করা
                              </span>
                            ) : null}
                            <StatusBadge tone={item.isActive ? "green" : "neutral"}>{item.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}</StatusBadge>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${audienceChipClass(item.genderScope)}`}>
                              কার জন্য: {audienceLabels[item.genderScope]}
                            </span>
                            {item.exemptOnPeriod ? (
                              <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                                মাসিকে প্রযোজ্য নয়
                              </span>
                            ) : null}
                            {item.isRequired ? (
                              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                                বাধ্যতামূলক
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1.5 text-sm text-stone-500">
                            {categoryLabels[item.category]} • {inputTypeLabels[item.inputType]}
                            {item.targetValue != null ? ` • লক্ষ্য ${item.targetValue}${item.unit ? ` ${item.unit}` : ""}` : ""}
                            {item.specificDay ? ` • ${weekdayLabels[item.specificDay]}` : " • প্রতিদিন"}
                            {` • ক্রম ${item.order}`}
                          </p>
                          {item.description ? <p className="mt-1 text-sm leading-6 text-stone-600">{item.description}</p> : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-9 items-center rounded-xl bg-stone-100 px-3 text-sm font-bold text-stone-700">
                            {item.points} পয়েন্ট
                          </span>
                          {editable ? (
                            <div className="flex items-center gap-2">
                              <Button size="icon" variant="outline" className="size-10" title="সম্পাদনা করুন" aria-label={`সম্পাদনা করুন: ${item.titleBn}`} onClick={() => setEditingId(item.id)} disabled={isPending}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button size="icon" variant="outline" className="size-10" title={item.isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"} aria-label={item.isActive ? `নিষ্ক্রিয় করুন: ${item.titleBn}` : `সক্রিয় করুন: ${item.titleBn}`} onClick={() => toggle(item)} disabled={isPending}>
                                <Power className="size-4" />
                              </Button>
                              <Button size="icon" variant="outline" className="size-10 border-red-200 text-red-700 hover:bg-red-50" title="মুছুন" aria-label={`মুছুন: ${item.titleBn}`} onClick={() => remove(item)} disabled={isPending}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-400">
                              <Lock className="size-3.5" /> কেবল অ্যাডমিন
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
