"use client";

import { useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";

import type { LegendItem } from "./chart-legend";
import { chartCsv, fileStem, type CsvSeries } from "./chart-axes";

/**
 * A hoverable point: its SVG position (1 unit = 1 px) and its values as the readout prints them. `cx`: where the dot
 * is drawn when it isn't at `x` (a grouped bar, which snaps to its category's centre).
 */
export type HoverPoint = { x: number; y: number; xText: string; yText: string; cx?: number };
export type HoverSeries = { name: string; color: string; points: HoverPoint[] };
/** The plot area in SVG units. */
export type PlotBox = { left: number; top: number; width: number; height: number };

/** A series is listed in the readout when its nearest point lies within this many px of the crosshair. */
const SNAP_PX = 24;

function nearest(points: readonly HoverPoint[], x: number): HoverPoint | null {
  let best: HoverPoint | null = null;
  for (const p of points) if (!best || Math.abs(p.x - x) < Math.abs(best.x - x)) best = p;
  return best;
}

/** The readout at crosshair x `at`: per series (index `si`), its point nearest in x, if within SNAP_PX. */
export function hoverRows(series: readonly HoverSeries[], at: number) {
  return series.flatMap((s, si) => {
    const p = nearest(s.points, at);
    return p && Math.abs(p.x - at) <= SNAP_PX ? [{ s, p, si }] : [];
  });
}

/**
 * The readout sits beside the crosshair (at fraction `fx` of the width), on the side with more room, and wraps to fit
 * that room: on a phone it never runs off the chart's edge.
 */
function readoutPosition(fx: number, fy: number) {
  const pct = `${(fx * 100).toFixed(2)}%`;
  return fx > 0.5
    ? { right: `calc(100% - ${pct} + 12px)`, top: `${fy * 100}%`, maxWidth: `min(16rem, calc(${pct} - 12px))` }
    : { left: `calc(${pct} + 12px)`, top: `${fy * 100}%`, maxWidth: `min(16rem, calc(100% - ${pct} - 12px))` };
}

/**
 * Hover crosshair and readout over an SVG chart `w` × `h` units: a transparent SVG on top of the chart, so moving the
 * pointer re-renders only this layer. The crosshair snaps to the nearest data x; the readout lists, per series, the
 * point nearest to it (Plotly's "x unified" hover). Mouse: follows the pointer. Touch: tap or drag (vertical scrolling
 * still pans), and the readout stays after the finger lifts. Keyboard: focus the chart, ←/→ step through the x values
 * (Shift: 10 at a time), Home/End, Esc hides. Render inside a `relative` box that holds only the chart SVG.
 */
export function ChartHover({ series, box, w, h, xLabel }: { series: HoverSeries[]; box: PlotBox; w: number; h: number; xLabel: string }) {
  const [at, setAt] = useState<number | null>(null);
  const [viaKeyboard, setViaKeyboard] = useState(false);

  const snap = (x: number) => nearest(series.flatMap((s) => s.points), x)?.x ?? null;

  function onPointer(e: PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) * w) / r.width;
    const y = ((e.clientY - r.top) * h) / r.height;
    const inside = x >= box.left - 8 && x <= box.left + box.width + 8 && y >= box.top - 8 && y <= box.top + box.height + 8;
    if (inside) setAt(snap(x));
    else if (e.pointerType === "mouse") setAt(null);
    setViaKeyboard(false);
  }

  function onKeyDown(e: KeyboardEvent<SVGSVGElement>) {
    const xs = [...new Set(series.flatMap((s) => s.points.map((p) => p.x)))].sort((a, b) => a - b);
    if (xs.length === 0) return;
    const i = at === null ? -1 : xs.indexOf(at);
    const step = e.shiftKey ? 10 : 1;
    let next: number | null;
    if (e.key === "ArrowRight") next = xs[i < 0 ? 0 : Math.min(xs.length - 1, i + step)];
    else if (e.key === "ArrowLeft") next = xs[i < 0 ? xs.length - 1 : Math.max(0, i - step)];
    else if (e.key === "Home") next = xs[0];
    else if (e.key === "End") next = xs[xs.length - 1];
    else if (e.key === "Escape") next = null;
    else return;
    e.preventDefault();
    setAt(next);
    setViaKeyboard(true);
  }

  const rows = at === null ? [] : hoverRows(series, at);
  const header = rows.find((r) => r.p.x === at)?.p.xText ?? rows[0]?.p.xText;
  const text = rows.length === 0 ? "" : `${xLabel ? `${xLabel}: ` : ""}${header}; ${rows.map((r) => `${r.s.name}: ${r.p.yText}`).join("; ")}`;
  const inPlot = (y: number) => y >= box.top && y <= box.top + box.height;

  return (
    <>
      <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
        data-export="skip" tabIndex={0} aria-label="Chart values: use the left and right arrow keys to read them"
        onPointerMove={onPointer} onPointerDown={onPointer}
        onPointerLeave={(e) => e.pointerType === "mouse" && setAt(null)} onBlur={() => viaKeyboard && setAt(null)} onKeyDown={onKeyDown}>
        {at !== null && rows.length > 0 && (
          <g pointerEvents="none">
            <line x1={at} y1={box.top} x2={at} y2={box.top + box.height} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3,3" />
            {rows.map(({ s, p, si }) => inPlot(p.y) && (
              <circle key={si} cx={p.cx ?? p.x} cy={p.y} r={4.5} fill={s.color} stroke="#111827" strokeWidth={1.5} />
            ))}
          </g>
        )}
      </svg>
      {at !== null && rows.length > 0 && (
        <div className="pointer-events-none absolute z-10 w-max rounded-md border border-gray-700 bg-gray-950/95 px-2 py-1 text-xs leading-5 text-gray-200 shadow-lg"
          style={readoutPosition(at / w, box.top / h)} aria-hidden="true">
          <div className="text-gray-400">{xLabel ? `${xLabel}: ` : ""}<span className="text-gray-100">{header}</span></div>
          {rows.map(({ s, p, si }) => (
            <div key={si} className="flex items-baseline gap-1.5">
              <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span>{s.name}: <span className="font-medium text-gray-50">{p.yText}</span></span>
            </div>
          ))}
        </div>
      )}
      <div className="sr-only" aria-live="polite">{viaKeyboard ? text : ""}</div>
    </>
  );
}

/**
 * "PNG" and "CSV" download buttons. The export code loads on the first click. The file name comes from the chart's
 * title, else from the page's slug ("gires-tournois-chart.png").
 */
export function ChartActions({ svgRef, title, legend, csv }: {
  svgRef: RefObject<SVGSVGElement | null>;
  title?: string;
  legend: readonly LegendItem[];
  csv: () => { series: CsvSeries[]; xLabel: string; yLabel: string };
}) {
  const stem = () => fileStem(title || `${location.pathname.split("/").filter(Boolean).pop() ?? ""}-chart`);
  const button = "min-h-6 rounded border border-gray-700 px-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400";
  return (
    <div className="flex shrink-0 gap-1.5">
      <button type="button" className={button} aria-label="Download chart as PNG image" onClick={async () => {
        const svg = svgRef.current;
        if (!svg) return;
        const { downloadPng } = await import("./chart-export");
        await downloadPng(svg, { fileName: `${stem()}.png`, title, legend });
      }}>PNG</button>
      <button type="button" className={button} aria-label="Download chart data as CSV" onClick={async () => {
        const { series, xLabel, yLabel } = csv();
        const { downloadCsv } = await import("./chart-export");
        downloadCsv(chartCsv(series, xLabel, yLabel), `${stem()}.csv`);
      }}>CSV</button>
    </div>
  );
}
