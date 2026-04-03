"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function FluorescenceLifetimePage() {
  const [tau, setTau] = useState(5); // ns
  const [amplitude, setAmplitude] = useState(1);
  const [multiExp, setMultiExp] = useState(false);
  const [tau2, setTau2] = useState(1);
  const [frac1, setFrac1] = useState(0.7);
  const [tMax, setTMax] = useState(30);

  const decay = (t: number) => {
    if (!multiExp) return amplitude * Math.exp(-t / tau);
    return amplitude * (frac1 * Math.exp(-t / tau) + (1 - frac1) * Math.exp(-t / tau2));
  };

  const avgLifetime = multiExp ? frac1 * tau + (1 - frac1) * tau2 : tau;

  const chartData = useMemo(() => {
    const points = 400;
    const ts = Array.from({ length: points }, (_, i) => (i / points) * tMax);
    const ys = ts.map(decay);
    const norm = ys.map(y => y / ys[0]);
    return [
      { x: ts, y: ys, type: "scatter", mode: "lines", name: "I(t)",
        line: { color: "#34d399", width: 2 } },
      { x: ts, y: ts.map(() => amplitude * Math.exp(-1)), type: "scatter", mode: "lines",
        name: "I₀/e", line: { color: "#fbbf24", width: 1, dash: "dash" } },
    ];
  }, [tau, tau2, amplitude, multiExp, frac1, tMax]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Fluorescence Lifetime Calculator</h1>
      <p className="text-gray-400 mb-8">Model single and bi-exponential fluorescence decay curves. Calculate intensity-weighted average lifetimes.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">τ₁ (ns)</span>
          <input type="number" value={tau} onChange={e => setTau(+e.target.value)} min="0.01" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Amplitude I₀</span>
          <input type="number" value={amplitude} onChange={e => setAmplitude(+e.target.value)} min="0.01" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Time Range (ns)</span>
          <input type="number" value={tMax} onChange={e => setTMax(+e.target.value)} min="1" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Bi-exponential mode</span>
          <select value={multiExp ? "true" : "false"} onChange={e => setMultiExp(e.target.value === "true")}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="false">Single exponential</option>
            <option value="true">Bi-exponential</option>
          </select>
        </label>
        {multiExp && <>
          <label className="block">
            <span className="text-gray-300 text-sm">τ₂ (ns)</span>
            <input type="number" value={tau2} onChange={e => setTau2(+e.target.value)} min="0.01" step="0.1"
              className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
          <label className="block">
            <span className="text-gray-300 text-sm">Fraction f₁ (0–1)</span>
            <input type="number" value={frac1} onChange={e => setFrac1(+e.target.value)} min="0" max="1" step="0.05"
              className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
        </>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">{multiExp ? "τ₁" : "Lifetime τ"}</p>
          <p className="text-xl font-bold text-green-400">{tau} ns</p>
        </div>
        {multiExp && <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">τ₂</p>
          <p className="text-xl font-bold text-blue-400">{tau2} ns</p>
        </div>}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">{multiExp ? "⟨τ⟩ (amplitude-weighted)" : "1/e Time"}</p>
          <p className="text-xl font-bold text-yellow-400">{avgLifetime.toFixed(2)} ns</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Quantum Yield (if τ<sub>rad</sub> known)</p>
          <p className="text-gray-500 text-sm">Set τ_rad below</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><strong>Single:</strong> I(t) = I₀ · exp(−t/τ)</p>
        <p><strong>Bi-exponential:</strong> I(t) = I₀ · [f₁·exp(−t/τ₁) + (1−f₁)·exp(−t/τ₂)]</p>
        <p>Amplitude-weighted avg: ⟨τ⟩ = f₁·τ₁ + (1−f₁)·τ₂</p>
        <p className="text-gray-500">Intensity-weighted avg: ⟨τ⟩_int = (f₁·τ₁² + (1−f₁)·τ₂²) / (f₁·τ₁ + (1−f₁)·τ₂)</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Time (ns)", gridcolor: "#374151" },
        yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
        margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
      }} config={{ responsive: true, displayModeBar: false }} />
    </div>
  );
}
