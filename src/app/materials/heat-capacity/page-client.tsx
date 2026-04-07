"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
interface Material {
  name: string;
  Cp300: number; // J/(g·K) at 300K
  Debye: number; // Debye temperature (K)
  rho: number;   // density g/cm³
}

const materials: Record<string, Material> = {
  "Fused Silica": { name: "Fused Silica", Cp300: 1.0, Debye: 470, rho: 2.20 },
  "BK7": { name: "BK7", Cp300: 0.86, Debye: 420, rho: 2.51 },
  "SF11": { name: "SF11", Cp300: 0.53, Debye: 350, rho: 4.74 },
  "CaF2": { name: "CaF₂", Cp300: 0.85, Debye: 510, rho: 3.18 },
  "ZnSe": { name: "ZnSe", Cp300: 0.34, Debye: 400, rho: 5.27 },
  "Diamond": { name: "Diamond", Cp300: 0.52, Debye: 2230, rho: 3.52 },
  "Sapphire": { name: "Sapphire", Cp300: 0.78, Debye: 1040, rho: 3.98 },
  "Si": { name: "Silicon", Cp300: 0.71, Debye: 645, rho: 2.33 },
  "Ge": { name: "Germanium", Cp300: 0.31, Debye: 374, rho: 5.32 },
  "MgF2": { name: "MgF₂", Cp300: 1.02, Debye: 740, rho: 3.15 },
};

// Debye model approximation for Cp
function debyeCp(mat: Material, T: number): number {
  if (T < 1) return 0;
  const thetaD = mat.Debye;
  const x = thetaD / T;
  if (x > 50) return 0; // T << Debye
  // Simplified Debye: Cp ≈ 3R * [1 - (1/20)(θ/T)²] for T > θ/3
  const R = 8.314; // J/(mol·K)
  // Approximate with polynomial fit to Debye function
  const t = T / thetaD;
  if (t > 2) return mat.Cp300 * (1 + 0.1 * Math.log(t)); // high-T, ~Dulong-Petit + slow growth
  if (t > 0.5) {
    const cp3R = 1 - 0.075 / (t * t);
    return Math.max(0, 3 * R * cp3R / 60); // normalize to ~match known values
  }
  // Low T: Cp ∝ T³
  return mat.Cp300 * 0.001 * Math.pow(t * 10, 3);
}

// More practical: interpolate with Debye-like curve
function cpAt(mat: Material, T: number): number {
  if (T < 10) return 0.01;
  const t = T / mat.Debye;
  // At T >> θD: Cp → Cp300 * (1 + small correction)
  // At T << θD: Cp ∝ T³
  if (t >= 2) return mat.Cp300 * (1 + 0.15 * Math.log(t / 2));
  if (t < 0.1) return mat.Cp300 * 0.0001 * Math.pow(t / 0.1, 3);
  // Intermediate: smooth interpolation
  const cubic = mat.Cp300 * 0.0001 * Math.pow(t / 0.1, 3);
  const high = mat.Cp300 * (1 + 0.15 * Math.log(t / 2));
  const blend = Math.pow((t - 0.1) / 1.9, 2);
  return cubic * (1 - blend) + high * blend;
}

function heatRequired(mat: Material, mass: number, T1: number, T2: number): number {
  const steps = 100;
  const dT = (T2 - T1) / steps;
  let Q = 0;
  for (let i = 0; i < steps; i++) Q += cpAt(mat, T1 + (i + 0.5) * dT) * dT;
  return Q * mass; // J
}

export default function HeatCapacityPage() {
  const [selected, setSelected] = useState("Fused Silica");
  const [temp, setTemp] = useState(300);
  const [mass, setMass] = useState(10);
  const [tempFrom, setTempFrom] = useState(20);
  const [tempTo, setTempTo] = useState(200);

  const mat = materials[selected];
  const cp = useMemo(() => cpAt(mat, temp), [mat, temp]);
  const heat = useMemo(() => heatRequired(mat, mass, tempFrom, tempTo), [mat, mass, tempFrom, tempTo]);
  const volHeat = useMemo(() => cp * mat.rho * 1000, [cp, mat.rho]); // J/(m³·K)

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 300 }, (_, i) => 10 + i * 3);
    return Object.values(materials).slice(0, 6).map((m, i) => ({
      x: temps,
      y: temps.map(T => cpAt(m, T)),
      type: "scatter" as const, mode: "lines" as const,
      name: m.name,
      line: { color: ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"][i], width: 2 },
    }));
  }, []);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Heat Capacity of Optical Materials" description="Specific heat and thermal energy storage">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono">
        <p>Q = m · ∫Cp(T) dT &nbsp;|&nbsp; ρ·Cp = volumetric heat capacity (J/m³·K)</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Material</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(materials).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Temperature (K)</label>
          <input type="number" value={temp} onChange={e => setTemp(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={10} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Mass (g)</label>
          <input type="number" value={mass} onChange={e => setMass(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={0.01} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-400 mb-1">T₁ (°C)</label>
            <input type="number" value={tempFrom} onChange={e => setTempFrom(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">T₂ (°C)</label>
            <input type="number" value={tempTo} onChange={e => setTempTo(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Cp(T)</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{cp.toFixed(3)} J/(g·K)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ρ · Cp</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{(volHeat / 1e6).toFixed(3)} MJ/(m³·K)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Density</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{mat.rho.toFixed(2)} g/cm³</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Q (T₁→T₂)</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{heat.toFixed(1)} J</p>
        </div>
      </div>

      <ChartPanel data={chartData}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Temperature (K)", gridcolor: "#374151" },
          yaxis: { title: "Cp (J/g·K)", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 50, l: 70 },
          legend: { orientation: "h", y: -0.2 },
        }}
       
       
      />
    </CalculatorShell>
  );
}
