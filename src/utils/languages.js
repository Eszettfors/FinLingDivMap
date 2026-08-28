// Shared helpers for turning [[langIdx, speakers], ...] rows into the
// language/family/speaker tables the UI displays.

/** Rows for one municipality + year, or the national total for a year. */
export function languageRowsFor(entries, languages) {
  if (!entries || !entries.length) return [];
  const total = entries.reduce((sum, [, speakers]) => sum + speakers, 0);
  return entries
    .map(([langIdx, speakers]) => ({
      language: languages[langIdx]?.name ?? "Unknown",
      family: languages[langIdx]?.family ?? "Unknown",
      speakers,
      percent: total ? (speakers / total) * 100 : 0,
    }))
    .sort((a, b) => b.speakers - a.speakers);
}

/**
 * Builds a percent-share time series of the top N languages (by total
 * speakers across all years) for one municipality, folding the remainder
 * into "*other" — mirrors get_top_10_langs_ts() from the R app.
 */
export function topLanguagesTimeSeries(yearsMap, languages, years, topN = 10) {
  const totalsByLang = new Map();
  years.forEach((y) => {
    (yearsMap[y] || []).forEach(([langIdx, speakers]) => {
      totalsByLang.set(langIdx, (totalsByLang.get(langIdx) || 0) + speakers);
    });
  });

  const top = [...totalsByLang.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([langIdx]) => langIdx);
  const topSet = new Set(top);

  const series = years.map((y) => {
    const entries = yearsMap[y] || [];
    const total = entries.reduce((sum, [, s]) => sum + s, 0);
    const bucket = {};
    top.forEach((idx) => {
      bucket[languages[idx].name] = 0;
    });
    bucket["*other"] = 0;
    entries.forEach(([langIdx, speakers]) => {
      const name = topSet.has(langIdx) ? languages[langIdx].name : "*other";
      bucket[name] += total ? (speakers / total) * 100 : 0;
    });
    return { year: y, ...bucket };
  });

  const keys = [...top.map((idx) => languages[idx].name), "*other"];
  return { series, keys };
}
