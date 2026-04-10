"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function AfterpulsingPage() {
  const [trapLifetime, setTrapLifetime] = useURLState("trapLifetime", 20);
  const [trapEfficiency, setTrapEfficiency] = useURLState("trapEfficiency", 0.05);
  const [deadTime, setDeadTime] = useURLState("deadTime", 50);
  const [countRate, setCountRate] = useURLState("countRate", 1e6);
  const [numTraps, setNumTraps] = useURLState("numTraps", 3);

  // Afterpulse probability: fraction of trapped carriers that survive the dead time
  // and can trigger a secondary avalanche. Decreases with longer dead time.
  // P_ap = η · exp(-t_dead / τ)   [Cova et al.]
  const trapReleaseFrac = 1 - Math.exp(-deadTime / trapLifetime);
  const afterpulseProb = trapEfficiency * Math.exp(-deadTime / trapLifetime);
  const afterpulseRate = countRate * afterpulseProb;
  const afterpulseFraction = countRate > 0 ? (afterpulseRate / countRate) * 100 : 0;

  const multiTrap = useMemo(() => {
    const traps = Array.from({ length: numTraps }, (_, i) => ({
      tau: trapLifetime * Math.pow(3, i),
      eta: trapEfficiency / Math.pow(2, i),
    }));
    return traps.map(t => ({
      ...t,
      release: 1 - Math.exp(-deadTime / t.tau),
      apProb: t.eta * Math.exp(-deadTime / t.tau),
      apRate: countRate * t.eta * Math.exp(-deadTime / t.tau),
    }));
  }, [trapLifetime, trapEfficiency, deadTime, countRate, numTraps]);

  const chartData = useMemo(() => {
    const dt = Array.from({ length: 200 }, (_, i) => 1 + i * 200 / 200);
    const apProb = dt.map(d => trapEfficiency * Math.exp(-d / trapLifetime));
    const apProb2 = dt.map(d => {
      let total = 0;
      multiTrap.forEach(t => { total += t.eta * Math.exp(-d / t.tau); });
      return total;
    });
    return [
      { x: dt, y: apProb.map(v => v * 100), type: "scatter" as const, mode: "lines" as const, name: "Single Trap", line: { color: "#60a5fa", width: 2 } },
      { x: dt, y: apProb2.map(v => v * 100), type: "scatter" as const, mode: "lines" as const, name: `${numTraps} Traps`, line: { color: "#f87171", width: 2, dash: "dash" as const } },
    ];
  }, [trapLifetime, trapEfficiency, numTraps, multiTrap]);

  const rateVsDeadTime = useMemo(() => {
    const dt = Array.from({ length: 200 }, (_, i) => 1 + i * 200 / 200);
    return [
      { x: dt, y: dt.map(d => { const ap = trapEfficiency * Math.exp(-d / trapLifetime); return countRate * ap; }), type: "scatter" as const, mode: "lines" as const, name: "Afterpulse Rate", line: { color: "#fbbf24", width: 2 }, yaxis: "y" },
      { x: dt, y: dt.map(d => { const measured = countRate / (1 + countRate * d * 1e-9); return measured / 1e6; }), type: "scatter" as const, mode: "lines" as const, name: "Measured Rate (Mcps)", line: { color: "#34d399", width: 2 }, yaxis: "y2" },
    ];
  }, [trapLifetime, trapEfficiency, countRate]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Afterpulsing in APDs" description="Afterpulse probability, trap dynamics, and dead time trade-offs in avalanche photodiodes.">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Primary Trap Lifetime (ns)" value={trapLifetime} onChange={setTrapLifetime} min={0.1} step="1" />
        <ValidatedNumberInput label="Trap Efficiency" value={trapEfficiency} onChange={setTrapEfficiency} min={0.001} max={1} step="0.01" />
        <ValidatedNumberInput label="Dead Time (ns)" value={deadTime} onChange={setDeadTime} min={1} step="1" />
        <ValidatedNumberInput label="True Count Rate (cps)" value={countRate} onChange={setCountRate} min={1} step="10000" />
        <ValidatedNumberInput label="Number of Trap Species" value={numTraps} onChange={setNumTraps} min={1} max={5} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Afterpulse Prob" value={`${(afterpulseProb * 100).toFixed(3)}%`} tone="red" />
        <ResultCard label="Afterpulse Rate" value={`${(afterpulseRate / 1e6).toFixed(3)} Mcps`} tone="yellow" />
        <ResultCard label="Afterpulse Fraction" value={`${afterpulseFraction.toFixed(2)}%`} tone="blue" />
        <ResultCard label={`Trap Release (${deadTime}ns)`} value={`${(trapReleaseFrac * 100).toFixed(1)}%`} tone="green" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>P_ap = η_trap · exp(-t_dead / τ)</p>
        <p>Afterpulsing occurs when trapped carriers survive the dead time and trigger a secondary avalanche.</p>
        <p>Longer dead time → more traps release harmlessly during dead time → fewer remaining carriers → lower afterpulse probability.</p>
      </div>
      <ChartPanel data={chartData as any} layout={{ xaxis: { title: { text: "Dead Time (ns)" }, gridcolor: "#374151" }, yaxis: { title: { text: "Afterpulse Probability (%)" }, gridcolor: "#374151" } }} />
      <h2 className="text-xl font-bold mt-8 mb-4">Rate vs Dead Time</h2>
      <ChartPanel data={rateVsDeadTime as any} layout={{ xaxis: { title: { text: "Dead Time (ns)" }, gridcolor: "#374151" }, yaxis: { title: { text: "Afterpulse Rate (cps)" }, gridcolor: "#374151" }, yaxis2: { title: { text: "Measured Rate (Mcps)" }, gridcolor: "#374151", overlaying: "y", side: "right" } }} />
    </CalculatorShell>
  );
}
