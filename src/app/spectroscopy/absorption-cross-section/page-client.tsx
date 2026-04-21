"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function AbsorptionCrossSectionPage() {
  const [extinctionCoeff, setExtinctionCoeff] = useURLState("extinctionCoeff", 50000);
  const [concentration, setConcentration] = useURLState("concentration", 0.001);

  const NA = 6.022e23;
  // σ = ε × 1000 × ln(10) / N_A  (from A = εcl = σ·N_A·c·l / (1000·ln10))
  const sigma = extinctionCoeff * 1000 * Math.LN10 / NA; // cm²
  const sigmaM2 = sigma * 1e-4; // m²
  const absorbance = extinctionCoeff * concentration * 1;

  const chartData = useMemo(() => {
    const n = 200;
    const eMax = Math.max(extinctionCoeff * 2, 100000);
    const xs = Array.from({ length: n }, (_, i) => (i / (n - 1)) * eMax);
    const ys = xs.map(e => e * 1000 * Math.LN10 / NA);

    return [
      { x: xs, y: ys, type: "scatter" as const, mode: "lines" as const, name: "σ (cm²)", line: { color: "#60a5fa" } },
      { x: [extinctionCoeff], y: [sigma], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [extinctionCoeff, sigma]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Absorption Cross-Section Calculator" description="σ = ε · 1000 · ln(10) / N_A — convert molar extinction coefficient to molecular cross-section.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="ε (L·mol⁻¹·cm⁻¹)" value={extinctionCoeff} onChange={setExtinctionCoeff} min={0} />
        <ValidatedNumberInput label="Concentration (mol/L)" value={concentration} onChange={setConcentration} min={0} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">σ (cm²)</p>
          <p className="text-xl font-bold text-blue-400">{sigma.toExponential(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">σ (Å²)</p>
          <p className="text-xl font-bold text-green-400">{(sigma * 1e16).toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">σ (m²)</p>
          <p className="text-xl font-bold text-purple-400">{sigmaM2.toExponential(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Absorbance (1 cm)</p>
          <p className="text-xl font-bold text-orange-400">{absorbance.toFixed(4)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono text-blue-400">σ = ε × 1000 × ln(10) / N_A</p>
        <p className="text-gray-300 text-sm font-mono text-green-400">σ ≈ 3.82 × 10⁻²¹ × ε (cm²)</p>
        <p className="text-gray-500 text-xs mt-2">Typical values: dye molecules ~10⁻¹⁶ cm², atoms ~10⁻¹⁸ cm², biomolecules 10⁻¹⁶–10⁻¹⁴ cm².</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "ε (L·mol⁻¹·cm⁻¹)", gridcolor: "#1f2937" },
          yaxis: { title: "σ (cm²)", gridcolor: "#1f2937" },
          margin: { t: 30 },
        }} />
      </div>
    </CalculatorShell>
  );
}
