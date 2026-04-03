"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function RamanSpectroscopyPage() {
  const [laserWavelength, setLaserWavelength] = useState(532);
  const [maxShift, setMaxShift] = useState(4000);

  const chartData = useMemo(() => {
    const shifts = Array.from({ length: 500 }, (_, i) => (i / 500) * maxShift);
    const laserNm = laserWavelength;

    // Stokes shift: λ_s = 1 / (1/λ₀ - ν̃)
    const stokesWavelengths = shifts.map(s => {
      const invLam0 = 1 / laserNm;
      const invLamS = invLam0 - s / 1e7;
      return invLamS > 0 ? 1 / invLamS : NaN;
    });

    // Anti-Stokes
    const antiStokesWavelengths = shifts.map(s => {
      const invLam0 = 1 / laserNm;
      const invLamAS = invLam0 + s / 1e7;
      return invLamAS > 0 ? 1 / invLamAS : NaN;
    });

    return [
      { x: shifts, y: stokesWavelengths, type: "scatter" as const, mode: "lines" as const, name: "Stokes", line: { color: "#60a5fa" } },
      { x: shifts, y: antiStokesWavelengths, type: "scatter" as const, mode: "lines" as const, name: "Anti-Stokes", line: { color: "#f87171" } },
    ];
  }, [laserWavelength, maxShift]);

  const sampleStokes = [
    { name: "C-H stretch", shift: 2850 },
    { name: "O-H stretch", shift: 3400 },
    { name: "N-H stretch", shift: 3300 },
    { name: "Si-O stretch", shift: 1100 },
    { name: "C=O stretch", shift: 1700 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Raman Spectroscopy</h1>
      <p className="text-gray-400 mb-8">Stokes and anti-Stokes wavelength shift vs Raman shift. Inelastic scattering fundamentals.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Laser Wavelength (nm)</span>
          <input type="number" value={laserWavelength} onChange={e => setLaserWavelength(+e.target.value)} min={200} max={2000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Max Raman Shift (cm⁻¹)</span>
          <input type="number" value={maxShift} onChange={e => setMaxShift(+e.target.value)} min={100} max={5000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Stokes:</span> λ<sub>s</sub> = 1 / (1/λ₀ − ν̃)</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-red-400 font-mono">Anti-Stokes:</span> λ<sub>as</sub> = 1 / (1/λ₀ + ν̃)</p>
        <p className="text-gray-300 text-sm">Raman shift is independent of excitation wavelength.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Common Raman Peaks</h3>
        {sampleStokes.map(p => {
          const invLam0 = 1 / laserWavelength;
          const invLamS = invLam0 - p.shift / 1e7;
          const wl = invLamS > 0 ? (1 / invLamS).toFixed(2) : "N/A";
          return (
            <p key={p.name} className="text-gray-300 text-sm">
              <span className="text-green-400">{p.name}</span>: {p.shift} cm⁻¹ → {wl} nm (Stokes)
            </p>
          );
        })}
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Raman Shift (cm⁻¹)", gridcolor: "#374151" },
          yaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { x: 0.01, y: 0.99 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
