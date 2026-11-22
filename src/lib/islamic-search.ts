/** Match Bengali spelling variants, Bengali digits, and Arabic without vowel marks. */
export function normalizeIslamicSearch(value: string) {
  return value.normalize("NFKD").toLowerCase()
    .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640\u200c\u200d]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))
    .replace(/\s+/g, " ").trim();
}
