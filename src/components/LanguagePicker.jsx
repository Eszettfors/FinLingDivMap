import { useEffect, useMemo, useRef, useState } from "react";

export default function LanguagePicker({ languages, value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef(null);

  useEffect(() => setQuery(value || ""), [value]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const names = languages.map((l) => l.name);
    if (!q) return names.slice(0, 30);
    return names.filter((n) => n.toLowerCase().includes(q)).slice(0, 30);
  }, [query, languages]);

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery(value || "");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [value]);

  function commit(name) {
    onChange(name);
    setQuery(name);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (matches[highlight]) commit(matches[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(value || "");
    }
  }

  return (
    <div className="lang-picker" ref={rootRef}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="lang-picker-list"
        placeholder="Type to search a language…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && matches.length > 0 && (
        <ul id="lang-picker-list" className="lang-picker__list" role="listbox">
          {matches.map((name, i) => (
            <li
              key={name}
              role="option"
              aria-selected={name === value}
              className={`lang-picker__option${i === highlight ? " lang-picker__option--active" : ""}`}
              onMouseDown={() => commit(name)}
              onMouseEnter={() => setHighlight(i)}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
