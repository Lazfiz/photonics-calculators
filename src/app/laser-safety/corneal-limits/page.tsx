"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";


export default function CornealLimitsPage() {
  const [wavelength, setWavelength] = useState(800);
  const [exposure, setExposure] = useState(1); // s

  const calc = useMemo(() => {
    const lam = wavelength / 1000; // µm
    const t = exposure;

    let mpe: number; // W/cm² for CW, or J/cm² converted
    let regime: string;

    if (lam >= 0.18 && lam < 0.302) {
      // UV-B, UV-C
      if (t < 1e-9) { mpe = 3e-3 / (lam * lam); regime = "UV (t<1ns)"; }
      else if (t < 10) { mpe = 0.56 * Math.pow(t, 0.25) / (lam * lam); regime = "UV (1ns-10s)"; }
      else { mpe = 0.001 / (lam * lam); regime = "UV (t>10s)"; }
    } else if (lam >= 0.302 && lam < 0.4) {
      // UV-A
      if (t < 1e-9) { mpe = 0.56 * Math.pow(1e-9, 0.25) / (lam * lam); regime = "UVA (t<1ns)"; }
      else if (t < 10) { mpe = 0.56 * Math.pow(t, 0.25) / (lam * lam); regime = "UVA (1ns-10s)"; }
      else { mpe = 0.001 / (lam * lam); regime = "UVA (t>10s)"; }
    } else if (lam >= 0.4 && lam < 0.7) {
      // Visible
      if (t < 1e-4) { mpe = 5e-3 / (t * 1e4); regime = "Vis (t<0.1ms)"; } // J/cm²
      else if (t < 10) { mpe = 1.8e-3 * Math.pow(t, -0.25); regime = "Vis (0.1ms-10s)"; }
      else { mpe = 1e-3 * Math.pow(t, -0.25); regime = "Vis (t>10s)"; }
    } else if (lam >= 0.7 && lam < 1.05) {
      // IR-A
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      if (t < 1e-4) { mpe = 5e-3 * CA; regime = "IR-A (t<0.1ms)"; }
      else if (t < 10) { mpe = 1.8e-3 * CA * Math.pow(t, -0.25); regime = "IR-A (0.1ms-10s)"; }
      else { mpe = 1e-3 * CA; regime = "IR-A (t>10s)"; }
    } else if (lam >= 1.05 && lam < 1.4) {
      if (t < 1e-4) { mpe = 5e-3; regime = "IR-B (t<0.1ms)"; }
      else if (t < 10) { mpe = 1.8e-3 * Math.pow(t, -0.25); regime = "IR-B (0.1ms-10s)"; }
      else { mpe = 1e-3; regime = "IR-B (t>10s)"; }
    } else if (lam >= 1.4 && lam < 1.8) {
      mpe = 0.1 / t; regime = "IR-C"; // J/cm² / s → W/cm²
    } else {
      mpe = 0.01; regime = "Unknown";
    }

    return { mpe, regime };
  }, [wavelength, exposure]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 180 + i * 6);
    const t = exposure;
    const vals = wls.map(wl => {
      const lam = wl / 1000;
      if (lam >= 0.18 && lam < 0.302) {
        return t < 10 ? 0.56 * Math.pow(Math.max(t, 1e-9), 0.25) / (lam * lam) : 0.001 / (lam * lam);
      } else if (lam >= 0.302 && lam < 0.4) {
        return t < 10 ? 0.56 * Math.pow(Math.max(t, 1e-9), 0.25) / (lam * lam) : 0.001 / (lam * lam);
      } else if (lam >= 0.4 && lam < 0.7) {
        return t < 10 ? 1.8e-3 * Math.pow(Math.max(t, 1e-4), -0.25) : 1e-3 * Math.pow(t, -0.25);
      } else if (lam >= 0.7 && lam < 1.05) {
        const CA = Math.pow(10, 0.02 * (lam - 0.7));
        return t < 10 ? 1.8e-3 * CA * Math.pow(Math.max(t, 1e-4), -0.25) : 1e-3 * CA;
      } else if (lam >= 1.05 && lam < 1.4) {
        return t < 10 ? 1.8e-3 * Math.pow(Math.max(t, 1e-4), -0.25) : 1e-3;
      } else if (lam >= 1.4 && lam < 1.8) {
        return 0.1 / Math.max(t, 1e-9);
      }
      return 0.01;
    });

    return [
      { x: wls, y: vals, type: "scatter" as const, mode: "lines" as const, name: "MPE", line: { color: "#60a5fa" } },
      { x: [wavelength, wavelength], y: [0, Math.max(...vals) * 1.1], type: "scatter" as const, mode: "lines" as const, name: "Selected λ", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [wavelength, exposure]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Corneal Exposure Limits" description="Corneal MPE across UV, visible, and IR spectral regions. Simplified model.">
            
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={180} max={1800}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Exposure Time (s)</span>
          <input type="number" value={exposure} onChange={e => setExposure(+e.target.value)} min={1e-12} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Corneal MPE</p>
          <p className="text-3xl font-bold text-blue-400">{calc.mpe.toExponential(2)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Spectral Regime</p>
          <p className="text-3xl font-bold text-yellow-400">{calc.regime}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "MPE (W/cm²)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
