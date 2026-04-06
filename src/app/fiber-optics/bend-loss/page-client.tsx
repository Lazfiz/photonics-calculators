"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function BendLossPage() {
  const [radius, setRadius] = useState(15); // mm
  const [wavelength, setWavelength] = useState(1550); // nm
  const [coreIndex, setCoreIndex] = useState(1.4682);
  const [claddingIndex, setCladdingIndex] = useState(1.4629);

  const calc = useMemo(() => {
    const R = radius * 1e-3; // m
    const lam = wavelength * 1e-9; // m
    const n1 = coreIndex;
    const n2 = claddingIndex;
    const NA = Math.sqrt(n1 * n1 - n2 * n2);
    const a = 4.1e-6; // SMF-28 core radius
    const V = (2 * Math.PI * a * NA) / lam;

    // Marcuse bend loss formula (dB/m)
    // α = (sqrt(π)/(2*a)) * (u²/(V²*K_{m-1}(w)*K_m(w))^(1/2)) * exp(-2*R*γ)
    // Simplified: α ≈ (π/(2*a)) * (n1²*sin²θ - n2²)^0.5 * exp(-R * (2*Δ*n1*k * (2.748 - 0.996*λ/λc)))
    const delta = (n1 - n2) / n1;
    const gamma = (2 * delta * n1 * 2 * Math.PI / lam) * (2.748 - 0.996 * 0.3); // simplified
    const loss = (1.5 / (2 * a)) * Math.exp(-R * gamma);
    const lossDB = 10 * Math.log10(Math.exp(1)) * loss; // dB/m

    return { NA, V, lossDB, delta };
  }, [radius, wavelength, coreIndex, claddingIndex]);

  const chartData = useMemo(() => {
    const radii = Array.from({ length: 100 }, (_, i) => 5 + i * 0.5);
    const lam = wavelength * 1e-9;
    const n1 = coreIndex;
    const n2 = claddingIndex;
    const NA = Math.sqrt(n1 * n1 - n2 * n2);
    const a = 4.1e-6;
    const delta = (n1 - n2) / n1;
    const gamma = (2 * delta * n1 * 2 * Math.PI / lam) * 1.75;

    const losses = radii.map(R => {
      const loss = (1.5 / (2 * a)) * Math.exp(-(R * 1e-3) * gamma);
      return 10 * Math.log10(Math.exp(1)) * loss;
    });

    return [
      { x: radii, y: losses, type: "scatter" as const, mode: "lines" as const, name: "Bend Loss", line: { color: "#f87171" } },
      { x: [radius, radius], y: [0, Math.max(...losses)], type: "scatter" as const, mode: "lines" as const, name: "Current R", line: { color: "#60a5fa", dash: "dash" } },
    ];
  }, [radius, wavelength, coreIndex, claddingIndex]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Macro Bending Loss" description="Estimate macro-bending loss for single-mode fiber using simplified Marcuse formula.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Bend Radius (mm)" value={radius} onChange={setRadius} min={1} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={800} max={1700} />
        <ValidatedNumberInput label="Core Index n₁" value={coreIndex} onChange={setCoreIndex} step="0.0001" />
        <ValidatedNumberInput label="Cladding Index n₂" value={claddingIndex} onChange={setCladdingIndex} step="0.0001" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bend Loss</p>
          <p className="text-3xl font-bold text-red-400">{calc.lossDB < 0.001 ? "< 0.001" : calc.lossDB.toFixed(3)} dB/m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">NA</p>
          <p className="text-3xl font-bold text-blue-400">{calc.NA.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">V-number</p>
          <p className="text-3xl font-bold text-green-400">{calc.V.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Bend Radius (mm)", gridcolor: "#374151" },
          yaxis: { title: "Loss (dB/m)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
