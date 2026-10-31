import { cn } from "@/lib/utils";

/** Category hues from the design tokens — each book gets one by id. */
const HUES = ["--cat-salah", "--cat-quran", "--cat-dhikr", "--cat-sunnah", "--cat-character", "--cat-service", "--cat-discipline", "--cat-reading", "--cat-jumuah"];

/**
 * Book cover: the publisher's image when there is one, otherwise a generated
 * cloth-bound cover (category hue, spine, gilt frame, title).
 */
export function BookCover({ id, title, cover, className, large = false }: { id: number; title: string; cover: string | null; className?: string; large?: boolean }) {
  if (cover) {
    return (
      <div className={cn("relative aspect-[3/4] overflow-hidden rounded-xl bg-muted shadow-md ring-1 ring-black/10", className)}>
        {/* Third-party cover, sized by CSS — next/image would need a remote-pattern config. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
        <span className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/30 to-transparent" />
      </div>
    );
  }
  const hue = `var(${HUES[id % HUES.length]})`;
  return (
    <div
      aria-hidden
      className={cn("relative flex aspect-[3/4] flex-col overflow-hidden rounded-xl text-white shadow-md ring-1 ring-black/10", className)}
      style={{ background: `linear-gradient(150deg, color-mix(in srgb, ${hue} 92%, white) 0%, ${hue} 45%, color-mix(in srgb, ${hue} 55%, black) 100%)` }}
    >
      {/* spine */}
      <span className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/35 via-black/10 to-transparent" />
      {/* gilt frame */}
      <span className="absolute inset-2.5 left-4 rounded-md border border-[#f3d48a]/55" />
      <span className="absolute inset-[13px] left-[19px] rounded border border-[#f3d48a]/25" />
      <span className="relative mx-auto mt-[18%] text-[#f3d48a]/90" style={{ fontSize: large ? 28 : 16 }}>
        ✦
      </span>
      <span
        className={cn("relative mx-5 mt-2 line-clamp-4 text-center font-semibold leading-snug drop-shadow-sm", large ? "text-xl" : "text-[13px]")}
      >
        {title}
      </span>
      <span className="relative mx-auto mb-[14%] mt-auto h-px w-1/3 bg-[#f3d48a]/60" />
    </div>
  );
}
