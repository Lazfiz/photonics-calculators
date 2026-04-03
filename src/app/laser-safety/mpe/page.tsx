"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";


export default function MPEPage() {
  const [wavelength, setWavelength] = useState(1550);
  const [exposure, setExposure] = useState(0.25);
  const [pulse, setPulse] = useState(false);

  const mpe = useMemo(() => {
    const lam = wavelength / 1000; // µm
    // Simplified MPE per ANSI Z136 (corneal, single pulse or CW)
    // For 400–700 nm (visible), CW: MPE = 1.8*t^0.75 mJ/cm² for t<10s
    // For 700–1050 nm (IR-A), CW: MPE = 1.8*C_A*t^0.75 mJ/cm²
    // For 1050–1400 nm, CW: MPE = 0.01 W/cm² for t>10s
    // For 1400–1500 nm, CW: MPE = 0.1 J/cm² for t<10s
    // Simplified model:
    let mpeVal: number;
    if (lam >= 0.4 && lam < 0.7) {
      mpeVal = 1.8 * Math.pow(exposure, 0.75); // mJ/cm²
    } else if (lam >= 0.7 && lam < 1.05) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      mpeVal = 1.8 * CA * Math.pow(exposure, 0.75);
    } else if (lam >= 1.05 && lam < 1.4) {
      mpeVal = exposure > 10 ? 10 * 0.01 * 1000 : 0.01 * exposure * 1000; // mJ/cm²
    } else if (lam >= 1.4 && lam < 1.5) {
      mpeVal = 100; // 0.1 J/cm² = 100 mJ/cm²
    } else if (lam >= 1.5 && lam <= 1.8) {
      mpeVal = 100;
    } else {
      mpeVal = 10; // default low
    }
    return mpeVal;
  }, [wavelength, exposure]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 400 + i * 6);
    const vals = wls.map(wl => {
      const lam = wl / 1000;
      if (lam >= 0.4 && lam < 0.7) return 1.8 * Math.pow(exposure, 0.75);
      if (lam >= 0.7 && lam < 1.05) return 1.8 * Math.pow(10, 0.02 * (lam - 0.7)) * Math.pow(exposure, 0.75);
      if (lam >= 1.05 && lam < 1.4) return exposure > 10 ? 100 : 0.01 * exposure * 1000;
      if (lam >= 1.4 && lam <= 1.8) return 100;
      return 10;
    });
    return [{ x: wls, y: vals, type: "scatter" as const, mode: "lines" as const, name: "MPE", line: { color: "#60a5fa" } }];
  }, [exposure]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Maximum Permissible Exposure (MPE)" description="Simplified MPE calculation per ANSI Z136 / IEC 60825-1. For educational use only — always consult the full standard.">
            
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={400} max={1800}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Exposure Time (s)</span>
          <input type="number" value={exposure} onChange={e => setExposure(+e.target.value)} min={1e-9} max={10000} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <p className="text-sm text-gray-400">MPE (corneal)</p>
        <p className="text-3xl font-bold text-blue-400">{mpe.toFixed(2)} mJ/cm²</p>
        <p className="text-sm text-gray-500 mt-1">λ = {wavelength} nm, t = {exposure} s</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "MPE (mJ/cm²)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
