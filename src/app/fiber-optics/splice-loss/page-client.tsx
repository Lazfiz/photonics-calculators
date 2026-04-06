"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function SpliceLossPage() {
  const [lateralOffset, setLateralOffset] = useState(0.5); // µm
  const [angularMisalign, setAngularMisalign] = useState(0.5); // degrees
  const [coreDiam, setCoreDiam] = useState(9); // µm (SMF-28 mode field)
  const [gap, setGap] = useState(0); // µm

  const calc = useMemo(() => {
    const d = lateralOffset; // µm
    const theta = angularMisalign * Math.PI / 180; // rad
    const w = coreDiam / 2; // µm, mode field radius approx

    // Lateral offset loss (dB) for Gaussian beams
    const latLoss = 4.343 * (d / w) * (d / w);

    // Angular misalignment loss (dB)
    const angLoss = 4.343 * (Math.PI * w * Math.sin(theta) / 1.55) ** 2; // normalized to 1550nm

    // Gap loss (Fresnel + diffraction, simplified)
    // For SMF, gap loss ≈ -10*log10(1/(1+(gap*λ/(π*w²))²))
    const lam = 1.55; // µm
    const gapLoss = gap > 0 ? -10 * Math.log10(1 / (1 + (gap * lam / (Math.PI * w * w)) ** 2)) : 0;

    const totalLoss = latLoss + angLoss + gapLoss;

    return { latLoss, angLoss, gapLoss, totalLoss };
  }, [lateralOffset, angularMisalign, coreDiam, gap]);

  const chartData = useMemo(() => {
    const offsets = Array.from({ length: 100 }, (_, i) => i * 0.1);
    const w = coreDiam / 2;
    const latLosses = offsets.map(d => 4.343 * (d / w) ** 2);
    const angles = Array.from({ length: 100 }, (_, i) => i * 0.05);
    const angLosses = angles.map(a => 4.343 * (Math.PI * w * Math.sin(a * Math.PI / 180) / 1.55) ** 2);

    return [
      { x: offsets, y: latLosses, type: "scatter" as const, mode: "lines" as const, name: "Lateral", line: { color: "#f87171" }, xaxis: "x", yaxis: "y" },
      { x: angles, y: angLosses, type: "scatter" as const, mode: "lines" as const, name: "Angular", line: { color: "#60a5fa" }, xaxis: "x2", yaxis: "y2" },
    ];
  }, [coreDiam]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Fiber Splice Loss" description="Estimate splice/connector loss from lateral offset, angular misalignment, and end-face gap for single-mode fiber.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Lateral Offset (µm)" value={lateralOffset} onChange={setLateralOffset} min={0} step="any" />
        <ValidatedNumberInput label="Angular Misalignment (°)" value={angularMisalign} onChange={setAngularMisalign} min={0} step="any" />
        <ValidatedNumberInput label="Mode Field Diameter (µm)" value={coreDiam} onChange={setCoreDiam} min={1} step="any" />
        <ValidatedNumberInput label="End-face Gap (µm)" value={gap} onChange={setGap} min={0} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Lateral</p>
          <p className="text-xl font-bold text-red-400">{calc.latLoss.toFixed(3)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Angular</p>
          <p className="text-xl font-bold text-blue-400">{calc.angLoss.toFixed(3)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Gap</p>
          <p className="text-xl font-bold text-yellow-400">{calc.gapLoss.toFixed(3)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total</p>
          <p className="text-xl font-bold text-green-400">{calc.totalLoss.toFixed(3)} dB</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Lateral Offset (µm)", gridcolor: "#374151", domain: [0, 0.47] },
          yaxis: { title: "Loss (dB)", gridcolor: "#374151", color: "#f87171" },
          xaxis2: { title: "Angular Misalign (°)", gridcolor: "#374151", anchor: "y2", domain: [0.55, 1] },
          yaxis2: { title: "Loss (dB)", gridcolor: "#374151", color: "#60a5fa", anchor: "x2" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
