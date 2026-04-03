"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function FiberLaserSafetyPage() {
  const [power, setPower] = useState(1000); // mW
  const [wavelength, setWavelength] = useState(1064); // nm
  const [fiberCoreDia, setFiberCoreDia] = useState(10); // µm
  const [fiberLength, setFiberLength] = useState(10); // m
  const [attenuation, setAttenuation] = useState(0.2); // dB/km
  const [na, setNa] = useState(0.12);

  const divergenceRad = useMemo(() => Math.asin(Math.min(na, 1)), [na]);
  const divergenceMrad = divergenceRad * 1000;
  const beamDiaMm = (fiberCoreDia / 1000); // µm → mm
  const lossDb = attenuation * fiberLength / 1000;
  const outputPower = power * Math.pow(10, -lossDb / 10);
  const mpeWcm2 = wavelength <= 1400 ? 0.1 : 0.01; // simplified MPE W/cm²
  const powerDensity = outputPower / (Math.PI * Math.pow(fiberCoreDia / 20000, 2)); // W/cm² at fiber facet
  const nohd = useMemo(() => {
    const a = (beamDiaMm / 2) / 1000;
    const phi = divergenceRad;
    const factor = 1.27 * (outputPower / 1000) / (mpeWcm2 * 1e4 * a * a);
    if (factor <= 1) return 0;
    return (1 / phi) * (Math.sqrt(factor) - 1);
  }, [beamDiaMm, divergenceRad, outputPower, mpeWcm2]);

  const chartData = useMemo(() => {
    const lengths = Array.from({ length: 100 }, (_, i) => i * 50); // 0-5000 m
    const powers = lengths.map(l => power * Math.pow(10, -(attenuation * l / 1000) / 10));
    const mpeLine = lengths.map(() => mpeWcm2 * Math.PI * Math.pow(fiberCoreDia / 20000, 2) * 1000);
    return [
      { x: lengths, y: powers, type: "scatter" as const, mode: "lines" as const, name: "Output Power", line: { color: "#60a5fa" } },
      { x: lengths, y: mpeLine, type: "scatter" as const, mode: "lines" as const, name: "Facet MPE threshold", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [power, attenuation, fiberCoreDia, mpeWcm2]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/laser-safety" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Laser Safety</Link>
      <h1 className="text-3xl font-bold mb-2">Fiber Laser Safety Calculator</h1>
      <p className="text-gray-400 mb-8">Analyze output power, fiber facet irradiance, and NOHD for fiber laser systems (1064/1550 nm typical).</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Input Power (mW)</span>
          <input type="number" value={power} onChange={e => setPower(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Fiber Core Diameter (µm)</span>
          <input type="number" value={fiberCoreDia} onChange={e => setFiberCoreDia(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Fiber Length (m)</span>
          <input type="number" value={fiberLength} onChange={e => setFiberLength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Attenuation (dB/km)</span>
          <input type="number" value={attenuation} onChange={e => setAttenuation(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Numerical Aperture (NA)</span>
          <input type="number" value={na} onChange={e => setNa(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Output Power</p>
          <p className="text-3xl font-bold text-blue-400">{outputPower.toFixed(1)} mW</p>
          <p className="text-xs text-gray-500 mt-1">Loss: {lossDb.toFixed(4)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Fiber Facet Irradiance</p>
          <p className="text-3xl font-bold text-red-400">{powerDensity.toFixed(1)} W/cm²</p>
          <p className="text-xs text-gray-500 mt-1">Core: {fiberCoreDia} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Beam Divergence (output)</p>
          <p className="text-3xl font-bold text-yellow-400">{divergenceMrad.toFixed(1)} mrad</p>
          <p className="text-xs text-gray-500 mt-1">θ = arcsin(NA)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">NOHD</p>
          <p className="text-3xl font-bold text-orange-400">{nohd.toFixed(1)} m</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <p>P<sub>out</sub> = P<sub>in</sub> × 10<sup>−(αL/10)</sup> where α in dB/km, L in m</p>
          <p>E<sub>facet</sub> = P<sub>out</sub> / (π × r²) where r = d<sub>core</sub> / 2</p>
          <p>θ = arcsin(NA)</p>
          <p>NOHD = (1/φ)(√(1.27P/(MPE·a²)) − 1)</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Fiber Length (m)", gridcolor: "#374151" },
          yaxis: { title: "Power (mW)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
