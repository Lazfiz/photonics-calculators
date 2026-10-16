"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { antiblooming, bloomingOnset } from "../../../physics/detectors/antiblooming";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fix = (x: number, digits = 0) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const sci = (x: number) => (Number.isFinite(x) ? (x >= 1e6 ? x.toExponential(3) : x.toFixed(0)) : "∞");

export default function AntibloomingPage() {
  const [wellRaw, setWellCapacity] = useURLState("wellCapacity", 50000); // e⁻
  const [thresholdRaw, setAbThreshold] = useURLState("abThreshold", 0.8); // fraction of the well
  const [excessRaw, setExcessCharge] = useURLState("excessCharge", 20000); // e⁻ above the barrier
  const [efficiencyRaw, setChargeDumpEfficiency] = useURLState("chargeDumpEfficiency", 0.99);

  const wellCapacity = clamp(wellRaw, 1000, 1e7, 50000);
  const abThreshold = clamp(thresholdRaw, 0, 1, 0.8);
  const excessCharge = clamp(excessRaw, 0, 1e12, 20000);
  const efficiency = clamp(efficiencyRaw, 0, 1, 0.99);

  const threshold = abThreshold * wellCapacity;
  const split = antiblooming(threshold + excessCharge, wellCapacity, abThreshold, efficiency);
  const onset = bloomingOnset(wellCapacity, abThreshold, efficiency);

  // Incident charge from 1 % of the well to 10× the blooming onset (or 10⁴ wells), log-spaced.
  const top = Math.min(1e4 * wellCapacity, Number.isFinite(onset) ? 10 * onset : 1e4 * wellCapacity);
  const incident = Array.from({ length: 241 }, (_, i) => 0.01 * wellCapacity * (top / (0.01 * wellCapacity)) ** (i / 240));
  const splits = incident.map(n => antiblooming(n, wellCapacity, abThreshold, efficiency));
  const chartData = [
    { x: incident, y: splits.map(s => s.collected), type: "scatter" as const, mode: "lines" as const, name: "In the well", line: { color: "#34d399" } },
    { x: incident, y: splits.map(s => s.drained), type: "scatter" as const, mode: "lines" as const, name: "To the drain", line: { color: "#60a5fa", dash: "dash" } },
    { x: incident, y: splits.map(s => s.spilled), type: "scatter" as const, mode: "lines" as const, name: "Spilled (blooming)", line: { color: "#f87171" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Full well capacity (e⁻)" value={wellRaw} onChange={setWellCapacity} step="1000" min={1000} max={10000000} />
        <ValidatedNumberInput label="Drain barrier (fraction of the well)" value={thresholdRaw} onChange={setAbThreshold} min={0} max={1} step="0.05" />
        <ValidatedNumberInput label="Charge above the barrier (e⁻)" value={excessRaw} onChange={setExcessCharge} step="1000" min={0} max={1000000000000} />
        <ValidatedNumberInput label="Drain efficiency η" value={efficiencyRaw} onChange={setChargeDumpEfficiency} min={0} max={1} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ResultCard label="Linear range (barrier)" value={`${fix(threshold)} e⁻`} subtext={`${fix(abThreshold * 100)} % of the well`} tone="blue" />
        <ResultCard label="In the well" value={`${fix(split.collected)} e⁻`} subtext={`barrier + ${fix(split.collected - threshold)} e⁻ leaked, capped at ${fix(wellCapacity - threshold)} e⁻`} tone="green" />
        <ResultCard label="To the drain" value={`${sci(split.drained)} e⁻`} tone="yellow" />
        <ResultCard label="Spilled into neighbours" value={`${sci(split.spilled)} e⁻`} subtext={split.spilled > 0 ? "the well is full: the pixel blooms" : "no blooming"} tone="red" />
        <ResultCard
          label="Blooming onset"
          value={`${sci(onset)} e⁻`}
          subtext={Number.isFinite(onset) ? `${fix(onset / wellCapacity, 1)}× full well: N_b = T + (W − T)/(1 − η)` : "a perfect drain never blooms"}
          tone="purple"
        />
        <ResultCard label="Well above the barrier" value={`${fix(wellCapacity - threshold)} e⁻`} subtext="headroom the drain protects" tone="gray" />
      </div>

      <p className="text-gray-400 text-sm mb-6">
        Illustrative hard-threshold drain: below the barrier every electron is kept; above it a fraction (1 − η) still
        reaches the well until the well is full, and the rest spills. Real lateral and vertical overflow drains turn on
        gradually, so the response bends over before the barrier.
      </p>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Incident charge (e⁻)", gridcolor: "#374151", type: "log" },
        yaxis: { title: "Charge (e⁻)", gridcolor: "#374151", type: "log" },
        margin: { t: 20, b: 40, l: 70, r: 20 }, autosize: true, showlegend: true
      }} />
    </>
  );
}
