"use client";

import { Bookmark, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { sectionHref } from "@/components/hadith/library-widgets";
import { useBookmarks } from "@/components/hadith/use-hadith-storage";
import { EmptyState } from "@/components/design/empty-state";
import { Button } from "@/components/ui/button";
import { bn, getBook } from "@/lib/hadith";

const noop = () => () => {};

export function BookmarksList() {
  const { bookmarks, toggle } = useBookmarks();
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  if (!mounted) return <div className="h-40 animate-pulse rounded-card bg-surface-sunken" />;
  if (!bookmarks.length)
    return (
      <EmptyState
        icon={Bookmark}
        title="এখনও কোনো হাদীস সংরক্ষণ করেননি"
        description="পড়ার সময় হাদীসের নিচে “বুকমার্ক” চাপুন — এখানে জমা থাকবে (এই ডিভাইসে)।"
        action={
          <Button asChild>
            <Link href="/dashboard/hadith">লাইব্রেরিতে যান</Link>
          </Button>
        }
      />
    );

  return (
    <ul className="space-y-3">
      {bookmarks.map((item) => {
        const book = getBook(item.book);
        return (
          <li key={`${item.book}-${item.number}`} className="surface flex items-start gap-3 rounded-card p-4">
            <Link href={sectionHref(item.book, item.section, item.number)} className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-md bg-primary px-2 py-0.5 text-on-primary">{bn(item.number)}</span>
                <span className="text-primary">{book?.nameBn ?? item.book}</span>
              </span>
              <span className="mt-2 line-clamp-3 block text-sm leading-6 text-foreground">{item.preview}</span>
            </Link>
            <button
              type="button"
              aria-label="বুকমার্ক সরান"
              onClick={() => toggle(item)}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
