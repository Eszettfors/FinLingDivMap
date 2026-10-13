import { useMemo, useRef, useState } from "react";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";

const WIDTH = 640;
const HEIGHT = 380;

// 1 = area strictly proportional to share. Lower = small languages get more
const SIZE_EXPONENT = 1;

const PAD = 5;
const MIN_FONT = 8;
const MAX_FONT = 16;
const CHAR_WIDTH = 0.58; // approx. average glyph width as a fraction of font size

const fmtPercent = (p) => (p < 0.01 ? "<0.01%" : `${p.toFixed(1)}%`);

/** Work out what text (if any) fits in a box, and at what size. */
function fitLabel(language, percent, w, h) {
  const innerW = w - PAD * 2;
  const innerH = h - PAD * 2;
  if (innerW <= 0 || innerH < MIN_FONT) return null;

  // Largest font at which the full name fits on one line
  let fontSize = Math.min(MAX_FONT, innerW / (language.length * CHAR_WIDTH), innerH);
  let text = language;

  // Doesn't fit at a readable size: truncate at the minimum font size
  if (fontSize < MIN_FONT) {
    fontSize = MIN_FONT;
    const maxChars = Math.floor(innerW / (fontSize * CHAR_WIDTH));
    if (maxChars < 4) return null;
    text = language.slice(0, maxChars - 1) + "…";
  }

  const pctText = fmtPercent(percent);
  const pctSize = Math.max(MIN_FONT, fontSize * 0.85);
  const showPercent =
    innerH >= fontSize * 1.25 + pctSize && innerW >= pctText.length * pctSize * CHAR_WIDTH;

  return { text, fontSize, pctText, pctSize, showPercent };
}

export default function Treemap({ rows, familyPalette, title }) {
  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const leaves = useMemo(() => {
    if (!rows.length) return [];
    const root = hierarchy({ children: rows })
      .sum((d) => Math.pow(d.percent ?? 0, SIZE_EXPONENT))
      .sort((a, b) => b.value - a.value);
    treemap().tile(treemapSquarify).size([WIDTH, HEIGHT]).paddingInner(2)(root);
    return root.leaves();
  }, [rows]);

  if (!rows.length) {
    return <p className="empty-note">No language data for this selection yet.</p>;
  }

  function handleMove(e, d) {
    const box = e.currentTarget.closest("figure").getBoundingClientRect();
    setTooltip({
      x: e.clientX - box.left,
      y: e.clientY - box.top,
      flip: e.clientX - box.left > box.width - 180,
      language: d.language,
      family: d.family,
      percent: d.percent,
    });
  }

  return (
    <figure className="treemap">
      <figcaption className="panel-title">{title}</figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={title}>
        {leaves.map((leaf) => {
          const d = leaf.data;
          const w = leaf.x1 - leaf.x0;
          const h = leaf.y1 - leaf.y0;
          const label = fitLabel(d.language, d.percent, w, h);
          const isHovered = hovered === d.language;
          return (
            <g
              key={d.language}
              transform={`translate(${leaf.x0},${leaf.y0})`}
              aria-label={`${d.language}: ${d.percent.toFixed(2)}%`}
              onMouseEnter={() => setHovered(d.language)}
              onMouseMove={(e) => handleMove(e, d)}
              onMouseLeave={() => {
                setHovered(null);
                setTooltip(null);
              }}
            >
              <rect
                width={w}
                height={h}
                fill={familyPalette[d.family] || "#9aa39d"}
                stroke="#16241f"
                strokeOpacity={isHovered ? 0.6 : 0.18}
                strokeWidth={isHovered ? 2 : 1}
                rx={2}
              />
              {label && (
                <g pointerEvents="none" fill="#ffffff" fontFamily="var(--font-body)">
                  <text x={PAD} y={PAD} fontSize={label.fontSize} dominantBaseline="hanging">
                    {label.text}
                  </text>
                  {label.showPercent && (
                    <text
                      x={PAD}
                      y={PAD + label.fontSize * 1.25}
                      fontSize={label.pctSize}
                      opacity={0.85}
                      dominantBaseline="hanging"
                    >
                      {label.pctText}
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {tooltip && (
        <div
          className="treemap__tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: `translate(${tooltip.flip ? "calc(-100% - 12px)" : "12px"}, 12px)`,
          }}
        >
          <strong>{tooltip.language}</strong>
          <span>{tooltip.percent.toFixed(2)}%</span>
          <span className="treemap__tooltip-family">{tooltip.family}</span>
        </div>
      )}

      <div className="treemap__note">
        Color shows language family. Box sizes are scaled so that small languages stay readable;
        hover for exact shares.
      </div>
    </figure>
  );
}
