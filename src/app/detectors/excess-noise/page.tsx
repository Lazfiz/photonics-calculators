"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

export default function ExcessNoisePage() {
  const [gain, setGain] = useState(100);
  const [kFactor, setKFactor] = useState(0.02);
  const [quantumEff, setQuantumEff] = useState(0.8);

  const excessNoise = kFactor * gain + (2 - 1 / gain) * (1 - kFactor);
  const totalNoise = Math.sqrt(excessNoise * gain * quantumEff);
  const noiseFigure = 10 * Math.log10(excessNoise);
  const snrDegradation = Math.sqrt(excessNoise);

  const chartData = useMemo(() => {
    const M = Array.from({ length: 300 }, (_, i) => 1 + i * 999 / 300);
    const materials = [
      { name: "Si (k≈0.02)", k: 0.02, color: "#60a5fa" },
      { name: "InGaAs (k≈0.5)", k: 0.5, color: "#f87171" },
      { name: "Ge (k≈0.7)", k: 0.7, color: "#fbbf24" },
      { name: "k≈0 (ideal)", k: 0.001, color: "#34d399", dash: "dash" },
    ];
    const traces = materials.map(mat => ({
      x: M, y: M.map(m => mat.k * m + (2 - 1 / m) * (1 - mat.k)),
      type: "scatter" as const, mode: "lines" as const,
      name: mat.name, line: { color: mat.color, width: 2, dash: (mat as any).dash || undefined },
    }));
    traces.push({ x: M, y: M.map(m => kFactor * m + (2 - 1 / m) * (1 - kFactor)), type: "scatter" as const, mode: "lines" as const, name: `Custom (k=${kFactor})`, line: { color: "#a78bfa", width: 3 } });
    return traces;
  }, [kFactor]);

  const snrChart = useMemo(() => {
    const signal = Array.from({ length: 200 }, (_, i) => 1 + i * 10000 / 200);
    return [
      { x: signal, y: signal.map(s => Math.sqrt(s * quantumEff)), type: "scatter", mode: "lines", name: "PIN (no excess)", line: { color: "#34d399", width: 2 } },
      { x: signal, y: signal.map(s => Math.sqrt(s * quantumEff / excessNoise)), type: "scatter", mode: "lines", name: `APD (F=${excessNoise.toFixed(2)})`, line: { color: "#f87171", width: 2 } },
    ];
  }, [quantumEff, excessNoise]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Excess Noise Factor" description="APD excess noise vs gain — McIntyre model for different semiconductor materials." maxWidthClassName="max-w-5xl">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Multiplication Gain (M)</span><input type="number" value={gain} onChange={e => setGain(+e.target.value)} min="1" step="10" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Ionization Ratio k</span><input type="number" value={kFactor} onChange={e => setKFactor(+e.target.value)} min="0.001" max="1" step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Quantum Efficiency</span><input type="number" value={quantumEff} onChange={e => setQuantumEff(+e.target.value)} min="0.01" max="1" step="0.05" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Excess Noise F" value={excessNoise.toFixed(3)} tone="red" />
        <ResultCard label="Noise Figure" value={`${noiseFigure.toFixed(2)} dB`} tone="yellow" />
        <ResultCard label="SNR Degradation" value={`×${snrDegradation.toFixed(2)}`} tone="blue" />
        <ResultCard label="F × M" value={(excessNoise * gain).toFixed(0)} tone="purple" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"><p>F(M) = k·M + (2 − 1/M)·(1 − k)  [McIntyre]</p><p>Si: k≈0.02, InGaAs: k≈0.5, Ge: k≈0.7</p></div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Gain M", gridcolor: "#374151", type: "log" }, yaxis: { title: "F", gridcolor: "#374151" } }} />
      <ChartPanel data={snrChart} layout={{ xaxis: { title: "Photons", gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} title="SNR: PIN vs APD" />
    </CalculatorShell>
  );
}
