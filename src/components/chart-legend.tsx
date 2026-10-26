export type LegendItem = {
  name: string;
  color: string;
  /** Swatch: a line (with `dash`), a marker dot, or a bar square. */
  kind: "line" | "marker" | "bar";
  dash?: string;
};

/**
 * Legend below a chart, as wrapping HTML: long names wrap instead of being clipped at the plot's edge, and the legend
 * can't cover data or the right-hand axis. Plotly `layout.legend` positions are not followed.
 */
export default function ChartLegend({ items }: { items: readonly LegendItem[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-300" aria-label="Legend">
      {items.map((item, i) => (
        <li key={`${i}-${item.name}`} className="flex items-center gap-2">
          <svg width="20" height="10" aria-hidden="true" className="shrink-0">
            {item.kind === "line" && (
              <line x1="1" y1="5" x2="19" y2="5" stroke={item.color} strokeWidth="2.5" strokeDasharray={item.dash} />
            )}
            {item.kind === "marker" && <circle cx="10" cy="5" r="4" fill={item.color} />}
            {item.kind === "bar" && <rect x="5" y="0" width="10" height="10" rx="1" fill={item.color} />}
          </svg>
          <span>{item.name}</span>
        </li>
      ))}
    </ul>
  );
}
