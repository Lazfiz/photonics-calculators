"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";


export default function SkinMPEPage() {
  const [wavelength, setWavelength] = useState(1064);
  const [exposure, setExposure] = useState(10);

  const mpe = useMemo(() => {
    const lam = wavelength / 1000;
    let val: number;
    if (lam >= 0.18 && lam < 0.302) {
      val = 0.003 * Math.pow(exposure, 0.75); // J/cm²
    } else if (lam >= 0.302 && lam < 0.4) {
      val = 0.56 * Math.pow(Math.min(exposure, 10), 0.25); // J/cm²
    } else if (lam >= 0.4 && lam < 1.4) {
      val = 0.2 * Math.pow(Math.min(exposure, 10), 0.75); // J/cm²
    } else if (lam >= 1.4 && lam < 1.8) {
      val = 0.1; // J/cm²
    } else if (lam >= 1.8 && lam <= 2.6) {
      val = 0.1; // J/cm²
    } else {
      val = 0.01;
    }
    return val;
  }, [wavelength, exposure]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 180 + i * 8.5);
    const vals = wls.map(wl => {
      const lam = wl / 1000;
      if (lam >= 0.18 && lam < 0.302) return 0.003 * Math.pow(exposure, 0.75);
      if (lam >= 0.302 && lam < 0.4) return 0.56 * Math.pow(Math.min(exposure, 10), 0.25);
      if (lam >= 0.4 && lam < 1.4) return 0.2 * Math.pow(Math.min(exposure, 10), 0.75);
      if (lam >= 1.4 && lam <= 2.6) return 0.1;
      return 0.01;
    });
    return [{ x: wls, y: vals, type: "scatter" as const, mode: "lines" as const, name: "Skin MPE", line: { color: "#a78bfa" } }];
  }, [exposure]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Skin MPE Calculator" description="Maximum permissible exposure for skin (ANSI Z136 simplified). Not for clinical safety decisions.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={180} max={2600}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Exposure Time (s)</span>
          <input type="number" value={exposure} onChange={e => setExposure(+e.target.value)} min={1e-9} max={30000} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <p className="text-sm text-gray-400">Skin MPE</p>
        <p className="text-3xl font-bold text-purple-400">{mpe.toFixed(4)} J/cm²</p>
        <p className="text-sm text-gray-500 mt-1">λ = {wavelength} nm, t = {exposure} s</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Skin MPE (J/cm²)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
