"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";


export default function ExtendedSourcePage() {
  const [wavelength, setWavelength] = useState(1064);
  const [alpha, setAlpha] = useState(50); // mrad angular subtense

  const calc = useMemo(() => {
    const lam = wavelength / 1000; // µm
    const alphaMin = 1.5; // mrad, minimum angular subtense
    const alphaMax = 100; // mrad
    const alphaEff = Math.max(alphaMin, Math.min(alpha, alphaMax));

    // C6 correction factor
    const C6 = alphaEff / alphaMin;

    // C7 factor for extended sources (angular subtense correction)
    // C6 = 1 for alpha <= alphaMin, increases linearly above
    // Extended source MPE = point source MPE × C6
    return { C6, alphaEff, alphaMin };
  }, [wavelength, alpha]);

  const chartData = useMemo(() => {
    const alphas = Array.from({ length: 200 }, (_, i) => 0.1 + i * 0.6);
    const C6s = alphas.map(a => Math.max(1, a / 1.5));
    const C6clamped = alphas.map(a => Math.min(Math.max(1, a / 1.5), 100 / 1.5));

    return [
      { x: alphas, y: C6clamped, type: "scatter" as const, mode: "lines" as const, name: "C₆", line: { color: "#f87171" } },
      { x: [alpha], y: [calc.C6], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#60a5fa", size: 12 } },
    ];
  }, [alpha, calc]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Extended Source Correction (C₆)" description="C₆ angular subtense correction factor for extended source laser hazard evaluation per ANSI Z136.">
            
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={400} max={1800}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Angular Subtense α (mrad)</span>
          <input type="number" value={alpha} onChange={e => setAlpha(+e.target.value)} min={0.1} max={100} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">C₆ Factor</p>
          <p className="text-3xl font-bold text-blue-400">{calc.C6.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Effective α (mrad)</p>
          <p className="text-3xl font-bold text-green-400">{calc.alphaEff.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">α_min (mrad)</p>
          <p className="text-3xl font-bold text-yellow-400">{calc.alphaMin.toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-300">Extended source MPE = Point source MPE × C₆. For α &gt; α_min, the retinal image is larger, spreading the energy over more area.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Angular Subtense α (mrad)", gridcolor: "#374151" },
          yaxis: { title: "C₆ Factor", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
