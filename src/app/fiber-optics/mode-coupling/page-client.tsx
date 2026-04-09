"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function ModeCouplingCalculator() {
  const [couplingLength, setCouplingLength] = useURLState("couplingLength", 1000); // μm
  const [couplingCoeff, setCouplingCoeff] = useURLState("couplingCoeff", 0.5); // mm⁻¹
  const [propConstDiff, setPropConstDiff] = useURLState("propConstDiff", 0.1); // mm⁻¹
  const [inputPower, setInputPower] = useURLState("inputPower", 1); // mW

  const kappa = couplingCoeff; // mm⁻¹
  const deltaBeta = propConstDiff; // mm⁻¹
  const L = couplingLength / 1000; // convert μm to mm

  // Coupled mode theory power transfer
  const kappaEff = useMemo(() => {
    return Math.sqrt(kappa ** 2 + (deltaBeta / 2) ** 2);
  }, [kappa, deltaBeta]);

  // Power in coupled waveguide
  const coupledPower = useMemo(() => {
    const P = (kappa / kappaEff) ** 2 * Math.sin(kappaEff * L) ** 2;
    return P * inputPower;
  }, [kappa, kappaEff, L, inputPower]);

  // Power in original waveguide
  const throughPower = useMemo(() => {
    return inputPower - coupledPower;
  }, [inputPower, coupledPower]);

  // Coupling length (100% transfer, only when phase-matched)
  const fullTransferLength = useMemo(() => {
    if (deltaBeta === 0) return (Math.PI / (2 * kappa)).toFixed(3) + " mm";
    return "N/A (phase mismatched)";
  }, [kappa, deltaBeta]);

  // Generate plot: power vs coupling length
  const plotData = useMemo(() => {
    const lengths: number[] = [];
    const coupled: number[] = [];
    const through: number[] = [];

    for (let l = 0; l <= 10; l += 0.05) {
      lengths.push(l);
      const pCoupled = (kappa / kappaEff) ** 2 * Math.sin(kappaEff * l) ** 2;
      coupled.push(pCoupled * inputPower);
      through.push((1 - pCoupled) * inputPower);
    }

    return [
      {
        x: lengths, y: coupled, type: "scatter" as const, mode: "lines" as const,
        name: "Coupled waveguide", line: { color: "#3b82f6", width: 2 },
      },
      {
        x: lengths, y: through, type: "scatter" as const, mode: "lines" as const,
        name: "Through waveguide", line: { color: "#ef4444", width: 2 },
      },
      {
        x: [L], y: [coupledPower], type: "scatter" as const, mode: "markers" as const,
        name: "Current point", marker: { color: "#22c55e", size: 12 },
      },
    ];
  }, [kappa, kappaEff, L, coupledPower, inputPower]);

  const layout = {
    title: "Power Transfer vs Coupling Length",
    xaxis: { title: "Coupling Length (mm)", gridcolor: "#374151" },
    yaxis: { title: "Power (mW)", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true,
    legend: { x: 0.02, y: 0.98 }, height: 400,
  };

  const couplingEfficiency = (coupledPower / inputPower) * 100;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
                
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Coupling Length (μm)</label>
              <ValidatedNumberInput label="Coupling Length (μm)" value={couplingLength} onChange={setCouplingLength} min={1} step="10" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Coupling Coefficient κ (mm⁻¹)</label>
              <ValidatedNumberInput label="Coupling Coefficient κ (mm⁻¹)" value={couplingCoeff} onChange={setCouplingCoeff} min={0.01} step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Propagation Constant Difference Δβ (mm⁻¹)</label>
              <ValidatedNumberInput label="Propagation Constant Difference Δβ (mm⁻¹)" value={propConstDiff} onChange={setPropConstDiff} step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Input Power (mW)</label>
              <ValidatedNumberInput label="Input Power (mW)" value={inputPower} onChange={setInputPower} min={0.01} step="0.1" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Effective coupling:</span><span className="font-mono">{kappaEff.toFixed(4)} mm⁻¹</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Coupled power:</span><span className="font-mono text-blue-400">{coupledPower.toFixed(4)} mW</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Through power:</span><span className="font-mono text-red-400">{throughPower.toFixed(4)} mW</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Coupling efficiency:</span><span className="font-mono text-lg text-green-400">{couplingEfficiency.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Full transfer length:</span><span className="font-mono">{fullTransferLength}</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">κ_eff = √(κ² + (Δβ/2)²)</p>
              <p className="font-mono text-sm mt-1">P₂(L) = P₁ · (κ/κ_eff)² · sin²(κ_eff · L)</p>
              <p className="font-mono text-sm mt-1">L_c = π/(2κ) (phase-matched)</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <ChartPanel data={plotData} layout={layout} />
        </div>
      </div>
    </div>
  );
}
