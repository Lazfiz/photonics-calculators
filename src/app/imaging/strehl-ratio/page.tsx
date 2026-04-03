"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function StrehlRatioPage() {
  const [wavelengthNm, setWavelengthNm] = useState(550);
  const [wfeNm, setWfeNm] = useState(20);
  const [mode, setMode] = useState<"wfe" | "pv">("wfe");

  const wfeMeters = wfeNm * 1e-9;
  const wavelengthM = wavelengthNm * 1e-9;
  const pvWave = mode === "pv" ? wfeNm / wavelengthNm : wfeNm / wavelengthNm * 3.55; // Maréchal approx: PV ≈ 3.55×RMS

  // Maréchal approximation: Strehl ≈ exp(-(2π·WFE_rms/λ)²)
  const wfeRmsWave = mode === "wfe" ? wfeNm / wavelengthNm : wfeNm / wavelengthNm;
  const strehl = Math.exp(-Math.pow(2 * Math.PI * wfeRmsWave, 2));

  const chartData = useMemo(() => {
    const wfes = Array.from({ length: 200 }, (_, i) => i * 0.5);
    return [
      {
        x: wfes,
        y: wfes.map(w => Math.exp(-Math.pow(2 * Math.PI * w, 2))),
        type: "scatter" as const, mode: "lines" as const,
        name: "Strehl Ratio",
        line: { color: "#60a5fa", width: 2 },
      },
      {
        x: [wfeRmsWave], y: [strehl],
        type: "scatter" as const, mode: "markers" as const,
        name: "Current",
        marker: { color: "#f87171", size: 12 },
      },
      {
        x: [0, 0.5],
        y: [0.8, 0.8],
        type: "scatter" as const, mode: "lines" as const,
        name: "Maréchal Criterion (0.8)",
        line: { color: "#34d399", dash: "dash" },
      },
    ];
  }, [wfeRmsWave, strehl]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Strehl Ratio Calculator" description="Estimate the Strehl ratio from wavefront error using the Maréchal approximation.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">S ≈ exp(−(2π · σ / λ)²)</p>
        <p className="text-gray-500 text-xs mt-1">where σ = RMS wavefront error, λ = wavelength</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelengthNm} onChange={e => setWavelengthNm(+e.target.value)} min={300} max={2000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">
            WFE {mode === "wfe" ? "RMS" : "PV"} (nm)
          </span>
          <input type="number" value={wfeNm} onChange={e => setWfeNm(+e.target.value)} min={0} max={500} step="0.1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Input Mode</span>
          <select value={mode} onChange={e => setMode(e.target.value as "wfe" | "pv")}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="wfe">WFE in units of λ (RMS)</option>
            <option value="pv">WFE in units of λ (PV)</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Strehl Ratio</p>
          <p className="text-2xl font-bold text-blue-400">{strehl.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">WFE (waves)</p>
          <p className="text-2xl font-bold text-yellow-400">{wfeRmsWave.toFixed(3)} λ</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Diffraction-Limited?</p>
          <p className={`text-2xl font-bold ${strehl >= 0.8 ? "text-green-400" : "text-red-400"}`}>
            {strehl >= 0.8 ? "Yes ✓" : "No ✗"}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "RMS WFE (waves λ)", gridcolor: "#374151", range: [0, Math.max(0.5, wfeRmsWave * 1.5)] },
          yaxis: { title: "Strehl Ratio", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
