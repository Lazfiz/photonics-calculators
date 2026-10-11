"use client";

import { useMemo } from "react";
import ChartPanel from "./chart-panel";
import { finiteXY, LIMIT_COLORS, LIMIT_LABELS } from "./eye-limit-labels";
import {
  apertureIrradiance, exposureDuration, exposureLimit, eyeLimits, limitingAperture, T_MAX, T_MIN,
} from "../physics/laser-safety/eye-exposure-limits";

export interface ExposureMark {
  /** Exposure time, s. */
  readonly t: number;
  readonly name: string;
  readonly color: string;
}

/**
 * Each ICNIRP 2013 eye limit at λ (m) as an irradiance H(t)/t against exposure time (log–log, 1 ns – 30 ks), and the
 * irradiance of a CW beam (P in W, 1/e² diameter d in m) over each limit's aperture. A marker shows where the first
 * limit is reached (t_max); `marks` add points on the beam curve of that limit. α (rad): the apparent source.
 */
export default function ExposureTimeChart({
  lambda,
  P,
  d,
  alpha = 0,
  marks = [],
}: {
  lambda: number;
  P: number;
  d: number;
  alpha?: number;
  marks?: readonly ExposureMark[];
}) {
  const data = useMemo(() => {
    const times = Array.from({ length: 271 }, (_, i) => T_MIN * Math.pow(T_MAX / T_MIN, i / 270));
    const limits = eyeLimits(lambda, alpha);
    const traces: Record<string, unknown>[] = limits.map((limit) => ({
      ...finiteXY(times, times.map((t) => exposureLimit(limit, t) / t)),
      type: "scatter", mode: "lines", name: `Limit: ${LIMIT_LABELS[limit.kind]}`,
      line: { color: LIMIT_COLORS[limit.kind] },
    }));
    // One beam curve per distinct averaging aperture (thermal and photochemical share 7 mm).
    const seen = new Set<string>();
    for (const limit of limits) {
      const key = JSON.stringify(limit.apertures);
      if (seen.has(key)) continue;
      seen.add(key);
      const fixed = limit.apertures.length === 1;
      traces.push({
        ...finiteXY(times, times.map((t) => apertureIrradiance(P, d, limitingAperture(limit, t)))),
        type: "scatter", mode: "lines",
        name: fixed ? `Beam over ${(limit.apertures[0].d * 1e3).toFixed(1)} mm` : "Beam over 1 → 3.5 mm",
        line: { color: "#f87171", dash: seen.size === 1 ? "dash" : "dot" },
      });
    }
    const result = exposureDuration(lambda, P, d, alpha);
    const first = result.limits.find((l) => l.kind === result.limiting);
    if (first && Number.isFinite(first.tMax) && first.irradiance > 0) {
      traces.push({
        x: [first.tMax], y: [first.irradiance], type: "scatter", mode: "markers", name: "t_max",
        marker: { color: "#f87171", size: 9 },
      });
    }
    const onBeam = limits.find((l) => l.kind === (result.limiting ?? limits[0]?.kind));
    for (const m of marks) {
      if (!onBeam || !(m.t >= T_MIN && m.t <= T_MAX)) continue;
      const y = apertureIrradiance(P, d, limitingAperture(onBeam, m.t));
      if (y > 0) traces.push({ x: [m.t], y: [y], type: "scatter", mode: "markers", name: m.name, marker: { color: m.color, size: 11, symbol: "diamond" } });
    }
    return traces;
  }, [lambda, P, d, alpha, marks]);

  return (
    <ChartPanel data={data} layout={{
      paper_bgcolor: "transparent", plot_bgcolor: "transparent",
      font: { color: "#9ca3af" },
      xaxis: { title: "Exposure Time (s)", type: "log", gridcolor: "#374151" },
      yaxis: { title: "Irradiance (W/m²)", type: "log", gridcolor: "#374151" },
      margin: { t: 30, r: 30, b: 50, l: 70 },
    }} />
  );
}
