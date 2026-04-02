"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function NOHDPage() {
  const [power, setPower] = useState(100);
  const [wavelength, setWavelength] = useState(1550);
  const [beamDia, setBeamDia] = useState(2);
  const [divergence, setDivergence] = useState(1);
  const [mpe, setMpe] = useState(100);

  const nohd = useMemo(() => {
    const a = (beamDia / 2) / 1000; // beam radius in m
    const phi = (divergence / 1000) * Math.PI / 180; // divergence in rad
    const MPE_W_per_m2 = (mpe * 10) / (1); // mJ/cm² → approximate W/m² (rough)
    const MPE_W_per_m2_approx = mpe / 1000 * 1e4; // mJ/cm² to W/m²
    const factor = 1.27 * power / (MPE_W_per_m2_approx * Math.pow(a, 2));
    if (factor <= 1) return 0;
    return (1 / phi) * (Math.sqrt(factor) - 1);
  }, [power, beamDia, divergence, mpe]);

  const chartData = useMemo(() => {
    const distances = Array.from({ length: 100 }, (_, i) => i * nohd * 1.5 / 100 || i * 100);
    const irradiances = distances.map(z => {
      const a = (beamDia / 2) / 1000;
      const phi = (divergence / 1000) * Math.PI / 180;
      const w = a + z * Math.tan(phi);
      return (power / (Math.PI * w * w)) * 1e-4; // W/cm²
    });
    return [
      { x: distances, y: irradiances, type: "scatter" as const, mode: "lines" as const, name: "Irradiance", line: { color: "#60a5fa" } },
      { x: [0, Math.max(...distances)], y: [mpe / 1000, mpe / 1000], type: "scatter" as const, mode: "lines" as const, name: "MPE", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [power, beamDia, divergence, mpe, nohd]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/laser-safety" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Laser Safety</Link>
      <h1 className="text-3xl font-bold mb-2">Nominal Ocular Hazard Distance (NOHD)</h1>
      <p className="text-gray-400 mb-8">Distance at which the laser irradiance drops below the MPE for a direct beam exposure.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Power (mW)</span>
          <input type="number" value={power} onChange={e => setPower(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Beam Diameter (mm)</span>
          <input type="number" value={beamDia} onChange={e => setBeamDia(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Divergence (mrad)</span>
          <input type="number" value={divergence} onChange={e => setDivergence(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">MPE (mJ/cm²)</span>
          <input type="number" value={mpe} onChange={e => setMpe(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <p className="text-sm text-gray-400">NOHD</p>
        <p className="text-3xl font-bold text-red-400">{nohd.toFixed(1)} m</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Distance (m)", gridcolor: "#374151" },
          yaxis: { title: "Irradiance (W/cm²)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
