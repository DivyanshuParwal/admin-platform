/**
 * Compact bar chart with no external dependency. Accepts:
 *   data: [{ name: string, value: number }]
 *   max:  number | undefined (auto-detected)
 */
export default function BarChart({ data = [], max }) {
  if (!data.length) {
    return <p className="muted" style={{ margin: 0 }}>No data yet.</p>;
  }
  const maxValue = max ?? Math.max(...data.map((d) => d.value || 0), 1);
  return (
    <div className="bar-chart">
      {data.map((d) => {
        const width = Math.max((d.value / maxValue) * 100, 4);
        return (
          <div className="bar-row" key={d.name}>
            <div className="name" title={d.name}>{d.name}</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${width}%` }} />
            </div>
            <div className="value">{d.value}</div>
          </div>
        );
      })}
    </div>
  );
}
