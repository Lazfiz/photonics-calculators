"use client";

import { useState } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import { useURLState } from "../../../hooks/use-url-state";


interface Material {
  name: string;
  alpha: number; // CTE in 10⁻⁶/K
  T_min: number; // useful range min °C
  T_max: number;
  type: string;
  notes: string;
}

const materials: Material[] = [
  { name: "Fused Silica", alpha: 0.55, T_min: -200, T_max: 1000, type: "Glass", notes: "Ultra-low expansion, ULE grade ~0.03" },
  { name: "ULE 7972", alpha: 0.03, T_min: -200, T_max: 600, type: "Glass", notes: "Corning ultra-low expansion" },
  { name: "Zerodur", alpha: 0.05, T_min: -200, T_max: 600, type: "Glass Ceramic", notes: "Schott zero-expansion ceramic" },
  { name: "BK7", alpha: 7.1, T_min: -50, T_max: 400, type: "Glass", notes: "Standard optical glass" },
  { name: "Pyrex (Borosilicate)", alpha: 3.3, T_min: -80, T_max: 500, type: "Glass", notes: "Lab glassware" },
  { name: "SF11", alpha: 6.3, T_min: -50, T_max: 400, type: "Glass", notes: "High-index flint" },
  { name: "Sapphire", alpha: 5.8, T_min: -200, T_max: 2000, type: "Crystal", notes: "Anisotropic (parallel c-axis)" },
  { name: "CaF₂", alpha: 18.9, T_min: -200, T_max: 800, type: "Crystal", notes: "Large expansion, needs care" },
  { name: "Si", alpha: 2.6, T_min: -200, T_max: 1000, type: "Semiconductor", notes: "@ 300K, increases with T" },
  { name: "Ge", alpha: 6.0, T_min: -200, T_max: 700, type: "Semiconductor", notes: "IR windows" },
  { name: "ZnSe", alpha: 7.1, T_min: -100, T_max: 700, type: "II-VI", notes: "CO₂ laser optics" },
  { name: "Aluminum 6061", alpha: 23.6, T_min: -200, T_max: 400, type: "Metal", notes: "Common mount material" },
  { name: "Invar 36", alpha: 1.2, T_min: -200, T_max: 300, type: "Metal", notes: "Fe-Ni alloy, low expansion" },
  { name: "Stainless 304", alpha: 17.3, T_min: -200, T_max: 800, type: "Metal", notes: "Common structural metal" },
  { name: "Copper", alpha: 16.5, T_min: -200, T_max: 500, type: "Metal", notes: "Heat sinks, mirrors" },
  { name: "Diamond", alpha: 1.0, T_min: -200, T_max: 1500, type: "Crystal", notes: "CVD, excellent thermal" },
  { name: "MgF₂", alpha: 13.7, T_min: -200, T_max: 800, type: "Crystal", notes: "Perpendicular to c-axis" },
];

export default function ThermalExpansionPage() {
  const [alpha, setAlpha] = useURLState("alpha", 7.1);
  const [dT, setDT] = useURLState("dT", 100); // temperature change in °C
  const [length, setLength] = useURLState("length", 100); // mm

  const dL = alpha * 1e-6 * dT * length; // mm
  const strain = alpha * 1e-6 * dT;

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Thermal Expansion" description="ΔL = α · ΔT · L — dimensional change from temperature">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">CTE α (×10⁻⁶/K)</label>
          <input type="number" value={alpha} onChange={e => setAlpha(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono" step={0.1} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Temperature change ΔT (°C)</label>
          <input type="number" value={dT} onChange={e => setDT(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Length L (mm)</label>
          <input type="number" value={length} onChange={e => setLength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ΔL (expansion)</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{dL >= 0.001 ? `${dL.toFixed(4)} mm` : `${(dL * 1000).toFixed(2)} µm`}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Strain ε</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{strain.toExponential(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ΔL / λ (at 633nm)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{(dL * 1e-3 / 633e-9).toFixed(1)} waves</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Reference CTE Values (×10⁻⁶/K)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left py-2 px-3">Material</th>
              <th className="text-left py-2 px-3">Type</th>
              <th className="text-right py-2 px-3">α (10⁻⁶/K)</th>
              <th className="text-left py-2 px-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {materials.sort((a, b) => a.alpha - b.alpha).map((m, i) => (
              <tr key={i} className={`border-b border-gray-800/50 hover:bg-gray-900/50 cursor-pointer ${alpha === m.alpha ? "bg-blue-900/20" : ""}`}
                onClick={() => setAlpha(m.alpha)}>
                <td className="py-2 px-3 font-medium">{m.name}</td>
                <td className="py-2 px-3 text-gray-400">{m.type}</td>
                <td className="py-2 px-3 text-right font-mono text-blue-400">{m.alpha}</td>
                <td className="py-2 px-3 text-gray-500">{m.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CalculatorShell>
  );
}
