"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function MacroBendPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);
  const [bendRadius, setBendRadius] = useURLState("bendRadius", 15);
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 4.5);
  const [na, setNa] = useURLState("na", 0.14);

  const loss = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const a = coreRadius * 1e-6;
    const V = (2 * Math.PI * a / lambda) * na;
    const Vc = 2.405; // single-mode cutoff
    // Empirical heuristic: loss increases as mode confinement weakens (V → Vc)
    // and as bend radius decreases. Calibrated to SMF-28 data at 1550nm.
    const bendLoss = 0.2 * Math.pow(Vc / V, 20) * Math.pow(15 / bendRadius, 4);
    return Math.max(0, bendLoss);
  }, [wavelength, bendRadius, coreRadius, na]);

  const criticalRadius = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const a = coreRadius * 1e-6;
    const V = (2 * Math.PI * a / lambda) * na;
    const Vc = 2.405;
    // Radius where loss ≈ fiber attenuation (~0.2 dB/turn)
    return 15 * Math.pow(Vc / V, 5);
  }, [wavelength, coreRadius, na]);

  const chartData = useMemo(() => {
    const radii = Array.from({ length: 100 }, (_, i) => 5 + i * 0.5);
    const lambda = wavelength * 1e-9;
    const a = coreRadius * 1e-6;
    const V = (2 * Math.PI * a / lambda) * na;
    const Vc = 2.405;
    return [
      { x: radii, y: radii.map(r => {
        return Math.max(0, 0.2 * Math.pow(Vc / V, 20) * Math.pow(15 / r, 4));
      }), type: "scatter" as const, mode: "lines" as const, name: "Bend Loss", line: { color: "#f97316" } },
      { x: [bendRadius], y: [loss], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [wavelength, coreRadius, na, bendRadius, loss]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Macro Bend Loss" description="Quick macrobending loss estimate using empirical heuristic. For physically rigorous results, see Macrobending Loss calculator.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={800} max={2000} />
        <ValidatedNumberInput label="Bend Radius (mm)" value={bendRadius} onChange={setBendRadius} min={1} max={100} />
        <ValidatedNumberInput label="Core Radius (µm)" value={coreRadius} onChange={setCoreRadius} min={2} max={15} step="0.1" />
        <ValidatedNumberInput label="Numerical Aperture" value={na} onChange={setNa} min={0.05} max={0.5} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bend Loss</p>
          <p className="text-2xl font-bold text-orange-400">{loss.toFixed(3)} dB/turn</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Critical Radius</p>
          <p className="text-2xl font-bold text-blue-400">{criticalRadius.toFixed(2)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">V-Number</p>
          <p className="text-2xl font-bold text-green-400">{((2 * Math.PI * coreRadius * 1e-6) / (wavelength * 1e-9) * na).toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Safety Margin</p>
          <p className={`text-2xl font-bold ${loss < 0.1 ? "text-green-400" : loss < 0.5 ? "text-yellow-400" : "text-red-400"}`}>{loss < 0.1 ? "OK" : loss < 0.5 ? "Caution" : "High"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Bend Radius (mm)", gridcolor: "#374151" },
          yaxis: { title: "Loss (dB/turn)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
