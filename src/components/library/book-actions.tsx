"use client";

import { Bookmark, Share2 } from "lucide-react";
import { toast } from "sonner";

import { useSavedBooks } from "@/components/library/saved-books";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** "পরে পড়ব" toggle. `compact` = round icon button for cards. */
export function SaveBookButton({ id, compact = false, className }: { id: number; compact?: boolean; className?: string }) {
  const [saved, toggle] = useSavedBooks();
  const active = saved.includes(id);
  const onClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const added = toggle(id);
    toast.success(added ? "পরে পড়ার তালিকায় রাখা হয়েছে" : "তালিকা থেকে সরানো হয়েছে");
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={active ? "পরে পড়ার তালিকা থেকে সরান" : "পরে পড়ব"}
        className={cn(
          "grid size-9 place-items-center rounded-full border bg-card/90 shadow-sm backdrop-blur transition active:scale-95",
          active ? "text-gold" : "text-muted-foreground hover:text-foreground",
          className,
        )}
      >
        <Bookmark className={cn("size-4", active && "fill-current")} />
      </button>
    );
  }
  return (
    <Button type="button" variant="outline" size="lg" onClick={onClick} aria-pressed={active} className={cn(active && "border-gold/50 text-gold", className)}>
      <Bookmark className={cn("size-[18px]", active && "fill-current")} />
      {active ? "তালিকায় আছে" : "পরে পড়ব"}
    </Button>
  );
}

export function ShareBookButton({ title, className }: { title: string; className?: string }) {
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title} — কিতাবখানা`, url });
      } catch {
        /* user cancelled */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("লিংক কপি হয়েছে");
    } catch {
      toast.error("কপি করা যায়নি");
    }
  }
  return (
    <Button type="button" variant="ghost" size="lg" onClick={share} className={className}>
      <Share2 className="size-[18px]" /> শেয়ার
    </Button>
  );
}
