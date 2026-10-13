import { TZDate } from "@date-fns/tz";
import type { AmalCategory, AmalInputType, Weekday } from "@prisma/client";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { CalendarDays, Grid3x3 } from "lucide-react";
import Link from "next/link";

import { roleLabels } from "@/lib/constants";
import { APP_TIME_ZONE } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Paper-style Amalnama grid (`/dashboard/amalnama/grid`): amal names down the
 * left, DATE COLUMNS across the top, one cell per (amal, day) and a right-hand
 * "মিস" column — exactly like the mosque's printed form, with a সারসংক্ষেপ
 * panel on top.
 *
 * Cell states:
 * - `done`    → ✓ (emerald); numeric amals show the value in Bengali digits
 * - `partial` → the value (amber) — some but not all of the target
 * - `missed`  → applicable but not done (warm red tint)
 * - `noEntry` → the member recorded nothing that day (grey hatch — NOT a miss)
 * - `exempt`  → "—" the day is a period day and this amal does not apply
 * - `offDay`  → "·" this amal is only for another weekday (e.g. শুক্রবার)
 * - `future`  → dimmed, not counted
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

const bnNumber = new Intl.NumberFormat("bn-BD");
const toBn = (value: number) => bnNumber.format(Math.round(value * 100) / 100);

export type GridViewItem = {
  id: string;
  titleBn: string;
  category: AmalCategory;
  inputType: AmalInputType;
  targetValue: number | null;
  unit: string | null;
  points: number;
};

export type GridCellState = "done" | "partial" | "missed" | "noEntry" | "exempt" | "offDay" | "future";

export type GridCell = { state: GridCellState; display: string; title?: string };

export type GridColumn = {
  key: string;
  date: Date;
  dayNumber: string;
  weekday: string;
  monthKey: string;
  monthLabel: string;
  isPeriodDay: boolean;
  isToday: boolean;
  isFuture: boolean;
  percent: number | null;
};

export type GridRow = {
  item: GridViewItem;
  cells: GridCell[];
  missedCount: number;
  doneCount: number;
};

export type GridSummary = {
  dayCount: number;
  completed: number;
  missed: number;
  noEntryCells: number;
  percent: number;
  periodDays: number;
  topMissed: Array<{ titleBn: string; count: number }>;
};

export type GridViewProps = {
  member: { id: string; name: string; role: string };
  range: GridRangeKey;
  rangeLabel: string;
  windowLabel: string;
  truncatedNote: string | null;
  columns: GridColumn[];
  rows: GridRow[];
  summary: GridSummary;
  /** Ustadh/Admin viewing a member may jump to the comment list. */
  commentsHref: string | null;
  isSelf: boolean;
};

/* ── Range chips (plain links, server rendered) ─────────────────────────── */
export function GridRangeChips({ active, memberId }: { active: GridRangeKey; memberId?: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="সময় পরিসীমা নির্বাচন করুন">
      {GRID_RANGE_OPTIONS.map((option) => (
        <Link
          key={option.key}
          href={`/dashboard/amalnama/grid?days=${option.key}${memberId ? `&member=${memberId}` : ""}`}
          aria-current={active === option.key ? "true" : undefined}
          className={cn(
            "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
            active === option.key
              ? "border-emerald-950 bg-emerald-950 text-white shadow-sm"
              : "border-stone-300 bg-white text-stone-600 hover:border-emerald-700 hover:text-emerald-800",
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

/* ── Cell rendering ─────────────────────────────────────────────────────── */

const cellBase = "h-11 w-[44px] min-w-[44px] border-l border-stone-100 text-center align-middle";

function CellContent({ cell }: { cell: GridCell }) {
  if (cell.state === "done" || cell.state === "partial") {
    const [value, unit] = cell.display.split("\n");
    return (
      <span className="flex flex-col items-center justify-center leading-none" title={cell.title}>
        <span className={cn("text-sm font-bold", cell.state === "done" ? "text-emerald-800" : "text-amber-700")}>{value}</span>
        {unit ? <span className="mt-0.5 text-[9px] font-semibold text-stone-400">{unit}</span> : null}
      </span>
    );
  }
  if (cell.state === "missed") return <span className="text-sm font-bold text-red-400">✗</span>;
  if (cell.state === "exempt") return <span className="text-sm font-bold text-stone-400">—</span>;
  if (cell.state === "offDay") return <span className="text-xs text-stone-300">·</span>;
  return null; // noEntry / future → hatch / dimmed background only
}

function cellClass(state: GridCellState) {
  if (state === "done") return "bg-emerald-50";
  if (state === "partial") return "bg-amber-50";
  if (state === "missed") return "bg-red-50/70";
  if (state === "exempt") return "bg-stone-50";
  if (state === "offDay") return "bg-white text-stone-300";
  if (state === "future") return "bg-white/50 opacity-60";
  // noEntry: grey hatch so it is never confused with a missed amal
  return "bg-white";
}

const hatchStyle: React.CSSProperties = {
  backgroundImage: "radial-gradient(circle at 1px 1px, rgb(214 213 210) 1px, transparent 0)",
  backgroundSize: "5px 5px",
};

/* ── Summary panel ──────────────────────────────────────────────────────── */

function SummaryStat({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "emerald" | "red" | "amber" | "stone" | "rose" }) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    red: "border-red-200 bg-red-50 text-red-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    stone: "border-stone-200 bg-stone-50 text-stone-700",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
  } as const;
  return (
    <div className={cn("rounded-2xl border px-3 py-3", tones[tone ?? "stone"])}>
      <p className="text-[11px] font-semibold leading-4 opacity-80">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
      {note ? <p className="mt-0.5 text-[10px] leading-4 opacity-70">{note}</p> : null}
    </div>
  );
}

/* ── The grid ───────────────────────────────────────────────────────────── */

export function GridView({
  member,
  rangeLabel,
  windowLabel,
  truncatedNote,
  columns,
  rows,
  summary,
  commentsHref,
  isSelf,
}: GridViewProps) {
  // Month band above the date row (grouping consecutive same-month columns).
  const monthBands: Array<{ key: string; label: string; span: number }> = [];
  for (const column of columns) {
    const last = monthBands[monthBands.length - 1];
    if (last && last.key === column.monthKey) last.span += 1;
    else monthBands.push({ key: column.monthKey, label: column.monthLabel, span: 1 });
  }

  return (
    <div className="space-y-4">
      {/* ── সারসংক্ষেপ ─────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5" aria-label="সারসংক্ষেপ">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-stone-500">
            <CalendarDays className="size-4 text-emerald-700" /> সারসংক্ষেপ
          </h2>
          <p className="text-xs font-semibold text-stone-400">
            {rangeLabel} • {windowLabel}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryStat label="প্রযোজ্য আমল-দিন" value={toBn(summary.dayCount)} tone="stone" />
          <SummaryStat label="সম্পন্ন" value={toBn(summary.completed)} tone="emerald" />
          <SummaryStat label="মিস" value={toBn(summary.missed)} tone="red" />
          <SummaryStat label="এন্ট্রি নেই" value={toBn(summary.noEntryCells)} note="কোনো তথ্য দেওয়া হয়নি" tone="stone" />
          <SummaryStat label="সম্পন্নতা" value={`${toBn(summary.percent)}%`} tone="amber" />
          <SummaryStat label="মাসিকের দিন" value={toBn(summary.periodDays)} note="এই দিনে নামাজ/রোজা বাদ" tone="rose" />
        </div>

        <div className="mt-3 rounded-xl border border-stone-100 bg-stone-50 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-400">সবচেয়ে বেশি মিস</p>
          {summary.topMissed.length === 0 ? (
            <p className="mt-1.5 text-sm font-semibold text-emerald-700">এই সময়ে কোনো আমল পুরোপুরি বাদ যায়নি।</p>
          ) : (
            <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
              {summary.topMissed.map((row) => (
                <li key={row.titleBn} className="flex items-center justify-between gap-2 text-sm text-stone-700">
                  <span className="min-w-0 truncate">{row.titleBn}</span>
                  <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">{toBn(row.count)} দিন মিস</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Legend ─────────────────────────────────────────────────── */}
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-stone-500">
        <li className="flex items-center gap-1.5"><span className="grid size-5 place-items-center rounded bg-emerald-50 text-emerald-700">✓</span> সম্পন্ন</li>
        <li className="flex items-center gap-1.5"><span className="grid size-5 place-items-center rounded bg-amber-50 text-[10px] font-black text-amber-700">৩</span> আংশিক (মান দেওয়া হয়েছে)</li>
        <li className="flex items-center gap-1.5"><span className="grid size-5 place-items-center rounded bg-red-50/70 text-red-400">✗</span> মিস</li>
        <li className="flex items-center gap-1.5"><span className="grid size-5 place-items-center rounded border border-stone-200 bg-white" style={hatchStyle} /> এন্ট্রি নেই</li>
        <li className="flex items-center gap-1.5"><span className="grid size-5 place-items-center rounded bg-stone-50 text-stone-400">—</span> মাসিকে প্রযোজ্য নয়</li>
        <li className="flex items-center gap-1.5"><span className="grid size-5 place-items-center rounded bg-white text-stone-300">·</span> সাপ্তাহিক আমল, এই দিনে নয়</li>
      </ul>

      {/* ── The paper grid ─────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-max border-collapse text-sm">
          <caption className="sr-only">{`${member.name} — ${rangeLabel} আমলনামা`}</caption>
          <thead>
            {/* Month band */}
            <tr>
              <th scope="col" className="sticky left-0 z-20 min-w-[190px] border-b border-stone-200 bg-stone-50 px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
                আমল
              </th>
              {monthBands.map((band) => (
                <th key={band.key} colSpan={band.span} scope="colgroup" className="border-b border-l border-stone-200 bg-stone-50 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-stone-500">
                  {band.label}
                </th>
              ))}
              <th scope="col" className="sticky right-0 z-20 min-w-[64px] border-b border-l border-stone-200 bg-stone-50 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-stone-400">
                মিস
              </th>
            </tr>
            {/* Date row */}
            <tr>
              <th scope="col" className="sticky left-0 z-20 min-w-[190px] border-b-2 border-stone-200 bg-white px-3 py-2 text-left text-xs font-bold text-emerald-950">
                {member.name} <span className="font-medium text-stone-400">({roleLabels[member.role as keyof typeof roleLabels] ?? member.role})</span>
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  title={`${format(new TZDate(column.date, APP_TIME_ZONE), "d MMMM yyyy", { locale: bn })}${column.isPeriodDay ? " — মাসিকের দিন" : ""}`}
                  className={cn(
                    "h-12 w-[44px] min-w-[44px] border-b-2 border-l border-stone-200 px-0 py-1 text-center align-middle",
                    column.isPeriodDay ? "bg-rose-50" : column.isToday ? "bg-amber-50" : "bg-white",
                  )}
                >
                  <span className={cn("block text-[11px] font-black leading-4", column.isToday ? "text-amber-700" : "text-stone-700")}>{column.dayNumber}</span>
                  <span className="block text-[9px] font-semibold leading-3 text-stone-400">{column.weekday}</span>
                  {column.isPeriodDay ? <span className="mt-0.5 block text-[8px] font-bold leading-3 text-rose-600">মাসিক</span> : null}
                </th>
              ))}
              <th scope="col" className="sticky right-0 z-20 min-w-[64px] border-b-2 border-l border-stone-200 bg-white px-2 py-2 text-center text-[10px] font-bold text-stone-400">
                মোট মিস
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.item.id} className="group">
                <th
                  scope="row"
                  className="sticky left-0 z-10 min-w-[190px] max-w-[190px] border-b border-stone-100 bg-white px-3 py-1.5 text-left align-middle group-hover:bg-emerald-50/40"
                >
                  <span className="block truncate text-xs font-semibold leading-4 text-stone-800">{row.item.titleBn}</span>
                  <span className="block truncate text-[10px] leading-3.5 text-stone-400">
                    +{toBn(row.item.points)} পয়েন্ট
                    {row.item.targetValue ? ` • লক্ষ্য ${toBn(row.item.targetValue)}${row.item.unit ? ` ${row.item.unit}` : ""}` : ""}
                  </span>
                </th>
                {row.cells.map((cell, index) => (
                  <td
                    key={`${row.item.id}-${columns[index].key}`}
                    className={cn(cellBase, cellClass(cell.state), columns[index].isPeriodDay && cell.state !== "noEntry" && "ring-1 ring-inset ring-rose-100")}
                    style={cell.state === "noEntry" ? hatchStyle : undefined}
                    title={cell.title}
                  >
                    <CellContent cell={cell} />
                  </td>
                ))}
                <td className="sticky right-0 z-10 min-w-[64px] border-b border-l border-stone-100 bg-white px-2 py-1.5 text-center align-middle">
                  {row.missedCount > 0 ? (
                    <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">{toBn(row.missedCount)}</span>
                  ) : row.doneCount > 0 ? (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">✓</span>
                  ) : (
                    <span className="text-[10px] font-semibold text-stone-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>

          {/* Per-day completion */}
          <tfoot>
            <tr>
              <th scope="row" className="sticky left-0 z-10 min-w-[190px] border-t-2 border-stone-200 bg-stone-50 px-3 py-2 text-left text-[11px] font-bold text-stone-500">
                দিনভিত্তিক সম্পন্নতা
              </th>
              {columns.map((column) => (
                <td
                  key={`foot-${column.key}`}
                  className={cn(
                    "h-9 w-[44px] min-w-[44px] border-l border-t-2 border-stone-200 text-center align-middle text-[10px] font-bold",
                    column.isPeriodDay ? "bg-rose-50 text-rose-500" : column.percent === null ? "bg-stone-50 text-stone-300" : column.percent >= 100 ? "bg-emerald-50 text-emerald-700" : column.percent > 0 ? "bg-amber-50 text-amber-700" : "bg-red-50/70 text-red-400",
                  )}
                >
                  {column.percent === null ? "·" : `${toBn(column.percent)}%`}
                </td>
              ))}
              <td className="sticky right-0 z-10 min-w-[64px] border-l border-t-2 border-stone-200 bg-stone-50 px-2 text-center text-[10px] font-bold text-stone-500">
                {toBn(summary.percent)}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {truncatedNote ? (
        <p className="rounded-xl border border-dashed border-stone-200 px-3 py-2 text-center text-xs text-stone-400">{truncatedNote}</p>
      ) : null}

      {/* ── Related links (comments stay on the list page) ─────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
        <p className="text-xs leading-5 text-stone-500">
          <Grid3x3 className="mr-1 inline size-3.5 text-emerald-700" />
          {isSelf
            ? "প্রতিদিনের আমল পূরণ করতে “আজকের আমলনামা” পেজে যান; উস্তাদের মন্তব্য তালিকা পেজে দেখা যাবে।"
            : "মন্তব্য রাখতে বা পড়তে আমলনামা তালিকা পেজে যান — সেখানে এই সদস্যের উস্তাদের মন্তব্য রাখা যাবে।"}
        </p>
        <div className="flex flex-wrap gap-2">
          {isSelf ? (
            <Link href="/dashboard/amalnama" className="inline-flex h-10 items-center rounded-xl border border-emerald-900 bg-emerald-950 px-4 text-sm font-bold text-white">
              আজকের আমলনামা
            </Link>
          ) : null}
          {commentsHref ? (
            <Link href={commentsHref} className="inline-flex h-10 items-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:border-emerald-700 hover:text-emerald-800">
              উস্তাদের মন্তব্য দেখুন
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
