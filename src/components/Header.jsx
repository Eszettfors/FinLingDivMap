import { fmtInt } from "../utils/format";

export default function Header({ view, onViewChange, yearsCount, municipalityCount, languageCount }) {
  return (
    <header className="app-header">
        <h1>The Finnish Linguistic Diversity Map (FinLingDivMap)</h1>
        <p className="app-header__subtitle">
          Mapping the languages of Finland, 1990–2025
        </p>
      <nav className="app-header__tabs" aria-label="Sections">
        <button
          type="button"
          className={view === "map" ? "tab tab--active" : "tab"}
          onClick={() => onViewChange("map")}
        >
          Map
        </button>
        <button
          type="button"
          className={view === "about" ? "tab tab--active" : "tab"}
          onClick={() => onViewChange("about")}
        >
          About
        </button>
      </nav>
    </header>
  );
}
