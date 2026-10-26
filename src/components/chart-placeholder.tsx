/**
 * The space a SimpleChart will take, drawn before it can: on the server, while its chunk loads and until its width is
 * measured. Without it every chart appears from nothing and pushes the page down (layout shift, CLS).
 * Mirrors SimpleChart's layout: the title row (heading, 24 px buttons, mb-2), then the plot at Plotly's
 * `layout.height` on screens ≥ 700 px, shrinking with the width down to 280 px. A legend or rotated category labels
 * still add a little height when the chart draws.
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
      <div className={`mb-2 flex min-h-6 items-start gap-3 ${title ? "justify-between" : "justify-end"}`}>
        {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
      </div>
      <div style={plot} />
    </div>
  );
}

/** ChartReserve in SimpleChart's bordered box, for a chart whose code hasn't loaded yet. */
export default function ChartPlaceholder({ layout, title, className = "" }: { layout?: Record<string, unknown>; title?: string; className?: string }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 ${className}`.trim()}>
      <ChartReserve layout={layout} title={title} />
    </div>
  );
}
