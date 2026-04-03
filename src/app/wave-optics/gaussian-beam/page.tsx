"use client";

import { useMemo, useState } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";

const wavelengthPresets = [532, 1064, 1550];

export default function GaussianBeamPage() {
  const [wavelength, setWavelength] = useState(1550);
  const [waist, setWaist] = useState(10); // µm

  const zR = (Math.PI * waist ** 2 / wavelength) * 1000; // mm
  const divergence = (wavelength / (Math.PI * waist)) * 1000; // mrad
  const bpp = (waist / 1000) * divergence / 2; // mm·mrad

  const chartData = useMemo(() => {
    const zMax = Math.max(zR * 4, 1);
    const zs = Array.from({ length: 220 }, (_, i) => -zMax + (i * 2 * zMax) / 219);
    const w = zs.map((z) => waist * Math.sqrt(1 + (z / zR) ** 2));
    return [
      { x: zs, y: w, type: "scatter" as const, mode: "lines", name: "Beam radius", line: { color: "#60a5fa", width: 3 } },
      { x: [0, 0], y: [0, waist], type: "scatter" as const, mode: "lines", name: "Waist", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [wavelength, waist, zR]);

  return (
    <CalculatorShell
      backHref="/wave-optics"
      backLabel="Wave Optics"
      title="Gaussian Beam Propagation"
      description="Explore how wavelength and waist size shape Rayleigh range, divergence, and beam envelope."
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {wavelengthPresets.map((preset) => (
          <button
            key={preset}
            onClick={() => setWavelength(preset)}
            className={`rounded-full border px-3 py-1 text-sm transition ${wavelength === preset ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}
          >
            {preset} nm
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <InputSlider label="Wavelength" value={wavelength} onChange={setWavelength} min={400} max={2000} step={1} unit="nm" />
        <InputSlider label="Beam waist w₀" value={waist} onChange={setWaist} min={2} max={100} step={0.5} unit="µm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <ResultCard label="Rayleigh range" value={`${zR.toFixed(2)} mm`} tone="blue" />
        <ResultCard label="Far-field divergence" value={`${divergence.toFixed(2)} mrad`} tone="green" />
        <ResultCard label="Beam parameter product" value={`${bpp.toFixed(4)} mm·mrad`} tone="yellow" />
        <ResultCard label="Confocal parameter" value={`${(2 * zR).toFixed(2)} mm`} tone="purple" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6">
        <p>w(z) = w₀ √(1 + (z/z<sub>R</sub>)²), z<sub>R</sub> = πw₀²/λ, θ ≈ λ/(πw₀)</p>
      </div>

      <ChartPanel
        data={chartData}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Propagation distance z (mm)", gridcolor: "#374151" },
          yaxis: { title: "Beam radius w(z) (µm)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }}
      />
    </CalculatorShell>
  );
}
