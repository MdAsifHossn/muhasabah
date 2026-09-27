import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return <Link href="/" className={cn("inline-flex items-center gap-3", className)}><span className="grid size-10 place-items-center rounded-xl bg-emerald-950 text-lg font-bold text-amber-300 shadow-sm">মু</span><span><span className="block text-lg font-bold leading-none tracking-wide text-emerald-950">মুহাসাবাহ</span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">Muhasabah</span></span></Link>;
}
