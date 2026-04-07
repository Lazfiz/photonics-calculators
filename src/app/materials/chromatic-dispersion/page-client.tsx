"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
interface Material {
  name: string;
  B1: number; B2: number; B3: number;
  C1: number; C2: number; C3: number;
}

const materials: Record<string, Material> = {
  "Fused Silica": { name: "Fused Silica", B1: 0.6961663, B2: 0.4079426, B3: 0.8974794, C1: 0.004679148, C2: 0.013512063, C3: 97.934002 },
  "BK7": { name: "BK7", B1: 1.03961212, B2: 0.231792344, B3: 1.01046945, C1: 0.00600069867, C2: 0.0200179144, C3: 103.560653 },
  "SF11": { name: "SF11", B1: 1.73759695, B2: 0.313747346, B3: 1.89878101, C1: 0.013188707, C2: 0.0623068142, C3: 155.23629 },
  "CaF2": { name: "CaF₂", B1: 0.5675888, B2: 0.4710914, B3: 3.8484723, C1: 0.00252643, C2: 0.01007833, C3: 1200.556 },
  "Diamond": { name: "Diamond", B1: 0.3306, B2: 4.3356, B3: 0.0, C1: 0.01150, C2: 0.03770, C3: 0.0 },
  "ZnSe": { name: "ZnSe", B1: 4.458137, B2: 0.4697145, B3: 2.895563, C1: 0.2008599, C2: 0.3943669, C3: 2.302026 },
};

function sellmeier(m: Material, lam: number) {
  const l2 = lam * lam;
  return Math.sqrt(1 + m.B1 * l2 / (l2 - m.C1) + m.B2 * l2 / (l2 - m.C2) + m.B3 * l2 / (l2 - m.C3));
}

// dn/dλ from Sellmeier: dn/dλ = (λ/n) * Σ (B_i * C_i) / (λ² - C_i)²
function dnDlambda(m: Material, lam: number) {
  const n = sellmeier(m, lam);
  const l2 = lam * lam;
  let sum = 0;
  for (const [B, C] of [[m.B1, m.C1], [m.B2, m.C2], [m.B3, m.C3]]) {
    if (C > 0) sum += B * C / Math.pow(l2 - C, 2);
  }
  return (lam / n) * sum; // per µm
}

// Group velocity dispersion: β₂ = (λ³/(2πc²)) * d²n/dλ² ≈ (λ³/(2πc²)) * (2/λ) * dn/dλ (simplified)
// More accurately: GVD = (λ/c) * d²n/dλ²
function gvd(m: Material, lamNm: number) {
  const lam = lamNm / 1000; // to µm
  const dlam = 0.001; // µm
  const dnd = (dnDlambda(m, lam + dlam) - dnDlambda(m, lam - dlam)) / (2 * dlam);
  const c = 2.998e5; // km/s
  return (lam / c) * dnd * 1e6; // ps²/km, convert from s²/km·µm⁻¹
}

const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function ChromaticDispersionPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);
  const [selected, setSelected] = useState("Fused Silica");

  const n = useMemo(() => sellmeier(materials[selected], wavelength / 1000), [selected, wavelength]);
  const dn = useMemo(() => dnDlambda(materials[selected], wavelength / 1000), [selected, wavelength]);
  const gvdVal = useMemo(() => gvd(materials[selected], wavelength), [selected, wavelength]);

  const chartData = useMemo(() => {
    const ws: number[] = [];
    for (let w = 400; w <= 2000; w += 10) ws.push(w);
    const mat = materials[selected];
    return [
      {
        x: ws,
        y: ws.map(w => sellmeier(mat, w / 1000)),
        type: "scatter" as const, mode: "lines" as const,
        name: "n(λ)", line: { color: "#3b82f6", width: 2 },
        yaxis: "y",
      },
      {
        x: ws,
        y: ws.map(w => dnDlambda(mat, w / 1000) * 1000), // per nm
        type: "scatter" as const, mode: "lines" as const,
        name: "dn/dλ (×10⁻³/nm)", line: { color: "#ef4444", width: 2 },
        yaxis: "y2",
      },
    ];
  }, [selected]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Chromatic Dispersion" description="Material dispersion dn/dλ from Sellmeier coefficients">
            
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
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={300} max={3000} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n(λ)</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{n.toFixed(6)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">dn/dλ</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{(dn * 1000).toExponential(3)} /nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">GVD (β₂)</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{gvdVal.toFixed(4)} ps²/km</p>
        </div>
      </div>

      <ChartPanel data={chartData}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Refractive Index n", gridcolor: "#374151", side: "left" },
          yaxis2: { title: "dn/dλ (×10⁻³/nm)", gridcolor: "#374151", overlaying: "y", side: "right" },
          margin: { t: 20, r: 60, b: 50, l: 60 },
          legend: { orientation: "h", y: -0.15 },
        }}
       
       
      />
    </CalculatorShell>
  );
}
