"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Critical angle and refractive index for X-ray materials
interface XRayMaterial {
  name: string;
  Z: number; // atomic number
  rho: number; // density g/cm³
  f1_10keV: number;
  f2_10keV: number;
  delta_10keV: number; // refractive index decrement
  beta_10keV: number; // absorption
  K_edge_keV: number;
}

const MATERIALS: Record<string, XRayMaterial> = {
  Beryllium: { name: "Beryllium (Be)", Z: 4, rho: 1.85, f1_10keV: 4.0, f2_10keV: 0.003, delta_10keV: 1.42e-6, beta_10keV: 5.3e-9, K_edge_keV: 0.111 },
  Diamond: { name: "Diamond (C)", Z: 6, rho: 3.52, f1_10keV: 6.0, f2_10keV: 0.009, delta_10keV: 4.65e-6, beta_10keV: 6.98e-9, K_edge_keV: 0.284 },
  Silicon: { name: "Silicon (Si)", Z: 14, rho: 2.33, f1_10keV: 14.0, f2_10keV: 0.258, delta_10keV: 5.18e-6, beta_10keV: 9.55e-8, K_edge_keV: 1.839 },
  Nickel: { name: "Nickel (Ni)", Z: 28, rho: 8.91, f1_10keV: 27.99, f2_10keV: 2.17, delta_10keV: 3.83e-5, beta_10keV: 2.96e-6, K_edge_keV: 8.333 },
  Gold: { name: "Gold (Au)", Z: 79, rho: 19.32, f1_10keV: 76.78, f2_10keV: 13.05, delta_10keV: 5.32e-5, beta_10keV: 4.53e-6, K_edge_keV: 80.725 },
  Platinum: { name: "Platinum (Pt)", Z: 78, rho: 21.45, f1_10keV: 75.78, f2_10keV: 12.5, delta_10keV: 5.86e-5, beta_10keV: 4.85e-6, K_edge_keV: 78.395 },
  Molybdenum: { name: "Molybdenum (Mo)", Z: 42, rho: 10.22, f1_10keV: 39.93, f2_10keV: 4.91, delta_10keV: 4.04e-5, beta_10keV: 9.94e-7, K_edge_keV: 20.0 },
  Copper: { name: "Copper (Cu)", Z: 29, rho: 8.96, f1_10keV: 28.99, f2_10keV: 2.53, delta_10keV: 3.95e-5, beta_10keV: 3.44e-6, K_edge_keV: 8.979 },
  Kapton: { name: "Kapton (C₂₂H₁₀N₂O₅)", Z: 6.4, rho: 1.42, f1_10keV: 6.4, f2_10keV: 0.014, delta_10keV: 1.48e-6, beta_10keV: 3.22e-9, K_edge_keV: 0.284 },
  SiliconNitride: { name: "Si₃N₄ Membrane", Z: 10.1, rho: 3.17, f1_10keV: 10.1, f2_10keV: 0.095, delta_10keV: 4.46e-6, beta_10keV: 4.2e-8, K_edge_keV: 1.839 },
};

// δ and β scale roughly as λ² for hard X-rays (away from edges)
const deltaAtEnergy = (mat: XRayMaterial, E_keV: number) => {
  const ratio = (10 / E_keV) ** 2;
  return mat.delta_10keV * ratio;
};
const betaAtEnergy = (mat: XRayMaterial, E_keV: number) => {
  const ratio = (10 / E_keV) ** 2;
  return mat.beta_10keV * ratio;
};

export default function XRayOpticsPage() {
  const [selected, setSelected] = useState<string[]>(["Diamond", "Beryllium", "Silicon", "Gold"]);
  const toggle = (k: string) => setSelected(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);

  const energyRange = useMemo(() => Array.from({ length: 200 }, (_, i) => 0.5 + i * 0.5), []);

  const deltaChart = useMemo(() => {
    const colors = ["#60a5fa", "#f87171", "#34d399", "#fbbf24", "#a78bfa", "#fb923c"];
    return {
      data: selected.map((key, i) => {
        const m = MATERIALS[key];
        return { x: energyRange, y: energyRange.map(E => deltaAtEnergy(m, E)), type: "scatter" as const, mode: "lines" as const, name: m.name, line: { color: colors[i % colors.length] } };
      }),
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Energy (keV)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "δ (refractive index decrement)", font: { color: "#9ca3af" } }, type: "log" as const }, title: { text: "δ vs Energy", font: { color: "#e5e7eb" } } }
    };
  }, [selected]);

  const betaChart = useMemo(() => {
    const colors = ["#60a5fa", "#f87171", "#34d399", "#fbbf24", "#a78bfa", "#fb923c"];
    return {
      data: selected.map((key, i) => {
        const m = MATERIALS[key];
        return { x: energyRange, y: energyRange.map(E => betaAtEnergy(m, E)), type: "scatter" as const, mode: "lines" as const, name: m.name, line: { color: colors[i % colors.length] } };
      }),
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Energy (keV)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "β (absorption index)", font: { color: "#9ca3af" } }, type: "log" as const }, title: { text: "β vs Energy", font: { color: "#e5e7eb" } } }
    };
  }, [selected]);

  const penetrationChart = useMemo(() => {
    const colors = ["#60a5fa", "#f87171", "#34d399", "#fbbf24", "#a78bfa", "#fb923c"];
    return {
      data: selected.map((key, i) => {
        const m = MATERIALS[key];
        // Penetration depth L = λ/(4πβ) ∝ 1/(β·E)
        return { x: energyRange, y: energyRange.map(E => {
          const b = betaAtEnergy(m, E);
          return (1.24 / E) / (4 * Math.PI * b) * 1e4; // in µm
        }), type: "scatter" as const, mode: "lines" as const, name: m.name, line: { color: colors[i % colors.length] } };
      }),
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Energy (keV)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Penetration Depth (µm)", font: { color: "#9ca3af" } }, type: "log" as const }, title: { text: "1/e Penetration Depth: L = λ/(4πβ)", font: { color: "#e5e7eb" } } }
    };
  }, [selected]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/materials" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Materials</Link>
      <h1 className="text-3xl font-bold mb-2">X-ray Optics Materials</h1>
      <p className="text-gray-400 mb-4">X-ray refractive index: n = 1 - δ - iβ. For hard X-rays, δ,β ∝ λ² ∝ 1/E².</p>
      <p className="text-gray-500 text-sm mb-6">Penetration depth: L = λ/(4πβ). Critical angle: θ<sub>c</sub> = √(2δ).</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(MATERIALS).map(key => (
          <button key={key} onClick={() => toggle(key)} className={`px-3 py-1 rounded text-xs ${selected.includes(key) ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>{MATERIALS[key].name.split("(")[0].trim()}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Plot data={deltaChart.data} layout={deltaChart.layout} config={plotConfig} />
        <Plot data={betaChart.data} layout={betaChart.layout} config={plotConfig} />
        <Plot data={penetrationChart.data} layout={penetrationChart.layout} config={plotConfig} />
      </div>
    </div>
  );
}

const baseLayout = { paper_bgcolor: "#030712", plot_bgcolor: "#111827", font: { color: "#d1d5db" }, xaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, yaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, margin: { t: 50, r: 20, b: 50, l: 70 }, legend: { font: { color: "#9ca3af" }, bgcolor: "rgba(0,0,0,0)" } };
const plotConfig = { responsive: true, displayModeBar: false };
