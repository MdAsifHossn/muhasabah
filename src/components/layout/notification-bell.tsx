"use client";

import { Bell, CheckCheck, Flame, Megaphone, MessageCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toBanglaDigits } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Item = { id: string; kind: "MESSAGE" | "NOTICE" | "STREAK"; title: string; body: string; href: string; readAt: string | null; createdAt: string };

const ICONS = {
  MESSAGE: { icon: MessageCircle, tone: "bg-cat-quran/15 text-cat-quran" },
  NOTICE: { icon: Megaphone, tone: "bg-warning/15 text-warning" },
  STREAK: { icon: Flame, tone: "bg-cat-service/15 text-cat-service" },
} as const;

function ago(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "এইমাত্র";
  if (minutes < 60) return `${toBanglaDigits(minutes)} মিনিট আগে`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${toBanglaDigits(hours)} ঘণ্টা আগে`;
  return `${toBanglaDigits(Math.round(hours / 24))} দিন আগে`;
}

/** Header bell: unread badge, latest notifications, tap to open + mark read. Polls every minute. */
export function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { items: Item[]; unread: number };
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      /* offline — keep what we have */
    }
  }, []);

  // Reload on every navigation (e.g. opening a chat thread marks its notification read).
  useEffect(() => {
    void load();
  }, [load, pathname, search]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 60000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  async function post(payload: { id?: string; all?: boolean }) {
    try {
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } catch {
      /* best effort */
    }
  }

  function openItem(item: Item) {
    setOpen(false);
    if (!item.readAt) {
      setItems((list) => list.map((entry) => (entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry)));
      setUnread((count) => Math.max(0, count - 1));
      void post({ id: item.id });
    }
    router.push(item.href);
  }

  function readAll() {
    setItems((list) => list.map((entry) => ({ ...entry, readAt: entry.readAt ?? new Date().toISOString() })));
    setUnread(0);
    void post({ all: true });
  }

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) void load(); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread ? `${toBanglaDigits(unread)}টি অপঠিত নোটিফিকেশন` : "নোটিফিকেশন"}
          className="relative grid size-10 place-items-center rounded-lg border border-hairline bg-surface text-muted-foreground transition hover:text-foreground"
        >
          <Bell className="size-[18px]" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 grid min-w-[1.15rem] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-[1.15rem] text-white ring-2 ring-background">
              {unread > 9 ? "৯+" : toBanglaDigits(unread)}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <p className="text-sm font-bold">নোটিফিকেশন</p>
          <button type="button" onClick={readAll} disabled={unread === 0} className="inline-flex items-center gap-1 text-xs font-semibold text-primary disabled:opacity-40">
            <CheckCheck className="size-3.5" /> সব পড়া হয়েছে
          </button>
        </div>
        <ul className="max-h-[22rem] overflow-y-auto overscroll-contain">
          {items.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">কোনো নোটিফিকেশন নেই</li>
          ) : (
            items.map((item) => {
              const meta = ICONS[item.kind] ?? ICONS.NOTICE;
              return (
                <li key={item.id}>
                  <button type="button" onClick={() => openItem(item)} className={cn("flex w-full items-start gap-3 border-b border-hairline px-4 py-3 text-left transition last:border-0 hover:bg-muted/60", !item.readAt && "bg-primary-soft/50")}>
                    <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg", meta.tone)}>
                      <meta.icon className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={cn("text-sm leading-snug", item.readAt ? "font-medium" : "font-bold")}>{item.title}</span>
                        {!item.readAt ? <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-danger" /> : null}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.body}</span>
                      <span className="mt-1 block text-[11px] text-subtle-foreground">{ago(item.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
