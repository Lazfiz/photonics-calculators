"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function FluorescenceLifetimePage() {
  const [tau, setTau] = useURLState("tau", 5); // ns
  const [amplitude, setAmplitude] = useURLState("amplitude", 1);
  const [multiExp, setMultiExp] = useState(false);
  const [tau2, setTau2] = useURLState("tau2", 1);
  const [frac1, setFrac1] = useURLState("frac1", 0.7);
  const [tMax, setTMax] = useURLState("tMax", 30);

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
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Fluorescence Lifetime Calculator" description="Model single and bi-exponential fluorescence decay curves. Calculate intensity-weighted average lifetimes.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="τ₁ (ns)" value={tau} onChange={setTau} min={0.01} step="0.1" />
        <ValidatedNumberInput label="Amplitude I₀" value={amplitude} onChange={setAmplitude} min={0.01} step="0.1" />
        <ValidatedNumberInput label="Time Range (ns)" value={tMax} onChange={setTMax} min={1} step="1" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Bi-exponential mode</span>
          <select value={multiExp ? "true" : "false"} onChange={e => setMultiExp(e.target.value === "true")}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="false">Single exponential</option>
            <option value="true">Bi-exponential</option>
          </select>
        </label>
        {multiExp && <>
          <ValidatedNumberInput label="τ₂ (ns)" value={tau2} onChange={setTau2} min={0.01} step="0.1" />
          <ValidatedNumberInput label="Fraction f₁ (0–1)" value={frac1} onChange={setFrac1} min={0} max={1} step="0.05" />
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

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Time (ns)", gridcolor: "#374151" },
        yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
        margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
      }} />
    </CalculatorShell>
  );
}
