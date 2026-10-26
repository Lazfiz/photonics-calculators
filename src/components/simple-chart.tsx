"use client";

import { useId, useRef } from "react";
import type { PlotParams } from "react-plotly.js";

import { useElementWidth } from "@/hooks/use-element-width";
import ChartLegend, { type LegendItem } from "./chart-legend";
import { ChartActions, ChartHover, type HoverSeries } from "./chart-hover";
import {
  LOG_FLOOR, PALETTE, TICK_FONT, dashArray, formatTick, formatValue, labelStride, labelWidth, niceTicks, plotValue, splitAtGaps,
  tickCount, xCategories,
} from "./chart-axes";
// Shared Plotly wrapper to prevent double-bundling
import { PlotlyChart } from "./plotly-chart";
import { ChartReserve } from "./chart-placeholder";

interface Trace {
  x?: (number | string | null)[];
  y?: (number | string | null)[];
  z?: (number | string)[][];
  type?: string;
  mode?: string;
  name?: string;
  line?: { color?: string; width?: number; dash?: string; shape?: string };
  marker?: { color?: string | string[]; size?: number; symbol?: string; colorscale?: string[] };
  fill?: string;
  fillcolor?: string;
  opacity?: number;
  text?: string | string[];
  textposition?: string;
  connectgaps?: boolean;
  showlegend?: boolean;
  [key: string]: unknown;
}

interface SimpleChartProps {
  data: Trace[];
  layout?: Record<string, unknown>;
  config?: Record<string, unknown>;
  title?: string;
  className?: string;
}

/** Plotted point in SVG px; `i` is its index in the trace (per-point colours and text). */
type Pt = { x: number; y: number; i: number };

const AXIS_COLOR = "#4b5563";
const TEXT_COLOR = "#9ca3af";
const Y2_COLOR = "#f97316";

/** Coordinates rounded to 0.01 px: smaller markup, and no 1-ulp differences between renders. */
const px = (v: number) => Math.round(v * 100) / 100;

function axisTitle(axis: Record<string, unknown> | undefined): string {
  const t = axis?.title;
  if (typeof t === "string") return t;
  const text = (t as { text?: unknown } | undefined)?.text;
  return typeof text === "string" ? text : "";
}

/** A Plotly marker: `size` is its diameter in px, as in Plotly. */
function Marker({ p, size, color, symbol, opacity }: { p: Pt; size: number; color: string; symbol?: string; opacity: number }) {
  const r = size / 2;
  if (symbol === "square") return <rect x={px(p.x - r)} y={px(p.y - r)} width={size} height={size} fill={color} opacity={opacity} />;
  if (symbol === "diamond") {
    const d = r * 1.3;
    return <path d={`M${p.x},${px(p.y - d)}L${px(p.x + d)},${p.y}L${p.x},${px(p.y + d)}L${px(p.x - d)},${p.y}Z`} fill={color} opacity={opacity} />;
  }
  if (symbol === "x") {
    return <path d={`M${px(p.x - r)},${px(p.y - r)}L${px(p.x + r)},${px(p.y + r)}M${px(p.x - r)},${px(p.y + r)}L${px(p.x + r)},${px(p.y - r)}`}
      stroke={color} strokeWidth={Math.max(1.5, size / 4)} opacity={opacity} />;
  }
  return <circle cx={p.x} cy={p.y} r={r} fill={color} opacity={opacity} />;
}

/**
 * The chart at `w` px wide, 1 SVG unit = 1 px, so text renders at its nominal size: ticks 11 px, axis titles 13 px.
 * Height follows Plotly's `layout.height` (400) on screens ≥ 700 px and shrinks with the width down to 280 px.
 */
function ChartBody({ data, layout, w, title }: { data: Trace[]; layout: Record<string, unknown>; w: number; title?: string }) {
  const clipId = `${useId().replace(/:/g, "")}-clip`;
  const svgRef = useRef<SVGSVGElement>(null);

  const margin = (layout.margin ?? {}) as Record<string, number | undefined>;
  const baseH = typeof layout.height === "number" ? layout.height : 400;
  const mt = margin.t ?? 30;
  const xaxis = layout.xaxis as Record<string, unknown> | undefined;
  const yaxis = layout.yaxis as Record<string, unknown> | undefined;
  const yaxis2 = layout.yaxis2 as Record<string, unknown> | undefined;
  const hasDualY = !!yaxis2;
  const xLabel = axisTitle(xaxis);
  const yLabel = axisTitle(yaxis);
  const y2Label = axisTitle(yaxis2);
  const gridColor = (xaxis?.gridcolor as string) || (yaxis?.gridcolor as string) || "#1f2937";

  const categories = xCategories(data as { x?: (number | string)[] }[], xaxis?.type);
  // Category labels wider than their slot are rotated (xaxis.tickangle, or −45° as Plotly's auto-rotation) and hang
  // below the axis: make room for the longest one.
  const longestLabel = categories ? Math.max(0, ...categories.map((c) => labelWidth(c))) : 0;
  const roughPlotW = w - (margin.l ?? 60) - (margin.r ?? 20);
  const tickAngle = !categories ? 0
    : typeof xaxis?.tickangle === "number" ? xaxis.tickangle
    : longestLabel > 0.9 * (roughPlotW / Math.max(categories.length, 1)) ? -45 : 0;
  const labelDrop = Math.min(100, longestLabel * Math.abs(Math.sin((tickAngle * Math.PI) / 180)));
  const mbLayout = margin.b ?? 50;
  const mb = Math.max(mbLayout, 50 + labelDrop);
  const h = Math.min(baseH, Math.max(Math.min(280, baseH), Math.round((w * baseH) / 700))) + (mb - mbLayout); // the labels add height, not take it
  const plotH = h - mt - mb;

  // Traces on the right-hand axis: those with yaxis "y2", or by convention every trace after the first.
  const onY2 = data.map((t) => hasDualY && t.yaxis === "y2");
  if (hasDualY && !onY2.some(Boolean)) onY2.fill(true, 1);

  const xLog = !categories && xaxis?.type === "log";
  const yLog = yaxis?.type === "log";
  const y2Log = yaxis2?.type === "log";
  // A category's x is its index, as in Plotly.
  const categoryIndex = new Map(categories?.map((c, i) => [c, i]));
  const xValue = (v: unknown) => (categories ? categoryIndex.get(String(v)) ?? null : plotValue(v, xLog));
  const yValue = (v: unknown, ti: number) => plotValue(v, onY2[ti] ? y2Log : yLog);
  const values = (pick: (t: Trace, ti: number) => (number | null)[]) =>
    data.flatMap(pick).filter((n): n is number => n !== null);
  const allX = values((t) => (t.x ?? []).slice(0, 10000).map(xValue));
  const allY1 = values((t, ti) => (onY2[ti] ? [] : (t.y ?? []).slice(0, 10000).map((v) => yValue(v, ti))));
  const allY2 = values((t, ti) => (onY2[ti] ? (t.y ?? []).slice(0, 10000).map((v) => yValue(v, ti)) : []));
  const heading = title ? <h3 className="text-lg font-semibold">{title}</h3> : null;
  if (allX.length === 0 || allY1.length + allY2.length === 0) return heading && <div className="mb-3">{heading}</div>;

  let xMin = Math.min(...allX);
  let xMax = Math.max(...allX);
  let yMin = allY1.length > 0 ? Math.min(...allY1) : 0;
  let yMax = allY1.length > 0 ? Math.max(...allY1) : 1;
  let y2Min = allY2.length > 0 ? Math.min(...allY2) : 0;
  let y2Max = allY2.length > 0 ? Math.max(...allY2) : 1;
  // Bars start at zero, so a linear axis that holds bars includes it (as Plotly's autorange does).
  const barIndices = data.flatMap((t, i) => (t.type === "bar" ? [i] : []));
  if (!yLog && allY1.length > 0 && barIndices.some((i) => !onY2[i])) { yMin = Math.min(yMin, 0); yMax = Math.max(yMax, 0); }
  if (!y2Log && allY2.length > 0 && barIndices.some((i) => onY2[i])) { y2Min = Math.min(y2Min, 0); y2Max = Math.max(y2Max, 0); }

  const xRange = xaxis?.range as number[] | undefined;
  const yRange = yaxis?.range as number[] | undefined;
  const y2Range = yaxis2?.range as number[] | undefined;
  if (xRange) { xMin = xRange[0]; xMax = xRange[1]; }
  if (yRange) { yMin = yRange[0]; yMax = yRange[1]; }
  if (y2Range) { y2Min = y2Range[0]; y2Max = y2Range[1]; }

  const rawXMin = xMin, rawXMax = xMax, rawYMin = yMin, rawYMax = yMax;
  const rawY2Min = y2Min, rawY2Max = y2Max;
  const lg = (v: number) => Math.log10(Math.max(v, LOG_FLOOR));
  if (xLog) { xMin = lg(xMin); xMax = lg(xMax); }
  if (yLog) { yMin = lg(yMin); yMax = lg(yMax); }
  if (y2Log) { y2Min = lg(y2Min); y2Max = lg(y2Max); }

  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;
  const y2Span = y2Max - y2Min || 1;
  const pad = 0.05;
  xMin -= xSpan * pad; xMax += xSpan * pad;
  yMin -= ySpan * pad; yMax += ySpan * pad;
  y2Min -= y2Span * pad; y2Max += y2Span * pad;
  if (categories && !xRange) { xMin = -0.5; xMax = categories.length - 0.5; } // one slot per category

  const toSvgY = (v: number) => px(mt + plotH - (((yLog ? lg(v) : v) - yMin) / (yMax - yMin)) * plotH);
  const toSvgY2 = (v: number) => px(mt + plotH - (((y2Log ? lg(v) : v) - y2Min) / (y2Max - y2Min)) * plotH);
  const yTicks = niceTicks(rawYMin, rawYMax, tickCount(plotH, 50), yLog);
  const y2Ticks = hasDualY ? niceTicks(rawY2Min, rawY2Max, tickCount(plotH, 50), y2Log) : [];
  const yTickText = yTicks.map((v) => formatTick(v, yTicks));
  const y2TickText = y2Ticks.map((v) => formatTick(v, y2Ticks));

  // Margins grow to fit the tick labels and axis titles (Plotly's automargin), never shrink below layout.margin.
  const widest = (labels: string[]) => Math.max(0, ...labels.map((s) => labelWidth(s)));
  const ml = Math.ceil(Math.max(margin.l ?? 60, widest(yTickText) + 8 + (yLabel ? 24 : 6)));
  const mr = Math.ceil(Math.max(margin.r ?? 20, hasDualY ? widest(y2TickText) + 8 + (y2Label ? 24 : 6) : 0));
  const plotW = w - ml - mr;

  const toSvgX = (v: number) => px(ml + (((xLog ? lg(v) : v) - xMin) / (xMax - xMin)) * plotW);
  const xTicks = categories ? categories.map((_, i) => i) : niceTicks(rawXMin, rawXMax, tickCount(plotW, 100), xLog);
  const xTickText = xTicks.map((v) => (categories ? categories[v] : formatTick(v, xTicks)));
  const xStride = tickAngle ? 1 : labelStride(xTicks.map(toSvgX), xTickText.map((s) => labelWidth(s)));

  const colorOf = (t: Trace, ti: number) => t.line?.color ?? (typeof t.marker?.color === "string" ? t.marker.color : PALETTE[ti % PALETTE.length]);
  const markerColor = (t: Trace, ti: number, i: number) => {
    const c = t.marker?.color;
    return (Array.isArray(c) ? c[i] : c) ?? t.line?.color ?? PALETTE[ti % PALETTE.length];
  };

  const points = data.map((t, ti): (Pt | null)[] => {
    const tx = t.x ?? [], ty = t.y ?? [];
    const yMap = onY2[ti] ? toSvgY2 : toSvgY;
    return Array.from({ length: Math.min(tx.length, ty.length) }, (_, i) => {
      const x = xValue(tx[i]), y = yValue(ty[i], ti);
      return x === null || y === null ? null : { x: toSvgX(x), y: yMap(y), i };
    });
  });

  // Plotly's default barmode "group" puts the bar traces side by side in each slot; "overlay" and "stack" draw them
  // over each other (stacking isn't drawn).
  const groupBars = layout.barmode !== "overlay" && layout.barmode !== "stack" && barIndices.length > 1;
  const barGeometry = (ti: number) => {
    const slot = categories ? plotW / categories.length : plotW / Math.max(data[ti].x?.length ?? 0, 1);
    const barW = Math.max(2, groupBars ? (slot * 0.8) / barIndices.length : slot * 0.6);
    return { barW, offset: groupBars ? (barIndices.indexOf(ti) - (barIndices.length - 1) / 2) * barW : 0 };
  };
  const plotBottom = mt + plotH;

  const legendItems: LegendItem[] = data.flatMap((t, ti) => {
    if (!t.name || t.showlegend === false) return [];
    const mode = t.mode ?? "lines";
    const kind = t.type === "bar" || (mode === "none" && t.fill) ? "bar" : mode.includes("lines") ? "line" : "marker";
    const color = kind === "line" ? colorOf(t, ti) : markerColor(t, ti, 0);
    return [{ name: t.name, color, kind, dash: kind === "line" ? dashArray(t.line?.dash) : undefined }];
  });
  const showLegend = layout.showlegend === true || (layout.showlegend !== false && data.length > 1);

  const traceName = (t: Trace, ti: number) => t.name || (onY2[ti] ? y2Label : yLabel) || `Trace ${ti + 1}`;
  // Filled shapes (toself), text-only label traces and hoverinfo "skip"/"none" aren't read out.
  const hoverSeries: HoverSeries[] = data.flatMap((t, ti) => {
    if (t.fill === "toself" || t.mode === "text" || t.hoverinfo === "skip" || t.hoverinfo === "none") return [];
    const offset = t.type === "bar" ? barGeometry(ti).offset : 0;
    const hoverPoints = points[ti].filter((p): p is Pt => p !== null).map((p) => ({
      x: p.x, y: p.y, cx: offset ? px(p.x + offset) : undefined,
      xText: categories ? String(t.x?.[p.i]) : formatValue(Number(t.x?.[p.i])),
      yText: formatValue(Number(t.y?.[p.i])),
    }));
    return hoverPoints.length > 0 ? [{ name: traceName(t, ti), color: colorOf(t, ti), points: hoverPoints }] : [];
  });
  const csv = () => ({
    series: data.flatMap((t, ti) => (t.x && t.y ? [{ name: traceName(t, ti), x: t.x, y: t.y }] : [])),
    xLabel, yLabel: hasDualY ? "" : yLabel, // two y axes: a long-format "y" column holds both
  });

  return (
    <>
      <div className={`mb-2 flex items-start gap-3 ${heading ? "justify-between" : "justify-end"}`}>
        {heading}
        <ChartActions svgRef={svgRef} title={title} legend={showLegend ? legendItems : []} csv={csv} />
      </div>
      <div className="relative">
      <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} className="block w-full h-auto overflow-visible" role="img" aria-label={title || "Chart"}>
        <title>{title || "Chart"}</title>
        <desc>{xLabel ? `${xLabel} vs ${yLabel}` : "Data visualization"}</desc>
        <defs>
          <clipPath id={clipId}>
            <rect x={ml} y={mt} width={plotW} height={plotH} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {xTicks.map((v) => (
          <line key={`xg${v}`} x1={toSvgX(v)} y1={mt} x2={toSvgX(v)} y2={plotBottom} stroke={gridColor} strokeWidth={0.5} />
        ))}
        {yTicks.map((v) => (
          <line key={`yg${v}`} x1={ml} y1={toSvgY(v)} x2={ml + plotW} y2={toSvgY(v)} stroke={gridColor} strokeWidth={0.5} />
        ))}

        {/* Axes */}
        <line x1={ml} y1={mt} x2={ml} y2={plotBottom} stroke={AXIS_COLOR} strokeWidth={1} />
        <line x1={ml} y1={plotBottom} x2={ml + plotW} y2={plotBottom} stroke={AXIS_COLOR} strokeWidth={1} />
        {hasDualY && <line x1={ml + plotW} y1={mt} x2={ml + plotW} y2={plotBottom} stroke={AXIS_COLOR} strokeWidth={1} />}

        {/* X tick labels (thinned to every xStride-th when they would overlap) */}
        {xTicks.map((v, k) => k % xStride !== 0 ? null : (
          <text key={`xl${v}`} x={toSvgX(v)} y={plotBottom + 18} textAnchor={tickAngle ? "end" : "middle"}
            transform={tickAngle ? `rotate(${tickAngle}, ${toSvgX(v)}, ${plotBottom + 18})` : undefined}
            fill={TEXT_COLOR} fontSize={TICK_FONT}>{xTickText[k]}</text>
        ))}

        {/* Y tick labels */}
        {yTicks.map((v, k) => (
          <text key={`yl${v}`} x={ml - 8} y={toSvgY(v) + 4} textAnchor="end" fill={TEXT_COLOR} fontSize={TICK_FONT}>{yTickText[k]}</text>
        ))}

        {xLabel && (
          <text x={ml + plotW / 2} y={h - 4} textAnchor="middle" fill={TEXT_COLOR} fontSize={13}>{xLabel}</text>
        )}
        {yLabel && (
          <text x={14} y={mt + plotH / 2} textAnchor="middle" fill={TEXT_COLOR} fontSize={13}
            transform={`rotate(-90, 14, ${mt + plotH / 2})`}>{yLabel}</text>
        )}

        {/* Y2 axis (right) */}
        {y2Ticks.map((v, k) => (
          <text key={`y2l${v}`} x={ml + plotW + 8} y={toSvgY2(v) + 4} textAnchor="start" fill={Y2_COLOR} fontSize={TICK_FONT}>{y2TickText[k]}</text>
        ))}
        {hasDualY && y2Label && (
          <text x={w - 8} y={mt + plotH / 2} textAnchor="middle" fill={Y2_COLOR} fontSize={13}
            transform={`rotate(90, ${w - 8}, ${mt + plotH / 2})`}>{y2Label}</text>
        )}

        {/* Bar traces */}
        {barIndices.map((ti) => {
          const t = data[ti];
          const [lo, hi, log] = onY2[ti] ? [y2Min, y2Max, y2Log] : [yMin, yMax, yLog];
          const yMap = onY2[ti] ? toSvgY2 : toSvgY;
          // Bars grow from 0, or from the plot's edge when 0 is off the axis (log: the bottom).
          const y0 = yMap(log ? Math.pow(10, lo) : Math.min(Math.max(0, lo), hi));
          const { barW, offset } = barGeometry(ti);
          return points[ti].map((p) => p && (
            <rect key={`bar${ti}-${p.i}`} x={px(p.x + offset - barW / 2)} y={Math.min(y0, p.y)} width={px(barW)}
              height={px(Math.abs(y0 - p.y))} fill={markerColor(t, ti, p.i)} opacity={t.opacity ?? 0.8} rx={1} />
          ));
        })}

        {/* Line and marker traces */}
        <g clipPath={`url(#${clipId})`}>
          {data.map((t, ti) => {
            if (t.type === "bar") return null;
            const runs = splitAtGaps(points[ti], t.connectgaps === true);
            if (runs.length === 0) return null;
            const color = colorOf(t, ti);
            const mode = t.mode ?? "lines";
            const pathOf = (run: Pt[]) => run.map((p, k) => `${k ? "L" : "M"}${p.x},${p.y}`).join("");
            // tozeroy fills down to y = 0 (the plot's bottom edge when 0 is off the axis or the axis is log).
            const zeroY = (onY2[ti] ? y2Log : yLog) ? plotBottom : Math.min(plotBottom, Math.max(mt, (onY2[ti] ? toSvgY2 : toSvgY)(0)));
            const fill = t.fill === "tozeroy"
              ? runs.map((r) => `${pathOf(r)}L${r[r.length - 1].x},${zeroY}L${r[0].x},${zeroY}Z`).join("")
              : t.fill === "toself" ? `${pathOf(runs.flat())}Z` : null;
            const size = t.marker?.size ?? 6;
            const texts = mode.includes("text") ? t.text : undefined;
            const textDy = t.textposition?.startsWith("bottom") ? size / 2 + 12 : t.textposition?.startsWith("middle") ? 4 : -(size / 2 + 4);
            return (
              <g key={`trace${ti}`}>
                {fill && <path d={fill} fill={t.fillcolor ?? color} fillOpacity={t.fillcolor ? undefined : 0.15} stroke="none" />}
                {mode.includes("lines") && (
                  <path d={runs.map(pathOf).join("")} fill="none" stroke={color} strokeWidth={t.line?.width ?? 2}
                    strokeDasharray={dashArray(t.line?.dash)} strokeLinejoin="round" />
                )}
                {mode.includes("markers") && runs.flat().map((p) => (
                  <Marker key={p.i} p={p} size={size} color={markerColor(t, ti, p.i)} symbol={t.marker?.symbol} opacity={t.opacity ?? 0.8} />
                ))}
                {texts !== undefined && runs.flat().map((p) => {
                  const s = Array.isArray(texts) ? texts[p.i] : texts;
                  return s ? <text key={`t${p.i}`} x={p.x} y={px(p.y + textDy)} textAnchor="middle" fill={TEXT_COLOR} fontSize={TICK_FONT}>{s}</text> : null;
                })}
              </g>
            );
          })}
        </g>
      </svg>
      <ChartHover series={hoverSeries} box={{ left: ml, top: mt, width: plotW, height: plotH }} w={w} h={h} xLabel={xLabel} />
      </div>
      {showLegend && <ChartLegend items={legendItems} />}
    </>
  );
}

export default function SimpleChart({ data, layout = {}, config = {}, title, className = "" }: SimpleChartProps) {
  const [ref, measured] = useElementWidth<HTMLDivElement>();
  const needsPlotly = data.some((t) =>
    t.type === "scatter3d" || t.type === "surface" || t.type === "heatmap" || t.type === "contour" ||
    t.type === "scatterpolar" || t.type === "scattergl" || t.type === "pie");
  if (needsPlotly) {
    return <PlotlyFallback data={data} layout={layout} config={config} title={title} className={className} />;
  }
  // A fixed layout.width draws at that width, scaled to fit; otherwise the chart lays out at the measured width.
  const w = typeof layout.width === "number" ? layout.width : measured;
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 ${className}`.trim()}>
      <div ref={ref}>{w !== null ? <ChartBody data={data} layout={layout} w={w} title={title} /> : <ChartReserve layout={layout} title={title} />}</div>
    </div>
  );
}

function PlotlyFallback({ data, layout, config, title, className }: SimpleChartProps) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 ${className}`.trim()}>
      {title ? <h3 className="text-lg font-semibold mb-3">{title}</h3> : null}
      <PlotlyChart
        data={data as PlotParams["data"]}
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
