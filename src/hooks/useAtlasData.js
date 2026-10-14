import { useEffect, useState } from "react";

const DATA_URL = `${import.meta.env.BASE_URL}data`;
const GEO_URL = `${import.meta.env.BASE_URL}geo`;

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
          diversityByRegion,
          languagesByRegion,
          nationalDiversity,
          nationalLanguages,
          municipalityGeo,
          regionGeo,
        ] = await Promise.all([
          fetchJson(`${DATA_URL}/meta.json`),
          fetchJson(`${DATA_URL}/languages.json`),
          fetchJson(`${DATA_URL}/diversity_by_municipality.json`),
          fetchJson(`${DATA_URL}/languages_by_municipality.json`),
          fetchJson(`${DATA_URL}/diversity_by_region.json`),
          fetchJson(`${DATA_URL}/languages_by_region.json`),
          fetchJson(`${DATA_URL}/national_diversity.json`),
          fetchJson(`${DATA_URL}/national_languages.json`),
          fetchJson(`${GEO_URL}/municipalities.geojson`),
          fetchJson(`${GEO_URL}/region_geometries.geojson`),
        ]);

        if (cancelled) return;

        setState({
          status: "ready",
          error: null,
          data: {
            years: meta.years,
            families: meta.families,
            everDominantLanguages: meta.everDominantLanguages,
            languages, // [{name, family}, ...] indexed by langIdx
            nationalDiversity, // { year: {...} }
            nationalLanguages, // { year: [[langIdx, speakers], ...] }
            // One entry per geographic level (keys match LEVELS in utils/levels.js).
            // Both levels share the same shapes, so the UI can treat them alike:
            //   diversity: { area: { year: [r, es, is, l0, l1, l2, domIdx, domPct] } }
            //   languages: { area: { year: [[langIdx, speakers], ...] } }
            levels: {
              municipality: {
                names: meta.municipalities,
                geo: municipalityGeo,
                diversity: diversityByMunicipality,
                languages: languagesByMunicipality,
              },
              region: {
                names: meta.regions,
                geo: regionGeo,
                diversity: diversityByRegion,
                languages: languagesByRegion,
              },
            },
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
