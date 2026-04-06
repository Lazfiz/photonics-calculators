"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function CavityStabilityPage() {
  const [r1, setR1] = useURLState("r1", 1000); // mm, radius of curvature (positive = concave facing inward)
  const [r2, setR2] = useURLState("r2", 1000);
  const [L, setL] = useURLState("L", 500); // mm, cavity length

  const calc = useMemo(() => {
    const g1 = 1 - L / r1;
    const g2 = 1 - L / r2;
    const stability = g1 * g2;
    const stable = stability >= 0 && stability <= 1;

    // Beam waist and position for stable cavity
    let w0 = 0, z1 = 0, z2 = 0;
    if (stable && stability > 0) {
      const lambda = 1.064e-3; // mm, 1064nm
      const Lm = L / 1000; // m
      const R1m = r1 / 1000;
      const R2m = r2 / 1000;
      const Lcap = L * 1e-3; // m

      // Waist size
      const num = Math.sqrt(Lcap * (R1m - Lcap) * (R2m - Lcap) * (R1m + R2m - Lcap));
      const denom = R1m + R2m - 2 * Lcap;
      if (denom !== 0) {
        w0 = Math.sqrt(lambda / Math.PI * Math.sqrt(num / Math.abs(denom)));
        // Position from mirror 1
        z1 = Lcap * (R2m - Lcap) / (R1m + R2m - 2 * Lcap);
        z2 = Lcap - z1;
      }
    }

    return { g1, g2, stability, stable, w0, z1, z2 };
  }, [r1, r2, L]);

  const chartData = useMemo(() => {
    // Stability diagram: g1 vs g2
    // Lines: g1*g2 = 0, g1*g2 = 1
    const g1line = Array.from({ length: 100 }, (_, i) => -2 + i * 0.04);
    const g2upper = g1line.map(g1 => g1 !== 0 ? 1 / g1 : 10);
    const g2lower = g1line.map(() => 0);

    return [
      // Stability boundaries
      { x: [-2, 2], y: [0, 0], type: "scatter" as const, mode: "lines" as const, name: "g₁g₂ = 0", line: { color: "#4b5563", dash: "dash" } },
      { x: [0, 0], y: [-2, 2], type: "scatter" as const, mode: "lines" as const, name: "", line: { color: "#4b5563", dash: "dash" }, showlegend: false },
      { x: g1line, y: g2upper, type: "scatter" as const, mode: "lines" as const, name: "g₁g₂ = 1", line: { color: "#4b5563", dash: "dash" } },
      // Stable region shading
      { x: [0, 1, 1, 0, 0], y: [0, 0, 1, 1, 0], type: "scatter" as const, mode: "lines" as const, fill: "toself", name: "Stable", fillcolor: "rgba(34, 197, 94, 0.2)", line: { color: "transparent" } },
      // Current point
      { x: [calc.g1], y: [calc.g2], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: calc.stable ? "#22c55e" : "#ef4444", size: 14 } },
    ];
  }, [r1, r2, L, calc]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Cavity Stability Diagram" description="Two-mirror cavity stability: g₁ = 1 - L/R₁, g₂ = 1 - L/R₂. Stable when 0 ≤ g₁g₂ ≤ 1.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="R₁ - Mirror 1 ROC (mm)" value={r1} onChange={setR1} step="any" />
        <ValidatedNumberInput label="R₂ - Mirror 2 ROC (mm)" value={r2} onChange={setR2} step="any" />
        <ValidatedNumberInput label="Cavity Length L (mm)" value={L} onChange={setL} min={0.1} step="any" />
      </div>

      <div className={`bg-gray-900 border ${calc.stable ? "border-green-800" : "border-red-800"} rounded-lg p-6 mb-8`}>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-sm text-gray-400">g₁</p>
            <p className="text-2xl font-bold text-blue-400">{calc.g1.toFixed(3)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">g₂</p>
            <p className="text-2xl font-bold text-blue-400">{calc.g2.toFixed(3)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">g₁g₂</p>
            <p className={`text-2xl font-bold ${calc.stable ? "text-green-400" : "text-red-400"}`}>{calc.stability.toFixed(3)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Status</p>
            <p className={`text-2xl font-bold ${calc.stable ? "text-green-400" : "text-red-400"}`}>{calc.stable ? "STABLE" : "UNSTABLE"}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "g₁", gridcolor: "#374151", range: [-2, 2] },
          yaxis: { title: "g₂", gridcolor: "#374151", range: [-2, 2] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
