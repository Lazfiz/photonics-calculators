"use client";

import { useMemo } from "react";
import ChartPanel from "./chart-panel";
import { LIMIT_COLORS, LIMIT_LABELS, segmentedLine } from "./eye-limit-labels";
import type { EyeLimitKind } from "../physics/laser-safety/eye-exposure-limits";

/** Exposure / limit of each eye limit at range r (m); above 1 the limit is exceeded. */
export type RatioAtRange = (r: number) => readonly { kind: EyeLimitKind; ratio: number }[];

const NO_MARKERS: readonly { r: number; y?: number; label: string }[] = [];

/**
 * Exposure over limit against range (log–log), one line per eye limit, with the limit (ratio 1) dashed and markers at
 * the given ranges (at y, default 1: the hazard distance; a viewing distance with its ratio). Pass a memoized `ratios`.
 */
export default function HazardRatioChart({
  ratios,
  rMin,
  rMax,
  markers = NO_MARKERS,
}: {
  ratios: RatioAtRange;
  rMin: number;
  rMax: number;
  markers?: readonly { r: number; y?: number; label: string }[];
}) {
  const data = useMemo(() => {
    if (!(rMin > 0 && rMax > rMin)) return [];
    const rs = Array.from({ length: 241 }, (_, i) => rMin * Math.pow(rMax / rMin, i / 240));
    const byKind = new Map<EyeLimitKind, number[]>();
    rs.forEach((r, i) => {
      for (const { kind, ratio } of ratios(r)) {
        if (!byKind.has(kind)) byKind.set(kind, new Array(rs.length).fill(NaN));
        byKind.get(kind)![i] = ratio;
      }
    });
    const traces: Record<string, unknown>[] = [];
    for (const [kind, ys] of byKind) traces.push(...segmentedLine(rs, ys, LIMIT_LABELS[kind], { color: LIMIT_COLORS[kind] }));
    traces.push({ x: [rMin, rMax], y: [1, 1], type: "scatter", mode: "lines", name: "Limit", line: { color: "#f87171", dash: "dash" } });
    for (const m of markers) {
      if (m.r >= rMin && m.r <= rMax) {
        traces.push({ x: [m.r], y: [m.y ?? 1], type: "scatter", mode: "markers", name: m.label, marker: { color: "#f87171", size: 9 } });
      }
    }
    return traces;
  }, [ratios, rMin, rMax, markers]);

  return (
    <ChartPanel
      data={data}
      layout={{
        xaxis: { title: "Distance (m)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Exposure / limit", type: "log", gridcolor: "#374151" },
        margin: { t: 30, r: 30, b: 50, l: 70 },
      }}
    />
  );
}
