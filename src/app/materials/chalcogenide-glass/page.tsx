"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


interface ChalcogenideGlass {
  name: string;
  composition: string;
  n2um: number;
  n4um: number;
  n10um: number;
  dn_dt: number; // dn/dT × 10⁻⁶ /K
  Tg: number; // glass transition °C
  n2: number; // nonlinear index × 10⁻¹⁸ m²/W
  transparencyMin: number; // μm
  transparencyMax: number; // μm
  // Sellmeier-ish coefficients for n(λ) approximation
  B1: number; B2: number; B3: number;
  C1: number; C2: number; C3: number;
}

const glasses: Record<string, ChalcogenideGlass> = {
  "As₂S₃": {
    name: "As₂S₃", composition: "Arsenic Trisulfide",
    n2um: 2.416, n4um: 2.412, n10um: 2.382,
    dn_dt: 10, Tg: 210, n2: 15.4,
    transparencyMin: 0.6, transparencyMax: 7.0,
    B1: 2.8248, B2: 1.3192, B3: 2.0896,
    C1: 0.0656, C2: 0.1058, C3: 35.05,
  },
  "As₂Se₃": {
    name: "As₂Se₃", composition: "Arsenic Triselenide",
    n2um: 2.792, n4um: 2.778, n10um: 2.732,
    dn_dt: 17, Tg: 180, n2: 23.0,
    transparencyMin: 0.8, transparencyMax: 14.0,
    B1: 4.7340, B2: 1.0250, B3: 1.6600,
    C1: 0.0440, C2: 0.1050, C3: 25.40,
  },
  "Ge₂₈Sb₁₂Se₆₀": {
    name: "Ge₂₈Sb₁₂Se₆₀", composition: "Ge-Sb-Se (Glasses from IRtransparent)",
    n2um: 2.60, n4um: 2.58, n10um: 2.54,
    dn_dt: 15, Tg: 280, n2: 18.0,
    transparencyMin: 1.0, transparencyMax: 14.0,
    B1: 3.8, B2: 1.1, B3: 1.9,
    C1: 0.05, C2: 0.12, C3: 28.0,
  },
  "Ge₂₅Ga₅Se₇₀": {
    name: "Ge₂₅Ga₅Se₇₀", composition: "Germanium Gallium Selenide",
    n2um: 2.50, n4um: 2.48, n10um: 2.44,
    dn_dt: 12, Tg: 310, n2: 16.5,
    transparencyMin: 0.9, transparencyMax: 14.0,
    B1: 3.5, B2: 1.0, B3: 1.8,
    C1: 0.05, C2: 0.11, C3: 30.0,
  },
  "Ge₁₀As₂₀Se₇₀": {
    name: "Ge₁₀As₂₀Se₇₀", composition: "Ge-As-Se (GASIR®)",
    n2um: 2.60, n4um: 2.59, n10um: 2.55,
    dn_dt: 15, Tg: 265, n2: 17.0,
    transparencyMin: 0.8, transparencyMax: 14.0,
    B1: 3.9, B2: 1.2, B3: 1.7,
    C1: 0.048, C2: 0.10, C3: 26.0,
  },
  "AsS": {
    name: "AsS", composition: "Arsenic Monosulfide",
    n2um: 2.38, n4um: 2.37, n10um: 2.35,
    dn_dt: 9, Tg: 200, n2: 13.0,
    transparencyMin: 0.6, transparencyMax: 8.0,
    B1: 2.7, B2: 1.2, B3: 2.0,
    C1: 0.06, C2: 0.11, C3: 33.0,
  },
  "Ge-As-S": {
    name: "Ge-As-S", composition: "Germanium Arsenic Sulfide",
    n2um: 2.40, n4um: 2.39, n10um: 2.36,
    dn_dt: 10, Tg: 320, n2: 14.0,
    transparencyMin: 0.6, transparencyMax: 10.0,
    B1: 2.9, B2: 1.15, B3: 2.1,
    C1: 0.058, C2: 0.10, C3: 32.0,
  },
};

function sellmeier(g: ChalcogenideGlass, lambdaUm: number): number {
  const l2 = lambdaUm * lambdaUm;
  const n2 = 1 + g.B1 * l2 / (l2 - g.C1) + g.B2 * l2 / (l2 - g.C2) + g.B3 * l2 / (l2 - g.C3);
  return Math.sqrt(n2);
}

const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export default function ChalcogenideGlassPage() {
  const [wavelength, setWavelength] = useState(4000);
  const [selected, setSelected] = useState("As₂S₃");
  const [plotMode, setPlotMode] = useState<"refractive" | "transparency">("refractive");

  const g = glasses[selected];
  const n = useMemo(() => sellmeier(g, wavelength / 1000), [selected, wavelength]);

  const chartData = useMemo(() => {
    if (plotMode === "refractive") {
      const ws: number[] = [];
      for (let w = 800; w <= 14000; w += 50) ws.push(w);
      return Object.entries(glasses).map(([key, glass], i) => ({
        x: ws, y: ws.map(w => sellmeier(glass, w / 1000)),
        type: "scatter" as const, mode: "lines" as const, name: glass.name,
        line: { color: colors[i % colors.length], width: key === selected ? 3 : 1.5 },
      }));
    }
    return Object.entries(glasses).map(([key, glass], i) => ({
      x: [glass.transparencyMin, glass.transparencyMax],
      y: [0, 0], type: "scatter" as const, mode: "markers+lines" as const,
      name: glass.name, line: { color: colors[i % colors.length], width: 8 },
      marker: { size: 10 },
    }));
  }, [selected, plotMode]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Chalcogenide Glass Properties" description="IR-transparent glasses for thermal imaging, sensing, and nonlinear optics">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Glass</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(glasses).map(([k, v]) => <option key={k} value={k}>{v.name} — {v.composition}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={600} max={14000} step={50} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Plot Mode</label>
          <select value={plotMode} onChange={e => setPlotMode(e.target.value as "refractive" | "transparency")}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            <option value="refractive">n(λ) Dispersion</option>
            <option value="transparency">Transparency Range</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n at {wavelength} nm</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{n.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n₂ (nonlinear)</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{g.n2.toFixed(1)}×10⁻¹⁸</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">T<sub>g</sub> (°C)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{g.Tg}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">dn/dT (×10⁻⁶/K)</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{g.dn_dt}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400 mb-1">Transparency Range</p>
        <p className="text-lg font-bold text-cyan-400">{g.transparencyMin} — {g.transparencyMax} μm</p>
      </div>

      <ChartPanel data={chartData}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: plotMode === "refractive" ? "Wavelength (nm)" : "Wavelength (μm)", gridcolor: "#374151" },
          yaxis: { title: plotMode === "refractive" ? "Refractive Index n" : "Transparency", gridcolor: "#374151",
            visible: plotMode === "refractive", showticklabels: plotMode === "refractive" },
          margin: { t: 20, r: 20, b: 50, l: 60 },
          legend: { orientation: "h", y: -0.25 },
        }}
       
       
      />
    </CalculatorShell>
  );
}
