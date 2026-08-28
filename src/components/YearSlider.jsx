export default function YearSlider({ years, value, onChange }) {
  const min = Number(years[0]);
  const max = Number(years[years.length - 1]);
  const ticks = years.filter((y) => Number(y) % 5 === 0);

  return (
    <div className="year-slider">
      <div className="year-slider__value">
        <span className="body">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(String(e.target.value))}
        aria-label="Select year"
      />
      <div className="year-slider__ticks">
        {ticks.map((y) => (
          <span key={y}>{y}</span>
        ))}
      </div>
    </div>
  );
}
