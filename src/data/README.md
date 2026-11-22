# Islamic reference data

## Dua catalog

`dua-catalog.json` is a local snapshot retrieved on 2026-11-22 from
[ThelightHub / Hisnul Muslim Dua API](https://github.com/ThelightHub/dua-api),
using its public API at <https://dua-api.hisnul.workers.dev>.

The upstream README declares the project open source under MIT in its
[License section](https://github.com/ThelightHub/dua-api#-license).
It credits Hisnul Muslim by Sheikh Sa'eed ibn Ali ibn Wahf Al-Qahtani.
The repository did not contain a standalone LICENSE file when inspected.
This snapshot relies on the README's express license declaration; it does not
assert independent ownership of translations or independently certify their authenticity.
Original upstream contributors retain their rights.

MIT License notice (upstream project contributors):

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### Coverage and transformations

- Book 1: Hisnul Muslim — 133 chapters, 312 source entries.
- Book 2: Quranic duas — 77 chapters, 77 source entries.
- Book 3: Special dhikr and duas — 9 chapters, 32 source entries.
- Total: 219 chapters, 421 entries, 578 text segments, 18 topic categories.
- Original Arabic, Bengali pronunciation, translation, introductory text,
  notes and references are preserved verbatim, including discussions of weak narrations.
- Database columns are renamed to application field names. Word-by-word
  data and internal application references are omitted; no translations are generated.
- 12 segments have no Arabic (some are introductory guidance), 19 lack a
  translation, and 150 have no per-segment reference. Other segments in an
  entry may contain its reference. Missing fields stay empty; the UI identifies
  entries without references and Arabic segments without translations.
- Counts reflect this source's editorial grouping. They are not claimed to
  match HadithBD's 267-dua edition or to constitute 421 unique hadiths.

Refresh intentionally with `node scripts/import-dua-catalog.mjs` from the
repository root. This uses four concurrent requests, timeouts and bounded
retries, validates every chapter and book count and unique IDs, then replaces
the snapshot only after a complete successful import. Review the diff and run
`node --import tsx --test tests/islamic-guides.test.tsx` before accepting changes.
The application performs no external data requests to read these pages.

## Allah's names

The existing `src/lib/asmaul-husna.ts` text is retained. The new
`asmaul-husna-details.ts` contains helper transliteration, original short study
prompts, and Quran verse links. The prompts are not quotations, tafsir, prescribed
recitation counts, or promises of specific rewards. References explicitly distinguish
names from related attributes; names without attached direct evidence are labeled.
The site describes the enumeration as a commonly used list, not the only possible
enumeration or an exhaustive list of Allah's names.

Reference and interaction inspiration: [HadithBD names](https://www.hadithbd.com/99namesofallah/).
HadithBD's detailed explanatory articles and recordings are not bundled.

## Mahram relationships

`src/lib/mahrams.ts` is an original relationship guide, with source links to
[Quran 4:22–23](https://quran.com/4/22-23),
[Quran 24:31](https://quran.com/24/31),
[Bukhari 2645](https://sunnah.com/bukhari:2645) and
[Bukhari 5232](https://sunnah.com/bukhari:5232).
[HadithBD's chart](https://www.hadithbd.com/mahram/) was consulted as a coverage
reference, rather than copied as a legal ruling. Spouses are a separate category;
stepdaughter/stepfather conditions are visible. Milk relationships assume the
relevant jurisprudential conditions have been established. Source links on
non-mahram entries identify the general basis, not a verbatim list of those
relationship names in the cited passage. Complex cases require qualified guidance.

Automated tests verify structure, search behavior, markup and route behavior;
they do not establish religious authenticity or scholarly approval.
