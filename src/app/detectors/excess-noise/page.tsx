"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Excess noise factor in APDs: F = k*M + (1-k)*(2 - 1/M)
// k = ionization coefficient ratio (electron/hole)
// M = multiplication gain
// McIntyre formula: F(M) = k*M + (2 - 1/M)*(1 - k)
// For electrons: k = β/α; for holes: k = α/β
export default function ExcessNoisePage() {
  const [gain, setGain] = useState(100); // multiplication gain
  const [kFactor, setKFactor] = useState(0.02); // ionization ratio
  const [gainMin, setGainMin] = useState(1);
  const [gainMax, setGainMax] = useState(1000);
  const [wavelength, setWavelength] = useState(800); // nm (for material reference)
  const [quantumEff, setQuantumEff] = useState(0.8);

  const excessNoise = kFactor * gain + (2 - 1 / gain) * (1 - kFactor);
  const totalNoise = Math.sqrt(excessNoise * gain * quantumEff);
  const noiseFigure = 10 * Math.log10(excessNoise); // dB
  const snrDegradation = Math.sqrt(excessNoise);

  const chartData = useMemo(() => {
    const M = Array.from({ length: 300 }, (_, i) => gainMin + i * (gainMax - gainMin) / 300);
    // Current k
    const fCurrent = M.map(m => kFactor * m + (2 - 1 / m) * (1 - kFactor));
    // Comparison materials
    const materials = [
      { name: "Si (k≈0.02)", k: 0.02, color: "#60a5fa" },
      { name: "InGaAs (k≈0.5)", k: 0.5, color: "#f87171" },
      { name: "Ge (k≈0.7)", k: 0.7, color: "#fbbf24" },
      { name: "k=0 (ideal)", k: 0.001, color: "#34d399", dash: "dash" },
    ];
    const traces = materials.map(mat => ({
      x: M, y: M.map(m => mat.k * m + (2 - 1 / m) * (1 - mat.k)),
      type: "scatter" as const, mode: "lines" as const,
      name: mat.name, line: { color: mat.color, width: 2, dash: (mat as any).dash || undefined },
    }));
    // Add user's custom k
    traces.push({
      x: M, y: fCurrent,
      type: "scatter" as const, mode: "lines" as const,
      name: `Custom (k=${kFactor})`, line: { color: "#a78bfa", width: 3 },
    });
    return traces;
  }, [kFactor, gainMin, gainMax]);

  const snrChart = useMemo(() => {
    const signal = Array.from({ length: 200 }, (_, i) => 1 + i * 10000 / 200);
    return [
      { x: signal, y: signal.map(s => Math.sqrt(s * quantumEff)), type: "scatter", mode: "lines",
        name: "PIN (no excess noise)", line: { color: "#34d399", width: 2 } },
      { x: signal, y: signal.map(s => Math.sqrt(s * quantumEff / excessNoise)), type: "scatter", mode: "lines",
        name: `APD (F=${excessNoise.toFixed(2)})`, line: { color: "#f87171", width: 2 } },
    ];
  }, [quantumEff, excessNoise]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Excess Noise Factor</h1>
      <p className="text-gray-400 mb-8">APD excess noise vs gain — McIntyre model for different semiconductor materials.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Multiplication Gain (M)</span>
          <input type="number" value={gain} onChange={e => setGain(+e.target.value)} min="1" step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Ionization Ratio (k = β/α)</span>
          <input type="number" value={kFactor} onChange={e => setKFactor(+e.target.value)} min="0.001" max="1" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Quantum Efficiency</span>
          <input type="number" value={quantumEff} onChange={e => setQuantumEff(+e.target.value)} min="0.01" max="1" step="0.05"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min="300" max="1700"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Excess Noise Factor (F)</p>
          <p className="text-xl font-bold text-red-400">{excessNoise.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Noise Figure</p>
          <p className="text-xl font-bold text-yellow-400">{noiseFigure.toFixed(2)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SNR Degradation</p>
          <p className="text-xl font-bold text-blue-400">×{snrDegradation.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">F × M (noise gain)</p>
          <p className="text-xl font-bold text-purple-400">{(excessNoise * gain).toFixed(0)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>F(M) = k·M + (2 − 1/M)·(1 − k)  [McIntyre formula]</p>
        <p>SNR<sub>APD</sub> = SNR<sub>PIN</sub> / √F  →  lower k = better (Si APDs are excellent)</p>
        <p>Si: k ≈ 0.02, InGaAs: k ≈ 0.5, Ge: k ≈ 0.7, GaAs: k ≈ 0.01</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Multiplication Gain (M)", gridcolor: "#374151", type: "log" },
        yaxis: { title: "Excess Noise Factor (F)", gridcolor: "#374151" },
        margin: { t: 30, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} config={{ responsive: true, displayModeBar: false }} />

      <h2 className="text-xl font-bold mt-8 mb-4">SNR: PIN vs APD</h2>
      <Plot data={snrChart} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Detected Photons", gridcolor: "#374151", type: "log" },
        yaxis: { title: "SNR", gridcolor: "#374151" },
        margin: { t: 30, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} config={{ responsive: true, displayModeBar: false }} />
    </div>
  );
}
