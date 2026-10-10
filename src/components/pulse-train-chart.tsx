"use client";

import { useMemo } from "react";
import ChartPanel from "./chart-panel";
import { segmentedLine } from "./eye-limit-labels";
import { pulseTrainLimits } from "../physics/laser-safety/pulse-train";

/**
 * Largest energy per pulse against the repetition rate (log–log) for pulses of duration τ (s) over an exposure T (s)
 * in a beam of 1/e² diameter d (m) at λ (m), α (rad): each ICNIRP 2013 rule (least over the eye limits) and the
 * least of them, with the pulse energy (J) dashed and a marker at the current rate (Hz; 0 for a single pulse).
 */
export default function PulseTrainChart({
  lambda,
  d,
  duration,
  exposure,
  alpha = 0,
  energy,
  prf,
}: {
  lambda: number;
  d: number;
  duration: number;
  exposure: number;
  alpha?: number;
  energy: number;
  prf: number;
}) {
  const data = useMemo(() => {
    // From one pulse per ten exposures up to a 100 % duty cycle (at most 10 GHz).
    const fMin = 0.1 / exposure;
    const fMax = Math.min(1 / duration, 1e10);
    if (!(fMax > fMin)) return [];
    const fs = Array.from({ length: 161 }, (_, i) => fMin * Math.pow(fMax / fMin, i / 160));
    const rules = fs.map((f) => {
      const r = pulseTrainLimits(lambda, d, { duration, prf: f, exposure }, alpha);
      const least = (key: "singlePulse" | "group" | "reduced") => Math.min(...r.limits.map((l) => l[key]));
      return { single: least("singlePulse"), group: least("group"), reduced: least("reduced"), qMax: r.qMax };
    });
    const traces: Record<string, unknown>[] = [
      ...segmentedLine(fs, rules.map((r) => r.qMax), "Max per pulse", { color: "#60a5fa", width: 4 }),
      ...segmentedLine(fs, rules.map((r) => r.single), "1. Single pulse", { color: "#fbbf24", dash: "dot" }),
      ...segmentedLine(fs, rules.map((r) => r.group), "2. Pulse groups", { color: "#34d399", dash: "dot" }),
      ...segmentedLine(fs, rules.map((r) => r.reduced), "3. C_P × single", { color: "#c084fc", dash: "dot" }),
    ];
    if (energy > 0) traces.push({ x: [fMin, fMax], y: [energy, energy], type: "scatter", mode: "lines", name: "Your pulse", line: { color: "#f87171", dash: "dash" } });
    if (prf >= fMin && prf <= fMax) {
      const here = pulseTrainLimits(lambda, d, { duration, prf, exposure }, alpha).qMax;
      if (Number.isFinite(here) && here > 0) {
        traces.push({ x: [prf], y: [here], type: "scatter", mode: "markers", name: "Your repetition rate", marker: { color: "#f87171", size: 9 } });
      }
    }
    return traces;
  }, [lambda, d, duration, exposure, alpha, energy, prf]);

  return (
    <ChartPanel
      data={data}
      layout={{
        xaxis: { title: "Repetition rate (Hz)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Energy per pulse (J)", type: "log", gridcolor: "#374151" },
        margin: { t: 30, r: 30, b: 50, l: 70 },
      }}
    />
  );
}
