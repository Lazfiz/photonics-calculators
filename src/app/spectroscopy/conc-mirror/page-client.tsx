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

  // Finesse for a Fabry-Perot etalon (for reference)
  const finesse = Math.PI * Math.sqrt(Math.max(0, 0.99)) / (1 - 0.99);

  // Grating spectrometer resolving power: R = mN = (d·sinθ)/(λ)·W/d = W·sinθ/λ
  // For concave mirror spectrometer: R ≈ f·(1/slitWidth) where f ≈ radius (focal length)
  // Using R ≈ 2R_mirror / (slitWidth_angular_spread) ≈ 2·radius(mm)/slitWidth(µm)·1e-3
  const resolvingPower = 2 * radius * 1e-3 / (slitWidth * 1e-6);

  // Étendue: G = A·Ω ≈ slit_width × slit_height × (mirror_area / f²)
  // Using slit_height ≈ slit_width and f ≈ radius:
  const etendue = Math.pow(slitWidth * 1e-6, 2) * Math.pow(mirrorDiam * 1e-3 / 2, 2) / Math.pow(radius * 1e-3, 2);

  // Throughput (fraction of light collected from extended source)
  const throughput = Math.min(1, etendue / (Math.PI * Math.pow(mirrorDiam * 1e-3 / 2, 2)));

  // Connes (Jacquinot) advantage: throughput ratio FTIR vs grating at same resolving power
  // FTIR throughput ~2π·A·(Δν/ν), grating ~ (λ/R)·A — advantage ~R·λ/D
  const throughputAdvantage = resolvingPower * wavelength * 1e-9 / (mirrorDiam * 1e-3);

  const chartData = useMemo(() => {
    const radii = Array.from({ length: 50 }, (_, i) => 10 + i * 4);
    return [
      { x: radii, y: radii.map(r => (2 * r * 1e-3 / (slitWidth * 1e-6)) / 1000), type: "scatter" as const, mode: "lines" as const, name: "Resolving Power (k)", line: { color: "#c084fc" } },
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
