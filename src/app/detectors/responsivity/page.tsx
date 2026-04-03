"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

export default function ResponsivityPage() {
  const [quantumEfficiency, setQuantumEfficiency] = useState(0.8);
  const [wavelength, setWavelength] = useState(1550);

  const q = 1.602e-19, h = 6.626e-34, c = 3e8;
  const responsivity = (quantumEfficiency * q * wavelength * 1e-9) / (h * c);
  const photonsPerWatt = (wavelength * 1e-9) / (h * c);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 300 + i * 7);
    const R = wls.map(wl => (quantumEfficiency * q * wl * 1e-9) / (h * c));
    return [{ x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Responsivity", line: { color: "#60a5fa" } }];
  }, [quantumEfficiency]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Quantum Efficiency (0–1)</span>
          <input type="number" value={quantumEfficiency} onChange={e => setQuantumEfficiency(+e.target.value)} step="0.01" min={0} max={1} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Responsivity" value="{responsivity.toFixed(3)} A/W" tone="blue" />
        <ResultCard label="Photons/W" value={photonsPerWatt.toExponential(2)} tone="green" />
        <ResultCard label="Current @ 1 mW" value="{(responsivity * 1e-3 * 1e6).toFixed(2)} µA" tone="orange" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Responsivity (A/W)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </div>
  );
}
