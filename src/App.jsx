import { useEffect, useMemo, useState } from "react";
import { useAtlasData } from "./hooks/useAtlasData";
import { buildFamilyPalette } from "./utils/colors";
import { MEASURES, readDiversityRow } from "./utils/format";
import { languageRowsFor, topLanguagesTimeSeries } from "./utils/languages";
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
  const [measure, setMeasure] = useState(MEASURES[0]); // Dominant Language
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [mapMode, setMapMode] = useState("diversity");
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE);
  const [vis, setVis] = useState("treemap");
  const [tableMode, setTableMode] = useState("global");
  const [clickedMunicipality, setClickedMunicipality] = useState(null);

  // Once data lands, make sure the default year/language actually exist.
  useEffect(() => {
    if (!data) return;
    if (!data.years.includes(year)) setYear(data.years[data.years.length - 1]);
    if (!data.languages.some((l) => l.name === selectedLanguage)) {
      setSelectedLanguage(data.languages[0]?.name ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const familyPalette = useMemo(
    () => (data ? buildFamilyPalette(data.families) : {}),
    [data]
  );

  const dominantLanguagesInView = useMemo(() => {
    if (!data) return [];
    const set = new Set();
    Object.values(data.diversityByMunicipality).forEach((years) => {
      const row = years[year];
      if (row && row[6] != null) set.add(data.languages[row[6]].name);
    });
    return [...set].sort();
  }, [data, year]);

  function handleMunicipalityClick(name) {
    setClickedMunicipality(name);
    setTableMode("municipality");
  }

  const tableRows = useMemo(() => {
    if (!data) return [];
    if (tableMode === "global") {
      return languageRowsFor(data.nationalLanguages[year], data.languages);
    }
    if (!clickedMunicipality) return [];
    return languageRowsFor(
      data.languagesByMunicipality[clickedMunicipality]?.[year],
      data.languages
    );
  }, [data, tableMode, clickedMunicipality, year]);

  const treemapRows = useMemo(() => {
    if (!data || !clickedMunicipality) return [];
    return languageRowsFor(
      data.languagesByMunicipality[clickedMunicipality]?.[year],
      data.languages
    );
  }, [data, clickedMunicipality, year]);

  const timeSeriesData = useMemo(() => {
    if (!data || !clickedMunicipality) return null;
    if (measure.key === "dominantLanguage") {
      const yearsMap = data.languagesByMunicipality[clickedMunicipality] || {};
      return {
        kind: "area",
        ...topLanguagesTimeSeries(yearsMap, data.languages, data.years, 10),
      };
    }
    const muniByYear = data.diversityByMunicipality[clickedMunicipality] || {};
    const muniValues = data.years.map((y) => readDiversityRow(muniByYear[y], measure.key));
    return { kind: "line", muniValues };
  }, [data, clickedMunicipality, measure]);

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
        municipalityCount={data.municipalities.length}
        languageCount={data.languages.length}
      />

      {view === "map" ? (
        <main className="app-main">
          <Sidebar
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
            clickedMunicipality={clickedMunicipality}
            tableRows={tableRows}
          />

          <div className="main-panel">
            <MapPanel
                geo={data.geo}
                mode={mapMode}
                measure={measure}
                year={year}
                diversityByMunicipality={data.diversityByMunicipality}
                languagesByMunicipality={data.languagesByMunicipality}
                languages={data.languages}
                selectedLanguage={selectedLanguage}
                clickedMunicipality={clickedMunicipality}
                onMunicipalityClick={handleMunicipalityClick}
                dominantLanguagesInView={dominantLanguagesInView}
              /> 

            <div className="detail-panel">
              {!clickedMunicipality && (
                <p className="empty-note empty-note--panel">
                  Click a municipality on the map to see its language treemap and diversity trend.
                </p>
              )}

              {clickedMunicipality && vis === "treemap" && (
                <Treemap
                  rows={treemapRows}
                  familyPalette={familyPalette}
                  title={`Language distribution in ${clickedMunicipality}, ${year}`}
                />
              )}

              {clickedMunicipality && vis === "ts" && timeSeriesData?.kind === "line" && (
                <TimeSeriesChart
                  years={data.years}
                  municipalityName={clickedMunicipality}
                  muniValues={timeSeriesData.muniValues}
                  measureLabel={measure.label}
                />
              )}

              {clickedMunicipality && vis === "ts" && timeSeriesData?.kind === "area" && (
                <TopLanguagesArea
                  series={timeSeriesData.series}
                  keys={timeSeriesData.keys}
                  municipalityName={clickedMunicipality}
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
