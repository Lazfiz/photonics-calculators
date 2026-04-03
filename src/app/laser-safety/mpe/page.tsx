"use client";

import { useMemo, useState } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

const wavelengthPresets = [532, 1064, 1550];
const exposurePresets = [0.25, 1, 10];

export default function MPEPage() {
  const [wavelength, setWavelength] = useState(1550);
  const [exposure, setExposure] = useState(0.25);

  const mpe = useMemo(() => {
    const lam = wavelength / 1000;
    if (lam >= 0.4 && lam < 0.7) return 1.8 * exposure ** 0.75;
    if (lam >= 0.7 && lam < 1.05) return 1.8 * 10 ** (0.02 * (lam - 0.7)) * exposure ** 0.75;
    if (lam >= 1.05 && lam < 1.4) return exposure > 10 ? 100 : 0.01 * exposure * 1000;
    if (lam >= 1.4 && lam <= 1.8) return 100;
    return 10;
  }, [wavelength, exposure]);

  const region = wavelength < 700 ? "Visible retinal" : wavelength < 1400 ? "Near-IR retinal" : "Corneal / skin";

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 240 }, (_, i) => 400 + i * 6);
    const vals = wls.map((wl) => {
      const lam = wl / 1000;
      if (lam >= 0.4 && lam < 0.7) return 1.8 * exposure ** 0.75;
      if (lam >= 0.7 && lam < 1.05) return 1.8 * 10 ** (0.02 * (lam - 0.7)) * exposure ** 0.75;
      if (lam >= 1.05 && lam < 1.4) return exposure > 10 ? 100 : 0.01 * exposure * 1000;
      if (lam >= 1.4 && lam <= 1.8) return 100;
      return 10;
    });
    return [{ x: wls, y: vals, type: "scatter" as const, mode: "lines", name: "MPE", line: { color: "#60a5fa", width: 3 } }];
  }, [exposure]);

  return (
    <CalculatorShell
      backHref="/laser-safety"
      backLabel="Laser Safety"
      title="Maximum Permissible Exposure (MPE)"
      description="Simplified ANSI/IEC-style MPE estimator for educational comparison only — never use this page as your sole safety decision source."
    >
      <LaserSafetyDisclaimer />

      <div className="mb-5 flex flex-wrap gap-2">
        {wavelengthPresets.map((preset) => (
          <button key={preset} onClick={() => setWavelength(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${wavelength === preset ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>{preset} nm</button>
        ))}
        {exposurePresets.map((preset) => (
          <button key={preset} onClick={() => setExposure(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${exposure === preset ? "border-purple-400 bg-purple-500/15 text-purple-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>{preset}s</button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <InputSlider label="Wavelength" value={wavelength} onChange={setWavelength} min={400} max={1800} step={1} unit="nm" />
        <InputSlider label="Exposure time" value={exposure} onChange={setExposure} min={0.001} max={10} step={0.001} unit="s" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <ResultCard label="MPE" value={`${mpe.toFixed(2)} mJ/cm²`} tone="blue" />
        <ResultCard label="Hazard regime" value={region} tone="red" />
        <ResultCard label="Wavelength" value={`${wavelength} nm`} tone="green" />
        <ResultCard label="Exposure" value={`${exposure.toFixed(3)} s`} tone="yellow" />
      </div>

      <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 mb-6 text-sm text-red-100 leading-6">
        <p>
          This calculator is intentionally simplified and omits many boundary conditions, correction factors, pulse rules,
          source-size effects, and standard-specific clauses. Always verify final safety work against the full applicable standard.
        </p>
      </div>

      <ChartPanel
        data={chartData}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "MPE (mJ/cm²)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }}
      />
    </CalculatorShell>
  );
}
