"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

const MATERIALS: Record<string, { name: string; dndT: number }> = {
  BK7: { name: "BK7", dndT: 3.0e-6 },
  FusedSilica: { name: "Fused Silica", dndT: 1.0e-5 },
  SF11: { name: "SF11", dndT: 4.6e-6 },
  CaF2: { name: "CaF₂", dndT: -1.1e-5 },
  Sapphire: { name: "Sapphire", dndT: 1.4e-5 },
  Germanium: { name: "Germanium", dndT: 4.0e-4 },
};

export default function ThermalDnDtPage() {
  const [material, setMaterial] = useState<keyof typeof MATERIALS>("FusedSilica");
  const [baseTemp, setBaseTemp] = useState(20); // °C
  const [deltaT, setDeltaT] = useState(50); // °C change
  const [baseN, setBaseN] = useState(1.458);

  const calc = useMemo(() => {
    const mat = MATERIALS[material];
    const dn = mat.dndT * deltaT;
    const newN = baseN + dn;
    const shiftFactor = mat.dndT * 1e6; // ppm/°C
    return { dn, newN, dndT: mat.dndT, shiftFactor };
  }, [material, baseTemp, deltaT, baseN]);

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 100 }, (_, i) => baseTemp - 50 + i);
    const ns = temps.map(T => baseN + calc.dndT * (T - baseTemp));

    return [
      { x: temps, y: ns, type: "scatter" as const, mode: "lines" as const, name: "n(T)", line: { color: "#60a5fa" } },
      { x: [baseTemp, baseTemp + deltaT], y: [baseN, calc.newN], type: "scatter" as const, mode: "markers" as const, name: "Selected", marker: { color: "#f87171", size: 10 } },
    ];
  }, [material, baseTemp, deltaT, baseN, calc]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Thermo-Optic Coefficient (dn/dT)" description="Temperature-dependent refractive index change. Positive dn/dT means n increases with temperature.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Material</span>
          <select value={material} onChange={e => setMaterial(e.target.value as any)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(MATERIALS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Base Temperature (°C)" value={baseTemp} onChange={setBaseTemp} />
        <ValidatedNumberInput label="Temperature Change ΔT (°C)" value={deltaT} onChange={setDeltaT} />
        <ValidatedNumberInput label="Base Refractive Index n₀" value={baseN} onChange={setBaseN} step="0.001" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">dn/dT</p>
          <p className="text-xl font-bold text-blue-400">{calc.dndT.toExponential(2)} /°C</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Δn</p>
          <p className="text-xl font-bold text-yellow-400">{calc.dn.toExponential(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n(T₀ + ΔT)</p>
          <p className="text-xl font-bold text-green-400">{calc.newN.toFixed(6)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Shift Factor</p>
          <p className="text-xl font-bold text-red-400">{calc.shiftFactor.toFixed(1)} ppm/°C</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Temperature (°C)", gridcolor: "#374151" },
          yaxis: { title: "Refractive Index n", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
