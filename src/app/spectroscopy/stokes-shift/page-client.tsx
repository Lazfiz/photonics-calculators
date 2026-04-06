"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function StokesShiftPage() {
  const [absPeak, setAbsPeak] = useState(480);
  const [emPeak, setEmPeak] = useState(520);
  const [absFWHM, setAbsFWHM] = useState(30);
  const [emFWHM, setEmFWHM] = useState(40);

  const stokesShiftNm = emPeak - absPeak;
  const stokesShiftCm = (1e7 / absPeak - 1e7 / emPeak);
  const stokesEnergyEV = 1240 / absPeak - 1240 / emPeak;

  const gaussian = (x: number[], center: number, fwhm: number) =>
    x.map(xi => Math.exp(-4 * Math.log(2) * ((xi - center) / fwhm) ** 2));

  const chartData = useMemo(() => {
    const wl = Array.from({ length: 500 }, (_, i) => 350 + (i / 500) * 400);
    const absSpec = gaussian(wl, absPeak, absFWHM);
    const emSpec = gaussian(wl, emPeak, emFWHM);
    return [
      { x: wl, y: absSpec, type: "scatter" as const, mode: "lines" as const, name: "Absorption", line: { color: "#60a5fa" }, fill: "tozeroy", fillcolor: "rgba(96,165,250,0.15)" },
      { x: wl, y: emSpec, type: "scatter" as const, mode: "lines" as const, name: "Emission", line: { color: "#f87171" }, fill: "tozeroy", fillcolor: "rgba(248,113,113,0.15)" },
      { x: [absPeak, emPeak], y: [1.05, 1.05], type: "scatter" as const, mode: "markers+lines", name: "Stokes Shift", line: { color: "#fbbf24", dash: "dash" }, marker: { size: 8 } },
    ];
  }, [absPeak, emPeak, absFWHM, emFWHM]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Stokes Shift Calculator" description="Δν̃ = ν̃_abs − ν̃_em — energy difference between absorption and emission maxima.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Absorption Peak (nm)</span>
          <input type="number" value={absPeak} onChange={e => setAbsPeak(+e.target.value)} min={200} max={1500} step={1}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Emission Peak (nm)</span>
          <input type="number" value={emPeak} onChange={e => setEmPeak(+e.target.value)} min={200} max={1500} step={1}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Absorption FWHM (nm)</span>
          <input type="number" value={absFWHM} onChange={e => setAbsFWHM(+e.target.value)} min={1} step={1}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Emission FWHM (nm)</span>
          <input type="number" value={emFWHM} onChange={e => setEmFWHM(+e.target.value)} min={1} step={1}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stokes Shift (nm)</p>
          <p className="text-xl font-bold text-blue-400">{stokesShiftNm.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stokes Shift (cm⁻¹)</p>
          <p className="text-xl font-bold text-green-400">{stokesShiftCm.toFixed(1)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Energy Loss</p>
          <p className="text-xl font-bold text-orange-400">{stokesEnergyEV.toFixed(4)} eV</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono text-blue-400">Δλ = λ_em − λ_abs</p>
        <p className="text-gray-300 text-sm font-mono text-green-400">Δν̃ = (1/λ_abs − 1/λ_em) × 10⁷ cm⁻¹</p>
        <p className="text-gray-300 text-sm font-mono text-purple-400">ΔE = (hc/λ_abs − hc/λ_em) = 1240(1/λ_abs − 1/λ_em) eV</p>
        <p className="text-gray-500 text-xs mt-2">Anti-Stokes (emission at shorter λ) is possible via thermal population of excited vibrational states.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#1f2937" },
          yaxis: { title: "Intensity (a.u.)", gridcolor: "#1f2937" },
          legend: { orientation: "h", y: 1.15 },
          margin: { t: 40 },
        }} />
      </div>
    </CalculatorShell>
  );
}
