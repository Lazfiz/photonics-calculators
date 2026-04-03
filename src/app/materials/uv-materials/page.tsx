"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface UVMaterial {
  name: string;
  range: [number, number]; // nm
  nd200: number;
  solarization: "high" | "medium" | "low";
  B: number[];
  C: number[];
}

const MATERIALS: Record<string, UVMaterial> = {
  FusedSilica: { name: "Fused Silica (SiO₂)", range: [160, 3500], nd200: 1.5600, solarization: "low", B: [0.6961663, 0.4079426, 0.8974794], C: [0.0684043, 0.1162414, 9.896161] },
  CaF2: { name: "Calcium Fluoride (CaF₂)", range: [130, 9000], nd200: 1.5300, solarization: "low", B: [0.5675888, 0.4710914, 3.8484723], C: [0.00252643, 0.010078333, 1200.556] },
  MgF2: { name: "Magnesium Fluoride (MgF₂)", range: [115, 7500], nd200: 1.4450, solarization: "low", B: [0.487551, 0.398750, 2.3120], C: [0.00188, 0.00788, 55.0] },
  LiF: { name: "Lithium Fluoride (LiF)", range: [105, 7000], nd200: 1.4400, solarization: "medium", B: [0.925, 0.209, 0.880], C: [0.0070, 0.022, 4100] },
  Sapphire: { name: "Sapphire (Al₂O₃)", range: [150, 6000], nd200: 1.8500, solarization: "low", B: [1.4313, 0.6505, 5.3414], C: [0.00528, 0.01424, 325.0] },
  BK7: { name: "BK7 (Borosilicate)", range: [310, 2500], nd200: null as any, solarization: "high", B: [1.03961212, 0.231792344, 1.01046945], C: [0.00600069867, 0.0200179144, 103.560653] },
  UVFS: { name: "UV Grade Fused Silica", range: [160, 3500], nd200: 1.5620, solarization: "very low", B: [0.6965, 0.4082, 0.8969], C: [0.0684, 0.1162, 9.8962] },
  BaF2: { name: "Barium Fluoride (BaF₂)", range: [135, 12500], nd200: 1.5700, solarization: "medium", B: [0.6434, 0.5088, 3.7237], C: [0.00340, 0.01200, 1960] },
  Quartz: { name: "Crystalline Quartz (SiO₂)", range: [150, 4000], nd200: 1.5560, solarization: "medium", B: [0.6962, 0.4080, 0.8970], C: [0.0684, 0.1162, 9.896] },
  CsI: { name: "Cesium Iodide (CsI)", range: [200, 55000], nd200: 1.7700, solarization: "medium", B: [1.0, 0.6, 2.5], C: [0.015, 0.08, 3000] },
};

const sellmeierN = (wl_um: number, B: number[], C: number[]) => {
  const l2 = wl_um * wl_um;
  return Math.sqrt(1 + B[0] * l2 / (l2 - C[0]) + B[1] * l2 / (l2 - C[1]) + B[2] * l2 / (l2 - C[2]));
};

export default function UVMaterialsPage() {
  const [selected, setSelected] = useState<string[]>(["FusedSilica", "CaF2", "MgF2", "Sapphire"]);
  const toggle = (k: string) => setSelected(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);

  const uvChart = useMemo(() => ({
    data: Object.entries(MATERIALS).map(([key, m], i) => ({
      x: [m.range[0], m.range[1]], y: [i, i], type: "scatter" as const, mode: "lines+markers" as const,
      name: m.name, line: { color: selected.includes(key) ? "#a78bfa" : "#374151", width: selected.includes(key) ? 6 : 2 },
      marker: { size: 6 }
    })),
    layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Wavelength (nm)", font: { color: "#9ca3af" } }, range: [50, 60000], type: "log" as const }, yaxis: { ...baseLayout.yaxis, tickvals: Object.keys(MATERIALS).map((_, i) => i), ticktext: Object.values(MATERIALS).map(m => m.name.split("(")[0].trim()), autorange: false, range: [-0.5, Object.keys(MATERIALS).length - 0.5] }, title: { text: "UV Transmission Ranges (log scale)", font: { color: "#e5e7eb" } } }
  }), [selected]);

  const dispersionChart = useMemo(() => {
    const wls = Array.from({ length: 150 }, (_, i) => 0.12 + i * 0.005);
    const colors = ["#a78bfa", "#f87171", "#34d399", "#fbbf24", "#60a5fa", "#fb923c", "#f472b6", "#22d3ee"];
    return {
      data: selected.map((key, i) => {
        const m = MATERIALS[key];
        const ns = wls.map(wl => {
          try { return sellmeierN(wl, m.B, m.C); } catch { return NaN; }
        });
        return { x: wls.map(w => w * 1000), y: ns, type: "scatter" as const, mode: "lines" as const, name: m.name.split("(")[0].trim(), line: { color: colors[i % colors.length] } };
      }),
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Wavelength (nm)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Refractive Index n(λ)", font: { color: "#9ca3af" } } }, title: { text: "UV Dispersion", font: { color: "#e5e7eb" } } }
    };
  }, [selected]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/materials" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Materials</Link>
      <h1 className="text-3xl font-bold mb-2">UV Optical Materials</h1>
      <p className="text-gray-400 mb-8">Deep UV to near-UV materials comparison. <span className="text-gray-500">Sellmeier: n² = 1 + Σ B<sub>i</sub>λ²/(λ² - C<sub>i</sub>)</span></p>

      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(MATERIALS).map(key => (
          <button key={key} onClick={() => toggle(key)} className={`px-3 py-1 rounded text-xs ${selected.includes(key) ? "bg-purple-600" : "bg-gray-800 hover:bg-gray-700"}`}>{MATERIALS[key].name.split("(")[0].trim()}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Plot data={uvChart.data} layout={uvChart.layout} config={plotConfig} />
        <Plot data={dispersionChart.data} layout={dispersionChart.layout} config={plotConfig} />
      </div>
    </div>
  );
}

const baseLayout = { paper_bgcolor: "#030712", plot_bgcolor: "#111827", font: { color: "#d1d5db" }, xaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, yaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, margin: { t: 50, r: 20, b: 60, l: 60 }, legend: { font: { color: "#9ca3af" }, bgcolor: "rgba(0,0,0,0)" } };
const plotConfig = { responsive: true, displayModeBar: false };
