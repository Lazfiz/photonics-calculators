"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

export default function AfterpulsingPage() {
  const [trapLifetime, setTrapLifetime] = useState(20);
  const [trapEfficiency, setTrapEfficiency] = useState(0.05);
  const [deadTime, setDeadTime] = useState(50);
  const [countRate, setCountRate] = useState(1e6);
  const [numTraps, setNumTraps] = useState(3);

  const trapReleaseFrac = 1 - Math.exp(-deadTime / trapLifetime);
  const afterpulseProb = trapEfficiency * (1 - trapReleaseFrac);
  const afterpulseRate = countRate * afterpulseProb;
  const afterpulseFraction = afterpulseRate / (countRate + afterpulseRate) * 100;

  const multiTrap = useMemo(() => {
    const traps = Array.from({ length: numTraps }, (_, i) => ({
      tau: trapLifetime * Math.pow(3, i),
      eta: trapEfficiency / Math.pow(2, i),
    }));
    return traps.map(t => ({
      ...t,
      release: 1 - Math.exp(-deadTime / t.tau),
      apProb: t.eta * (1 - (1 - Math.exp(-deadTime / t.tau))),
      apRate: countRate * t.eta * (1 - (1 - Math.exp(-deadTime / t.tau))),
    }));
  }, [trapLifetime, trapEfficiency, deadTime, countRate, numTraps]);

  const chartData = useMemo(() => {
    const dt = Array.from({ length: 200 }, (_, i) => 1 + i * 200 / 200);
    const apProb = dt.map(d => trapEfficiency * (1 - (1 - Math.exp(-d / trapLifetime))));
    const apProb2 = dt.map(d => { let total = 0; multiTrap.forEach(t => total += t.eta * (1 - (1 - Math.exp(-d / t.tau)))); return total; });
    return [
      { x: dt, y: apProb.map(v => v * 100), type: "scatter" as const, mode: "lines" as const, name: "Single Trap", line: { color: "#60a5fa", width: 2 } },
      { x: dt, y: apProb2.map(v => v * 100), type: "scatter" as const, mode: "lines" as const, name: `${numTraps} Traps`, line: { color: "#f87171", width: 2, dash: "dash" as const } },
    ];
  }, [trapLifetime, trapEfficiency, numTraps, multiTrap]);

  const rateVsDeadTime = useMemo(() => {
    const dt = Array.from({ length: 200 }, (_, i) => 1 + i * 200 / 200);
    return [
      { x: dt, y: dt.map(d => { const ap = trapEfficiency * (1 - (1 - Math.exp(-d / trapLifetime))); return countRate * ap; }), type: "scatter" as const, mode: "lines" as const, name: "Afterpulse Rate", line: { color: "#fbbf24", width: 2 }, yaxis: "y" },
      { x: dt, y: dt.map(d => { const measured = countRate / (1 + countRate * d * 1e-9); return measured / 1e6; }), type: "scatter" as const, mode: "lines" as const, name: "Measured Rate (Mcps)", line: { color: "#34d399", width: 2 }, yaxis: "y2" },
    ];
  }, [trapLifetime, trapEfficiency, countRate]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Afterpulsing in APDs" description="Afterpulse probability, trap dynamics, and dead time trade-offs in avalanche photodiodes.">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Primary Trap Lifetime (ns)</span><input type="number" value={trapLifetime} onChange={e => setTrapLifetime(+e.target.value)} min="0.1" step="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Trap Efficiency</span><input type="number" value={trapEfficiency} onChange={e => setTrapEfficiency(+e.target.value)} min="0.001" max="1" step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Dead Time (ns)</span><input type="number" value={deadTime} onChange={e => setDeadTime(+e.target.value)} min="1" step="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Count Rate (Mcps)</span><input type="number" value={countRate / 1e6} onChange={e => setCountRate(+e.target.value * 1e6)} min="0.01" step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Number of Trap Species</span><input type="number" value={numTraps} onChange={e => setNumTraps(+e.target.value)} min="1" max="5" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Afterpulse Prob" value={`${(afterpulseProb * 100).toFixed(3)}%`} tone="red" />
        <ResultCard label="Afterpulse Rate" value={`${(afterpulseRate / 1e6).toFixed(3)} Mcps`} tone="yellow" />
        <ResultCard label="Afterpulse Fraction" value={`${afterpulseFraction.toFixed(2)}%`} tone="blue" />
        <ResultCard label={`Trap Release (${deadTime}ns)`} value={`${(trapReleaseFrac * 100).toFixed(1)}%`} tone="green" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>P_ap = η_trap · e^(-t_dead/τ)</p>
        <p>Longer dead time → more traps release → lower afterpulsing, but lower max count rate</p>
      </div>
      <ChartPanel data={chartData as any} layout={{ xaxis: { title: { text: "Dead Time (ns)" }, gridcolor: "#374151" }, yaxis: { title: { text: "Afterpulse Probability (%)" }, gridcolor: "#374151" } }} />
      <h2 className="text-xl font-bold mt-8 mb-4">Rate vs Dead Time</h2>
      <ChartPanel data={rateVsDeadTime as any} layout={{ xaxis: { title: { text: "Dead Time (ns)" }, gridcolor: "#374151" }, yaxis: { title: { text: "Afterpulse Rate (cps)" }, gridcolor: "#374151" }, yaxis2: { title: { text: "Measured Rate (Mcps)" }, gridcolor: "#374151", overlaying: "y", side: "right" } }} />
    </CalculatorShell>
  );
}
