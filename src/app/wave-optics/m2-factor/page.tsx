"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function M2FactorPage() {
  const [wavelength, setWavelength] = useState(1550); // nm
  const [waistMeasured, setWaistMeasured] = useState(10); // µm (measured 1/e² waist)
  const [divMeasured, setDivMeasured] = useState(50); // mrad (measured far-field divergence)
  const [m2, setM2] = useState(1.2);

  // If M² is set, compute what the measured divergence would be
  const zR_ideal = Math.PI * Math.pow(waistMeasured, 2) / wavelength * 1000; // mm
  const div_ideal = wavelength / (Math.PI * waistMeasured) * 1000; // mrad
  const div_from_m2 = div_ideal * m2;
  const m2_from_meas = (waistMeasured * divMeasured) / (div_ideal * waistMeasured);

  // Use slider-driven M² for the chart
  const effectiveM2 = m2;
  const effectiveDiv = div_ideal * effectiveM2;
  const effectiveZR = zR_ideal;

  const chartData = useMemo(() => {
    const zMax = effectiveZR * 4;
    const zs = Array.from({ length: 300 }, (_, i) => -zMax + i * 2 * zMax / 300);

    // Real beam: w(z) = w₀ * sqrt(1 + M⁴ * (z/zR)²)
    const w_real = zs.map(z => waistMeasured * Math.sqrt(1 + Math.pow(effectiveM2, 2) * Math.pow(z / effectiveZR, 2)));
    // Ideal beam: w(z) = w₀ * sqrt(1 + (z/zR)²)
    const w_ideal = zs.map(z => waistMeasured * Math.sqrt(1 + Math.pow(z / effectiveZR, 2)));

    return [
      { x: zs, y: w_ideal, type: "scatter" as const, mode: "lines" as const, name: "Ideal (M²=1)", line: { color: "#22c55e", dash: "dash" } },
      { x: zs, y: w_real, type: "scatter" as const, mode: "lines" as const, name: `Real (M²=${effectiveM2.toFixed(2)})`, line: { color: "#60a5fa" } },
      // Divergence asymptotes
      { x: [0, zMax], y: [waistMeasured, waistMeasured + effectiveDiv * zMax / 1000], type: "scatter" as const, mode: "lines" as const, name: "Far-field asymptote", line: { color: "#f87171", dash: "dot" } },
    ];
  }, [wavelength, waistMeasured, effectiveM2, effectiveZR, effectiveDiv]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">M² Beam Quality Factor</h1>
      <p className="text-gray-400 mb-8">Compare real beam quality against the diffraction limit.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 font-mono text-sm text-gray-300">
        <pre>{`w(z) = w₀ · √(1 + M⁴·(z/z_R)²)
θ_real = M² · λ / (π·w₀)
BPP_real = M² · λ/π = w₀ · θ_real

M² = 1: diffraction-limited (TEM₀₀)`}</pre>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <label className="block"><span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Measured Waist w₀ (µm)</span>
          <input type="number" value={waistMeasured} onChange={e => setWaistMeasured(+e.target.value)} step="any" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <label className="block mb-6"><span className="text-gray-300 text-sm">M² Factor: {m2.toFixed(2)}</span>
        <input type="range" min={1} max={5} step={0.01} value={m2} onChange={e => setM2(+e.target.value)} className="w-full mt-1" /></label>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Ideal Divergence</p>
          <p className="text-xl font-bold text-green-400">{div_ideal.toFixed(2)} mrad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Real Divergence</p>
          <p className="text-xl font-bold text-blue-400">{effectiveDiv.toFixed(2)} mrad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">BPP (real)</p>
          <p className="text-xl font-bold text-orange-400">{(waistMeasured * effectiveDiv / 2).toFixed(3)} mm·mrad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Rayleigh Range</p>
          <p className="text-xl font-bold text-purple-400">{effectiveZR.toFixed(2)} mm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "z (mm)", gridcolor: "#374151" },
          yaxis: { title: "w(z) (µm)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 }, showlegend: true, legend: { x: 0, y: 1.15, orientation: "h" },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
