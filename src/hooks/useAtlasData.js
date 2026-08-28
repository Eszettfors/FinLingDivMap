import { useEffect, useState } from "react";

const DATA_URL = `${import.meta.env.BASE_URL}data`;
const GEO_URL = `${import.meta.env.BASE_URL}geo/municipalities.geojson`;

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

/**
 * Loads every static dataset the atlas needs exactly once and exposes it in
 * a shape that's cheap to query from the UI. All the heavy joining
 * (municipality <-> language <-> geometry) was already done offline during
 * the data-prep step, so this hook just wires the flat JSON files together.
 */
export function useAtlasData() {
  const [state, setState] = useState({
    status: "loading",
    error: null,
    data: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [
          meta,
          languages,
          diversityByMunicipality,
          languagesByMunicipality,
          nationalDiversity,
          nationalLanguages,
          geo,
        ] = await Promise.all([
          fetchJson(`${DATA_URL}/meta.json`),
          fetchJson(`${DATA_URL}/languages.json`),
          fetchJson(`${DATA_URL}/diversity_by_municipality.json`),
          fetchJson(`${DATA_URL}/languages_by_municipality.json`),
          fetchJson(`${DATA_URL}/national_diversity.json`),
          fetchJson(`${DATA_URL}/national_languages.json`),
          fetchJson(GEO_URL),
        ]);

        if (cancelled) return;

        setState({
          status: "ready",
          error: null,
          data: {
            years: meta.years,
            municipalities: meta.municipalities,
            families: meta.families,
            everDominantLanguages: meta.everDominantLanguages,
            languages, // [{name, family}, ...] indexed by langIdx
            diversityByMunicipality, // { mncp: { year: [r, es, is, l0, l1, l2, domIdx, domPct] } }
            languagesByMunicipality, // { mncp: { year: [[langIdx, speakers], ...] } }
            nationalDiversity, // { year: {...} }
            nationalLanguages, // { year: [[langIdx, speakers], ...] }
            geo,
          },
        });
      } catch (err) {
        if (!cancelled) {
          setState({ status: "error", error: err, data: null });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
