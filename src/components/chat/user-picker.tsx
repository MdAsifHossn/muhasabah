"use client";

import { Check, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { searchChatUsers } from "@/lib/actions/groups";
import { cn } from "@/lib/utils";

export type PickedUser = { id: string; name: string; gender: string; isUstadh: boolean };

/** Name search + multi-select. `excludeIds` hides people who are already in the group. */
export function UserPicker({ selected, onChange, excludeIds = [] }: { selected: PickedUser[]; onChange: (next: PickedUser[]) => void; excludeIds?: string[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      searchChatUsers(query)
        .then((users) => active && setResults(users))
        .catch(() => active && setResults([]))
        .finally(() => active && setLoading(false));
    }, query ? 300 : 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const chosen = new Set(selected.map((user) => user.id));
  const visible = results.filter((user) => !excludeIds.includes(user.id));
  const toggle = (user: PickedUser) => onChange(chosen.has(user.id) ? selected.filter((entry) => entry.id !== user.id) : [...selected, user]);

  return (
    <div className="space-y-3">
      {selected.length ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="নির্বাচিত সদস্য">
          {selected.map((user) => (
            <li key={user.id}>
              <button type="button" onClick={() => toggle(user)} className="inline-flex items-center gap-1 rounded-lg bg-active px-2.5 py-1 text-xs font-semibold text-on-active" aria-label={`${user.name} বাদ দিন`}>
                {user.name} <span aria-hidden>×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <label className="relative block">
        <span className="sr-only">নাম দিয়ে খুঁজুন</span>
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="নাম দিয়ে খুঁজুন…"
          className="field-3d h-11 w-full rounded-xl pl-9 pr-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25"
        />
      </label>
      <ul className="max-h-60 divide-y divide-hairline overflow-y-auto rounded-xl border border-hairline">
        {loading && !visible.length ? (
          <li className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> খোঁজা হচ্ছে…
          </li>
        ) : visible.length ? (
          visible.map((user) => {
            const on = chosen.has(user.id);
            return (
              <li key={user.id}>
                <button type="button" onClick={() => toggle(user)} aria-pressed={on} className={cn("flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-muted/60", on && "bg-primary-soft/60")}>
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold", user.gender === "FEMALE" ? "bg-female-soft text-female" : "bg-primary-soft text-primary")}>{user.name.trim().slice(0, 1)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{user.name}</span>
                  {user.isUstadh ? <Badge variant="gold">উস্তাদজি</Badge> : user.gender === "FEMALE" ? <Badge variant="female">বোন</Badge> : user.gender === "MALE" ? <Badge variant="soft">ভাই</Badge> : null}
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border", on ? "border-transparent bg-active text-on-active" : "border-border-strong")}>{on ? <Check className="size-3.5" /> : null}</span>
                </button>
              </li>
            );
          })
        ) : (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">কাউকে পাওয়া যায়নি।</li>
        )}
      </ul>
    </div>
  );
}
