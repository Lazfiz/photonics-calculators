"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ViewingDistancePage() {
  const [power, setPower] = useState(500); // mW
  const [wavelength, setWavelength] = useState(532);
  const [beamDiameter, setBeamDiameter] = useState(2); // mm
  const [divergence, setDivergence] = useState(0.5); // mrad full angle
  const [mpeIrrad, setMpeIrrad] = useState(0.0025); // W/cm²

  // Beam diameter at distance z: d(z) = d0 + z * θ (small angle)
  // Irradiance at z: I(z) = P / (π/4 * d(z)²)
  const irradianceAtDistance = (z: number) => {
    const d0 = beamDiameter / 10; // cm
    const theta = divergence / 1000; // rad
    const dZ = d0 + z * 100 * theta; // cm (z in m, convert to cm)
    const area = Math.PI / 4 * dZ * dZ;
    return (power / 1000) / area; // W/cm²
  };

  const nohd = useMemo(() => {
    let z = 0.01;
    while (z < 100000 && irradianceAtDistance(z) > mpeIrrad) z *= 1.02;
    return z;
  }, [power, beamDiameter, divergence, mpeIrrad]);

  const enhd = useMemo(() => {
    // Enhanced NHOD: assumes 7mm pupil instead of full beam
    const pupilArea = Math.PI * Math.pow(0.35, 2); // cm² (3.5mm radius)
    const pupilIrrad = (power / 1000) / pupilArea;
    if (pupilIrrad <= mpeIrrad) return 0;
    let z = 0.01;
    while (z < 100000 && irradianceAtDistance(z) > mpeIrrad) z *= 1.02;
    return z;
  }, [power, mpeIrrad]);

  const chartData = useMemo(() => {
    const maxDist = nohd * 1.5;
    const distances = Array.from({ length: 200 }, (_, i) => maxDist * Math.pow(10, -1.5 + i * 0.018));
    return [
      {
        x: distances, y: distances.map(irradianceAtDistance),
        type: "scatter" as const, mode: "lines" as const, name: "Irradiance",
        line: { color: "#60a5fa" }
      },
      {
        x: distances, y: distances.map(() => mpeIrrad),
        type: "scatter" as const, mode: "lines" as const, name: "MPE",
        line: { color: "#f87171", dash: "dash" }
      }
    ];
  }, [nohd, mpeIrrad, power, beamDiameter, divergence]);

  const formatDist = (d: number) =>
    d >= 1000 ? (d / 1000).toFixed(2) + " km" :
    d >= 1 ? d.toFixed(1) + " m" :
    (d * 100).toFixed(1) + " cm";

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/laser-safety" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Laser Safety</Link>
      <h1 className="text-3xl font-bold mb-2">Safe Viewing Distance Calculator</h1>
      <p className="text-gray-400 mb-8">Calculate Nominal Ocular Hazard Distance (NOHD) for direct beam viewing based on beam divergence and MPE.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Power (mW)</span>
          <input type="number" value={power} onChange={e => setPower(+e.target.value)} min={0.001} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={180} max={1800}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Beam Diameter (mm)</span>
          <input type="number" value={beamDiameter} onChange={e => setBeamDiameter(+e.target.value)} min={0.01} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Divergence (mrad)</span>
          <input type="number" value={divergence} onChange={e => setDivergence(+e.target.value)} min={0.01} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">MPE Irradiance (W/cm²)</span>
          <input type="number" value={mpeIrrad} onChange={e => setMpeIrrad(+e.target.value)} min={0.00001} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">NOHD (Nominal Ocular Hazard Distance)</p>
          <p className="text-3xl font-bold text-red-400">{formatDist(nohd)}</p>
          <p className="text-sm text-gray-500 mt-1">Beyond this distance, irradiance falls below MPE</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Beam Diameter at NOHD</p>
          <p className="text-3xl font-bold text-yellow-400">
            {(beamDiameter / 10 + nohd * 100 * divergence / 1000).toFixed(1)} cm
          </p>
          <p className="text-sm text-gray-500 mt-1">d₀ + NOHD × θ</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Distance (m)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Irradiance (W/cm²)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
