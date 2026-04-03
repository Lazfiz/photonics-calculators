"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Afterpulsing in APDs/SPADs: spurious pulses due to trapped carriers
// Afterpulsing probability: P_ap = (1 - exp(-t_dead / τ_trap)) * η_trap
// τ_trap typically 1-100 ns, depends on material and trap type
// Dead time reduces afterpulsing by allowing traps to release
export default function AfterpulsingPage() {
  const [trapLifetime, setTrapLifetime] = useState(20); // ns
  const [trapEfficiency, setTrapEfficiency] = useState(0.05); // fraction of carriers trapped
  const [deadTime, setDeadTime] = useState(50); // ns
  const [countRate, setCountRate] = useState(1e6); // counts/s
  const [numTraps, setNumTraps] = useState(3); // distinct trap species

  const trapReleaseFrac = 1 - Math.exp(-deadTime / trapLifetime);
  const afterpulseProb = trapEfficiency * (1 - trapReleaseFrac);
  const afterpulseRate = countRate * afterpulseProb;
  const afterpulseFraction = afterpulseRate / (countRate + afterpulseRate) * 100;
  // Multiple traps with different lifetimes
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
    const apProb2 = dt.map(d => {
      let total = 0;
      multiTrap.forEach(t => total += t.eta * (1 - (1 - Math.exp(-d / t.tau))));
      return total;
    });
    return [
      { x: dt, y: apProb.map(v => v * 100), type: "scatter", mode: "lines",
        name: "Single Trap", line: { color: "#60a5fa", width: 2 } },
      { x: dt, y: apProb2.map(v => v * 100), type: "scatter", mode: "lines",
        name: `${numTraps} Traps`, line: { color: "#f87171", width: 2, dash: "dash" } },
    ];
  }, [trapLifetime, trapEfficiency, numTraps, multiTrap]);

  const rateVsDeadTime = useMemo(() => {
    const dt = Array.from({ length: 200 }, (_, i) => 1 + i * 200 / 200);
    return [
      { x: dt, y: dt.map(d => {
        const ap = trapEfficiency * (1 - (1 - Math.exp(-d / trapLifetime)));
        return countRate * ap;
      }), type: "scatter", mode: "lines",
        name: "Afterpulse Rate", line: { color: "#fbbf24", width: 2 }, yaxis: "y" },
      { x: dt, y: dt.map(d => {
        const measured = countRate / (1 + countRate * d * 1e-9);
        return measured / 1e6;
      }), type: "scatter", mode: "lines",
        name: "Measured Rate (Mcps)", line: { color: "#34d399", width: 2 }, yaxis: "y2" },
    ];
  }, [trapLifetime, trapEfficiency, countRate]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Afterpulsing in APDs</h1>
      <p className="text-gray-400 mb-8">Afterpulse probability, trap dynamics, and dead time trade-offs in avalanche photodiodes.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Primary Trap Lifetime (ns)</span>
          <input type="number" value={trapLifetime} onChange={e => setTrapLifetime(+e.target.value)} min="0.1" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Trap Efficiency</span>
          <input type="number" value={trapEfficiency} onChange={e => setTrapEfficiency(+e.target.value)} min="0.001" max="1" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Dead Time (ns)</span>
          <input type="number" value={deadTime} onChange={e => setDeadTime(+e.target.value)} min="1" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Count Rate (Mcps)</span>
          <input type="number" value={countRate / 1e6} onChange={e => setCountRate(+e.target.value * 1e6)} min="0.01" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Number of Trap Species</span>
          <input type="number" value={numTraps} onChange={e => setNumTraps(+e.target.value)} min="1" max="5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Afterpulse Prob</p>
          <p className="text-xl font-bold text-red-400">{(afterpulseProb * 100).toFixed(3)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Afterpulse Rate</p>
          <p className="text-xl font-bold text-yellow-400">{(afterpulseRate / 1e6).toFixed(3)} Mcps</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Afterpulse Fraction</p>
          <p className="text-xl font-bold text-blue-400">{afterpulseFraction.toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Trap Release ({deadTime}ns)</p>
          <p className="text-xl font-bold text-green-400">{(trapReleaseFrac * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>P<sub>ap</sub> = η<sub>trap</sub> · [1 − (1 − e<sup>−t<sub>dead</sub>/τ</sup>)] = η<sub>trap</sub> · e<sup>−t<sub>dead</sub>/τ</sup></p>
        <p>Longer dead time → more traps release → lower afterpulsing, but lower max count rate</p>
        <p>τ<sub>trap</sub>: 1-10 ns (shallow), 10-100 ns (medium), 100+ ns (deep traps)</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Dead Time (ns)", gridcolor: "#374151" },
        yaxis: { title: "Afterpulse Probability (%)", gridcolor: "#374151" },
        margin: { t: 30, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} config={{ responsive: true, displayModeBar: false }} />

      <h2 className="text-xl font-bold mt-8 mb-4">Rate vs Dead Time</h2>
      <Plot data={rateVsDeadTime} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Dead Time (ns)", gridcolor: "#374151" },
        yaxis: { title: "Afterpulse Rate (cps)", gridcolor: "#374151" },
        yaxis2: { title: "Measured Rate (Mcps)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 30, r: 60, b: 50, l: 70 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} config={{ responsive: true, displayModeBar: false }} />
    </div>
  );
}
