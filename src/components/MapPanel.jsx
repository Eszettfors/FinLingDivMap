import { useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { readDiversityRow, fmtMeasure, fmtPct } from "../utils/format";
import { makeDiversityScale, dominantLanguageColor } from "../utils/colors";
import { CategoricalLegend, NumericLegend } from "./MapLegend";

const FINLAND_CENTER = [64.9, 26.2];
const FINLAND_ZOOM = 5;

export default function MapPanel({
  geo,
  mode,
  measure,
  year,
  diversityByMunicipality,
  languagesByMunicipality,
  languages,
  selectedLanguage,
  clickedMunicipality,
  onMunicipalityClick,
  dominantLanguagesInView,
}) {
  // ---- Diversity-measure view ----
  const diversityValues = useMemo(() => {
    if (mode !== "diversity") return [];
    return geo.features
      .map((f) => {
        const row = diversityByMunicipality[f.properties.mncplty]?.[year];
        return readDiversityRow(row, measure.key);
      })
      .filter((v) => typeof v === "number");
  }, [geo, diversityByMunicipality, year, measure, mode]);

  const diversityScale = useMemo(
    () => makeDiversityScale(diversityValues),
    [diversityValues]
  );

  // ---- Language-share view ----
  const langIndex = useMemo(
    () => languages.findIndex((l) => l.name === selectedLanguage),
    [languages, selectedLanguage]
  );

  const languageValues = useMemo(() => {
    if (mode !== "language") return [];
    return geo.features.map((f) => {
      const entries = languagesByMunicipality[f.properties.mncplty]?.[year] || [];
      const total = entries.reduce((s, [, sp]) => s + sp, 0);
      const found = entries.find(([idx]) => idx === langIndex);
      return total && found ? (found[1] / total) * 100 : 0;
    });
  }, [geo, languagesByMunicipality, year, langIndex, mode]);

  const languageScale = useMemo(() => makeDiversityScale(languageValues), [languageValues]);

  function styleFeature(feature) {
    const mncp = feature.properties.mncplty;
    const isSelected = mncp === clickedMunicipality;
    const base = {
      weight: isSelected ? 2.5 : 0.6,
      color: isSelected ? "var(--ink)" : "#7d8a83",
      fillOpacity: 0.82,
    };

    if (mode === "diversity") {
      const row = diversityByMunicipality[mncp]?.[year];
      if (measure.key === "dominantLanguage") {
        const domIdx = row?.[6];
        const domPct = row?.[7];
        const name = domIdx != null ? languages[domIdx].name : null;
        return {
          ...base,
          fillColor: name ? dominantLanguageColor(name) : "#c9c9c9",
          fillOpacity: domPct != null ? Math.max(0.25, domPct / 100) : 0.2,
        };
      }
      const value = readDiversityRow(row, measure.key);
      return { ...base, fillColor: diversityScale(value) };
    }

    // language mode
    const entries = languagesByMunicipality[mncp]?.[year] || [];
    const total = entries.reduce((s, [, sp]) => s + sp, 0);
    const found = entries.find(([idx]) => idx === langIndex);
    const pct = total && found ? (found[1] / total) * 100 : 0;
    return { ...base, fillColor: languageScale(pct) };
  }

  function onEachFeature(feature, layer) {
    const mncp = feature.properties.mncplty;
    layer.on({
      click: () => onMunicipalityClick(mncp),
      mouseover: (e) => e.target.setStyle({ weight: 2, color: "var(--ink)" }),
      mouseout: (e) => {
        if (mncp !== clickedMunicipality) {
          e.target.setStyle({ weight: 0.6, color: "#7d8a83" });
        }
      },
    });

    let label;
    if (mode === "diversity") {
      const row = diversityByMunicipality[mncp]?.[year];
      if (measure.key === "dominantLanguage") {
        const domIdx = row?.[6];
        const domPct = row?.[7];
        label = domIdx != null
          ? `${mncp}: ${languages[domIdx].name} (${fmtPct(domPct)})`
          : `${mncp}: no data`;
      } else {
        const value = readDiversityRow(row, measure.key);
        label = `${mncp}: ${fmtMeasure(value)}`;
      }
    } else {
      const entries = languagesByMunicipality[mncp]?.[year] || [];
      const total = entries.reduce((s, [, sp]) => s + sp, 0);
      const found = entries.find(([idx]) => idx === langIndex);
      const pct = total && found ? (found[1] / total) * 100 : 0;
      label = `${mncp}: ${fmtPct(pct)} ${selectedLanguage}`;
    }
    layer.bindTooltip(label, { sticky: true });
  }

  const geoKey = `${mode}-${measure.key}-${year}-${selectedLanguage}`;

  return (
    <div className="map-shell">
      <MapContainer
        center={FINLAND_CENTER}
        zoom={FINLAND_ZOOM}
        minZoom={4}
        maxZoom={10}
        scrollWheelZoom
        className="leaflet-instance"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON key={geoKey} data={geo} style={styleFeature} onEachFeature={onEachFeature} />
      </MapContainer>

      {mode === "diversity" && measure.key === "dominantLanguage" && (
        <CategoricalLegend
          title="Dominant language"
          items={dominantLanguagesInView}
          colorFn={dominantLanguageColor}
        />
      )}
      {mode === "diversity" && measure.key !== "dominantLanguage" && diversityValues.length > 0 && (
        <NumericLegend
          title={measure.label}
          min={Math.min(...diversityValues)}
          max={Math.max(...diversityValues)}
          colorFn={diversityScale}
        />
      )}
      {mode === "language" && (
        <NumericLegend
          title={`${selectedLanguage} share`}
          min={0}
          max={Math.max(...languageValues, 0.0001)}
          colorFn={languageScale}
          suffix="%"
        />
      )}
    </div>
  );
}
