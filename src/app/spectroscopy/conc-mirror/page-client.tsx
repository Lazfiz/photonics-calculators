"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function ConcMirrorPage() {
  const [radius, setRadius] = useURLState("radius", 50);
  const [wavelength, setWavelength] = useURLState("wavelength", 600);
  const [mirrorDiam, setMirrorDiam] = useURLState("mirrorDiam", 25);
  const [slitWidth, setSlitWidth] = useURLState("slitWidth", 50); // µm

  const finesse = Math.PI * Math.sqrt(Math.max(0, 0.99)) / (1 - 0.99);
  const resolvingPower = finesse * (2 * radius) / slitWidth;
  const throughput = Math.min(1, Math.pow(mirrorDiam / 2, 2) / Math.pow(radius * wavelength * 1e-6 / (2 * slitWidth * 1e-6), 2));
  const etendue = slitWidth * 1e-6 * mirrorDiam * 1e-3 * 1e-6; // simplified
  const throughputAdvantage = resolvingPower / (mirrorDiam / slitWidth); // Connes advantage factor

  const chartData = useMemo(() => {
    const radii = Array.from({ length: 50 }, (_, i) => 10 + i * 4);
    return [
      { x: radii, y: radii.map(r => (finesse * 2 * r) / slitWidth / 1000), type: "scatter" as const, mode: "lines" as const, name: "Resolving Power (k)", line: { color: "#c084fc" } },
      { x: [radius], y: [resolvingPower / 1000], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [radius, slitWidth, resolvingPower]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Concave Mirror Throughput" description="Connes advantage and throughput for concave mirror-based spectrometers (e.g., FTIR, concave grating).">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Mirror Radius (mm)" value={radius} onChange={setRadius} min={5} max={500} />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={100} max={50000} />
        <ValidatedNumberInput label="Mirror Diameter (mm)" value={mirrorDiam} onChange={setMirrorDiam} min={5} max={200} />
        <ValidatedNumberInput label="Slit Width (µm)" value={slitWidth} onChange={setSlitWidth} min={1} max={500} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Resolving Power</p>
          <p className="text-2xl font-bold text-purple-400">{(resolvingPower / 1000).toFixed(1)}k</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Finesse</p>
          <p className="text-2xl font-bold text-blue-400">{finesse.toFixed(0)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Étendue (a.u.)</p>
          <p className="text-2xl font-bold text-green-400">{etendue.toExponential(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Connes Advantage</p>
          <p className="text-2xl font-bold text-yellow-400">{throughputAdvantage.toFixed(1)}×</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Mirror Radius (mm)", gridcolor: "#374151" },
          yaxis: { title: "Resolving Power (×10³)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
