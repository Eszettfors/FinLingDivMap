import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { readDiversityRow, fmtMeasure, fmtPct } from "../utils/format";
import { makeDiversityScale, languageColor, NO_LANGUAGE_COLOR } from "../utils/colors";
import { CategoricalLegend, NumericLegend } from "./MapLegend";

const FINLAND_CENTER = [64.9, 26.2];
const FINLAND_ZOOM = 5;

export default function MapPanel({
  geo,
  level,
  mode,
  measure,
  year,
  diversityByArea,
  languagesByArea,
  languages,
  selectedLanguage,
  clickedArea,
  onAreaClick,
  legendItems,
}) {
  // Leaflet binds the handlers in onEachFeature once, when the layer is
  // created, so they would see a stale clickedArea. They read it from this ref.
  const clickedRef = useRef(clickedArea);
  useEffect(() => {
    clickedRef.current = clickedArea;
  }, [clickedArea]);

  // ---- Diversity-measure view ----
  const diversityValues = useMemo(() => {
    if (mode !== "diversity") return [];
    return geo.features
      .map((f) => {
        const row = diversityByArea[f.properties[level.nameProp]]?.[year];
        return readDiversityRow(row, measure.key);
      })
      .filter((v) => typeof v === "number");
  }, [geo, level, diversityByArea, year, measure, mode]);

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
      const entries = languagesByArea[f.properties[level.nameProp]]?.[year] || [];
      const total = entries.reduce((s, [, sp]) => s + sp, 0);
      const found = entries.find(([idx]) => idx === langIndex);
      return total && found ? (found[1] / total) * 100 : 0;
    });
  }, [geo, level, languagesByArea, year, langIndex, mode]);

  const languageScale = useMemo(() => makeDiversityScale(languageValues), [languageValues]);

  function styleFeature(feature) {
    const area = feature.properties[level.nameProp];
    const isSelected = area === clickedArea;
    const base = {
      weight: isSelected ? 2.5 : level.borderWeight,
      color: isSelected ? "var(--ink)" : "#7d8a83",
      fillOpacity: 0.82,
    };

    if (mode === "diversity") {
      const row = diversityByArea[area]?.[year];
      if (measure.kind === "categorical") {
        const langIdx = row?.[measure.index];
        const pct = row?.[measure.pctIndex];
        if (langIdx == null) {
          // e.g. an area where only one language is recorded has no second language
          return { ...base, fillColor: NO_LANGUAGE_COLOR, fillOpacity: 0.5 };
        }
        return {
          ...base,
          fillColor: languageColor(languages[langIdx].name),
          // The dominant language fades with a lower share. Second languages
          // have small shares by nature, so they are drawn at full strength to
          // stay readable (the share is in the tooltip).
          fillOpacity: measure.shadeByShare ? Math.max(0.25, pct / 100) : 0.85,
        };
      }
      const value = readDiversityRow(row, measure.key);
      return { ...base, fillColor: diversityScale(value) };
    }

    // language mode
    const entries = languagesByArea[area]?.[year] || [];
    const total = entries.reduce((s, [, sp]) => s + sp, 0);
    const found = entries.find(([idx]) => idx === langIndex);
    const pct = total && found ? (found[1] / total) * 100 : 0;
    return { ...base, fillColor: languageScale(pct) };
  }

  function onEachFeature(feature, layer) {
    const area = feature.properties[level.nameProp];
    layer.on({
      click: () => onAreaClick(area),
      mouseover: (e) => e.target.setStyle({ weight: 2, color: "var(--ink)" }),
      mouseout: (e) => {
        const selected = area === clickedRef.current;
        e.target.setStyle(
          selected
            ? { weight: 2.5, color: "var(--ink)" }
            : { weight: level.borderWeight, color: "#7d8a83" }
        );
      },
    });

    let label;
    if (mode === "diversity") {
      const row = diversityByArea[area]?.[year];
      if (measure.kind === "categorical") {
        const langIdx = row?.[measure.index];
        label = langIdx != null
          ? `${area}: ${languages[langIdx].name} (${fmtPct(row[measure.pctIndex])})`
          : `${area}: ${measure.noneLabel?.toLowerCase() ?? "no data"}`;
      } else {
        const value = readDiversityRow(row, measure.key);
        label = `${area}: ${fmtMeasure(value)}`;
      }
    } else {
      const entries = languagesByArea[area]?.[year] || [];
      const total = entries.reduce((s, [, sp]) => s + sp, 0);
      const found = entries.find(([idx]) => idx === langIndex);
      const pct = total && found ? (found[1] / total) * 100 : 0;
      label = `${area}: ${fmtPct(pct)} ${selectedLanguage}`;
    }
    layer.bindTooltip(label, { sticky: true });
  }

  const geoKey = `${level.key}-${mode}-${measure.key}-${year}-${selectedLanguage}`;

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

      {mode === "diversity" && measure.kind === "categorical" && (
        <CategoricalLegend title={measure.label} items={legendItems} />
      )}
      {mode === "diversity" && measure.kind !== "categorical" && diversityValues.length > 0 && (
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
