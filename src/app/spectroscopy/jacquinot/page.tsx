"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function JacquinotPage() {
  const [maxOPD, setMaxOPD] = useState(1.0); // cm
  const [wavenumber, setWavenumber] = useState(1000); // cm⁻¹

  const chartData = useMemo(() => {
    const wns = Array.from({ length: 300 }, (_, i) => 400 + i * 3600 / 300);
    // Jacquinot advantage: throughput = 2π·A·Ω = π·θ² (for FTIR circular aperture)
    // G = (2π·Δν̃)/ν̃ where Δν̃ = 1/(2·L) is resolution
    const resolution = wns.map(wn => 1 / (2 * maxOPD));
    const G = wns.map(wn => (2 * Math.PI) / (wn * 2 * maxOPD));
    // Also: etendue advantage over grating
    // FTIR throughput advantage ≈ 2π·Δν̃/ν̃ ≈ 2π/(ν̃·2L) = π/(ν̃·L)
    return [{ x: wns, y: G, type: "scatter" as const, mode: "lines" as const, name: "Throughput Advantage", line: { color: "#60a5fa" } }];
  }, [maxOPD]);

  const deltaNu = 1 / (2 * maxOPD);
  const jacquinotAdv = (2 * Math.PI) / (wavenumber * 2 * maxOPD);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Jacquinot Advantage" description="FTIR throughput advantage over dispersive instruments. G = 2π/(ν̃·2L) where L = max OPD.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Max OPD (cm)</span>
          <input type="number" value={maxOPD} onChange={e => setMaxOPD(+e.target.value)} step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Wavenumber (cm⁻¹)</span>
          <input type="number" value={wavenumber} onChange={e => setWavenumber(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Resolution Δν̃ = <span className="text-blue-400 font-mono">{deltaNu.toFixed(3)} cm⁻¹</span></p>
        <p className="text-gray-300">Jacquinot advantage at {wavenumber} cm⁻¹ = <span className="text-blue-400 font-mono">{jacquinotAdv.toExponential(3)}</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Wavenumber (cm⁻¹)", gridcolor: "#374151" }, yaxis: { title: "Throughput Advantage", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true }} />
    </CalculatorShell>
  );
}
