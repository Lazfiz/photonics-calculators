"use client";

import { useMemo, useId } from "react";

interface Trace {
  x?: (number | string)[];
  y?: (number | string)[];
  z?: (number | string)[][];
  type?: string;
  mode?: string;
  name?: string;
  line?: { color?: string; width?: number; dash?: string; shape?: string };
  marker?: { color?: string; size?: number; symbol?: string; colorscale?: string[] };
  fill?: string;
  fillcolor?: string;
  opacity?: number;
  text?: string;
  [key: string]: unknown;
}

interface SimpleChartProps {
  data: Trace[];
  layout?: Record<string, unknown>;
  config?: Record<string, unknown>;
  title?: string;
  className?: string;
}

function getDash(dash?: string): string {
  if (!dash) return "none";
  if (dash === "dash") return "6,3";
  if (dash === "dot") return "2,2";
  if (dash === "dashdot") return "6,3,2,3";
  if (dash === "longdash") return "10,5";
  return "none";
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function SimpleChart({ data, layout = {}, config = {}, title, className = "" }: SimpleChartProps) {
  // Check if any trace uses 3D or special types that need Plotly
  const needsPlotly = useMemo(() => {
    return data.some(t =>
      t.type === "scatter3d" ||
      t.type === "surface" ||
      t.type === "heatmap" ||
      t.type === "contour" ||
      t.type === "scatterpolar" ||
      t.type === "scattergl" ||
      t.type === "pie"
    );
  }, [data]);

  // If we need Plotly for 3D/special charts, fall back
  if (needsPlotly) {
    // Dynamic import to avoid bundling Plotly for simple charts
    return <PlotlyFallback data={data} layout={layout} config={config} title={title} className={className} />;
  }

  const w = typeof layout.width === "number" ? layout.width : 700;
  const h = typeof layout.height === "number" ? layout.height : 400;
  const ml = (layout.margin as Record<string, number>)?.l ?? 60;
  const mr = (layout.margin as Record<string, number>)?.r ?? 20;
  const mt = (layout.margin as Record<string, number>)?.t ?? 30;
  const mb = (layout.margin as Record<string, number>)?.b ?? 50;

  const plotW = w - ml - mr;
  const plotH = h - mt - mb;

  const xaxis = layout.xaxis as Record<string, unknown> | undefined;
  const yaxis = layout.yaxis as Record<string, unknown> | undefined;
  const showLegend = layout.showlegend !== false && data.length > 1;

  // Compute scales
  // Handle title being string or { text: string }
  const xLabel = typeof xaxis?.title === "string" ? xaxis.title : (xaxis?.title as Record<string, string>)?.text || "";
  const yLabel = typeof yaxis?.title === "string" ? yaxis.title : (yaxis?.title as Record<string, string>)?.text || "";
  const gridColor = (xaxis?.gridcolor as string) || (yaxis?.gridcolor as string) || "#1f2937";
  const textColor = "#9ca3af";

  // Get all x/y values across traces
  // Unique ID for this chart instance (prevents clipPath collisions across multiple charts)
  const chartId = useId().replace(/:/g, "");

  const allX = data.flatMap(t => ((t.x ?? []) as (number | string)[]).slice(0, 10000).map(Number)).filter(n => !isNaN(n));
  const allY = data.flatMap(t => ((t.y ?? []) as (number | string)[]).slice(0, 10000).map(Number)).filter(n => !isNaN(n));

  if (allX.length === 0 || allY.length === 0) return null;

  let xMin = Math.min(...allX);
  let xMax = Math.max(...allX);
  let yMin = Math.min(...allY);
  let yMax = Math.max(...allY);

  // Apply ranges if specified
  const xRange = xaxis?.range as number[] | undefined;
  const yRange = yaxis?.range as number[] | undefined;
  if (xRange) { xMin = xRange[0]; xMax = xRange[1]; }
  if (yRange) { yMin = yRange[0]; yMax = yRange[1]; }

  // Log scale support — save raw bounds for tick generation
  const xLog = xaxis?.type === "log";
  const yLog = yaxis?.type === "log";
  const rawXMin = xMin, rawXMax = xMax, rawYMin = yMin, rawYMax = yMax;
  if (xLog) { xMin = Math.log10(Math.max(xMin, 1e-10)); xMax = Math.log10(Math.max(xMax, 1e-10)); }
  if (yLog) { yMin = Math.log10(Math.max(yMin, 1e-10)); yMax = Math.log10(Math.max(yMax, 1e-10)); }

  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;
  const pad = 0.05;
  xMin -= xSpan * pad; xMax += xSpan * pad;
  yMin -= ySpan * pad; yMax += ySpan * pad;

  const toSvgX = (v: number) => {
    let n = v;
    if (xLog) n = Math.log10(Math.max(n, 1e-10));
    return ml + ((n - xMin) / (xMax - xMin)) * plotW;
  };
  const toSvgY = (v: number) => {
    let n = v;
    if (yLog) n = Math.log10(Math.max(n, 1e-10));
    return mt + plotH - ((n - yMin) / (yMax - yMin)) * plotH;
  };

  // Compute nice tick values
  function niceTicks(min: number, max: number, count: number, log: boolean): number[] {
    if (log) {
      const lo = Math.ceil(Math.log10(Math.max(min, 1e-10)));
      const hi = Math.floor(Math.log10(Math.max(max, 1e-10)));
      const ticks: number[] = [];
      for (let p = lo; p <= hi; p++) {
        ticks.push(Math.pow(10, p));
        if (hi - lo <= 4) { ticks.push(2 * Math.pow(10, p)); ticks.push(5 * Math.pow(10, p)); }
      }
      return ticks.filter(t => t >= min * 0.9 && t <= max * 1.1);
    }
    const range = max - min;
    if (range <= 0 || !isFinite(range)) return [];
    const rough = range / count;
    if (rough <= 0 || !isFinite(rough)) return [];
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const nice = [1, 2, 5, 10].find(n => n * mag >= rough) || 10 * mag;
    const ticks: number[] = [];
    let t = Math.ceil(min / nice) * nice;
    let safety = 0;
    while (t <= max && safety < 100) { ticks.push(t); t += nice; safety++; }
    return ticks;
  }

  const xTicks = niceTicks(rawXMin, rawXMax, 6, xLog);
  const yTicks = niceTicks(rawYMin, rawYMax, 6, yLog);

  function formatTick(v: number): string {
    if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + "M";
    if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + "k";
    if (Math.abs(v) < 0.01 && v !== 0) return v.toExponential(1);
    if (Number.isInteger(v)) return v.toString();
    return v.toFixed(2);
  }

  // Build paths for each trace
  const paths = data.map(trace => {
    const tx = trace.x ?? [];
    const ty = trace.y ?? [];
    if (tx.length === 0 || ty.length === 0) return null;
    const points: string[] = [];
    for (let i = 0; i < Math.min(tx.length, ty.length); i++) {
      const xv = Number(tx[i]);
      const yv = Number(ty[i]);
      if (isNaN(xv) || isNaN(yv)) continue;
      points.push(`${toSvgX(xv)},${toSvgY(yv)}`);
    }
    return points;
  });

  // For bar charts
  const barTraces = data.filter(t => t.type === "bar");
  const lineTraces = data.filter(t => t.type !== "bar");

  // Build legend items
  const legendItems = data.filter(t => t.name).map(t => ({
    name: t.name!,
    color: t.line?.color || t.marker?.color || "#60a5fa",
    dash: t.line?.dash,
  }));

  // Responsive wrapper
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 ${className}`.trim()}>
      {title ? <h3 className="text-lg font-semibold mb-3">{title}</h3> : null}
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxWidth: w }}>
        {/* Grid lines */}
        {xTicks.map(v => (
          <line key={`xg${v}`} x1={toSvgX(v)} y1={mt} x2={toSvgX(v)} y2={mt + plotH}
            stroke={gridColor} strokeWidth={0.5} />
        ))}
        {yTicks.map(v => (
          <line key={`yg${v}`} x1={ml} y1={toSvgY(v)} x2={ml + plotW} y2={toSvgY(v)}
            stroke={gridColor} strokeWidth={0.5} />
        ))}

        {/* Axes */}
        <line x1={ml} y1={mt} x2={ml} y2={mt + plotH} stroke="#4b5563" strokeWidth={1} />
        <line x1={ml} y1={mt + plotH} x2={ml + plotW} y2={mt + plotH} stroke="#4b5563" strokeWidth={1} />

        {/* X tick labels */}
        {xTicks.map(v => (
          <text key={`xl${v}`} x={toSvgX(v)} y={mt + plotH + 18} textAnchor="middle"
            fill={textColor} fontSize={11}>{formatTick(v)}</text>
        ))}

        {/* Y tick labels */}
        {yTicks.map(v => (
          <text key={`yl${v}`} x={ml - 8} y={toSvgY(v) + 4} textAnchor="end"
            fill={textColor} fontSize={11}>{formatTick(v)}</text>
        ))}

        {/* X axis label */}
        {xLabel && (
          <text x={ml + plotW / 2} y={h - 4} textAnchor="middle" fill={textColor} fontSize={13}>
            {xLabel}
          </text>
        )}

        {/* Y axis label */}
        {yLabel && (
          <text x={14} y={mt + plotH / 2} textAnchor="middle" fill={textColor} fontSize={13}
            transform={`rotate(-90, 14, ${mt + plotH / 2})`}>
            {yLabel}
          </text>
        )}

        {/* Bar traces */}
        {barTraces.map((trace, ti) => {
          const tx = trace.x ?? [];
          const ty = trace.y ?? [];
          if (tx.length === 0 || ty.length === 0) return null;
          const color = trace.marker?.color || ["#60a5fa", "#f97316", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"][ti % 6];
          const barW = Math.max(2, (plotW / Math.max(tx.length, 1)) * 0.6);
          return tx.map((xv, i) => {
            const x = Number(xv), y = Number(ty[i]);
            if (isNaN(x) || isNaN(y)) return null;
            const base = yLog ? Math.log10(Math.max(yMin > 0 ? yMin : 1e-10, 1e-10)) : Math.min(0, yMin);
            const bx = toSvgX(x) - barW / 2;
            const by = toSvgY(y);
            const bh = toSvgY(base) - by;
            return (
              <rect key={`bar${ti}-${i}`} x={bx} y={by} width={barW} height={Math.max(bh, 0)}
                fill={typeof color === "string" ? color : "#60a5fa"} opacity={trace.opacity ?? 0.8} rx={1} />
            );
          });
        })}

        {/* Line traces with fill */}
        {lineTraces.map((trace, ti) => {
          const pts = paths[ti];
          if (!pts || pts.length === 0) return null;
          const color = trace.line?.color || ["#60a5fa", "#f97316", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#eab308", "#ec4899"][ti % 8];
          const width = trace.line?.width ?? 2;
          const dash = getDash(trace.line?.dash);
          const mode = trace.mode || "lines";
          const showFill = trace.fill && trace.fill !== "none";
          const fillDir = trace.fill; // "tozeroy", "toself", etc.

          // Build SVG path
          const d = pts.join(" L");

          // Fill path (tozeroy = fill to bottom)
          const fillPath = showFill && fillDir === "tozeroy" && pts.length > 0
            ? `M${pts[0]} L${pts.join(" L")} L${pts[pts.length - 1].split(",")[0]},${mt + plotH} L${pts[0].split(",")[0]},${mt + plotH} Z`
            : showFill && fillDir === "toself" && pts.length > 0
            ? `M${pts[0]} L${pts.join(" L")} Z`
            : null;

          // Clip path to plot area
          const clipId = `${chartId}-clip-${ti}`;
          return (
            <g key={`trace${ti}`} clipPath={`url(#${clipId})`}>
              <clipPath id={clipId}>
                <rect x={ml} y={mt} width={plotW} height={plotH} />
              </clipPath>
              {fillPath && (
                <path d={fillPath} fill={hexToRgba(typeof color === "string" ? color : "#60a5fa", 0.15)} stroke="none" />
              )}
              {mode.includes("lines") && (
                <path d={`M${d}`} fill="none" stroke={color} strokeWidth={width}
                  strokeDasharray={dash} strokeLinejoin="round" />
              )}
              {mode.includes("markers") && pts.map((p, i) => (
                <circle key={i} cx={Number(p.split(",")[0])} cy={Number(p.split(",")[1])}
                  r={trace.marker?.size || 4} fill={color} opacity={trace.opacity ?? 0.8} />
              ))}
            </g>
          );
        })}

        {/* Legend */}
        {showLegend && (
          <g transform={`translate(${ml + plotW - 10}, ${mt + 5})`}>
            {legendItems.map((item, i) => (
              <g key={i} transform={`translate(0, ${i * 18})`}>
                <line x1={-60} y1={0} x2={-40} y2={0} stroke={item.color} strokeWidth={2}
                  strokeDasharray={getDash(item.dash)} />
                <text x={-35} y={4} fill={textColor} fontSize={11}>{item.name}</text>
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

// Lazy-loaded Plotly fallback for 3D/special charts
import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

function PlotlyFallback({ data, layout, config, title, className }: SimpleChartProps) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 ${className}`.trim()}>
      {title ? <h3 className="text-lg font-semibold mb-3">{title}</h3> : null}
      <Plot
        data={data as any[]}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          margin: { t: 30, r: 20, b: 50, l: 60 },
          height: 400,
          ...layout,
        }}
        config={{ responsive: true, displayModeBar: false, ...config }}
        className="w-full"
      />
    </div>
  );
}
