"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function GouyPhasePage() {
  const [wavelength, setWavelength] = useState(1064); // nm
  const [w0, setW0] = useState(0.5); // mm, beam waist
  const [z, setZ] = useState(100); // mm, distance from waist

  const calc = useMemo(() => {
    const lam = wavelength * 1e-6; // mm
    const w0m = w0; // mm
    const zm = z; // mm
    const zR = Math.PI * w0m * w0m / lam; // Rayleigh range mm
    const gouy = Math.atan(zm / zR); // rad
    const gouyDeg = gouy * 180 / Math.PI;
    const w = w0m * Math.sqrt(1 + (zm / zR) ** 2);
    const R = zm * (1 + (zR / zm) ** 2);
    return { zR, gouy, gouyDeg, w, R };
  }, [wavelength, w0, z]);

  const chartData = useMemo(() => {
    const lam = wavelength * 1e-6;
    const w0m = w0;
    const zR = Math.PI * w0m * w0m / lam;
    const zs = Array.from({ length: 200 }, (_, i) => -5 * zR + i * 0.05 * zR);
    const phases = zs.map(zi => Math.atan(zi / zR) * 180 / Math.PI);

    return [
      { x: zs, y: phases, type: "scatter" as const, mode: "lines" as const, name: "Gouy Phase", line: { color: "#60a5fa" } },
      { x: [z], y: [calc.gouyDeg], type: "scatter" as const, mode: "markers" as const, name: "Current z", marker: { color: "#f87171", size: 12 } },
      { x: [-zR, -zR], y: [-45, 45], type: "scatter" as const, mode: "lines" as const, name: "-zR", line: { color: "#4b5563", dash: "dot" }, showlegend: false },
      { x: [zR, zR], y: [-45, 45], type: "scatter" as const, mode: "lines" as const, name: "+zR", line: { color: "#4b5563", dash: "dot" }, showlegend: false },
    ];
  }, [wavelength, w0, z, calc]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Gouy Phase Shift</h1>
      <p className="text-gray-400 mb-8">Gouy phase ψ(z) = arctan(z/zᵣ) accumulated by Gaussian beam. Total π phase shift through focus.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Waist Radius w₀ (mm)</span>
          <input type="number" value={w0} onChange={e => setW0(+e.target.value)} min={0.001} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Distance from Waist z (mm)</span>
          <input type="number" value={z} onChange={e => setZ(+e.target.value)} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Rayleigh Range zᵣ</p>
          <p className="text-xl font-bold text-yellow-400">{calc.zR.toFixed(2)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Gouy Phase ψ</p>
          <p className="text-xl font-bold text-blue-400">{calc.gouyDeg.toFixed(2)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Beam Radius w(z)</p>
          <p className="text-xl font-bold text-green-400">{calc.w.toFixed(3)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Wavefront R(z)</p>
          <p className="text-xl font-bold text-red-400">{calc.R.toFixed(1)} mm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "z (mm)", gridcolor: "#374151" },
          yaxis: { title: "Gouy Phase (°)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
