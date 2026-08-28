import { useMemo, useState } from "react";
import { fmtInt, fmtPct } from "../utils/format";

const COLUMNS = [
  { key: "language", label: "Language", align: "left" },
  //{ key: "family", label: "Family", align: "left" },
  { key: "speakers", label: "Speakers", align: "right" },
  { key: "percent", label: "Share", align: "right" },
];

export default function LanguageTable({ rows, caption }) {
  const [sort, setSort] = useState({ key: "percent", dir: "desc" });

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sort]);

  function toggleSort(key) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }
    );
  }

  if (!rows.length) {
    return <p className="empty-note">No language data for this selection.</p>;
  }

  return (
    <div className="lang-table__wrap">
      <table className="lang-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.key} style={{ textAlign: col.align }}>
                <button
                  type="button"
                  className="lang-table__sort"
                  onClick={() => toggleSort(col.key)}
                  aria-sort={sort.key === col.key ? sort.dir : "none"}
                >
                  {col.label}
                  {sort.key === col.key && (
                    <span aria-hidden="true">{sort.dir === "asc" ? " ↑" : " ↓"}</span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.language}>
              <td>{row.language}</td>
              {/*<td className="lang-table__family">{row.family}</td>*/}
              <td className="body" style={{ textAlign: "right" }}>{fmtInt(row.speakers)}</td>
              <td className="body" style={{ textAlign: "right" }}>{fmtPct(row.percent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
