"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


const MATERIALS: Record<string, { name: string; alpha0: number; lambda0: number; type: string }> = {
  FusedSilica: { name: "Fused Silica", alpha0: 0.2, lambda0: 1550, type: "glass" },
  BK7: { name: "BK7", alpha0: 0.5, lambda0: 1550, type: "glass" },
  Germanium: { name: "Germanium", alpha0: 0.02, lambda0: 10600, type: "ir" },
  Silicon: { name: "Silicon", alpha0: 0.5, lambda0: 1550, type: "ir" },
  CaF2: { name: "CaF₂", alpha0: 0.001, lambda0: 4000, type: "ir" },
  Sapphire: { name: "Sapphire", alpha0: 0.05, lambda0: 4000, type: "ir" },
};

export default function AbsorptionPage() {
  const [material, setMaterial] = useState<keyof typeof MATERIALS>("FusedSilica");
  const [wavelength, setWavelength] = useState(1550);
  const [thickness, setThickness] = useState(10); // mm

  const calc = useMemo(() => {
    const mat = MATERIALS[material];
    // Simplified absorption model: α(λ) follows λ⁻⁴ Rayleigh + IR absorption edge
    const lamRatio = wavelength / mat.lambda0;
    let alpha: number;
    if (mat.type === "glass") {
      // UV edge + Rayleigh + OH + IR edge
      const rayleigh = mat.alpha0 * Math.pow(lamRatio, 4);
      const irEdge = mat.alpha0 * Math.exp(Math.max(0, 1 - lamRatio) * 5);
      alpha = rayleigh + irEdge;
    } else {
      // IR materials: low absorption in band, edge outside
      const irEdge = mat.alpha0 * Math.exp(Math.abs(lamRatio - 1) * 3);
      alpha = mat.alpha0 + irEdge;
    }
    const T = Math.exp(-alpha * thickness / 10); // thickness in cm
    const loss = -10 * Math.log10(T);
    return { alpha, transmission: T * 100, loss };
  }, [material, wavelength, thickness]);

  const chartData = useMemo(() => {
    const mat = MATERIALS[material];
    const wls = Array.from({ length: 200 }, (_, i) => 300 + i * 100);
    const alphas = wls.map(wl => {
      const lamRatio = wl / mat.lambda0;
      if (mat.type === "glass") {
        const rayleigh = mat.alpha0 * Math.pow(lamRatio, 4);
        const irEdge = mat.alpha0 * Math.exp(Math.max(0, 1 - lamRatio) * 5);
        return rayleigh + irEdge;
      } else {
        const irEdge = mat.alpha0 * Math.exp(Math.abs(lamRatio - 1) * 3);
        return mat.alpha0 + irEdge;
      }
    });

    return [
      { x: wls, y: alphas, type: "scatter" as const, mode: "lines" as const, name: "α(λ)", line: { color: "#f87171" } },
      { x: [wavelength], y: [calc.alpha], type: "scatter" as const, mode: "markers" as const, name: "Selected", marker: { color: "#60a5fa", size: 12 } },
    ];
  }, [material, wavelength, calc]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Absorption Coefficient" description="Wavelength-dependent absorption coefficient α(λ) and transmission through material thickness.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Material</span>
          <select value={material} onChange={e => setMaterial(e.target.value as any)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(MATERIALS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Thickness (mm)</span>
          <input type="number" value={thickness} onChange={e => setThickness(+e.target.value)} min={0.01}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">α (dB/km equiv)</p>
          <p className="text-xl font-bold text-red-400">{calc.alpha.toFixed(3)} /cm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmission</p>
          <p className="text-xl font-bold text-green-400">{calc.transmission.toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Absorption Loss</p>
          <p className="text-xl font-bold text-yellow-400">{calc.loss.toFixed(2)} dB</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "α (cm⁻¹)", gridcolor: "#374151", rangemode: "tozero" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
