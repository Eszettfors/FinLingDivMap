import { useMemo, useState } from "react";
import { scaleLinear, scalePoint } from "d3-scale";
import { area as d3area } from "d3-shape";
import { stack, stackOrderNone, stackOffsetNone } from "d3-shape";
import { qualitativeColor } from "../utils/colors";

const WIDTH = 640;
const HEIGHT = 380;
const MARGIN = { top: 12, right: 150, bottom: 28, left: 40 };

export default function TopLanguagesArea({ series, keys, municipalityName }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const { x, y, layers, years } = useMemo(() => {
    const years = series.map((d) => d.year);
    const innerW = WIDTH - MARGIN.left - MARGIN.right;
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

    const xScale = scalePoint().domain(years).range([0, innerW]);
    const yScale = scaleLinear().domain([0, 100]).range([innerH, 0]);

    const stacker = stack().keys(keys).order(stackOrderNone).offset(stackOffsetNone);
    const stacked = stacker(series);

    const areaGen = d3area()
      .x((_, i) => xScale(years[i]))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]));

    const layers = stacked.map((layer, i) => ({
      key: layer.key,
      path: areaGen(layer),
      values: layer,
      color: qualitativeColor(i, layer.key),
    }));

    return { x: xScale, y: yScale, layers, years };
  }, [series, keys]);

  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const xTickYears = years.filter((yr) => Number(yr) % 5 === 0);

  return (
    <figure className="area-chart">
      <figcaption className="panel-title">
        Top languages over time: <strong>{municipalityName}</strong>
      </figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Top languages over time for ${municipalityName}`}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {[0, 25, 50, 75, 100].map((t) => (
            <g key={t} transform={`translate(0,${y(t)})`}>
              <line x2={innerW} stroke="var(--line)" strokeWidth={1} />
              <text x={-8} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--ink)">
                {t}%
              </text>
            </g>
          ))}
          {xTickYears.map((yr) => (
            <text key={yr} x={x(yr)} y={innerH + 18} textAnchor="middle" fontSize={10} fill="var(--ink)">
              {yr}
            </text>
          ))}

          {layers.map((layer) => (
            <path
              key={layer.key}
              d={layer.path}
              fill={layer.color}
              opacity={0.92}
            />
          ))}

          {years.map((yr, i) => (
            <rect
              key={yr}
              x={x(yr) - innerW / years.length / 2}
              y={0}
              width={innerW / years.length}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          ))}
          {hoverIdx != null && (
            <line
              x1={x(years[hoverIdx])}
              x2={x(years[hoverIdx])}
              y1={0}
              y2={innerH}
              stroke="var(--ink)"
              strokeDasharray="2 2"
              opacity={0.4}
            />
          )}
        </g>
        <g transform={`translate(${WIDTH - MARGIN.right + 16},${MARGIN.top})`}>
          {layers.map((layer, i) => (
            <g key={layer.key} transform={`translate(0,${i * 16})`}>
              <rect width={10} height={10} fill={layer.color} />
              <text x={14} y={9} fontSize={10} fill="var(--ink)">
                {layer.key.length > 16 ? layer.key.slice(0, 15) + "…" : layer.key}
                {hoverIdx != null ? ` (${layer.values[hoverIdx][1] - layer.values[hoverIdx][0] > 0.05 ? (layer.values[hoverIdx][1] - layer.values[hoverIdx][0]).toFixed(1) + "%" : "<0.1%"})` : ""}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </figure>
  );
}
