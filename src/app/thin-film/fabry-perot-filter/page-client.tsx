"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function FabryPerotFilterPage() {
  const [nCavity, setNCavity] = useState(1.5);
  const [spacing, setSpacing] = useState(500);
  const [reflectance, setReflectance] = useState(0.8);
  const [wlCenter, setWlCenter] = useState(550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => wlCenter - 50 + i * 0.2);
    const R = reflectance;
    const F = 4 * R / ((1 - R) ** 2);
    const T = wls.map(wl => {
      const delta = (4 * Math.PI * nCavity * spacing) / wl;
      return 1 / (1 + F * Math.sin(delta / 2) ** 2);
    });
    const Rcurve = wls.map(wl => {
      const delta = (4 * Math.PI * nCavity * spacing) / wl;
      return F * Math.sin(delta / 2) ** 2 / (1 + F * Math.sin(delta / 2) ** 2);
    });
    return [
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "Transmittance", line: { color: "#60a5fa" } },
      { x: wls, y: Rcurve, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#f87171" } },
    ];
  }, [nCavity, spacing, reflectance, wlCenter]);

  const F = 4 * reflectance / ((1 - reflectance) ** 2);
  const finesse = Math.PI * Math.sqrt(F) / 2;
  const fsr = (wlCenter * wlCenter) / (2 * nCavity * spacing);
  const fwhm = fsr / finesse;

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Fabry-Pérot Filter" description="Fabry-Pérot etalon/filter transmission based on the Airy function. Explore how mirror reflectance and cavity spacing control spectral selectivity.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n (cavity)</span>
          <input type="number" value={nCavity} onChange={e => setNCavity(+e.target.value)} step="0.01" min="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Cavity Spacing (nm)</span>
          <input type="number" value={spacing} onChange={e => setSpacing(+e.target.value)} step="10" min="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Mirror Reflectance</span>
          <input type="number" value={reflectance} onChange={e => setReflectance(+e.target.value)} step="0.01" min="0" max="0.999" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Center Wavelength (nm)</span>
          <input type="number" value={wlCenter} onChange={e => setWlCenter(+e.target.value)} step="10" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Finesse</p>
          <p className="text-xl font-bold text-green-400">{finesse.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FSR</p>
          <p className="text-xl font-bold text-blue-400">{fsr.toFixed(2)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FWHM</p>
          <p className="text-xl font-bold text-yellow-400">{fwhm.toFixed(3)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">Airy Function</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>T = 1 / (1 + F·sin²(δ/2))</p>
          <p>δ = 4πnd/λ</p>
          <p>F = 4R/(1−R)²</p>
          <p>FSR = λ²/(2nd)</p>
          <p>ℱ = π√F/2</p>
          <p>FWHM = FSR/ℱ</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "T / R", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.02, y: 0.98 },
        }} />
      </div>
    </CalculatorShell>
  );
}
