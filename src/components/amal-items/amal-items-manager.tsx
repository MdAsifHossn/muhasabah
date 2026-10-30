"use client";

import { AmalAudience, AmalCategory, AmalInputType, Weekday } from "@prisma/client";
import { ArrowDown, ArrowUp, CalendarDays, Droplet, Lock, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import type { AmalItemsTab, AmalItemView, AmalPreview } from "@/components/amal-items/amal-item-view";
import { Segmented, Sheet } from "@/components/ustad/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createAmalItem, deleteAmalItem, moveAmalItem, toggleAmalItem, updateAmalItem } from "@/lib/actions/admin";
import { actionErrorMessage } from "@/lib/action-error";
import { categoryLabels, inputTypeLabels, weekdayLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";

const audienceText: Record<AmalAudience, string> = { ALL: "সবার জন্য", MALE: "ভাইদের জন্য", FEMALE: "বোনদের জন্য" };
const audienceVariant = { ALL: "secondary", MALE: "info", FEMALE: "female" } as const;

function matchesTab(item: AmalItemView, tab: AmalItemsTab) {
  if (tab === "men") return item.genderScope !== AmalAudience.FEMALE;
  if (tab === "women") return item.genderScope !== AmalAudience.MALE;
  if (tab === "jumuah") return item.category === AmalCategory.JUMUAH || item.specificDay === Weekday.FRIDAY;
  return true;
}

function targetText(item: AmalItemView) {
  if (item.inputType === AmalInputType.BOOLEAN) return "হ্যাঁ / না";
  if (item.inputType === AmalInputType.TEXT) return "লিখিত";
  return item.targetValue ? `লক্ষ্য ${item.targetValue.toLocaleString("bn-BD")} ${item.unit ?? ""}` : inputTypeLabels[item.inputType];
}

const errorText = (error: unknown) => actionErrorMessage(error, "দুঃখিত, কাজটি সম্পন্ন হয়নি।");

export function AmalItemsManager({
  initialTab,
  items,
  preview,
  currentUserId,
  isAdmin,
}: {
  initialTab: AmalItemsTab;
  items: AmalItemView[];
  preview: AmalPreview;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<AmalItemsTab>(initialTab);
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [editing, setEditing] = useState<AmalItemView | "new" | null>(null);
  const [isPending, startTransition] = useTransition();

  const canEdit = (item: AmalItemView) => isAdmin || item.createdById === currentUserId;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        matchesTab(item, tab) &&
        (showInactive || item.isActive) &&
        (!needle || `${item.titleBn} ${item.description ?? ""} ${categoryLabels[item.category]}`.toLowerCase().includes(needle)),
    );
  }, [items, tab, query, showInactive]);

  const grouped = useMemo(() => {
    const map = new Map<AmalCategory, AmalItemView[]>();
    for (const item of filtered) map.set(item.category, [...(map.get(item.category) ?? []), item]);
    return [...map.entries()];
  }, [filtered]);

  function run(task: () => Promise<unknown>, success: string, after?: () => void) {
    startTransition(async () => {
      try {
        await task();
        toast.success(success);
        after?.();
        router.refresh();
      } catch (error) {
        toast.error(errorText(error));
      }
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const isNew = editing === "new";
    run(() => (isNew ? createAmalItem(data) : updateAmalItem(data)), isNew ? "নতুন আমল যোগ হয়েছে।" : "আমল আপডেট হয়েছে।", () => setEditing(null));
  }

  function remove(item: AmalItemView) {
    if (!window.confirm(`“${item.titleBn}” মুছে ফেলবেন? কেউ আগে এটি পূরণ করে থাকলে মুছে না ফেলে বন্ধ (নিষ্ক্রিয়) করা হবে।`)) return;
    startTransition(async () => {
      try {
        const result = await deleteAmalItem(item.id);
        toast.success(result.archived ? "আগের রিপোর্ট ঠিক রাখতে আমলটি মুছে না ফেলে বন্ধ করা হয়েছে।" : "আমলটি মুছে ফেলা হয়েছে।");
        setEditing(null);
        router.refresh();
      } catch (error) {
        toast.error(errorText(error));
      }
    });
  }

  const counts = {
    all: items.length,
    men: items.filter((item) => matchesTab(item, "men")).length,
    women: items.filter((item) => matchesTab(item, "women")).length,
    jumuah: items.filter((item) => matchesTab(item, "jumuah")).length,
  };
  const form = editing === "new" ? null : editing;
  const defaultAudience = tab === "men" ? AmalAudience.MALE : tab === "women" ? AmalAudience.FEMALE : AmalAudience.ALL;

  return (
    <div className="space-y-4">
      {/* What each member sees */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "ভাইয়েরা আজ যা দেখবেন", data: preview.male, tone: "bg-info-soft text-info" },
          { label: "বোনেরা আজ যা দেখবেন", data: preview.female, tone: "bg-female-soft text-female" },
        ].map((card) => (
          <div key={card.label} className="surface flex items-center gap-3 rounded-card p-4">
            <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", card.tone)}>
              <UserRound className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                {card.label} ({preview.todayLabel})
              </p>
              <p className="text-lg font-bold text-foreground">
                {card.data.today.toLocaleString("bn-BD")}টি আমল • {card.data.points.toLocaleString("bn-BD")} পয়েন্ট
              </p>
              {!preview.isFriday ? <p className="text-[11px] text-subtle-foreground">শুক্রবারে {card.data.friday.toLocaleString("bn-BD")}টি (জুমার আমলসহ)</p> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="surface space-y-3 rounded-card p-3 sm:p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="আমল খুঁজুন" className="pl-9" aria-label="আমল খুঁজুন" />
          </div>
          <Button onClick={() => setEditing("new")} className="shrink-0">
            <Plus className="size-4" />
            <span className="hidden sm:inline">নতুন আমল</span>
          </Button>
        </div>
        <Segmented<AmalItemsTab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: "সব আমল", count: counts.all },
            { value: "men", label: "ভাইদের", count: counts.men },
            { value: "women", label: "বোনদের", count: counts.women },
            { value: "jumuah", label: "জুমা", count: counts.jumuah },
          ]}
        />
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} className="size-4" />
          বন্ধ (নিষ্ক্রিয়) আমলও দেখান
        </label>
      </div>

      {grouped.length === 0 ? (
        <p className="surface rounded-card p-8 text-center text-sm text-muted-foreground">এই তালিকায় কোনো আমল নেই।</p>
      ) : (
        grouped.map(([category, list]) => (
          <section key={category} className="space-y-2">
            <h2 className="flex items-center gap-2 px-1 text-sm font-bold text-foreground">
              {categoryLabels[category]}
              <span className="rounded-full bg-surface-sunken px-2 text-xs font-semibold text-muted-foreground">{list.length.toLocaleString("bn-BD")}</span>
            </h2>
            <ul className="space-y-2">
              {list.map((item) => {
                const editable = canEdit(item);
                return (
                  <li key={item.id} className={cn("surface rounded-card p-3.5 sm:p-4", !item.isActive && "opacity-60")}>
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-6 text-foreground">{item.titleBn}</p>
                        {item.description ? <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.description}</p> : null}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge variant={audienceVariant[item.genderScope]}>{audienceText[item.genderScope]}</Badge>
                          <Badge variant="outline">{targetText(item)}</Badge>
                          <Badge variant="gold">+{item.points.toLocaleString("bn-BD")} পয়েন্ট</Badge>
                          {item.specificDay ? (
                            <Badge variant="soft">
                              <CalendarDays className="size-3" /> শুধু {weekdayLabels[item.specificDay]}
                            </Badge>
                          ) : null}
                          {item.exemptOnPeriod ? (
                            <Badge variant="female">
                              <Droplet className="size-3" /> মাসিকে ছাড়
                            </Badge>
                          ) : null}
                          {!item.isActive ? <Badge variant="danger">বন্ধ</Badge> : null}
                        </div>
                        <p className="mt-2 text-[11px] text-subtle-foreground">
                          {item.createdById ? `যোগ করেছেন: ${item.creatorName ?? "অজানা"}` : "মূল তালিকা"}
                          {!editable ? (
                            <span className="ml-1 inline-flex items-center gap-0.5">
                              • <Lock className="size-3" /> শুধু অ্যাডমিন/নির্মাতা সম্পাদনা করতে পারবেন
                            </span>
                          ) : null}
                        </p>
                      </div>
                      {editable ? (
                        <label className="relative inline-flex shrink-0 cursor-pointer items-center" title={item.isActive ? "চালু" : "বন্ধ"}>
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={item.isActive}
                            disabled={isPending}
                            onChange={() => run(() => toggleAmalItem(item.id), item.isActive ? "আমলটি বন্ধ করা হয়েছে।" : "আমলটি চালু করা হয়েছে।")}
                            aria-label={`${item.titleBn} চালু/বন্ধ`}
                          />
                          <span className="h-6 w-11 rounded-full bg-hairline-strong transition peer-checked:bg-primary" />
                          <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                        </label>
                      ) : null}
                    </div>
                    {editable ? (
                      <div className="mt-3 flex gap-2 border-t border-hairline pt-3">
                        <Button size="sm" variant="soft" className="flex-1" onClick={() => setEditing(item)}>
                          <Pencil className="size-3.5" /> সম্পাদনা
                        </Button>
                        <Button size="icon-sm" variant="outline" disabled={isPending} onClick={() => run(() => moveAmalItem(item.id, "up"), "ক্রম পরিবর্তন হয়েছে।")} aria-label="উপরে সরান">
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="outline" disabled={isPending} onClick={() => run(() => moveAmalItem(item.id, "down"), "ক্রম পরিবর্তন হয়েছে।")} aria-label="নিচে সরান">
                          <ArrowDown className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="danger-soft" disabled={isPending} onClick={() => remove(item)} aria-label="মুছে ফেলুন">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      <Sheet open={editing !== null} onClose={() => !isPending && setEditing(null)} title={form ? "আমল সম্পাদনা" : "নতুন আমল যোগ করুন"} description="পরিবর্তন সাথে সাথে সদস্যদের আমলনামায় প্রযোজ্য হবে।">
        {editing !== null ? <ItemForm key={form?.id ?? "new"} item={form} defaultAudience={defaultAudience} onSubmit={submit} pending={isPending} /> : null}
      </Sheet>
    </div>
  );
}

function ItemForm({ item, defaultAudience, onSubmit, pending }: { item: AmalItemView | null; defaultAudience: AmalAudience; onSubmit: (event: FormEvent<HTMLFormElement>) => void; pending: boolean }) {
  const [inputType, setInputType] = useState<AmalInputType>(item?.inputType ?? AmalInputType.BOOLEAN);
  const [category, setCategory] = useState<AmalCategory>(item?.category ?? AmalCategory.SALAH);
  const numeric = inputType !== AmalInputType.BOOLEAN && inputType !== AmalInputType.TEXT;
  const defaultDay = item ? (item.specificDay ?? "") : category === AmalCategory.JUMUAH ? Weekday.FRIDAY : "";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {item ? <input type="hidden" name="itemId" value={item.id} /> : null}
      <Field label="আমলের নাম" htmlFor="a-title">
        <Input id="a-title" name="titleBn" required minLength={2} maxLength={160} defaultValue={item?.titleBn} placeholder="যেমন: ফজর — জামাতের সাথে তাকবীরে উলা" />
      </Field>
      <Field label="সংক্ষিপ্ত নির্দেশনা (ঐচ্ছিক)" htmlFor="a-desc">
        <Textarea id="a-desc" name="description" maxLength={500} defaultValue={item?.description ?? ""} className="min-h-20" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="বিভাগ" htmlFor="a-cat">
          <Select id="a-cat" name="category" value={category} onChange={(event) => setCategory(event.target.value as AmalCategory)}>
            {Object.values(AmalCategory).map((value) => (
              <option key={value} value={value}>
                {categoryLabels[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="কার জন্য" htmlFor="a-aud">
          <Select id="a-aud" name="genderScope" defaultValue={item?.genderScope ?? defaultAudience}>
            <option value={AmalAudience.ALL}>সবার জন্য</option>
            <option value={AmalAudience.MALE}>শুধু ভাইদের</option>
            <option value={AmalAudience.FEMALE}>শুধু বোনদের</option>
          </Select>
        </Field>
        <Field label="পূরণের ধরন" htmlFor="a-type">
          <Select id="a-type" name="inputType" value={inputType} onChange={(event) => setInputType(event.target.value as AmalInputType)}>
            {Object.values(AmalInputType).map((value) => (
              <option key={value} value={value}>
                {inputTypeLabels[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="পয়েন্ট" htmlFor="a-points">
          <Input id="a-points" name="points" type="number" inputMode="decimal" min="0.5" max="100" step="0.5" required defaultValue={item?.points ?? 1} />
        </Field>
        {numeric ? (
          <>
            <Field label="লক্ষ্য" htmlFor="a-target">
              <Input id="a-target" name="targetValue" type="number" inputMode="numeric" min="0" defaultValue={item?.targetValue ?? ""} placeholder="যেমন ১০০" />
            </Field>
            <Field label="একক" htmlFor="a-unit">
              <Input id="a-unit" name="unit" maxLength={40} defaultValue={item?.unit ?? ""} placeholder="বার / মিনিট / পৃষ্ঠা" />
            </Field>
          </>
        ) : null}
        <Field label="কোন দিন" htmlFor="a-day" className="col-span-2">
          <Select id="a-day" name="specificDay" key={defaultDay} defaultValue={defaultDay}>
            <option value="">প্রতিদিন</option>
            {Object.values(Weekday).map((value) => (
              <option key={value} value={value}>
                শুধু {weekdayLabels[value]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="space-y-2">
        {[
          { name: "isActive", label: "চালু রাখুন", helper: "বন্ধ থাকলে সদস্যদের আমলনামায় দেখাবে না।", checked: item?.isActive ?? true },
          { name: "exemptOnPeriod", label: "মাসিকের দিনে প্রযোজ্য নয়", helper: "নামাজ, রোজা, তিলাওয়াতের মতো আমল — বোনদের মাসিকের দিনে বাদ যাবে, মিস ধরা হবে না।", checked: item?.exemptOnPeriod ?? category === AmalCategory.SALAH },
          { name: "isRequired", label: "গুরুত্বপূর্ণ (আবশ্যক) আমল", helper: "আমলনামায় বিশেষভাবে চিহ্নিত হবে।", checked: item?.isRequired ?? false },
        ].map((check) => (
          <label key={check.name} className="flex cursor-pointer items-start gap-3 rounded-xl border border-hairline bg-surface-sunken p-3">
            <input type="checkbox" name={check.name} defaultChecked={check.checked} className="mt-0.5 size-4" />
            <span>
              <span className="block text-sm font-semibold text-foreground">{check.label}</span>
              <span className="block text-xs leading-5 text-muted-foreground">{check.helper}</span>
            </span>
          </label>
        ))}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "সংরক্ষণ হচ্ছে…" : item ? "পরিবর্তন সংরক্ষণ" : "আমল যোগ করুন"}
      </Button>
    </form>
  );
}
