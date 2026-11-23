import type { CatalogDua } from "@/lib/dua-catalog";

export function formatCatalogDua(dua: CatalogDua, chapterTitle: string) {
  const parts = dua.segments.map((segment) => [
    segment.introduction, segment.arabic,
    segment.pronunciation && `উচ্চারণ: ${segment.pronunciation}`,
    segment.meaning && `অর্থ: ${segment.meaning}`,
    segment.note,
    segment.reference && `সূত্র: ${segment.reference}`,
  ].filter(Boolean).join("\n\n"));
  return `${chapterTitle}\n${dua.title}\n\n${parts.join("\n\n")}\n\nসংকলন: মুহাসাবাহ — হিসনুল মুসলিম ও কুরআনের দোয়া`;
}
