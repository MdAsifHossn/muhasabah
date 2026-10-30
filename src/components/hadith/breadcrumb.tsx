import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type Crumb = { label: string; href?: string };

/** Compact "হাদীস › বুখারী › কিতাব ৮" trail; on phones it shows a single back link. */
export function HadithBreadcrumb({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ label: "হাদীস", href: "/dashboard/hadith" }, ...items];
  const back = [...trail].reverse().find((item, index) => index > 0 && item.href);
  return (
    <nav aria-label="অবস্থান" className="text-sm">
      {back?.href ? (
        <Link href={back.href} className="inline-flex items-center gap-1 font-semibold text-primary sm:hidden">
          <ChevronLeft className="size-4" /> {back.label}
        </Link>
      ) : null}
      <ol className="hidden flex-wrap items-center gap-1 text-muted-foreground sm:flex">
        {trail.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            {index > 0 ? <ChevronRight className="size-3.5 text-subtle-foreground" /> : null}
            {item.href ? (
              <Link href={item.href} className="font-medium hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
