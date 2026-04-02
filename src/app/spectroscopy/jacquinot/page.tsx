"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

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
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Jacquinot Advantage</h1>
      <p className="text-gray-400 mb-8">FTIR throughput advantage over dispersive instruments. G = 2π/(ν̃·2L) where L = max OPD.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Max OPD (cm)</span>
          <input type="number" value={maxOPD} onChange={e => setMaxOPD(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Wavenumber (cm⁻¹)</span>
          <input type="number" value={wavenumber} onChange={e => setWavenumber(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Resolution Δν̃ = <span className="text-blue-400 font-mono">{deltaNu.toFixed(3)} cm⁻¹</span></p>
        <p className="text-gray-300">Jacquinot advantage at {wavenumber} cm⁻¹ = <span className="text-blue-400 font-mono">{jacquinotAdv.toExponential(3)}</span></p>
      </div>

      <Plot data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Wavenumber (cm⁻¹)", gridcolor: "#374151" }, yaxis: { title: "Throughput Advantage", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
