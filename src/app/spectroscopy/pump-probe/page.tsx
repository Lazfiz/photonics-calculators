"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function PumpProbePage() {
  const [pumpWavelength, setPumpWavelength] = useState(400);
  const [probeWavelength, setProbeWavelength] = useState(800);
  const [tau1, setTau1] = useState(0.5); // ps - excited state lifetime
  const [tau2, setTau2] = useState(5]; // ps - intermediate decay
  const [tMax, setTMax] = useState(20]; // ps

  const chartData = useMemo(() => {
    const N = 500;
    const times = Array.from({ length: N }, (_, i) => (i / N) * tMax);

    // Ground state bleach (negative ΔT/T)
    const bleach = times.map(t => -1 * Math.exp(-t / tau1));

    // Stimulated emission (negative)
    const SE = times.map(t => -0.8 * Math.exp(-t / tau1));

    // Excited state absorption (positive, appears with delay)
    const ESA = times.map(t => 0.6 * (Math.exp(-t / tau2) - Math.exp(-t / tau1)) / (tau1 - tau2) * tau1);

    // Total signal
    const total = times.map((_, i) => bleach[i] + SE[i] + ESA[i]);

    return [
      { x: times, y: total, type: "scatter", mode: "lines", name: "Total ΔT/T",
        line: { color: "#ffffff", width: 2 } },
      { x: times, y: bleach, type: "scatter", mode: "lines", name: "GSB",
        line: { color: "#60a5fa", dash: "dash" } },
      { x: times, y: SE, type: "scatter", mode: "lines", name: "Stim. Emission",
        line: { color: "#34d399", dash: "dash" } },
      { x: times, y: ESA, type: "scatter", mode: "lines", name: "ESA",
        line: { color: "#f87171", dash: "dash" } },
    ];
  }, [pumpWavelength, probeWavelength, tau1, tau2, tMax]);

  const c = 3e8;
  const pumpE = 1240 / pumpWavelength; // eV
  const probeE = 1240 / probeWavelength; // eV

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Pump-Probe Spectroscopy</h1>
      <p className="text-gray-400 mb-8">Ultrafast dynamics via time-resolved differential transmission. GSB, SE, and ESA contributions.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Pump Wavelength (nm)</span>
          <input type="number" value={pumpWavelength} onChange={e => setPumpWavelength(+e.target.value)} min={200} max={2000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Probe Wavelength (nm)</span>
          <input type="number" value={probeWavelength} onChange={e => setProbeWavelength(+e.target.value)} min={200} max={3000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Fast Lifetime τ₁ (ps)</span>
          <input type="number" value={tau1} onChange={e => setTau1(+e.target.value)} min={0.01} max={100} step={0.1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Slow Decay τ₂ (ps)</span>
          <input type="number" value={tau2} onChange={e => setTau2(+e.target.value)} min={0.1} max={1000} step={0.1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Max Delay (ps)</span>
          <input type="number" value={tMax} onChange={e => setTMax(+e.target.value)} min={1} max={1000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Signal:</span> ΔT/T = (T_pumped − T_unpumped) / T_unpumped</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">GSB:</span> ΔT/T &lt; 0 (ground state depopulated)</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">SE:</span> ΔT/T &lt; 0 (stimulated emission adds to probe)</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">ESA:</span> ΔT/T &gt; 0 (excited state absorbs probe)</p>
        <p className="text-gray-300 text-sm"><span className="text-blue-400 font-mono">Kinetics:</span> ΔT/T(t) = A₁·e^{−t/τ₁} + A₂·e^{−t/τ₂}</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Energy</h3>
        <p className="text-gray-300 text-sm"><span className="text-green-400">Pump photon:</span> {pumpE.toFixed(3)} eV</p>
        <p className="text-gray-300 text-sm"><span className="text-green-400">Probe photon:</span> {probeE.toFixed(3)} eV</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "Pump-Probe Kinetics", font: { color: "white" } },
          xaxis: { title: "Pump-Probe Delay (ps)", gridcolor: "#374151" },
          yaxis: { title: "ΔT/T", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
          showlegend: true, legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0)" },
        }} config={{ responsive: true }} />
      </div>
    </div>
  );
}
