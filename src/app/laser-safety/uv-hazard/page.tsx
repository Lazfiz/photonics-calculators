"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";


export default function UVHazardPage() {
  const [wavelength, setWavelength] = useState(254);
  const [spectralIrr, setSpectralIrr] = useState(0.01);
  const [exposure, setExposure] = useState(8 * 3600);

  // ACGIH UV hazard weighting function (simplified)
  const weightFn = (lam: number) => {
    if (lam < 200 || lam > 400) return 0;
    if (lam < 210) return 0.3;
    if (lam < 220) return 0.3 + (lam - 210) * 0.07;
    if (lam < 230) return 1.0;
    if (lam < 240) return 1.0;
    if (lam < 250) return 1.0;
    if (lam < 260) return 1.0;
    if (lam < 270) return 1.0 - (lam - 260) * 0.015;
    if (lam < 280) return 0.85 - (lam - 270) * 0.035;
    if (lam < 290) return 0.5 - (lam - 280) * 0.04;
    if (lam < 300) return 0.1 - (lam - 290) * 0.007;
    if (lam < 310) return 0.03 - (lam - 300) * 0.002;
    if (lam < 320) return 0.01 - (lam - 310) * 0.0005;
    return 0.001;
  };

  const weight = weightFn(wavelength);
  const effectiveIrr = spectralIrr * weight;
  const exposureLimit = 0.003; // J/cm² per ACGIH for 8hr
  const maxExposureTime = effectiveIrr > 0 ? exposureLimit / effectiveIrr : Infinity;
  const hazardRatio = (effectiveIrr * exposure) / exposureLimit;

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 200 + i);
    return [
      { x: wls, y: wls.map(w => weightFn(w)), type: "scatter" as const, mode: "lines" as const, name: "S(λ)", line: { color: "#c084fc" } },
      { x: [wavelength], y: [weight], type: "scatter" as const, mode: "markers" as const, name: "Selected λ", marker: { color: "#f87171", size: 10 } },
    ];
  }, [wavelength]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="UV Hazard Calculator" description="UV hazard assessment using ACGIH actinic UV weighting function S(λ). Covers 200–400 nm spectral region.">
            
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={200} max={400}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Spectral Irradiance (W/cm²/nm)</span>
          <input type="number" value={spectralIrr} onChange={e => setSpectralIrr(+e.target.value)} min={0} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Exposure Time (s)</span>
          <input type="number" value={exposure} onChange={e => setExposure(+e.target.value)} min={1} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">S(λ) Weight</p>
          <p className="text-2xl font-bold text-purple-400">{weight.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Effective Irradiance</p>
          <p className="text-2xl font-bold text-blue-400">{effectiveIrr.toExponential(2)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max Safe Time</p>
          <p className="text-2xl font-bold text-green-400">{maxExposureTime === Infinity ? "∞" : maxExposureTime >= 3600 ? (maxExposureTime / 3600).toFixed(1) + " hr" : maxExposureTime.toFixed(0) + " s"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Hazard Ratio</p>
          <p className={`text-2xl font-bold ${hazardRatio > 1 ? "text-red-400" : "text-green-400"}`}>{hazardRatio.toFixed(3)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "S(λ) Weight", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
