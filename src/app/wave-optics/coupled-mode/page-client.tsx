"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function CoupledModePage() {
  const [kappa, setKappa] = useURLState("kappa", 0.5); // coupling coeff /mm
  const [deltaBeta, setDeltaBeta] = useURLState("deltaBeta", 0); // phase mismatch /mm
  const [length, setLength] = useURLState("length", 10); // mm
  const [inputPower, setInputPower] = useURLState("inputPower", 1); // mW

  const kappaSq = kappa * kappa;
  const deltaSq = deltaBeta * deltaBeta;
  const gamma = Math.sqrt(kappaSq + deltaSq / 4);
  const couplingEfficiency = kappaSq / gamma * gamma * Math.pow(Math.sin(gamma * length) / (gamma * length), 2) * (gamma * length) * (gamma * length) / (kappaSq / gamma * gamma) ;
  // Simpler: P_cross = (κ²/γ²) sin²(γL)
  const pCross = (kappaSq / (gamma * gamma)) * Math.pow(Math.sin(gamma * length), 2);
  const pThrough = 1 - pCross;
  const couplingLength = Math.PI / (2 * kappa); // full coupling length

  const chartData = useMemo(() => {
    const N = 300;
    const ls = Array.from({ length: N }, (_, i) => i / N * length);
    const cross = ls.map(l => {
      const g = Math.sqrt(kappaSq + deltaSq / 4);
      return (kappaSq / (g * g)) * Math.pow(Math.sin(g * l), 2);
    });
    const through = cross.map(c => 1 - c);
    return [
      { x: ls, y: cross, type: "scatter" as const, mode: "lines" as const, name: "Cross port", line: { color: "#60a5fa", width: 2 } },
      { x: ls, y: through, type: "scatter" as const, mode: "lines" as const, name: "Through port", line: { color: "#f87171", width: 2 } },
    ];
  }, [kappa, deltaBeta, length, kappaSq, deltaSq]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Coupled Mode Theory" description="Power exchange between two coupled waveguides.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Coupling Coefficient κ (mm⁻¹)" value={kappa} onChange={setKappa} step="any" />
        <ValidatedNumberInput label="Phase Mismatch Δβ (mm⁻¹)" value={deltaBeta} onChange={setDeltaBeta} step="any" />
        <ValidatedNumberInput label="Interaction Length (mm)" value={length} onChange={setLength} step="any" />
        <ValidatedNumberInput label="Input Power (mW)" value={inputPower} onChange={setInputPower} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Cross Port Power</p>
          <p className="text-xl font-bold text-blue-400">{(pCross * inputPower).toFixed(3)} mW ({(pCross * 100).toFixed(1)}%)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Through Port Power</p>
          <p className="text-xl font-bold text-red-400">{(pThrough * inputPower).toFixed(3)} mW ({(pThrough * 100).toFixed(1)}%)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Full Coupling Length</p>
          <p className="text-xl font-bold text-green-400">{couplingLength.toFixed(3)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">γ = √(κ² + Δβ²/4)</p>
          <p className="text-xl font-bold text-orange-400">{gamma.toFixed(4)} mm⁻¹</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2 font-mono">P<sub>cross</sub> = (κ²/γ²)sin²(γL) &nbsp;|&nbsp; L<sub>c</sub> = π/(2κ) &nbsp;|&nbsp; γ = √(κ² + Δβ²/4)</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Length (mm)", gridcolor: "#374151" },
          yaxis: { title: "Normalised Power", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
