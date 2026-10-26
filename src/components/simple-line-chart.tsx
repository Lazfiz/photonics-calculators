"use client";

import { useId, useRef } from "react";

import { useElementWidth } from "@/hooks/use-element-width";
import ChartLegend from "./chart-legend";
import { ChartActions, ChartHover, type HoverSeries, type PlotBox } from "./chart-hover";
import { TICK_FONT, formatTick, formatValue, labelStride, labelWidth, niceTicks, plotValue, splitAtGaps, tickCount } from "./chart-axes";

/** A point; `y: null` is a gap, where the line breaks. */
type Point = { x: number; y: number | null };
type Series = {
  name: string;
  color: string;
  points: Point[];
  dashed?: boolean;
  showPoints?: boolean;
};

type AxisScale = "linear" | "log";

/** Width the server render and the hydration render lay out at, before the container is measured. */
const DEFAULT_WIDTH = 900;

// Rounded to 0.01 px: Node (prerender) and Chrome can differ by 1 ulp, a hydration mismatch at full precision.
const px = (v: number) => Math.round(v * 100) / 100;

/** [min, max] of an axis in plotted units (log10 on a log axis); a single value gets ±half a decade or ±10 %. */
function extent(values: number[], scale: AxisScale): [number, number] {
  const s = values.map((v) => (scale === "log" ? Math.log10(v) : v));
  const lo = Math.min(...s), hi = Math.max(...s);
  if (hi > lo) return [lo, hi];
  const d = scale === "log" ? 0.5 : Math.abs(lo) * 0.1 || 1;
  return [lo - d, hi + d];
}

/**
 * Line chart of x–y series, laid out at the container's measured width (1 SVG unit = 1 px, so ticks render at 11 px on
 * a phone) and `height` px tall. Values ≤ 0 on a log axis and non-finite values are gaps, like `y: null`.
 */
export default function SimpleLineChart({
  title,
  xLabel,
  yLabel,
  series,
  xScale = "linear",
  yScale = "linear",
  height = 320,
}: {
  title?: string;
  xLabel: string;
  yLabel: string;
  series: Series[];
  xScale?: AxisScale;
  yScale?: AxisScale;
  height?: number;
}) {
  const id = useId();
  const [ref, measured] = useElementWidth<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const width = measured ?? DEFAULT_WIDTH;

  const plotted = series.map((s) =>
    s.points.map((p) => {
      const x = plotValue(p.x, xScale === "log"), y = plotValue(p.y, yScale === "log");
      return x === null || y === null ? null : { x, y };
    }),
  );
  const all = plotted.flat().filter((p) => p !== null);

  let body = null;
  let hover: { series: HoverSeries[]; box: PlotBox } | null = null;
  if (all.length > 0) {
    const [xMin, xMax] = extent(all.map((p) => p.x), xScale);
    const [yMin, yMax] = extent(all.map((p) => p.y), yScale);
    const raw = (v: number, scale: AxisScale) => (scale === "log" ? Math.pow(10, v) : v);
    const top = 24, bottom = 56, right = 24;
    const innerH = height - top - bottom;
    const yTicks = niceTicks(raw(yMin, yScale), raw(yMax, yScale), tickCount(innerH, 50), yScale === "log");
    const yText = yTicks.map((v) => formatTick(v, yTicks));
    // Left margin fits the widest y tick label plus the axis title.
    const left = Math.ceil(Math.max(72, Math.max(0, ...yText.map((s) => labelWidth(s, 12))) + 10 + 30));
    const innerW = width - left - right;
    const scaled = (v: number, scale: AxisScale) => (scale === "log" ? Math.log10(v) : v);
    const xAt = (x: number) => px(left + ((scaled(x, xScale) - xMin) / (xMax - xMin)) * innerW);
    const yAt = (y: number) => px(top + innerH - ((scaled(y, yScale) - yMin) / (yMax - yMin)) * innerH);
    const xTicks = niceTicks(raw(xMin, xScale), raw(xMax, xScale), tickCount(innerW, 100), xScale === "log");
    const xText = xTicks.map((v) => formatTick(v, xTicks));
    const xStride = labelStride(xTicks.map(xAt), xText.map((s) => labelWidth(s, 12)));
    hover = {
      box: { left, top, width: innerW, height: innerH },
      series: series.map((s, si) => ({
        name: s.name,
        color: s.color,
        points: plotted[si].flatMap((p) => (p ? [{ x: xAt(p.x), y: yAt(p.y), xText: formatValue(p.x), yText: formatValue(p.y) }] : [])),
      })),
    };

    body = (
      <>
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect x={left} y={top} width={innerW} height={innerH} />
          </clipPath>
        </defs>

        {yTicks.map((tick, i) => (
          <g key={`y-${i}`}>
            <line x1={left} x2={width - right} y1={yAt(tick)} y2={yAt(tick)} stroke="#374151" strokeWidth="1" />
            <text x={left - 10} y={yAt(tick) + 4} textAnchor="end" fill="#9ca3af" fontSize="12">{yText[i]}</text>
          </g>
        ))}
        {xTicks.map((tick, i) => (
          <g key={`x-${i}`}>
            <line x1={xAt(tick)} x2={xAt(tick)} y1={top} y2={height - bottom} stroke="#374151" strokeWidth="1" />
            {i % xStride === 0 && (
              <text x={xAt(tick)} y={height - bottom + 18} textAnchor="middle" fill="#9ca3af" fontSize="12">{xText[i]}</text>
            )}
          </g>
        ))}

        <line x1={left} x2={left} y1={top} y2={height - bottom} stroke="#9ca3af" />
        <line x1={left} x2={width - right} y1={height - bottom} y2={height - bottom} stroke="#9ca3af" />

        <g clipPath={`url(#${id}-clip)`}>
          {series.map((s, si) => {
            const runs = splitAtGaps(plotted[si]);
            const d = runs.map((run) => run.map((p, k) => `${k ? "L" : "M"} ${xAt(p.x)} ${yAt(p.y)}`).join(" ")).join(" ");
            const lone = runs.filter((run) => run.length === 1).flat();
            return (
              <g key={s.name}>
                <path d={d} fill="none" stroke={s.color} strokeWidth="3" strokeDasharray={s.dashed ? "8 6" : undefined} />
                {(s.showPoints ? runs.flat() : lone).map((p, idx) => <circle key={idx} cx={xAt(p.x)} cy={yAt(p.y)} r="4.5" fill={s.color} />)}
              </g>
            );
          })}
        </g>

        <text x={left + innerW / 2} y={height - 12} textAnchor="middle" fill="#cbd5e1" fontSize="13">{xLabel}</text>
        <text x={18} y={top + innerH / 2} textAnchor="middle" fill="#cbd5e1" fontSize="13" transform={`rotate(-90 18 ${top + innerH / 2})`}>{yLabel}</text>
      </>
    );
  }

  const legend = series.map((s) => ({ name: s.name, color: s.color, kind: "line" as const, dash: s.dashed ? "5 3" : undefined }));
  const csv = () => ({ series: series.map((s) => ({ name: s.name, x: s.points.map((p) => p.x), y: s.points.map((p) => p.y) })), xLabel, yLabel });

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4">
      <div className={`mb-2 flex items-start gap-3 ${title ? "justify-between" : "justify-end"}`}>
        {title && <p className="text-sm font-medium text-gray-200">{title}</p>}
        <ChartActions svgRef={svgRef} title={title} legend={legend} csv={csv} />
      </div>
      <div ref={ref} className="relative">
        {/* Fixed pixel height: the server render (DEFAULT_WIDTH, scaled to fit) and the measured one take the same space. */}
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="block overflow-visible" role="img"
          aria-label={title || `${yLabel} versus ${xLabel}`}>
          {body ?? <text x={width / 2} y={height / 2} textAnchor="middle" fill="#9ca3af" fontSize={TICK_FONT}>No finite values to plot</text>}
        </svg>
        {hover && <ChartHover series={hover.series} box={hover.box} w={width} h={height} xLabel={xLabel} />}
      </div>
      <ChartLegend items={legend} />
    </div>
  );
}
