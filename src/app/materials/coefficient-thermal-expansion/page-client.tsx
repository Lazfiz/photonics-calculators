"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
interface Material {
  name: string;
  cte0: number; // CTE at T0 (×10⁻⁶ /K)
  T0: number;   // reference temp (°C)
  alpha: number[]; // polynomial coeffs for CTE(T) = cte0 + a1*(T-T0) + a2*(T-T0)^2
}

const materials: Record<string, Material> = {
  "Fused Silica": { name: "Fused Silica", cte0: 0.55, T0: 20, alpha: [0.55, 0.0001, 0.0] },
  "BK7": { name: "BK7", cte0: 7.1, T0: 20, alpha: [7.1, 0.006, 0.0001] },
  "SF11": { name: "SF11", cte0: 8.5, T0: 20, alpha: [8.5, 0.007, 0.0002] },
  "CaF2": { name: "CaF₂", cte0: 18.9, T0: 20, alpha: [18.9, 0.012, 0.0003] },
  "ZnSe": { name: "ZnSe", cte0: 7.6, T0: 20, alpha: [7.6, 0.005, 0.0002] },
  "Diamond": { name: "Diamond", cte0: 1.0, T0: 20, alpha: [1.0, 0.002, 0.0001] },
  "Sapphire": { name: "Sapphire", cte0: 5.8, T0: 20, alpha: [5.8, 0.004, 0.0001] },
  "SiC": { name: "SiC", cte0: 2.6, T0: 20, alpha: [2.6, 0.003, 0.0001] },
  "ULE": { name: "ULE (Corning 7972)", cte0: 0.03, T0: 20, alpha: [0.03, 0.0005, 0.0] },
  "Zerodur": { name: "Zerodur", cte0: 0.05, T0: 20, alpha: [0.05, 0.0008, 0.0] },
};

function cteAt(m: Material, T: number) {
  const dT = T - m.T0;
  return m.alpha[0] + m.alpha[1] * dT + m.alpha[2] * dT * dT;
}

function thermalExpansion(m: Material, L0: number, T1: number, T2: number) {
  // ΔL = L0 * ∫CTE dT from T1 to T2 (numerical integration)
  const steps = 100;
  const dT = (T2 - T1) / steps;
  let integral = 0;
  for (let i = 0; i < steps; i++) {
    integral += cteAt(m, T1 + (i + 0.5) * dT) * dT;
  }
  return L0 * integral * 1e-6; // in same units as L0
}

export default function CTEPage() {
  const [selected, setSelected] = useState("Fused Silica");
  const [length, setLength] = useState(100);
  const [tempStart, setTempStart] = useState(20);
  const [tempEnd, setTempEnd] = useState(200);

  const cte = useMemo(() => cteAt(materials[selected], (tempStart + tempEnd) / 2), [selected, tempStart, tempEnd]);
  const deltaL = useMemo(() => thermalExpansion(materials[selected], length, tempStart, tempEnd), [selected, length, tempStart, tempEnd]);

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 200 }, (_, i) => -50 + i * 2.5);
    const mat = materials[selected];
    return [
      {
        x: temps,
        y: temps.map(T => cteAt(mat, T)),
        type: "scatter" as const, mode: "lines" as const,
        name: "CTE", line: { color: "#3b82f6", width: 2 },
        yaxis: "y",
      },
      {
        x: temps,
        y: temps.map(T => {
          const steps = 100;
          const dT = (T - tempStart) / steps;
          let integral = 0;
          for (let i = 0; i < steps; i++) integral += cteAt(mat, tempStart + (i + 0.5) * dT) * dT;
          return length * integral * 1e-6;
        }),
        type: "scatter" as const, mode: "lines" as const,
        name: "ΔL (mm)", line: { color: "#ef4444", width: 2, dash: "dash" },
        yaxis: "y2",
      },
    ];
  }, [selected, tempStart, length]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Coefficient of Thermal Expansion" description="Thermal expansion of optical materials">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300">
        <p className="font-mono">ΔL = L₀ · ∫α(T) dT &nbsp;|&nbsp; CTE α in ×10⁻⁶ /K</p>
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
          <label className="block text-sm text-gray-400 mb-1">Length L₀ (mm)</label>
          <input type="number" value={length} onChange={e => setLength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={0.1} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">T start (°C)</label>
          <input type="number" value={tempStart} onChange={e => setTempStart(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">T end (°C)</label>
          <input type="number" value={tempEnd} onChange={e => setTempEnd(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">CTE at mid-T</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{cte.toFixed(3)} ×10⁻⁶/K</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ΔL</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{deltaL.toExponential(3)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ΔL / L₀</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{tempEnd !== tempStart ? ((deltaL / length) * 1e6).toFixed(2) : "0"} ppm</p>
        </div>
      </div>

      <ChartPanel data={chartData}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Temperature (°C)", gridcolor: "#374151" },
          yaxis: { title: "CTE (×10⁻⁶/K)", gridcolor: "#374151", side: "left" },
          yaxis2: { title: "ΔL (mm)", gridcolor: "#374151", overlaying: "y", side: "right" },
          margin: { t: 20, r: 60, b: 50, l: 70 },
          legend: { orientation: "h", y: -0.15 },
        }}
       
       
      />
    </CalculatorShell>
  );
}
