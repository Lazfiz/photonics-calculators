"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";


interface FluorideGlass {
  name: string;
  composition: string;
  nd: number;
  vd: number;
  Tg: number;
  n3um: number;
  n4um: number;
  dn_dt: number;
  transparencyMin: number;
  transparencyMax: number;
  B1: number; B2: number; B3: number;
  C1: number; C2: number; C3: number;
}

const glasses: Record<string, FluorideGlass> = {
  "ZBLAN": {
    name: "ZBLAN", composition: "ZrF₄-BaF₂-LaF₃-AlF₃-NaF",
    nd: 1.499, vd: 91, Tg: 260,
    n3um: 1.488, n4um: 1.485,
    dn_dt: -7, transparencyMin: 0.25, transparencyMax: 6.0,
    B1: 1.4893, B2: 0.4050, B3: 2.1980,
    C1: 0.0107, C2: 0.0489, C3: 9.60,
  },
  "ZBLA": {
    name: "ZBLA", composition: "ZrF₄-BaF₂-LaF₃-AlF₃",
    nd: 1.509, vd: 87, Tg: 310,
    n3um: 1.498, n4um: 1.495,
    dn_dt: -8, transparencyMin: 0.25, transparencyMax: 5.5,
    B1: 1.5250, B2: 0.3500, B3: 1.9000,
    C1: 0.0120, C2: 0.0500, C3: 10.50,
  },
  "BIG": {
    name: "BIG", composition: "BaF₂-InF₃-GaF₃ (fluoride)",
    nd: 1.490, vd: 95, Tg: 300,
    n3um: 1.480, n4um: 1.477,
    dn_dt: -5, transparencyMin: 0.25, transparencyMax: 5.5,
    B1: 1.4500, B2: 0.3800, B3: 2.1000,
    C1: 0.0090, C2: 0.0450, C3: 8.80,
  },
  "Fluorozirconate": {
    name: "Fluorozirconate", composition: "ZrF₄-based (general)",
    nd: 1.510, vd: 85, Tg: 275,
    n3um: 1.499, n4um: 1.496,
    dn_dt: -6, transparencyMin: 0.3, transparencyMax: 5.5,
    B1: 1.5300, B2: 0.3600, B3: 1.9500,
    C1: 0.0115, C2: 0.0480, C3: 10.20,
  },
  "AlF₃-based": {
    name: "AlF₃-based", composition: "AlF₃-ZrF₄ (low loss)",
    nd: 1.420, vd: 93, Tg: 430,
    n3um: 1.412, n4um: 1.410,
    dn_dt: -4, transparencyMin: 0.2, transparencyMax: 5.0,
    B1: 1.3500, B2: 0.3000, B3: 1.8000,
    C1: 0.0080, C2: 0.0400, C3: 9.00,
  },
  "PbF₂-AlF₃": {
    name: "PbF₂-AlF₃", composition: "Lead-Aluminum Fluoride",
    nd: 1.560, vd: 75, Tg: 320,
    n3um: 1.548, n4um: 1.544,
    dn_dt: -10, transparencyMin: 0.35, transparencyMax: 5.0,
    B1: 1.6000, B2: 0.4200, B3: 2.2000,
    C1: 0.0130, C2: 0.0520, C3: 11.00,
  },
};

function sellmeier(g: FluorideGlass, lambdaUm: number): number {
  const l2 = lambdaUm * lambdaUm;
  const n2 = 1 + g.B1 * l2 / (l2 - g.C1) + g.B2 * l2 / (l2 - g.C2) + g.B3 * l2 / (l2 - g.C3);
  return Math.sqrt(n2);
}

const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function FluorideGlassPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);
  const [selected, setSelected] = useState("ZBLAN");

  const g = glasses[selected];
  const n = useMemo(() => sellmeier(g, wavelength / 1000), [selected, wavelength]);

  const chartData = useMemo(() => {
    const ws: number[] = [];
    for (let w = 300; w <= 6000; w += 20) ws.push(w);
    return Object.entries(glasses).map(([key, glass], i) => ({
      x: ws, y: ws.map(w => sellmeier(glass, w / 1000)),
      type: "scatter" as const, mode: "lines" as const, name: glass.name,
      line: { color: colors[i % colors.length], width: key === selected ? 3 : 1.5 },
    }));
  }, [selected]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Fluoride Glass (ZBLAN)" description="Heavy-metal fluoride glasses for mid-IR fiber optics and low-loss transmission">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Glass Type</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(glasses).map(([k, v]) => <option key={k} value={k}>{v.name} — {v.composition}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={300} max={6000} step={10} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n at {wavelength} nm</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{n.toFixed(6)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n<sub>d</sub></p>
          <p className="text-2xl font-bold text-green-400 mt-1">{g.nd.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ν<sub>d</sub> (Abbe)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{g.vd}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">T<sub>g</sub> (°C)</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{g.Tg}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">dn/dT (×10⁻⁶/K)</p>
          <p className="text-lg font-bold text-cyan-400 mt-1">{g.dn_dt}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transparency</p>
          <p className="text-lg font-bold text-rose-400 mt-1">{g.transparencyMin} – {g.transparencyMax} μm</p>
        </div>
      </div>

      <ChartPanel data={chartData}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Refractive Index n", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 50, l: 60 },
          legend: { orientation: "h", y: -0.25 },
        }}
       
       
      />
    </CalculatorShell>
  );
}
