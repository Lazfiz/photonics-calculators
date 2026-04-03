"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SpectralLineBroadeningPage() {
  const [centerWl, setCenterWl] = useState(500); // nm
  const [temperature, setTemperature] = useState(5000); // K
  const [molecularMass, setMolecularMass] = useState(20); // amu
  const [pressure, setPressure] = useState(1); // atm
  const [gammaCol, setGammaCol] = useState(0.1); // cm⁻¹ FWHM collisional
  const [naturalWidth, setNaturalWidth] = useState(0.001); // cm⁻¹

  const chartData = useMemo(() => {
    const sigma0 = 1e7 / centerWl; // cm⁻¹
    const range = 5; // cm⁻¹ from center
    const x = Array.from({ length: 500 }, (_, i) => sigma0 - range + (2 * range * i) / 499);

    // Doppler FWHM: Δσ_D = σ0 * sqrt(8kT ln2 / mc²)
    const k = 1.381e-23, c = 3e8, amu = 1.661e-27;
    const m = molecularMass * amu;
    const dopplerFWHM = sigma0 * Math.sqrt((8 * k * temperature * Math.LN2) / (m * c * c));
    const dopplerGauss = dopplerFWHM / (2 * Math.sqrt(2 * Math.LN2));

    // Gaussian (Doppler)
    const gaussian = x.map(s => Math.exp(-Math.pow((s - sigma0) / dopplerGauss, 2) / 2));

    // Lorentzian (collisional + natural)
    const lorentzFWHM = gammaCol + naturalWidth;
    const lorentzian = x.map(s => (lorentzFWHM / 2) ** 2 / ((s - sigma0) ** 2 + (lorentzFWHM / 2) ** 2));

    // Voigt (approximate: Gaussian convolved with Lorentzian via pseudo-Voigt)
    const fG = dopplerFWHM;
    const fL = lorentzFWHM;
    const f = Math.pow(fG ** 5 + 2.69269 * fG ** 4 * fL + 2.42843 * fG ** 3 * fL ** 2 + 4.47163 * fG ** 2 * fL ** 3 + 0.07842 * fG * fL ** 4 + fL ** 5, 0.2);
    const eta = (fL / f);
    const voigt = x.map(s => {
      const g = Math.exp(-Math.pow((s - sigma0) / (fG / (2 * Math.sqrt(2 * Math.LN2))), 2) / 2);
      const l = (fL / 2) ** 2 / ((s - sigma0) ** 2 + (fL / 2) ** 2);
      return (1 - eta) * g + eta * l;
    });

    // Normalize
    const norm = (arr: number[]) => { const mx = Math.max(...arr); return mx > 0 ? arr.map(v => v / mx) : arr; };

    return [
      { x, y: norm(gaussian), type: "scatter" as const, mode: "lines" as const, name: "Doppler (Gaussian)", line: { color: "#60a5fa" } },
      { x, y: norm(lorentzian), type: "scatter" as const, mode: "lines" as const, name: "Collisional (Lorentzian)", line: { color: "#34d399" } },
      { x, y: norm(voigt), type: "scatter" as const, mode: "lines" as const, name: "Voigt (combined)", line: { color: "#f87171", width: 2.5 } },
    ];
  }, [centerWl, temperature, molecularMass, pressure, gammaCol, naturalWidth]);

  // Compute values
  const k = 1.381e-23, c = 3e8, amu = 1.661e-27;
  const m = molecularMass * amu;
  const sigma0 = 1e7 / centerWl;
  const dopplerFWHM = sigma0 * Math.sqrt((8 * k * temperature * Math.LN2) / (m * c * c));
  const collisionalFWHM = gammaCol * Math.max(pressure, 0.001);
  const totalFWHM = gammaCol + naturalWidth + dopplerFWHM;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Spectral Line Broadening</h1>
      <p className="text-gray-400 mb-8">Doppler, collisional, natural, and Voigt broadening mechanisms.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Center λ (nm)</span>
          <input type="number" value={centerWl} onChange={e => setCenterWl(+e.target.value)} min={100} step={50} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Temperature (K)</span>
          <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} min={100} step={500} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Molecular Mass (amu)</span>
          <input type="number" value={molecularMass} onChange={e => setMolecularMass(Math.max(1, +e.target.value))} min={1} step={1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Pressure (atm)</span>
          <input type="number" value={pressure} onChange={e => setPressure(Math.max(0, +e.target.value))} min={0} step={0.1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Collisional γ (cm⁻¹)</span>
          <input type="number" value={gammaCol} onChange={e => setGammaCol(Math.max(0, +e.target.value))} min={0} step={0.01} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Natural Width (cm⁻¹)</span>
          <input type="number" value={naturalWidth} onChange={e => setNaturalWidth(Math.max(0, +e.target.value))} min={0} step={0.0001} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Doppler FWHM</p>
          <p className="text-xl font-bold text-blue-400">{dopplerFWHM.toFixed(4)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Collisional FWHM</p>
          <p className="text-xl font-bold text-green-400">{collisionalFWHM.toFixed(4)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Voigt ~FWHM</p>
          <p className="text-xl font-bold text-red-400">{totalFWHM.toFixed(4)} cm⁻¹</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400 font-mono">Gaussian (Doppler):</span> Δσ = σ₀√(8kT ln2 / mc²) — thermal motion</p>
        <p><span className="text-green-400 font-mono">Lorentzian (collisional):</span> Δσ = 2γ_col·P — molecular collisions</p>
        <p><span className="text-red-400 font-mono">Voigt:</span> Convolution of Gaussian + Lorentzian. Dominant at intermediate conditions.</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavenumber (cm⁻¹)", gridcolor: "#374151" },
        yaxis: { title: "Normalized Intensity", gridcolor: "#374151", range: [-0.05, 1.1] },
        height: 500, margin: { t: 30, b: 40 },
      }} config={{ responsive: true }} />
    </div>
  );
}
