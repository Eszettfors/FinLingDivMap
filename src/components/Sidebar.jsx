import { MEASURES } from "../utils/format";
import SegmentedControl from "./SegmentedControl";
import YearSlider from "./YearSlider";
import LanguagePicker from "./LanguagePicker";
import LanguageTable from "./LanguageTable";

export default function Sidebar({
  years,
  measure,
  onMeasureChange,
  year,
  onYearChange,
  mapMode,
  onMapModeChange,
  languages,
  selectedLanguage,
  onLanguageChange,
  vis,
  onVisChange,
  tableMode,
  onTableModeChange,
  clickedMunicipality,
  tableRows,
}) {
  return (
    <aside className="sidebar">
      <section className="control-block">
        <label className="control-label" htmlFor="measure-select">
          Select a measure to visualize:
        </label>
        <select
          id="measure-select"
          value={measure.key}
          onChange={(e) => onMeasureChange(MEASURES.find((m) => m.key === e.target.value))}
        >
          {MEASURES.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </section>

      <section className="control-block">
        <label className="control-label">Select a year:</label>
        <YearSlider years={years} value={year} onChange={onYearChange} />
      </section>

      <section className="control-block">
        <label className="control-label">Map type</label>
        <SegmentedControl
          name="Map type"
          value={mapMode}
          onChange={onMapModeChange}
          options={[
            { value: "diversity", label: "Diversity measure" },
            { value: "language", label: "Language share" },
          ]}
        />
      </section>

      <section className="control-block">
        <label className="control-label" htmlFor="lang-picker-input">
          Language
        </label>
        <LanguagePicker languages={languages} value={selectedLanguage} onChange={onLanguageChange} />
      </section>

      <section className="control-block">
        <label className="control-label">Visualization</label>
        <SegmentedControl
          name="Visualization"
          value={vis}
          onChange={onVisChange}
          options={[
            { value: "treemap", label: "Language treemap" },
            { value: "ts", label: "Time series" },
          ]}
        />
      </section>

      

      <section className="control-block">
        <label className="control-label">Most spoken languages</label>
        <SegmentedControl
          name="Table view"
          value={tableMode}
          onChange={onTableModeChange}
            options={[
              { value: "global", label: "Finland" },
              { value: "municipality", label: clickedMunicipality || "Municipality" },
            ]}
          />

        <LanguageTable
          rows={tableRows}
          caption={tableMode === "global" ? "Languages spoken across Finland" : `Languages spoken in ${clickedMunicipality || ""}`}
        />
      </section>
    </aside>
  );
}
