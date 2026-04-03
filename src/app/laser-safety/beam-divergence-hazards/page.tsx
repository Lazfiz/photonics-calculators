"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function BeamDivergenceHazardsPage() {
  const [power, setPower] = useState(1000); // mW
  const [wavelength, setWavelength] = useState(1064);
  const [beamWaist, setBeamWaist] = useState(1); // mm
  const [divergence, setDivergence] = useState(1); // mrad

  // Beam radius at distance z: w(z) = w0 * sqrt(1 + (z/zR)^2)
  // Rayleigh range: zR = π * w0² / λ
  const rayleighRange = useMemo(() => {
    const w0 = beamWaist / 1000; // m
    const lam = wavelength * 1e-9; // m
    return Math.PI * w0 * w0 / lam; // m
  }, [beamWaist, wavelength]);

  const beamRadiusAt = (z: number) => {
    const w0 = beamWaist / 1000;
    return w0 * Math.sqrt(1 + Math.pow(z / rayleighRange, 2));
  };

  const irradianceAt = (z: number) => {
    const r = beamRadiusAt(z);
    return (power / 1000) / (Math.PI * r * r * 1e4); // W/cm²
  };

  // MPE for CW IR (simplified)
  const mpeIrradiance = useMemo(() => {
    const lam = wavelength / 1000;
    if (lam >= 1.05 && lam < 1.4) return 0.1; // W/cm² for long exposure
    if (lam >= 0.7 && lam < 1.05) return 0.1;
    return 0.01;
  }, [wavelength]);

  const nohd = useMemo(() => {
    // Find z where irradiance = MPE
    let z = 0.1;
    while (z < 10000 && irradianceAt(z) > mpeIrradiance) z *= 1.05;
    return z;
  }, [power, beamWaist, wavelength, mpeIrradiance, rayleighRange]);

  const chartData = useMemo(() => {
    const distances = Array.from({ length: 200 }, (_, i) => 0.1 + i * nohd * 0.05);
    return [
      {
        x: distances.map(d => d * 100), y: distances.map(d => irradianceAt(d)),
        type: "scatter" as const, mode: "lines" as const, name: "Irradiance",
        line: { color: "#60a5fa" }
      },
      {
        x: distances.map(d => d * 100), y: distances.map(() => mpeIrradiance),
        type: "scatter" as const, mode: "lines" as const, name: "MPE",
        line: { color: "#f87171", dash: "dash" }
      }
    ];
  }, [nohd, mpeIrradiance, rayleighRange, power, beamWaist]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/laser-safety" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Laser Safety</Link>
      <h1 className="text-3xl font-bold mb-2">Beam Divergence Hazards</h1>
      <p className="text-gray-400 mb-8">Model Gaussian beam propagation and hazard distance based on beam divergence and MPE limits.</p>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
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
          <span className="text-gray-300 text-sm">Beam Waist (mm)</span>
          <input type="number" value={beamWaist} onChange={e => setBeamWaist(+e.target.value)} min={0.01} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Divergence (mrad)</span>
          <input type="number" value={divergence} onChange={e => setDivergence(+e.target.value)} min={0.01} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Rayleigh Range</p>
          <p className="text-2xl font-bold text-blue-400">{rayleighRange.toFixed(2)} m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Nominal OHD (NOHD)</p>
          <p className="text-2xl font-bold text-yellow-400">{nohd.toFixed(1)} m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">MPE Irradiance</p>
          <p className="text-2xl font-bold text-green-400">{mpeIrradiance} W/cm²</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Distance (cm)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Irradiance (W/cm²)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
