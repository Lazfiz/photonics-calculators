"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function DiffuseReflectionPage() {
  const [power, setPower] = useState(5000); // mW
  const [wavelength, setWavelength] = useState(1064);
  const [beamDiameter, setBeamDiameter] = useState(5); // mm
  const [surfaceReflectance, setSurfaceReflectance] = useState(0.1); // 10%
  const [viewingDistance, setViewingDistance] = useState(0.5); // m
  const [exposureTime, setExposureTime] = useState(10); // s

  // Diffuse (Lambertian) reflection: radiance L = (ρ * P) / (π * A_beam)
  // where ρ = reflectance, P = power, A_beam = beam area on surface
  // Irradiance at viewer: E = L * A_lens * cos(θ) / r²
  // Simplified for normal viewing: E = (ρ * P) / (π * A_beam * r²) * A_lens
  // A_lens = pupil area = π * (0.35cm)² = 0.385 cm²
  const pupilArea = Math.PI * Math.pow(0.35, 2); // cm² (7mm pupil)

  const beamArea = useMemo(() => Math.PI * Math.pow(beamDiameter / 20, 2), [beamDiameter]); // cm²
  const radiance = useMemo(() => (surfaceReflectance * power / 1000) / (Math.PI * beamArea), [surfaceReflectance, power, beamArea]);
  const viewerIrradiance = useMemo(() => {
    const r = viewingDistance * 100; // cm
    return radiance * pupilArea / (r * r); // W/cm²
  }, [radiance, viewingDistance]);

  // Extended source MPE: MPE_es = MPE_point * (α_min / α) for large sources
  // α = source angular subtense at viewer
  const sourceSize = useMemo(() => {
    const r = viewingDistance * 100; // cm
    return Math.atan2(beamDiameter / 10, r) * 180 / Math.PI; // degrees
  }, [beamDiameter, viewingDistance]);

  const alphaMin = 1.5; // mrad = 0.086 degrees
  const alphaMinDeg = alphaMin * 180 / Math.PI / 1000;
  const extendedSourceFactor = useMemo(() => {
    return Math.max(1, alphaMinDeg / sourceSize);
  }, [sourceSize]);

  // Simplified MPE (point source)
  const pointMPE = useMemo(() => {
    const lam = wavelength / 1000;
    if (lam >= 0.4 && lam < 0.7) return 1.8e-3 * Math.pow(exposureTime, -0.25);
    if (lam >= 0.7 && lam < 1.4) return 1.8e-3 * Math.pow(10, 0.02 * (lam - 0.7)) * Math.pow(exposureTime, -0.25);
    if (lam >= 1.4 && lam < 1.8) return exposureTime < 10 ? 0.1 / exposureTime : 0.01;
    return 0.01;
  }, [wavelength, exposureTime]);

  const extendedMPE = useMemo(() => pointMPE * extendedSourceFactor, [pointMPE, extendedSourceFactor]);
  const hazardRatio = useMemo(() => viewerIrradiance / extendedMPE, [viewerIrradiance, extendedMPE]);

  const chartData = useMemo(() => {
    const distances = Array.from({ length: 150 }, (_, i) => 0.05 + i * 0.05);
    return [
      {
        x: distances, y: distances.map(d => {
          const r = d * 100;
          return radiance * pupilArea / (r * r);
        }),
        type: "scatter" as const, mode: "lines" as const, name: "Diffuse Reflection Irradiance",
        line: { color: "#60a5fa" }
      },
      {
        x: distances, y: distances.map(() => extendedMPE),
        type: "scatter" as const, mode: "lines" as const, name: "Extended Source MPE",
        line: { color: "#f87171", dash: "dash" }
      }
    ];
  }, [radiance, extendedMPE]);

  const riskLevel = hazardRatio > 10 ? "HIGH" : hazardRatio > 1 ? "MODERATE" : "SAFE";
  const riskColor = hazardRatio > 10 ? "text-red-500" : hazardRatio > 1 ? "text-yellow-400" : "text-green-400";

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/laser-safety" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Laser Safety</Link>
      <h1 className="text-3xl font-bold mb-2">Diffuse Reflection Hazard</h1>
      <p className="text-gray-400 mb-8">Evaluate hazard from Lambertian (diffuse) reflections off matte surfaces. Uses extended-source MPE.</p>

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
          <span className="text-gray-300 text-sm">Surface Reflectance</span>
          <input type="number" value={surfaceReflectance} onChange={e => setSurfaceReflectance(+e.target.value)} min={0} max={1} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Viewing Distance (m)</span>
          <input type="number" value={viewingDistance} onChange={e => setViewingDistance(+e.target.value)} min={0.01} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Exposure Time (s)</span>
          <input type="number" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} min={1e-9} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Radiance</p>
          <p className="text-xl font-bold text-blue-400">{radiance.toFixed(4)} W/(cm²·sr)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Viewer Irradiance</p>
          <p className="text-xl font-bold text-yellow-400">{viewerIrradiance.toExponential(2)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Extended MPE</p>
          <p className="text-xl font-bold text-green-400">{extendedMPE.toFixed(4)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Hazard</p>
          <p className={`text-xl font-bold ${riskColor}`}>{hazardRatio.toFixed(1)}× ({riskLevel})</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Viewing Distance (m)", gridcolor: "#374151" },
          yaxis: { title: "Irradiance (W/cm²)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
