import { fmtMeasure } from "../utils/format";

// items: [{ label, color }]
export function CategoricalLegend({ title, items }) {
  return (
    <div className="map-legend">
      <div className="map-legend__title">{title}</div>
      <div className="map-legend__items map-legend__items--wrap">
        {items.map(({ label, color }) => (
          <span key={label} className="map-legend__chip">
            <i style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function NumericLegend({ title, min, max, colorFn, suffix = "" }) {
  const stops = 6;
  const values = Array.from({ length: stops }, (_, i) => min + ((max - min) * i) / (stops - 1));
  return (
    <div className="map-legend">
      <div className="map-legend__title">{title}</div>
      <div className="map-legend__ramp">
        {values.map((v, i) => (
          <i key={i} style={{ background: colorFn(v) }} />
        ))}
      </div>
      <div className="map-legend__scale-labels">
        <span>{fmtMeasure(min)}{suffix}</span>
        <span>{fmtMeasure(max)}{suffix}</span>
      </div>
    </div>
  );
}
