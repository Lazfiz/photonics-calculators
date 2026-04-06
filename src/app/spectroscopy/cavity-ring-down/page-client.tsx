"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function CavityRingDownPage() {
  const [mirrorReflectivity, setMirrorReflectivity] = useState(99.99); // %
  const [cavityLength, setCavityLength] = useState(100); // cm
  const [baseLoss, setBaseLoss] = useState(0); // % additional round-trip loss
  const [sampleAbsorbance, setSampleAbsorbance] = useState(0.001); // per pass

  const R = mirrorReflectivity / 100;
  const L = cavityLength / 100; // meters
  const lossFrac = baseLoss / 100;
  const roundTripLoss = -Math.log(R * R * (1 - lossFrac));
  const alphaSample = sampleAbsorbance;
  const totalLoss = roundTripLoss + alphaSample;

  const c = 2.998e8; // m/s
  const roundTripTime = 2 * L / c; // seconds
  const tau = roundTripTime / totalLoss; // ring-down time

  // Sensitivity (minimum detectable absorption per pass)
  const sensitivity = totalLoss / (2 * L); // m⁻¹

  // Finesse
  const finesse = 2 * Math.PI / totalLoss;

  const chartData = useMemo(() => {
    const tMax = tau * 5;
    const ts = Array.from({ length: 400 }, (_, i) => (i / 400) * tMax);
    const empty = ts.map(t => Math.exp(-t / (roundTripTime / roundTripLoss)));
    const withSample = ts.map(t => Math.exp(-t / tau));
    return [
      { x: ts.map(t => t * 1e6), y: empty, type: "scatter", mode: "lines", name: "Empty cavity",
        line: { color: "#60a5fa", width: 2 } },
      { x: ts.map(t => t * 1e6), y: withSample, type: "scatter", mode: "lines", name: "With sample",
        line: { color: "#34d399", width: 2 } },
      { x: [roundTripTime / roundTripLoss * 1e6], y: [Math.exp(-1)], type: "scatter", mode: "markers",
        name: "τ_empty (1/e)", marker: { color: "#60a5fa", size: 10 } },
      { x: [tau * 1e6], y: [Math.exp(-1)], type: "scatter", mode: "markers",
        name: "τ_sample (1/e)", marker: { color: "#34d399", size: 10 } },
    ];
  }, [roundTripTime, roundTripLoss, tau]);

  const tauVsLossData = useMemo(() => {
    const losses = Array.from({ length: 200 }, (_, i) => 1e-4 + i * 5e-3 / 200);
    const taus = losses.map(l => (roundTripTime / l) * 1e6);
    return [
      { x: losses, y: taus, type: "scatter", mode: "lines", name: "τ vs total loss",
        line: { color: "#a78bfa", width: 2 } },
      { x: [totalLoss], y: [tau * 1e6], type: "scatter", mode: "markers",
        name: "Current", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [roundTripTime, totalLoss, tau]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Cavity Ring-Down Spectroscopy" description="Model CRDS ring-down time, sensitivity, and finesse. Visualize exponential decay with and without sample absorption.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Mirror Reflectivity R (%)</span>
          <input type="number" value={mirrorReflectivity} onChange={e => setMirrorReflectivity(+e.target.value)} min="90" max="99.9999" step="0.001"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Cavity Length (cm)</span>
          <input type="number" value={cavityLength} onChange={e => setCavityLength(+e.target.value)} min="1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Additional Round-Trip Loss (%)</span>
          <input type="number" value={baseLoss} onChange={e => setBaseLoss(+e.target.value)} min="0" step="0.001"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Sample Absorbance (per pass)</span>
          <input type="number" value={sampleAbsorbance} onChange={e => setSampleAbsorbance(+e.target.value)} min="0" step="0.0001"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Ring-Down Time τ</p>
          <p className="text-xl font-bold text-green-400">{tau < 1e-3 ? (tau * 1e9).toFixed(1) + " ns" : (tau * 1e6).toFixed(2) + " μs"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Finesse ℱ</p>
          <p className="text-xl font-bold text-blue-400">{finesse.toFixed(0)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Round-Trip Loss</p>
          <p className="text-xl font-bold text-red-400">{totalLoss.toExponential(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Min. Detectable α</p>
          <p className="text-xl font-bold text-yellow-400">{sensitivity.toExponential(2)} m⁻¹</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>I(t) = I₀ · exp(−t/τ)</p>
        <p>τ = t_rt / L_rt = 2L / (c · L_rt)</p>
        <p>L_rt = −ln(R₁·R₂) + α_sample + L_other</p>
        <p>ℱ = 2π / L_rt | Sensitivity ∝ 1/(cavity length × loss)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          title: { text: "Ring-Down Decay", font: { size: 13 } },
          xaxis: { title: "Time (μs)", gridcolor: "#374151" },
          yaxis: { title: "I/I₀", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent" },
        }} />
        <ChartPanel data={tauVsLossData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          title: { text: "τ vs Round-Trip Loss", font: { size: 13 } },
          xaxis: { title: "Total Round-Trip Loss", gridcolor: "#374151" },
          yaxis: { title: "τ (μs)", gridcolor: "#374151", type: "log" },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent" },
        }} />
      </div>
    </CalculatorShell>
  );
}
