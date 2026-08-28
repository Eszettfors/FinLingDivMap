import { format } from "d3-format";

export const fmtInt = format(",d");
export const fmtPct = (v) => (v == null || Number.isNaN(v) ? "—" : `${format(".1f")(v)}%`);
export const fmtMeasure = (v) => (v == null || Number.isNaN(v) ? "—" : format(".3f")(v));

export const MEASURES = [
  { key: "dominantLanguage", label: "Dominant Language", index: 6, kind: "categorical" },
  { key: "richness", label: "Richness", index: 0, kind: "numeric" },
  { key: "expShannon", label: "Exponent Shannon", index: 1, kind: "numeric" },
  { key: "invSimpson", label: "Inverse Simpson", index: 2, kind: "numeric" },
  { key: "lexDivQ0", label: "Lexical Diversity (q=0)", index: 3, kind: "numeric" },
  { key: "lexDivQ1", label: "Lexical Diversity (q=1)", index: 4, kind: "numeric" },
  { key: "lexDivQ2", label: "Lexical Diversity (q=2)", index: 5, kind: "numeric" },
];

// Diversity rows are compact arrays:
// [richness, expShannon, invSimpson, lexDivQ0, lexDivQ1, lexDivQ2, domLangIdx, domPct]
export function readDiversityRow(row, measureKey) {
  if (!row) return null;
  const measure = MEASURES.find((m) => m.key === measureKey);
  if (!measure) return null;
  if (measure.kind === "categorical") return row[6];
  return row[measure.index];
}
