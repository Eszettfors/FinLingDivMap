import { hcl } from "d3-color";
import { interpolateYlGnBu } from "d3-scale-chromatic";
import { scaleSequential } from "d3-scale";

// The three languages that have ever been the single most-spoken language in
// any Finnish municipality, 1990-2025 — mirrors custom_palette in the R app.
// (Every other language never "wins" a municipality outright, so the map's
// categorical legend never needs more than these three.)
export const DOMINANT_LANGUAGE_COLORS = {
  Finnish: "#1f78b4",
  Sami: "#e31a1c",
  Swedish: "#ffda03",
};

export function dominantLanguageColor(name) {
  return DOMINANT_LANGUAGE_COLORS[name] || "#9aa39d";
}

let cachedFamilyPalette = null;
let cachedFamilyKey = null;

/** Evenly spaced HCL hues, one per language family, for the treemap. */
export function buildFamilyPalette(familyNames) {
  const key = familyNames.join("|");
  if (cachedFamilyPalette && cachedFamilyKey === key) return cachedFamilyPalette;

  const palette = {};
  familyNames.forEach((name, i) => {
    const hue = (i / familyNames.length) * 360;
    palette[name] = hcl(hue, 55, 55) + "";
  });

  cachedFamilyPalette = palette;
  cachedFamilyKey = key;
  return palette;
}

// A fixed, maximally-distinguishable qualitative sequence for charts that
// show a handful of items at once (the top-languages-over-time area chart).
// Assigned by rank, not by language identity — same approach as ggplot's
// default per-plot hue assignment in the original app.
const QUALITATIVE_SEQUENCE = [
  "#2361a6", "#c62828", "#2e8b57", "#d9a900", "#8e44ad",
  "#e67e22", "#16a085", "#c0392b", "#34568b", "#7f8c8d",
];
const OTHER_COLOR = "#c7d2cb";

export function qualitativeColor(index, key) {
  if (key === "*other") return OTHER_COLOR;
  return QUALITATIVE_SEQUENCE[index % QUALITATIVE_SEQUENCE.length];
}

/**
 * Sequential blue-green scale used for every numeric diversity measure and
 * for single-language share, matching the "YlGnBu" palette from the
 * original leaflet::colorNumeric call.
 */
export function makeDiversityScale(values) {
  const finite = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  const domain = finite.length ? [Math.min(...finite), Math.max(...finite)] : [0, 1];
  const scale = scaleSequential(domain, (t) => interpolateYlGnBu(t));
  return (v) => (typeof v === "number" && !Number.isNaN(v) ? scale(v) : "#c9c9c9");
}
