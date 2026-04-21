"use client";

import { useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function ConcMirrorPage() {
  const [radius, setRadius] = useURLState("radius", 50);
  const [mirrorDiam, setMirrorDiam] = useURLState("mirrorDiam", 25);
  const [slitWidth, setSlitWidth] = useURLState("slitWidth", 50); // µm
  const [slitHeight, setSlitHeight] = useURLState("slitHeight", 1); // mm

  const f = radius * 1e-3 / 2; // focal length: f = R/2 for spherical mirror (Hecht, Optics)

  // Finesse for a Fabry-Perot etalon (for reference)
  const finesse = Math.PI * Math.sqrt(Math.max(0, 0.99)) / (1 - 0.99);

  // Inverse slit angle: f/w (geometric factor, NOT spectral resolving power)
  // True resolving power R = λ/Δλ requires dispersion, not just f/w
  const inverseSlitAngle = f / (slitWidth * 1e-6);

  // Étendue: G = A_slit × Ω = w·h × π(D/2)²/f² (Saleh & Teich, Eq. 11.2-5)
  const etendue = (slitWidth * 1e-6) * (slitHeight * 1e-3) * Math.PI * Math.pow(mirrorDiam * 1e-3 / 2, 2) / (f * f);

  // Jacquinot advantage: T_FT/T_grating ≈ 2πF/l (Jacquinot, 1954)
  // Jacquinot advantage: T_FT/T_grating ≈ 2π·f / slitHeight (Jacquinot 1954)
  // slitHeight is in mm, convert to m for dimensional consistency
  const jacquinotAdvantage = 2 * Math.PI * f / (slitHeight * 1e-3);

  const chartData = useMemo(() => {
    const radii = Array.from({ length: 50 }, (_, i) => 10 + i * 4);
    return [
      { x: radii, y: radii.map(r => ((r * 1e-3 / 2) / (slitWidth * 1e-6)) / 1000), type: "scatter" as const, mode: "lines" as const, name: "f/w (×10³)", line: { color: "#c084fc" } },
      { x: [radius], y: [inverseSlitAngle / 1000], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [radius, slitWidth, inverseSlitAngle]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Concave Mirror Throughput" description="Connes advantage and throughput for concave mirror-based spectrometers (e.g., FTIR, concave grating).">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Mirror Radius (mm)" value={radius} onChange={setRadius} min={5} max={500} />
        <ValidatedNumberInput label="Mirror Diameter (mm)" value={mirrorDiam} onChange={setMirrorDiam} min={5} max={200} />
        <ValidatedNumberInput label="Slit Width (µm)" value={slitWidth} onChange={setSlitWidth} min={1} max={500} />
        <ValidatedNumberInput label="Slit Height (mm)" value={slitHeight} onChange={setSlitHeight} min={0.1} max={50} step={0.1} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Inverse Slit Angle (f/w)</p>
          <p className="text-2xl font-bold text-purple-400">{(inverseSlitAngle / 1000).toFixed(1)}k</p>
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
          <p className="text-sm text-gray-400">Jacquinot Advantage</p>
          <p className="text-2xl font-bold text-yellow-400">{jacquinotAdvantage.toFixed(1)}×</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Mirror Radius (mm)", gridcolor: "#374151" },
          yaxis: { title: "f/w (×10³)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
