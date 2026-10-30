import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";
import { Pin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { roleLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type NoticeView = {
  id: string;
  title: string;
  body: string;
  audience: "ALL" | "MALE" | "FEMALE";
  pinned: boolean;
  createdAt: Date;
  author: { name: string; role: "MEMBER" | "USTADH" | "ADMIN" };
};

/** One notice-board post (read-only). `compact` clamps the body for the home page. */
export function NoticeCard({ notice, compact = false }: { notice: NoticeView; compact?: boolean }) {
  return (
    <article className={cn("rounded-2xl border p-4", notice.pinned ? "border-gold/40 bg-gold-soft/60" : "border-hairline bg-surface")}>
      <div className="flex flex-wrap items-center gap-1.5">
        {notice.pinned ? (
          <Badge variant="gold">
            <Pin className="size-3" /> পিন করা
          </Badge>
        ) : null}
        {notice.audience === "MALE" ? <Badge variant="info">ভাইদের জন্য</Badge> : null}
        {notice.audience === "FEMALE" ? <Badge variant="female">বোনদের জন্য</Badge> : null}
        <span className="ml-auto text-[11px] text-muted-foreground">{formatDistanceToNow(notice.createdAt, { addSuffix: true, locale: bn })}</span>
      </div>
      <h3 className="mt-2 text-[15px] font-bold leading-6 text-foreground">{notice.title}</h3>
      <p className={cn("mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground", compact && "line-clamp-3")}>{notice.body}</p>
      <p className="mt-2 text-[11px] font-medium text-subtle-foreground">
        — {notice.author.name} ({roleLabels[notice.author.role]})
      </p>
    </article>
  );
}
