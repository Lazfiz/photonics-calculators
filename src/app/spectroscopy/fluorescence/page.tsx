"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function FluorescencePage() {
  const [tau, setTau] = useState(3);
  const [multiExp, setMultiExp] = useState(false);
  const [tau2, setTau2] = useState(10);
  const [amp2, setAmp2] = useState(0.3);

  const chartData = useMemo(() => {
    const tMax = Math.max(tau, multiExp ? tau2 : 0) * 6;
    const t = Array.from({ length: 300 }, (_, i) => (i / 300) * tMax);

    const single = t.map(ti => Math.exp(-ti / tau));
    const biExp = multiExp
      ? t.map(ti => (1 - amp2) * Math.exp(-ti / tau) + amp2 * Math.exp(-ti / tau2))
      : [];

    const traces = [
      { x: t, y: single, type: "scatter" as const, mode: "lines" as const, name: `τ₁ = ${tau} ns`, line: { color: "#60a5fa", width: 2 } },
    ];

    if (multiExp) {
      traces.push(
        { x: t, y: biExp, type: "scatter" as const, mode: "lines" as const, name: `Bi-exponential`, line: { color: "#34d399", width: 2 } },
        { x: t, y: t.map(ti => amp2 * Math.exp(-ti / tau2)), type: "scatter" as const, mode: "lines" as const, name: `Component τ₂`, line: { color: "#f87171", width: 1, dash: "dash" } },
      );
    }

    return traces;
  }, [tau, multiExp, tau2, amp2]);

  const avgLifetime = multiExp
    ? ((1 - amp2) * tau + amp2 * tau2).toFixed(2)
    : tau.toFixed(2);

  const fwhmSpectrum = (tau * 0.441 * 1e9 * 3e8 * 1e9).toExponential(2); // Δλ = 0.441 τ (ns) λ² (nm) / c simplified
  const fwhmSpectrumSimple = (tau * 0.441).toFixed(3);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Fluorescence Lifetime" description="Exponential decay models for fluorescence. Single and bi-exponential fitting.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">τ₁ (ns)</span>
          <input type="number" value={tau} onChange={e => setTau(Math.max(0.01, +e.target.value))} min={0.01} max={100} step={0.1}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Bi-exponential</span>
          <input type="checkbox" checked={multiExp} onChange={e => setMultiExp(e.target.checked)}
            className="mt-1 w-5 h-5" />
        </label>
        {multiExp && <>
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">τ₂ (ns)</span>
            <input type="number" value={tau2} onChange={e => setTau2(Math.max(0.01, +e.target.value))} min={0.01} max={100} step={0.1}
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">Amplitude₂ (fraction)</span>
            <input type="number" value={amp2} onChange={e => setAmp2(Math.min(1, Math.max(0, +e.target.value)))} min={0} max={1} step={0.05}
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
        </>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Avg. Lifetime ⟨τ⟩</p>
          <p className="text-xl font-bold text-green-400">{avgLifetime} ns</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FWHM of spectrum (Δν·τ ≈ 0.441)</p>
          <p className="text-xl font-bold text-blue-400">{fwhmSpectrumSimple} (τ·0.441)</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-300"><span className="text-blue-400 font-mono">I(t) = I₀ · e^(−t/τ)</span></p>
        <p className="text-sm text-gray-300"><span className="text-green-400 font-mono">Bi-exp: I(t) = a₁·e^(−t/τ₁) + a₂·e^(−t/τ₂)</span></p>
        <p className="text-gray-300 text-sm mt-1">Fourier-limited spectral width: Δν = 1/(2πτ), Δλ = λ²·Δν/c</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Time (ns)", gridcolor: "#374151" },
          yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151", range: [-0.05, 1.1] },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { x: 0.7, y: 0.99 },
        }} />
      </div>
    </CalculatorShell>
  );
}
