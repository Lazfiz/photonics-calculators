"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function InterferometerPage() {
  const [armDiff, setArmDiff] = useState(10); // µm path difference
  const [wavelength, setWavelength] = useState(633); // nm
  const [reflectivity, setReflectivity] = useState(0.9); // mirror R
  const [type, setType] = useState<"michelson" | "mz">("michelson");

  const calc = useMemo(() => {
    const delta = (armDiff * 1e-6) / (wavelength * 1e-9); // fringes
    const phase = (2 * Math.PI * delta) % (2 * Math.PI);
    // Visibility V = (Imax - Imin)/(Imax + Imin)
    // For ideal interferometer: V = 1
    // With mirror reflectivity imbalance: V ≈ 2√(R1*R2)/(R1+R2)
    const R1 = reflectivity;
    const R2 = reflectivity; // assume equal mirrors
    const V = 2 * Math.sqrt(R1 * R2) / (R1 + R2);
    const I = (1 + V * Math.cos(phase)) / 2; // normalized intensity
    return { delta, phase, V, I };
  }, [armDiff, wavelength, reflectivity]);

  const chartData = useMemo(() => {
    const deltas = Array.from({ length: 500 }, (_, i) => -2 + i * 0.008);
    const R1 = reflectivity;
    const R2 = reflectivity;
    const V = 2 * Math.sqrt(R1 * R2) / (R1 + R2);
    const intensities = deltas.map(d => {
      const phi = 2 * Math.PI * d;
      return (1 + V * Math.cos(phi)) / 2;
    });
    const currentI = (1 + V * Math.cos(2 * Math.PI * calc.delta)) / 2;

    return [
      { x: deltas.map(d => d * wavelength / 1000), y: intensities, type: "scatter" as const, mode: "lines" as const, name: "I(ΔL)", line: { color: "#60a5fa" } },
      { x: [armDiff], y: [currentI], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [armDiff, wavelength, reflectivity, calc]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Interferometer Visibility</h1>
      <p className="text-gray-400 mb-8">Michelson / Mach-Zehnder interferometer intensity vs path difference. Visibility limited by mirror reflectivity.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Type</span>
          <select value={type} onChange={e => setType(e.target.value as any)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="michelson">Michelson</option>
            <option value="mz">Mach-Zehnder</option>
          </select>
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={100}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Path Difference ΔL (µm)</span>
          <input type="number" value={armDiff} onChange={e => setArmDiff(+e.target.value)} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Mirror Reflectivity R</span>
          <input type="number" value={reflectivity} onChange={e => setReflectivity(+e.target.value)} min={0} max={1} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Fringes</p>
          <p className="text-xl font-bold text-blue-400">{calc.delta.toFixed(2)} λ</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Phase</p>
          <p className="text-xl font-bold text-yellow-400">{((calc.phase * 180 / Math.PI + 360) % 360).toFixed(1)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Visibility V</p>
          <p className="text-xl font-bold text-green-400">{(calc.V * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Normalized I</p>
          <p className="text-xl font-bold text-red-400">{(calc.I * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Path Difference (µm)", gridcolor: "#374151" },
          yaxis: { title: "Normalized Intensity", gridcolor: "#374151", range: [0, 1.1] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
