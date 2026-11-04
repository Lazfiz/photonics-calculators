/** The chart card, or only the caller's classes when the page already draws a card around the chart (`bare`). */
export function chartBoxClass(className = "", bare = false): string | undefined {
  return (bare ? className : `bg-gray-900 border border-gray-800 rounded-lg p-4 ${className}`).trim() || undefined;
}

/**
 * The space a SimpleChart will take, drawn before it can: on the server, while its chunk loads and until its width is
 * measured. Without it every chart appears from nothing and pushes the page down (layout shift, CLS).
 * Mirrors SimpleChart's layout: a titled chart's title row (heading, 24 px buttons, mb-2; an untitled chart's buttons
 * sit in its top margin), then the plot at Plotly's `layout.height` on screens ≥ 700 px, shrinking with the width down
 * to 280 px. A legend or rotated category labels still add a little height when the chart draws.
 */
export function ChartReserve({ layout = {}, title }: { layout?: Record<string, unknown>; title?: string }) {
  const baseH = typeof layout.height === "number" ? layout.height : 400;
  const fixedW = typeof layout.width === "number" ? layout.width : null;
  // A fixed layout.width draws at that width, scaled to fit the box.
  const plot = fixedW !== null
    ? { aspectRatio: `${fixedW} / ${Math.min(baseH, Math.max(Math.min(280, baseH), Math.round((fixedW * baseH) / 700)))}` }
    : { aspectRatio: `700 / ${baseH}`, minHeight: Math.min(280, baseH), maxHeight: baseH };
  return (
    <div aria-hidden="true">
      {title ? (
        <div className="mb-2 flex min-h-6 items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      ) : null}
      <div style={plot} />
    </div>
  );
}

/** ChartReserve in SimpleChart's box, for a chart whose code hasn't loaded yet. */
export default function ChartPlaceholder({ layout, title, className = "", bare = false }: {
  layout?: Record<string, unknown>; title?: string; className?: string; bare?: boolean;
}) {
  return (
    <div className={chartBoxClass(className, bare)}>
      <ChartReserve layout={layout} title={title} />
    </div>
  );
}
