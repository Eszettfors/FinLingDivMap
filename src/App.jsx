import { useEffect, useMemo, useState } from "react";
import { useAtlasData } from "./hooks/useAtlasData";
import {
  buildFamilyPalette,
  languageColor,
  hasOwnColor,
  OTHER_LANGUAGE_COLOR,
  NO_LANGUAGE_COLOR,
} from "./utils/colors";
import { MEASURES, readDiversityRow } from "./utils/format";
import { languageRowsFor, topLanguagesTimeSeries } from "./utils/languages";
import { LEVELS } from "./utils/levels";
import "./App.css";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MapPanel from "./components/MapPanel";
import Treemap from "./components/Treemap";
import TimeSeriesChart from "./components/TimeSeriesChart";
import TopLanguagesArea from "./components/TopLanguagesArea";
import AboutView from "./components/AboutView";

const DEFAULT_YEAR = "2025";
const DEFAULT_LANGUAGE = "Finnish";

export default function App() {
  const { status, error, data } = useAtlasData();

  const [view, setView] = useState("map");
  const [levelKey, setLevelKey] = useState("municipality");
  const [measure, setMeasure] = useState(MEASURES[0]); // Dominant Language
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [mapMode, setMapMode] = useState("diversity");
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE);
  const [vis, setVis] = useState("treemap");
  const [tableMode, setTableMode] = useState("global");
  const [clickedArea, setClickedArea] = useState(null);

  // Once data lands, make sure the default year/language actually exist.
  useEffect(() => {
    if (!data) return;
    if (!data.years.includes(year)) setYear(data.years[data.years.length - 1]);
    if (!data.languages.some((l) => l.name === selectedLanguage)) {
      setSelectedLanguage(data.languages[0]?.name ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // The geographic level currently on the map, and its data (geometry,
  // diversity rows, language rows). Everything below reads from these.
  const level = LEVELS[levelKey];
  const levelData = data ? data.levels[levelKey] : null;

  const familyPalette = useMemo(
    () => (data ? buildFamilyPalette(data.families) : {}),
    [data]
  );

  // Entries for the categorical map legend (Dominant / Second dominant
  // language): one per language present at this level and year. Languages
  // without a colour of their own share an "Other languages" entry, and areas
  // with no language to show (e.g. no second language) get an entry of their own.
  const legendItems = useMemo(() => {
    if (!levelData || measure.kind !== "categorical") return [];
    const named = new Set();
    let hasOther = false;
    let hasNone = false;
    Object.values(levelData.diversity).forEach((years) => {
      const row = years[year];
      if (!row) return;
      const langIdx = row[measure.index];
      if (langIdx == null) {
        hasNone = true;
        return;
      }
      const name = data.languages[langIdx].name;
      if (hasOwnColor(name)) named.add(name);
      else hasOther = true;
    });
    const items = [...named].sort().map((name) => ({ label: name, color: languageColor(name) }));
    if (hasOther) items.push({ label: "Other languages", color: OTHER_LANGUAGE_COLOR });
    if (hasNone && measure.noneLabel) items.push({ label: measure.noneLabel, color: NO_LANGUAGE_COLOR });
    return items;
  }, [data, levelData, measure, year]);

  function handleAreaClick(name) {
    setClickedArea(name);
    setTableMode("area");
  }

  // A selected municipality means nothing at region level (and vice versa),
  // so switching level clears the selection.
  function handleLevelChange(key) {
    setLevelKey(key);
    setClickedArea(null);
    setTableMode("global");
  }

  const tableRows = useMemo(() => {
    if (!data) return [];
    if (tableMode === "global") {
      return languageRowsFor(data.nationalLanguages[year], data.languages);
    }
    if (!clickedArea) return [];
    return languageRowsFor(
      levelData.languages[clickedArea]?.[year],
      data.languages
    );
  }, [data, levelData, tableMode, clickedArea, year]);

  const treemapRows = useMemo(() => {
    if (!levelData || !clickedArea) return [];
    return languageRowsFor(
      levelData.languages[clickedArea]?.[year],
      data.languages
    );
  }, [data, levelData, clickedArea, year]);

  const timeSeriesData = useMemo(() => {
    if (!levelData || !clickedArea) return null;
    if (measure.kind === "categorical") {
      const yearsMap = levelData.languages[clickedArea] || {};
      return {
        kind: "area",
        ...topLanguagesTimeSeries(yearsMap, data.languages, data.years, 10),
      };
    }
    const muniByYear = levelData.diversity[clickedArea] || {};
    const muniValues = data.years.map((y) => readDiversityRow(muniByYear[y], measure.key));
    return { kind: "line", muniValues };
  }, [data, levelData, clickedArea, measure]);

  if (status === "loading") {
    return (
      <div className="app-loading">
        <p className="eyebrow">Loading the atlas…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="app-loading">
        <p>Something went wrong loading the dataset.</p>
        <p className="mono">{String(error)}</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header
        view={view}
        onViewChange={setView}
        yearsCount={data.years.length}
        municipalityCount={data.levels.municipality.names.length}
        languageCount={data.languages.length}
      />

      {view === "map" ? (
        <main className="app-main">
          <Sidebar
            level={level}
            onLevelChange={handleLevelChange}
            years={data.years}
            measure={measure}
            onMeasureChange={setMeasure}
            year={year}
            onYearChange={setYear}
            mapMode={mapMode}
            onMapModeChange={setMapMode}
            languages={data.languages}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            vis={vis}
            onVisChange={setVis}
            tableMode={tableMode}
            onTableModeChange={setTableMode}
            clickedArea={clickedArea}
            tableRows={tableRows}
          />

          <div className="main-panel">
            <MapPanel
                geo={levelData.geo}
                level={level}
                mode={mapMode}
                measure={measure}
                year={year}
                diversityByArea={levelData.diversity}
                languagesByArea={levelData.languages}
                languages={data.languages}
                selectedLanguage={selectedLanguage}
                clickedArea={clickedArea}
                onAreaClick={handleAreaClick}
                legendItems={legendItems}
              /> 

            <div className="detail-panel">
              {!clickedArea && (
                <p className="empty-note empty-note--panel">
                  Click a {level.label.toLowerCase()} on the map to see its language treemap and diversity trend.
                </p>
              )}

              {clickedArea && vis === "treemap" && (
                <Treemap
                  rows={treemapRows}
                  familyPalette={familyPalette}
                  title={`Language distribution in ${clickedArea}, ${year}`}
                />
              )}

              {clickedArea && vis === "ts" && timeSeriesData?.kind === "line" && (
                <TimeSeriesChart
                  years={data.years}
                  municipalityName={clickedArea}
                  muniValues={timeSeriesData.muniValues}
                  measureLabel={measure.label}
                />
              )}

              {clickedArea && vis === "ts" && timeSeriesData?.kind === "area" && (
                <TopLanguagesArea
                  series={timeSeriesData.series}
                  keys={timeSeriesData.keys}
                  municipalityName={clickedArea}
                />
              )}
            </div>
            
          </div>
        </main>
      ) : (
        <AboutView />
      )}

      <footer className="app-footer">
        <p>
          By Hannes Essfors ·{" "}
          <a href="https://zenodo.org/records/18257720" target="_blank" rel="noreferrer">
            FinLingDiv on Zenodo
          </a>
        </p>
      </footer>
    </div>
  );
}
