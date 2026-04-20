"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function GouyPhasePage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1064); // nm
  const [w0, setW0] = useURLState("w0", 0.5); // mm, beam waist
  const [z, setZ] = useURLState("z", 100); // mm, distance from waist

  const calc = useMemo(() => {
    const lam = wavelength * 1e-6; // mm
    const w0m = w0; // mm
    const zm = z; // mm
    const zR = Math.PI * w0m * w0m / lam; // Rayleigh range mm
    const gouy = Math.atan(zm / zR); // rad
    const gouyDeg = gouy * 180 / Math.PI;
    const w = w0m * Math.sqrt(1 + (zm / zR) ** 2);
    const R = zm === 0 ? Infinity : zm * (1 + (zR / zm) ** 2);
    return { zR, gouy, gouyDeg, w, R };
  }, [wavelength, w0, z]);

  const chartData = useMemo(() => {
    const lam = wavelength * 1e-6;
    const w0m = w0;
    const zR = Math.PI * w0m * w0m / lam;
    const zs = Array.from({ length: 200 }, (_, i) => -5 * zR + i * 0.05 * zR);
    const phases = zs.map(zi => Math.atan(zi / zR) * 180 / Math.PI);

    return [
      { x: zs, y: phases, type: "scatter" as const, mode: "lines" as const, name: "Gouy Phase", line: { color: "#60a5fa" } },
      { x: [z], y: [calc.gouyDeg], type: "scatter" as const, mode: "markers" as const, name: "Current z", marker: { color: "#f87171", size: 12 } },
      { x: [-zR, -zR], y: [-45, 45], type: "scatter" as const, mode: "lines" as const, name: "-zR", line: { color: "#4b5563", dash: "dot" }, showlegend: false },
      { x: [zR, zR], y: [-45, 45], type: "scatter" as const, mode: "lines" as const, name: "+zR", line: { color: "#4b5563", dash: "dot" }, showlegend: false },
    ];
  }, [wavelength, w0, z, calc]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Gouy Phase Shift" description="Gouy phase ψ(z) = arctan(z/zᵣ) accumulated by Gaussian beam. Total π phase shift through focus.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={1} />
        <ValidatedNumberInput label="Waist Radius w₀ (mm)" value={w0} onChange={setW0} min={0.001} step="any" />
        <ValidatedNumberInput label="Distance from Waist z (mm)" value={z} onChange={setZ} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Rayleigh Range zᵣ</p>
          <p className="text-xl font-bold text-yellow-400">{calc.zR.toFixed(2)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Gouy Phase ψ</p>
          <p className="text-xl font-bold text-blue-400">{calc.gouyDeg.toFixed(2)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Beam Radius w(z)</p>
          <p className="text-xl font-bold text-green-400">{calc.w.toFixed(3)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Wavefront R(z)</p>
          <p className="text-xl font-bold text-red-400">{calc.R.toFixed(1)} mm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "z (mm)", gridcolor: "#374151" },
          yaxis: { title: "Gouy Phase (°)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
