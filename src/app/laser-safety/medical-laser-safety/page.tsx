"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function MedicalLaserSafetyPage() {
  const [power, setPower] = useState(10000); // mW (10W)
  const [wavelength, setWavelength] = useState(10600); // nm CO2
  const [spotSize, setSpotSize] = useState(0.2); // mm
  const [exposureTime, setExposureTime] = useState(0.1); // s
  const [beamDia, setBeamDia] = useState(1); // mm (delivery fiber/handpiece)
  const [treatmentArea, setTreatmentArea] = useState(1); // cm²

  // MPE based on wavelength region
  const mpe = useMemo(() => {
    if (wavelength < 400) return 0.003; // UV, W/cm²
    if (wavelength <= 700) return 2.5 / Math.sqrt(exposureTime); // visible
    if (wavelength <= 1400) return 0.1 / Math.sqrt(exposureTime); // IR-A retinal
    if (wavelength <= 3000) return 0.1; // IR-B
    return 0.1; // IR-C (CO2) - simplified
  }, [wavelength, exposureTime]);

  const spotAreaCm2 = Math.PI * Math.pow(spotSize / 20, 2);
  const powerDensity = (power / 1000) / spotAreaCm2; // W/cm²
  const fluence = powerDensity * exposureTime; // J/cm²
  const safetyRatio = mpe > 0 ? powerDensity / mpe : Infinity;
  const odRequired = safetyRatio > 1 ? Math.ceil(Math.log10(safetyRatio)) : 0;

  // Thermal relaxation time
  const thermalRelaxTime = Math.pow(spotSize / 1000, 2) / (16 * 1.3e-3); // s (skin, α ≈ 1.3e-3 cm²/s)

  // Treatment power density
  const treatmentPowerDensity = treatmentArea > 0 ? (power / 1000) / treatmentArea : 0;

  // Laser type
  const laserType = useMemo(() => {
    if (wavelength === 10600) return "CO₂ Surgical";
    if (wavelength === 1064) return "Nd:YAG";
    if (wavelength === 532) return "KTP (frequency-doubled Nd:YAG)";
    if (wavelength === 810) return "Diode";
    if (wavelength === 694) return "Ruby";
    if (wavelength === 755) return "Alexandrite";
    if (wavelength === 1550) return "Er:Glass";
    if (wavelength === 2940) return "Er:YAG";
    if (wavelength === 1320 || wavelength === 1440) return "Nd:YAG (1.3–1.4 µm)";
    return "Other";
  }, [wavelength]);

  const chartData = useMemo(() => {
    const times = Array.from({ length: 80 }, (_, i) => 0.001 + i * 0.5); // 1ms to 40s
    const fluences = times.map(t => powerDensity * t);
    const mpeFluences = times.map(t => {
      if (wavelength <= 700) return (2.5 / Math.sqrt(t)) * t;
      if (wavelength <= 1400) return (0.1 / Math.sqrt(t)) * t;
      return 0.1 * t;
    });
    return [
      { x: times.map(t => t * 1000), y: fluences, type: "scatter" as const, mode: "lines" as const, name: "Your fluence", line: { color: "#60a5fa" } },
      { x: times.map(t => t * 1000), y: mpeFluences, type: "scatter" as const, mode: "lines" as const, name: "MPE fluence", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [powerDensity, wavelength]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/laser-safety" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Laser Safety</Link>
      <h1 className="text-3xl font-bold mb-2">Medical Laser Safety Calculator</h1>
      <p className="text-gray-400 mb-8">Analyze irradiance, fluence, thermal relaxation, and OD for medical/surgical laser systems.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Power (mW)</span>
          <input type="number" value={power} onChange={e => setPower(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Spot Size (mm)</span>
          <input type="number" value={spotSize} onChange={e => setSpotSize(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Exposure Time (s)</span>
          <input type="number" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Delivery Ø (mm)</span>
          <input type="number" value={beamDia} onChange={e => setBeamDia(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Treatment Area (cm²)</span>
          <input type="number" value={treatmentArea} onChange={e => setTreatmentArea(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Laser Type</p>
          <p className="text-2xl font-bold text-blue-400">{laserType}</p>
          <p className="text-xs text-gray-500 mt-1">{wavelength} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Peak Irradiance</p>
          <p className="text-2xl font-bold text-red-400">{powerDensity.toFixed(0)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Fluence</p>
          <p className="text-2xl font-bold text-yellow-400">{fluence.toFixed(1)} J/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Thermal Relaxation Time</p>
          <p className="text-2xl font-bold text-orange-400">{(thermalRelaxTime * 1000).toFixed(1)} ms</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">MPE (this config)</p>
          <p className="text-2xl font-bold text-green-400">{mpe.toFixed(4)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Min OD (spectators)</p>
          <p className="text-2xl font-bold text-purple-400">OD{odRequired}+</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <p>E = P / A<sub>spot</sub></p>
          <p>F = E × t (fluence)</p>
          <p>τ<sub>tr</sub> = d² / (16α) where α ≈ 1.3 × 10<sup>−3</sup> cm²/s (skin)</p>
          <p>MPE<sub>IR-C</sub> = 0.1 W/cm²</p>
          <p>MPE<sub>vis</sub> = 2.5 / √t W/cm²</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Exposure Time (ms)", gridcolor: "#374151" },
          yaxis: { title: "Fluence (J/cm²)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
