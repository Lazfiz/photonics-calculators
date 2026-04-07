"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
interface IRMaterial {
  name: string;
  range: [number, number]; // µm
  nd25: number;
  dn_dT: number; // ×10⁻⁶/K
  thermalCond: number; // W/(m·K)
  hardness: number; // Knoop
  B?: number[]; C?: number[]; // Sellmeier
}

const MATERIALS: Record<string, IRMaterial> = {
  Germanium: { name: "Germanium (Ge)", range: [2, 14], nd25: 4.003, dn_dT: 396, thermalCond: 60, hardness: 780, B: [4.0098, 2.894, 1.900, 1.409], C: [0.1397, 0.3061, 0.0356, 30.51] },
  Silicon: { name: "Silicon (Si)", range: [1.2, 7], nd25: 3.4179, dn_dT: 159, thermalCond: 149, hardness: 1150 },
  ZnSe: { name: "Zinc Selenide (ZnSe)", range: [0.6, 18], nd25: 2.4033, dn_dT: 61, thermalCond: 18, hardness: 150, B: [4.298, 0.182, 2.878], C: [0.0907, 18.39, 1.874] },
  ZnS: { name: "Zinc Sulfide (ZnS)", range: [0.4, 14], nd25: 2.2004, dn_dT: 43, thermalCond: 27, hardness: 355 },
  CaF2: { name: "Calcium Fluoride (CaF₂)", range: [0.13, 9], nd25: 1.4338, dn_dT: -10.6, thermalCond: 9.71, hardness: 158, B: [0.5675888, 0.4710914, 3.8484723], C: [0.00252643, 0.010078333, 1200.556] },
  BaF2: { name: "Barium Fluoride (BaF₂)", range: [0.15, 12], nd25: 1.4744, dn_dT: -16.3, thermalCond: 11.7, hardness: 82 },
  KRS5: { name: "KRS-5 (TlBrI)", range: [0.6, 40], nd25: 2.3773, dn_dT: -253, thermalCond: 0.54, hardness: 40 },
  AMTIR1: { name: "AMTIR-1 (GeAsSe)", range: [1, 14], nd25: 2.4975, dn_dT: 72, thermalCond: 0.25, hardness: 170 },
  MgF2: { name: "Magnesium Fluoride (MgF₂)", range: [0.11, 7.5], nd25: 1.3777, dn_dT: 1.0, thermalCond: 21, hardness: 576, B: [0.487551, 0.398750, 2.3120], C: [0.00188, 0.00788, 55.0] },
  NaCl: { name: "Sodium Chloride (NaCl)", range: [0.2, 17], nd25: 1.4913, dn_dT: -34, thermalCond: 6.5, hardness: 18 },
};

export default function InfraredGlassPage() {
  const [material, setMaterial] = useState<keyof typeof MATERIALS>("Germanium");
  const [temperature, setTemperature] = useURLState("temperature", 25);

  const mat = MATERIALS[material];

  const nAtTemp = useMemo(() => {
    if (!mat.B || !mat.C) return mat.nd25;
    const l2 = 4 * 4; // at 2µm typical
    const n25 = Math.sqrt(1 + mat.B.reduce((s, b, i) => s + b * l2 / (l2 - mat.C![i]), 0));
    return n25 + mat.dn_dT * 1e-6 * (temperature - 25);
  }, [material, temperature]);

  const rangeChart = useMemo(() => ({
    data: Object.entries(MATERIALS).map(([key, m], i) => ({
      x: [m.range[0], m.range[1]], y: [i, i], type: "scatter" as const, mode: "lines+markers" as const,
      name: m.name, line: { color: key === material ? "#60a5fa" : "#374151", width: key === material ? 4 : 2 },
      marker: { size: 8 }
    })),
    layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Transmission Range (µm)", font: { color: "#9ca3af" } }, range: [0, 42] }, yaxis: { ...baseLayout.yaxis, tickvals: Object.keys(MATERIALS).map((_, i) => i), ticktext: Object.values(MATERIALS).map(m => m.name), autorange: false, range: [-0.5, Object.keys(MATERIALS).length - 0.5] }, title: { text: "IR Material Transmission Ranges", font: { color: "#e5e7eb" } } }
  }), [material]);

  const propsChart = useMemo(() => {
    const keys = Object.keys(MATERIALS);
    return {
      data: [
        { x: keys, y: keys.map(k => MATERIALS[k].thermalCond), type: "bar" as const, name: "Thermal Cond.", marker: { color: "#f87171" }, yaxis: "y" },
        { x: keys, y: keys.map(k => MATERIALS[k].hardness / 10), type: "bar" as const, name: "Hardness (×10)", marker: { color: "#60a5fa" }, yaxis: "y2" },
      ],
      layout: { ...baseLayout, barmode: "group" as const, xaxis: { ...baseLayout.xaxis, tickangle: -45 }, yaxis: { ...baseLayout.yaxis, title: { text: "W/(m·K)", font: { color: "#f87171" } } }, yaxis2: { title: { text: "Knoop / 10", font: { color: "#60a5fa" } }, overlaying: "y" as const, side: "right" as const, gridcolor: "rgba(0,0,0,0)" }, title: { text: "Thermal & Mechanical Properties", font: { color: "#e5e7eb" } } }
    };
  }, []);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Infrared Optical Materials" description="Compare IR transmitting materials. n(T) = n₂₅ + (dn/dT)(T - 25°C)">
            
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        {Object.keys(MATERIALS).map(key => (
          <button key={key} onClick={() => setMaterial(key as any)} className={`px-3 py-2 rounded text-xs ${material === key ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>{MATERIALS[key].name.split("(")[0].trim()}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 p-4 bg-gray-900 rounded-lg">
        <div><div className="text-gray-400 text-xs">n at {temperature}°C</div><div className="text-2xl font-bold text-blue-400">{nAtTemp.toFixed(4)}</div></div>
        <div><div className="text-gray-400 text-xs">Range</div><div className="text-2xl font-bold">{mat.range[0]}–{mat.range[1]} µm</div></div>
        <div><div className="text-gray-400 text-xs">dn/dT</div><div className="text-xl font-bold">{mat.dn_dT > 0 ? "+" : ""}{mat.dn_dT} ×10⁻⁶/K</div></div>
        <div><div className="text-gray-400 text-xs">Thermal Cond.</div><div className="text-2xl font-bold">{mat.thermalCond} W/(m·K)</div></div>
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-400">Temperature: {temperature}°C</label>
        <input type="range" min={-50} max={200} value={temperature} onChange={e => setTemperature(+e.target.value)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPanel data={rangeChart.data} layout={rangeChart.layout} config={plotConfig} />
        <ChartPanel data={propsChart.data} layout={propsChart.layout} config={plotConfig} />
      </div>
    </CalculatorShell>
  );
}

const baseLayout = { paper_bgcolor: "#030712", plot_bgcolor: "#111827", font: { color: "#d1d5db" }, xaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, yaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, margin: { t: 50, r: 20, b: 80, l: 60 }, legend: { font: { color: "#9ca3af" }, bgcolor: "rgba(0,0,0,0)" } };
const plotConfig = { responsive: true, displayModeBar: false };
