import { useMemo, useState } from "react";
import { scaleLinear, scalePoint } from "d3-scale";
import { line as d3line } from "d3-shape";
import { fmtMeasure } from "../utils/format";

const WIDTH = 640;
const HEIGHT = 340;
const MARGIN = { top: 16, right: 20, bottom: 28, left: 44 };

export default function TimeSeriesChart({ years, municipalityName, muniValues, measureLabel }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const { x, y, muniLine } = useMemo(() => {
    const innerW = WIDTH - MARGIN.left - MARGIN.right;
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
    const xScale = scalePoint().domain(years).range([0, innerW]).padding(0.5);

    const finite = muniValues.filter((v) => v != null && !Number.isNaN(v));
    const lo = Math.min(...finite);
    const hi = Math.max(...finite);
    const pad = (hi - lo || 1) * 0.15;
    const yScale = scaleLinear()
      .domain([lo - pad, hi + pad])
      .range([innerH, 0]);

    const gen = d3line()
      .defined((v) => v != null && !Number.isNaN(v))
      .x((_, i) => xScale(years[i]))
      .y((v) => yScale(v));

    return { x: xScale, y: yScale, muniLine: gen(muniValues) };
  }, [years, muniValues]);

  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const yTicks = y.ticks ? y.ticks(5) : [];
  const xTickYears = years.filter((yr) => Number(yr) % 5 === 0);

  return (
    <figure className="timeseries">
      <figcaption className="panel-title">
        {measureLabel} over time: <strong>{municipalityName}</strong>
      </figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${measureLabel} time series for ${municipalityName}`}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {yTicks.map((t) => (
            <g key={t} transform={`translate(0,${y(t)})`}>
              <line x2={innerW} stroke="var(--line)" strokeWidth={1} />
              <text x={-8} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--ink)">
                {fmtMeasure(t)}
              </text>
            </g>
          ))}
          {xTickYears.map((yr) => (
            <text
              key={yr}
              x={x(yr)}
              y={innerH + 18}
              textAnchor="middle"
              fontSize={10}
              fill="var(--ink)"
            >
              {yr}
            </text>
          ))}

          <path d={muniLine} fill="none" stroke="var(--accent-lake)" strokeWidth={2.5} />

          {years.map((yr, i) => (
            <rect
              key={yr}
              x={x(yr) - (innerW / years.length) / 2}
              y={0}
              width={innerW / years.length}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          ))}

          {hoverIdx != null && muniValues[hoverIdx] != null && (
            <g transform={`translate(${x(years[hoverIdx])},0)`}>
              <line y1={0} y2={innerH} stroke="var(--line-strong)" strokeDasharray="2 2" />
              <circle cy={y(muniValues[hoverIdx])} r={4} fill="var(--accent-lake)" />
            </g>
          )}
        </g>
      </svg>
      <div className="timeseries__legend">
        <span><i className="swatch swatch--lake" /> {municipalityName}</span>
        {hoverIdx != null && muniValues[hoverIdx] != null && (
          <span className="mono timeseries__readout">
            {years[hoverIdx]}: {fmtMeasure(muniValues[hoverIdx])}
          </span>
        )}
      </div>
    </figure>
  );
}
