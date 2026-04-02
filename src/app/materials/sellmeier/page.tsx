"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Material {
  name: string;
  B1: number; B2: number; B3: number;
  C1: number; C2: number; C3: number;
}

// Sellmeier coefficients (C values in µm²)
const materials: Record<string, Material> = {
  "Fused Silica": { 
    name: "Fused Silica (Malitson 1965)", 
    B1: 0.6961663, B2: 0.4079426, B3: 0.8974794, 
    C1: 0.00467914825849, C2: 0.01351206307396, C3: 97.93400253792099 
  },
  "BK7": { 
    name: "BK7 (SCHOTT)", 
    B1: 1.03961212, B2: 0.231792344, B3: 1.01046945, 
    C1: 0.00600069867, C2: 0.0200179144, C3: 103.560653 
  },
  "CaF2": { 
    name: "CaF₂", 
    B1: 0.5675888, B2: 0.4710914, B3: 3.8484723, 
    C1: 0.00252643, C2: 0.01007833, C3: 1200.556 
  },
  "SiO2": { 
    name: "SiO₂ (Crystal Quartz, o-ray)", 
    B1: 0.6961663, B2: 0.4079426, B3: 0.8974794, 
    C1: 0.0684043, C2: 0.1162414, C3: 9.896161 
  },
  "Ge": { 
    name: "Germanium", 
    B1: 4.009489, B2: 0.3922679, B3: 4.213251, 
    C1: 0.1383964, C2: 0.2918464, C3: 2.507735 
  },
  "ZnSe": { 
    name: "ZnSe", 
    B1: 4.458137, B2: 0.4697145, B3: 2.895563, 
    C1: 0.2008599, C2: 0.3943669, C3: 2.302026 
  },
  "Diamond": { 
    name: "Diamond", 
    B1: 0.3306, B2: 4.3356, B3: 0.0, 
    C1: 0.01150, C2: 0.03770, C3: 0.0 
  },
};

function sellmeier(m: Material, lambdaUm: number): number {
  const l2 = lambdaUm * lambdaUm;
  const n2 = 1 + m.B1 * l2 / (l2 - m.C1) + m.B2 * l2 / (l2 - m.C2) + m.B3 * l2 / (l2 - m.C3);
  return Math.sqrt(n2);
}

const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function SellmeierPage() {
  const [wavelength, setWavelength] = useState(1550);
  const [selected, setSelected] = useState("Fused Silica");

  const n = useMemo(() => sellmeier(materials[selected], wavelength / 1000), [selected, wavelength]);

  const chartData = useMemo(() => {
    const ws: number[] = [];
    for (let w = 400; w <= 2000; w += 5) ws.push(w);
    const entries = Object.entries(materials);
    return entries.map(([key, m], i) => ({
      x: ws,
      y: ws.map(w => sellmeier(m, w / 1000)),
      type: "scatter" as const,
      mode: "lines" as const,
      name: m.name,
      line: { color: colors[i % colors.length], width: key === selected ? 3 : 1.5 },
    }));
  }, [selected]);

  const mat = materials[selected];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/materials" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Materials</Link>
      <h1 className="text-3xl font-bold mb-2">Sellmeier Equation</h1>
      <p className="text-gray-400 mb-6">n²(λ) = 1 + B₁λ²/(λ²−C₁) + B₂λ²/(λ²−C₂) + B₃λ²/(λ²−C₃)</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
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
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={100} max={50000} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <p className="text-sm text-gray-400">Refractive Index at {wavelength} nm</p>
        <p className="text-4xl font-bold text-blue-400 mt-1">{n.toFixed(6)}</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <p className="text-sm text-gray-400 mb-2">Sellmeier Coefficients for {mat.name}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
          <span>B₁: {mat.B1}</span>
          <span>B₂: {mat.B2}</span>
          <span>B₃: {mat.B3}</span>
          <span>C₁: {mat.C1} µm²</span>
          <span>C₂: {mat.C2} µm²</span>
          <span>C₃: {mat.C3} µm²</span>
        </div>
      </div>

      <Plot
        data={chartData}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Refractive Index n", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 50, l: 60 },
          legend: { orientation: "h", y: -0.15 },
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%", height: 500 }}
      />
    </div>
  );
}
