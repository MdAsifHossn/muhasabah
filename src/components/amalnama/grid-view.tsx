import type { AmalCategory, AmalInputType, Role, Weekday } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";
import { CalendarDays, MessageSquareText, NotebookPen } from "lucide-react";
import Link from "next/link";

import { CommentDeleteButton, CommentForm } from "@/components/amalnama/comment-form";
import { DailyEntryActions } from "@/components/amalnama/daily-entry-actions";
import { toBn } from "@/components/amalnama/report-data";
import { cn } from "@/lib/utils";

/**
 * Paper-style Amalnama grid: amal names down the left (sticky), one column per
 * Bangladesh day, a "মিস" column on the right and a per-day completion footer.
 *
 * Cell states:
 * - done    ✓ (numeric amals show the recorded value)
 * - partial value in amber (some of the target)
 * - missed  ✗
 * - noEntry · nothing recorded that day (a missed DAY, not a missed amal)
 * - exempt  — মাসিকের দিনে প্রযোজ্য নয়
 * - offDay  blank — not applicable that day (e.g. a Friday-only amal)
 */

export const GRID_RANGE_OPTIONS = [
  { key: "1", label: "১ দিন" },
  { key: "7", label: "৭ দিন" },
  { key: "30", label: "৩০ দিন" },
  { key: "40", label: "৪০ দিন" },
  { key: "all", label: "সব সময়" },
] as const;

export type GridRangeKey = (typeof GRID_RANGE_OPTIONS)[number]["key"];

export function parseGridDays(value: string | string[] | undefined): GridRangeKey {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && GRID_RANGE_OPTIONS.some((option) => option.key === raw) ? (raw as GridRangeKey) : "7";
}

export const weekdayShortLabels: Record<Weekday, string> = {
  SUNDAY: "রবি",
  MONDAY: "সোম",
  TUESDAY: "মঙ্গল",
  WEDNESDAY: "বুধ",
  THURSDAY: "বৃহ",
  FRIDAY: "শুক্র",
  SATURDAY: "শনি",
};

export type GridViewItem = {
  id: string;
  titleBn: string;
  category: AmalCategory;
  inputType: AmalInputType;
  targetValue: number | null;
  unit: string | null;
  points: number;
  specificDay: Weekday | null;
};

export type GridCellState = "done" | "partial" | "missed" | "noEntry" | "exempt" | "offDay";
export type GridCell = { state: GridCellState; display: string; title?: string };

export type GridColumn = {
  key: string;
  dayNumber: string;
  weekday: string;
  monthKey: string;
  monthLabel: string;
  fullLabel: string;
  isPeriodDay: boolean;
  isToday: boolean;
  isFriday: boolean;
  hasEntry: boolean;
  percent: number | null;
  entryId: string | null;
};

export type GridComment = { id: string; comment: string; createdAt: Date; authorId: string; author: { name: string; role: Role } };

export type GridRow = { item: GridViewItem; cells: GridCell[]; missedCount: number; doneCount: number };

export type GridSummary = {
  totalDays: number;
  enteredDays: number;
  completed: number;
  missed: number;
  noEntryDays: number;
  percent: number;
  periodDays: number;
  topMissed: Array<{ titleBn: string; count: number }>;
};

export function GridRangeChips({ active, memberId }: { active: GridRangeKey; memberId?: string }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="সময় পরিসীমা">
      {GRID_RANGE_OPTIONS.map((option) => (
        <Link
          key={option.key}
          href={`/dashboard/amalnama/grid?days=${option.key}${memberId ? `&member=${memberId}` : ""}`}
          aria-current={active === option.key ? "true" : undefined}
          className={cn(
            "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
            active === option.key
              ? "border-primary bg-primary text-on-primary shadow-sm"
              : "border-hairline-strong bg-surface text-muted-foreground hover:border-primary hover:text-primary",
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

function CellContent({ cell }: { cell: GridCell }) {
  if (cell.state === "done" || cell.state === "partial") {
    const [value, unit] = cell.display.split("\n");
    return (
      <span className="flex flex-col items-center justify-center leading-none" title={cell.title}>
        <span className={cn("text-sm font-bold", cell.state === "done" ? "text-success" : "text-warning")}>{value}</span>
        {unit ? <span className="mt-0.5 text-[9px] font-semibold text-subtle-foreground">{unit}</span> : null}
      </span>
    );
  }
  if (cell.state === "missed") return <span className="text-sm font-bold text-danger">✗</span>;
  if (cell.state === "exempt") return <span className="text-sm font-bold text-female">—</span>;
  if (cell.state === "noEntry") return <span className="text-base font-bold text-subtle-foreground">·</span>;
  return null;
}

const cellTone: Record<GridCellState, string> = {
  done: "bg-success-soft",
  partial: "bg-warning-soft",
  missed: "bg-danger-soft",
  exempt: "bg-female-soft",
  noEntry: "bg-surface-sunken/60",
  offDay: "bg-surface",
};

function SummaryStat({ label, value, note, tone }: { label: string; value: string; note?: string; tone: "primary" | "danger" | "gold" | "muted" | "female" }) {
  const tones = {
    primary: "bg-primary-soft text-primary-soft-foreground",
    danger: "bg-danger-soft text-danger",
    gold: "bg-gold-soft text-gold-foreground",
    muted: "bg-surface-sunken text-foreground",
    female: "bg-female-soft text-female",
  } as const;
  return (
    <div className={cn("rounded-2xl px-3 py-3", tones[tone])}>
      <p className="text-[11px] font-semibold leading-4 opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      {note ? <p className="mt-0.5 text-[10px] leading-4 opacity-75">{note}</p> : null}
    </div>
  );
}

export function GridLegend() {
  const item = (swatch: React.ReactNode, label: string, tone: string) => (
    <li className="flex items-center gap-1.5">
      <span className={cn("grid size-5 place-items-center rounded text-[11px] font-bold", tone)}>{swatch}</span>
      {label}
    </li>
  );
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-muted-foreground">
      {item("✓", "সম্পন্ন", "bg-success-soft text-success")}
      {item("৩", "আংশিক", "bg-warning-soft text-warning")}
      {item("✗", "মিস", "bg-danger-soft text-danger")}
      {item("—", "ওজরের দিনে প্রযোজ্য নয়", "bg-female-soft text-female")}
      {item("·", "এন্ট্রি নেই", "bg-surface-sunken text-subtle-foreground")}
      {item("", "এই দিনে প্রযোজ্য নয়", "border border-hairline bg-surface")}
    </ul>
  );
}

export function GridView({
  memberName,
  memberGender,
  rangeLabel,
  windowLabel,
  truncatedNote,
  columns,
  rows,
  summary,
  isSelf,
  memberId,
  comments,
  canComment,
  viewerId,
  canManage,
}: {
  memberName: string;
  memberGender: string;
  rangeLabel: string;
  windowLabel: string;
  truncatedNote: string | null;
  columns: GridColumn[];
  rows: GridRow[];
  summary: GridSummary;
  isSelf: boolean;
  memberId: string;
  comments: GridComment[];
  canComment: boolean;
  viewerId: string;
  canManage: boolean;
}) {
  const monthBands: Array<{ key: string; label: string; span: number }> = [];
  for (const column of columns) {
    const last = monthBands[monthBands.length - 1];
    if (last && last.key === column.monthKey) last.span += 1;
    else monthBands.push({ key: column.monthKey, label: column.monthLabel, span: 1 });
  }

  return (
    <div className="space-y-4 pb-20 sm:pb-0">
      <section className="surface rounded-card p-4 sm:p-5" aria-label="সারসংক্ষেপ">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <CalendarDays className="size-4 text-primary" /> সারসংক্ষেপ
          </h2>
          <p className="text-xs font-medium text-muted-foreground">
            {rangeLabel} • {windowLabel}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryStat label="সম্পন্নতা" value={`${toBn(summary.percent)}%`} tone="primary" />
          <SummaryStat label="সম্পন্ন আমল" value={toBn(summary.completed)} tone="primary" />
          <SummaryStat label="মিস আমল" value={toBn(summary.missed)} tone="danger" />
          <SummaryStat label="এন্ট্রি দেওয়া দিন" value={`${toBn(summary.enteredDays)}/${toBn(summary.totalDays)}`} tone="gold" />
          <SummaryStat label="এন্ট্রি নেই" value={`${toBn(summary.noEntryDays)} দিন`} tone="muted" />
          {memberGender === "FEMALE" ? <SummaryStat label="শরয়ী ওজরের দিন" value={toBn(summary.periodDays)} note="নামাজ/রোজা গণনার বাইরে" tone="female" /> : null}
        </div>
        <div className="mt-3 min-w-0 overflow-hidden rounded-xl bg-surface-sunken p-3">
          <p className="text-xs font-bold text-muted-foreground">সবচেয়ে বেশি মিস</p>
          {summary.topMissed.length === 0 ? (
            <p className="mt-1.5 text-sm font-semibold text-success">এই সময়ে কোনো আমল মিস হয়নি। আলহামদুলিল্লাহ!</p>
          ) : (
            <ul className="mt-1.5 grid min-w-0 grid-cols-1 gap-1.5 sm:grid-cols-2">
              {summary.topMissed.map((row) => (
                <li key={row.titleBn} className="flex min-w-0 max-w-full items-center justify-between gap-2 text-sm text-foreground">
                  <span className="min-w-0 flex-1 truncate">{row.titleBn}</span>
                  <span className="max-w-[42%] shrink-0 truncate rounded-full bg-danger-soft px-2 py-0.5 text-xs font-bold text-danger">{toBn(row.count)} দিন</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <GridLegend />

      <div className="overflow-x-auto overscroll-x-contain rounded-card border border-hairline bg-surface shadow-card">
        <table className="w-max border-collapse text-sm">
          <caption className="sr-only">{`${memberName} — ${rangeLabel} আমলনামা`}</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-20 w-[150px] min-w-[150px] border-b border-hairline bg-surface-sunken px-3 py-1.5 text-left text-[11px] font-bold text-muted-foreground sm:w-[220px] sm:min-w-[220px]">
                আমল
              </th>
              {monthBands.map((band) => (
                <th key={band.key} colSpan={band.span} scope="colgroup" className="border-b border-l border-hairline bg-surface-sunken px-2 py-1 text-center text-[11px] font-bold text-muted-foreground">
                  {band.label}
                </th>
              ))}
              <th scope="col" className="border-b border-l border-hairline bg-surface-sunken px-2 py-1 text-center text-[11px] font-bold text-muted-foreground">
                মিস
              </th>
            </tr>
            <tr>
              <th scope="col" className="sticky left-0 z-20 w-[150px] min-w-[150px] border-b-2 border-hairline bg-surface px-3 py-2 text-left text-xs font-bold text-foreground sm:w-[220px] sm:min-w-[220px]">
                {memberName}
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  title={`${column.fullLabel}${column.isPeriodDay ? " — শরয়ী ওজরের দিন" : ""}`}
                  className={cn(
                    "h-12 w-11 min-w-11 border-b-2 border-l border-hairline px-0 py-1 text-center align-middle",
                    column.isPeriodDay ? "bg-female-soft" : column.isToday ? "bg-gold-soft" : column.isFriday ? "bg-primary-soft" : "bg-surface",
                  )}
                >
                  <span className={cn("block text-xs font-bold leading-4", column.isToday ? "text-gold-foreground" : "text-foreground")}>{column.dayNumber}</span>
                  <span className={cn("block text-[9px] font-semibold leading-3", column.isFriday ? "text-primary" : "text-subtle-foreground")}>{column.weekday}</span>
                  {canManage ? <DailyEntryActions entryId={column.entryId} memberId={memberId} dateKey={column.key} /> : null}
                </th>
              ))}
              <th scope="col" className="border-b-2 border-l border-hairline bg-surface px-2 py-2 text-center text-[10px] font-bold text-muted-foreground">
                মোট
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.item.id}>
                <th scope="row" className="sticky left-0 z-10 w-[150px] min-w-[150px] max-w-[150px] border-b border-hairline bg-surface px-3 py-1.5 text-left align-middle sm:w-[220px] sm:min-w-[220px] sm:max-w-[220px]">
                  <span className="line-clamp-2 text-xs font-semibold leading-4 text-foreground">{row.item.titleBn}</span>
                  <span className="block truncate text-[10px] leading-4 text-subtle-foreground">
                    {row.item.specificDay === "FRIDAY" ? "শুধু শুক্রবার • " : ""}
                    {row.item.targetValue ? `লক্ষ্য ${toBn(row.item.targetValue)} ${row.item.unit ?? ""}` : `+${toBn(row.item.points)} পয়েন্ট`}
                  </span>
                </th>
                {row.cells.map((cell, index) => (
                  <td key={`${row.item.id}-${columns[index].key}`} className={cn("h-11 w-11 min-w-11 border-b border-l border-hairline text-center align-middle", cellTone[cell.state])} title={cell.title}>
                    <CellContent cell={cell} />
                  </td>
                ))}
                <td className="min-w-14 border-b border-l border-hairline px-2 text-center align-middle">
                  {row.missedCount > 0 ? (
                    <span className="inline-flex rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold text-danger">{toBn(row.missedCount)}</span>
                  ) : row.doneCount > 0 ? (
                    <span className="text-xs font-bold text-success">✓</span>
                  ) : (
                    <span className="text-[11px] text-subtle-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="sticky left-0 z-10 w-[150px] min-w-[150px] border-t-2 border-hairline bg-surface-sunken px-3 py-2 text-left text-[11px] font-bold text-muted-foreground sm:w-[220px] sm:min-w-[220px]">
                দিনের সম্পন্নতা
              </th>
              {columns.map((column) => (
                <td
                  key={`foot-${column.key}`}
                  className={cn(
                    "h-9 w-11 min-w-11 border-l border-t-2 border-hairline text-center align-middle text-[10px] font-bold",
                    column.percent === null
                      ? "bg-surface-sunken text-subtle-foreground"
                      : column.percent >= 80
                        ? "bg-success-soft text-success"
                        : column.percent >= 40
                          ? "bg-warning-soft text-warning"
                          : "bg-danger-soft text-danger",
                  )}
                >
                  {column.percent === null ? "·" : `${toBn(column.percent)}%`}
                </td>
              ))}
              <td className="border-l border-t-2 border-hairline bg-surface-sunken px-2 text-center text-[11px] font-bold text-foreground">{toBn(summary.percent)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {truncatedNote ? <p className="rounded-xl border border-dashed border-hairline-strong px-3 py-2 text-center text-xs text-muted-foreground">{truncatedNote}</p> : null}

      {comments.length > 0 || canComment ? (
        <section className="surface space-y-3 rounded-card border border-hairline p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <MessageSquareText className="size-4 text-primary" /> উস্তাদজির মন্তব্য ({toBn(comments.length)})
          </h2>
          {comments.length === 0 ? <p className="text-xs text-muted-foreground">এখনো কোনো মন্তব্য নেই।</p> : null}
          <div className="space-y-2">
            {comments.map((item) => (
              <div key={item.id} className="rounded-xl bg-gold-soft px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{item.comment}</p>
                  {item.authorId === viewerId || canManage ? <CommentDeleteButton commentId={item.id} /> : null}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{item.author.name} ({item.author.role === "USTADH" ? "উস্তাদজি" : "সদস্য"}) • {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: bn })}</p>
              </div>
            ))}
          </div>
          {canComment ? <CommentForm memberId={memberId} memberName={memberName} /> : null}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {isSelf ? (
          <Link href="/dashboard/amalnama" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary">
            <NotebookPen className="size-4" /> আজকের আমলনামা
          </Link>
        ) : null}
        {canManage && !isSelf ? <Link href={`/dashboard/amalnama?member=${memberId}`} className="inline-flex h-11 items-center gap-2 rounded-xl border border-hairline-strong bg-surface px-4 text-sm font-semibold text-foreground"><NotebookPen className="size-4" /> আজকের আমল সম্পাদনা</Link> : null}
      </div>
    </div>
  );
}
