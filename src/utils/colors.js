import { hcl } from "d3-color";
import { interpolateYlGnBu } from "d3-scale-chromatic";
import { scaleSequential } from "d3-scale";

// Colours for the categorical language maps ("Dominant" and "Second dominant").
//
// Finnish, Sami and Swedish are the only languages that ever come out on top
// in a municipality, so the dominant map needs just these three. The second
// most spoken language varies much more (28 different languages over the
// years), but a handful cover nearly everything - in 2025 Russian, Ukrainian,
// Swedish, Estonian, Finnish and Arabic are second in ~95% of municipalities.
// Those get a colour of their own (ColorBrewer "Paired" hues, chosen to stay
// apart from the first three); every other language shares one grey, and the
// tooltip still names it. Add a line here to give another language a colour.
export const LANGUAGE_COLORS = {
  Finnish: "#1f78b4",
  Sami: "#e31a1c",
  Swedish: "#ffda03",
  Russian: "#6a3d9a",
  Estonian: "#33a02c",
  Ukrainian: "#ff7f00",
  Arabic: "#b15928",
};

export const OTHER_LANGUAGE_COLOR = "#8a8f8c"; // languages without a colour above
export const NO_LANGUAGE_COLOR = "#d4d8d5"; // areas with no language to show

export function hasOwnColor(name) {
  return Object.hasOwn(LANGUAGE_COLORS, name);
}

export function languageColor(name) {
  return hasOwnColor(name) ? LANGUAGE_COLORS[name] : OTHER_LANGUAGE_COLOR;
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
