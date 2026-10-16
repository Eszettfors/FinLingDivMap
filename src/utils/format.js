import { format } from "d3-format";

export const fmtInt = format(",d");
export const fmtPct = (v) => (v == null || Number.isNaN(v) ? "—" : `${format(".1f")(v)}%`);
export const fmtMeasure = (v) => (v == null || Number.isNaN(v) ? "—" : format(".3f")(v));

// Categorical measures show one language per area. `index` / `pctIndex` point
// at the language and its share inside a diversity row, `shadeByShare` makes
// the map fade areas where that language has a low share, and `noneLabel`
// names the state of areas that have no such language at all.
export const MEASURES = [
  { key: "dominantLanguage", label: "Dominant Language", index: 6, pctIndex: 7, kind: "categorical", shadeByShare: true },
  { key: "secondDominantLanguage", label: "Second Dominant Language", index: 8, pctIndex: 9, kind: "categorical", noneLabel: "No second language" },
  { key: "richness", label: "Richness", index: 0, kind: "numeric" },
  { key: "expShannon", label: "Exponent Shannon", index: 1, kind: "numeric" },
  { key: "invSimpson", label: "Inverse Simpson", index: 2, kind: "numeric" },
  { key: "lexDivQ0", label: "Lexical Diversity (q=0)", index: 3, kind: "numeric" },
  { key: "lexDivQ1", label: "Lexical Diversity (q=1)", index: 4, kind: "numeric" },
  { key: "lexDivQ2", label: "Lexical Diversity (q=2)", index: 5, kind: "numeric" },
];

// Diversity rows are compact arrays:
// [richness, expShannon, invSimpson, lexDivQ0, lexDivQ1, lexDivQ2,
//  domLangIdx, domPct, secondLangIdx, secondPct]
export function readDiversityRow(row, measureKey) {
  if (!row) return null;
  const measure = MEASURES.find((m) => m.key === measureKey);
  return measure ? row[measure.index] : null;
}
