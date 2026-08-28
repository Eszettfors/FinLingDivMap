import { useMemo, useState } from "react";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";

const WIDTH = 640;
const HEIGHT = 380;

export default function Treemap({ rows, familyPalette, title }) {
  const [hovered, setHovered] = useState(null);

  const leaves = useMemo(() => {
    if (!rows.length) return [];
    const root = hierarchy({ children: rows }).sum((d) => d.percent ?? 0);
    treemap().tile(treemapSquarify).size([WIDTH, HEIGHT]).paddingInner(2)(root);
    return root.leaves();
  }, [rows]);

  if (!rows.length) {
    return <p className="empty-note">No language data for this selection yet.</p>;
  }

  return (
    <figure className="treemap">
      <figcaption className="panel-title">{title}</figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={title}>
        {leaves.map((leaf) => {
          const d = leaf.data;
          const w = leaf.x1 - leaf.x0;
          const h = leaf.y1 - leaf.y0;
          const showLabel = w > 46 && h > 26;
          const isHovered = hovered === d.language;
          return (
            <g
              key={d.language}
              transform={`translate(${leaf.x0},${leaf.y0})`}
              onMouseEnter={() => setHovered(d.language)}
              onMouseLeave={() => setHovered(null)}
            >
              <rect
                width={w}
                height={h}
                fill={familyPalette[d.family] || "#9aa39d"}
                stroke="#16241f"
                strokeOpacity={isHovered ? 0.55 : 0.18}
                strokeWidth={isHovered ? 2 : 1}
                rx={2}
              />
              {showLabel && (
                <text x={6} y={16} fill="#ffffff" fontSize={11} fontFamily="var(--font-body)">
                  {d.language}
                </text>
              )}
              {showLabel && h > 40 && (
                <text x={6} y={30} fill="#ffffff" fontSize={10} opacity={0.85}>
                  {d.percent.toFixed(1)}%
                </text>
              )}
              {isHovered && !showLabel && (
                <title>{`${d.language} (${d.family}): ${d.percent.toFixed(2)}%`}</title>
              )}
            </g>
          );
        })}
      </svg>
      <div className="treemap__note">Color shows language family.</div>
    </figure>
  );
}
