"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
interface Material {
  name: string;
  // Verdet constant at reference wavelength
  V_ref: number; // rad/(T·m) at specified wavelength
  lambda_ref: number; // nm
  // For dispersion: V(λ) ∝ 1/λ² (approximate)
  type: string;
  notes: string;
}

const materials: Record<string, Material> = {
  "TGG": { name: "TGG (Tb₃Ga₅O₁₂)", V_ref: -134, lambda_ref: 633, type: "Crystal", notes: "Best Faraday rotator crystal" },
  "TbAG": { name: "TbAG (Tb₃Al₅O₁₂)", V_ref: -172, lambda_ref: 633, type: "Crystal", notes: "Higher than TGG" },
  "YIG": { name: "YIG (Y₃Fe₅O₁₂)", V_ref: -240, lambda_ref: 1310, type: "Crystal", notes: "IR Faraday isolator" },
  "FR5": { name: "FR5 Glass", V_ref: -95, lambda_ref: 633, type: "Glass", notes: "Hoya paramagnetic glass" },
  "SF57": { name: "SF57 Glass", V_ref: -27, lambda_ref: 633, type: "Glass", notes: "High-index diamagnetic" },
  "SF6": { name: "SF6 Glass", V_ref: -23, lambda_ref: 633, type: "Glass", notes: "Dense flint" },
  "BK7": { name: "BK7", V_ref: -6.6, lambda_ref: 633, type: "Glass", notes: "Low Verdet, diamagnetic" },
  "Fused Silica": { name: "Fused Silica", V_ref: -3.7, lambda_ref: 633, type: "Glass", notes: "Very low" },
  "CaF2": { name: "CaF₂", V_ref: -4.0, lambda_ref: 633, type: "Crystal", notes: "Low, used for windows" },
  "ZnSe": { name: "ZnSe", V_ref: 120, lambda_ref: 10600, type: "II-VI", notes: "CO₂ laser isolators" },
  "Diamond": { name: "Diamond", V_ref: 15, lambda_ref: 633, type: "Crystal", notes: "Small positive at IR" },
};

function verdetConstant(m: Material, lambda: number): number {
  // V(λ) ≈ V_ref × (λ_ref/λ)² for paramagnetic materials
  // For diamagnetic: similar scaling
  return m.V_ref * Math.pow(m.lambda_ref / lambda, 2);
}

const colors = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#6b7280", "#14b8a6", "#a855f7", "#f97316"];

export default function VerdetConstantPage() {
  const [wavelength, setWavelength] = useState(633);
  const [selected, setSelected] = useState("TGG");
  const [length, setLength] = useState(20); // mm
  const [field, setField] = useState(1); // Tesla

  const m = materials[selected];
  const V = useMemo(() => verdetConstant(m, wavelength), [m, wavelength]);
  const rotation = V * field * (length / 1000); // rad

  const chartData = useMemo(() => {
    const ws: number[] = [];
    for (let w = 400; w <= 2000; w += 10) ws.push(w);
    const entries = Object.entries(materials);
    return entries.map(([key, mat], i) => ({
      x: ws,
      y: ws.map(w => verdetConstant(mat, w)),
      type: "scatter" as const,
      mode: "lines" as const,
      name: mat.name,
      line: { color: colors[i % colors.length], width: key === selected ? 3 : 1.5 },
    }));
  }, [selected]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Verdet Constant" description="Faraday rotation: θ = V · B · L, where V ∝ 1/λ² for paramagnetic materials">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Material</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(materials).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={400} max={5000} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Magnetic field B (T)</label>
          <input type="number" value={field} onChange={e => setField(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={0.01} max={10} step={0.1} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Length (mm)</label>
          <input type="number" value={length} onChange={e => setLength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={0.1} max={200} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">V (rad/T·m)</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{V.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">V (°/T·cm)</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{(V * 180 / Math.PI / 100).toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Rotation θ</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{(rotation * 180 / Math.PI).toFixed(2)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">45° isolator L</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{(Math.PI/4 / V / field * 1000).toFixed(1)} mm</p>
        </div>
      </div>

      <ChartPanel data={chartData}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Verdet Constant V (rad/T·m)", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 50, l: 60 },
          legend: { orientation: "h", y: -0.25, font: { size: 9 } },
        }}
       
       
      />
    </CalculatorShell>
  );
}
