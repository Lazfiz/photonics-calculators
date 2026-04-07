"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
interface Material {
  name: string;
  B1: number; B2: number; B3: number;
  C1: number; C2: number; C3: number;
  lambdaMin: number; // nm
  lambdaMax: number; // nm
  absorption: number; // cm⁻¹ typical
  dn_dT: number; // ×10⁻⁶/K
  type: string;
  notes: string;
}

const materials: Record<string, Material> = {
  "Ge": {
    name: "Germanium (Ge)",
    B1: 4.009489, B2: 0.3922679, B3: 4.213251,
    C1: 0.1383964, C2: 0.2918464, C3: 2.507735,
    lambdaMin: 1800, lambdaMax: 23000,
    absorption: 0.03, dn_dT: 396,
    type: "Semiconductor",
    notes: "Standard IR material, high dn/dT"
  },
  "Si": {
    name: "Silicon (Si)",
    B1: 3.422745, B2: 0.0972906, B3: 1.053119,
    C1: 0.1042907, C2: 0.0071907, C3: 1.020824,
    lambdaMin: 1100, lambdaMax: 7000,
    absorption: 0.05, dn_dT: 160,
    type: "Semiconductor",
    notes: "Lower dn/dT than Ge, cheaper"
  },
  "ZnSe": {
    name: "Zinc Selenide (ZnSe)",
    B1: 4.458137, B2: 0.4697145, B3: 2.895563,
    C1: 0.2008599, C2: 0.3943669, C3: 2.302026,
    lambdaMin: 500, lambdaMax: 20000,
    absorption: 0.001, dn_dT: 61,
    type: "II-VI",
    notes: "Low absorption, CO₂ laser optics"
  },
  "ZnS": {
    name: "Zinc Sulfide (ZnS)",
    B1: 4.582155, B2: 0.474380, B3: 2.724693,
    C1: 0.2280887, C2: 0.3766896, C3: 2.032671,
    lambdaMin: 400, lambdaMax: 14000,
    absorption: 0.01, dn_dT: 40,
    type: "II-VI",
    notes: "Cleartran grade visible-IR"
  },
  "Chalcogenide": {
    name: "Chalcogenide (As₂S₃)",
    B1: 1.898367, B2: 1.066835, B3: 0.946696,
    C1: 0.0666, C2: 0.2500, C3: 0.8800,
    lambdaMin: 600, lambdaMax: 8000,
    absorption: 0.02, dn_dT: 86,
    type: "IR Glass",
    notes: "Moldable IR optics"
  },
  "GaAs": {
    name: "Gallium Arsenide (GaAs)",
    B1: 4.372514, B2: 5.466742, B3: 0.0242996,
    C1: 0.4431307, C2: 0.8746453, C3: 0.0000001,
    lambdaMin: 900, lambdaMax: 17000,
    absorption: 0.01, dn_dT: 207,
    type: "Semiconductor",
    notes: "Fiber-coupled IR windows"
  },
  "CaF2": {
    name: "Calcium Fluoride (CaF₂)",
    B1: 0.5675888, B2: 0.4710914, B3: 3.8484723,
    C1: 0.00252643, C2: 0.01007833, C3: 1200.556,
    lambdaMin: 130, lambdaMax: 9000,
    absorption: 0.001, dn_dT: -10.8,
    type: "Crystal",
    notes: "Low dispersion, DUV to MWIR"
  },
  "BaF2": {
    name: "Barium Fluoride (BaF₂)",
    B1: 0.33973, B2: 0.81070, B3: 0.19652,
    C1: 0.0000001, C2: 0.000965, C3: 0.0666,
    lambdaMin: 130, lambdaMax: 14500,
    absorption: 0.002, dn_dT: -15.3,
    type: "Crystal",
    notes: "Far-IR windows, hygroscopic"
  },
};

function sellmeier(m: Material, lamUm: number): number {
  const l2 = lamUm * lamUm;
  return Math.sqrt(1 + m.B1 * l2 / (l2 - m.C1) + m.B2 * l2 / (l2 - m.C2) + m.B3 * l2 / (l2 - m.C3));
}

const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export default function InfraredMaterialsPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 10600);
  const [selected, setSelected] = useState("ZnSe");

  const m = materials[selected];
  const n = useMemo(() => sellmeier(m, wavelength / 1000), [m, wavelength]);
  const inRange = wavelength >= m.lambdaMin && wavelength <= m.lambdaMax;

  const chartData = useMemo(() => {
    const ws: number[] = [];
    for (let w = 500; w <= 25000; w += 50) ws.push(w);
    const entries = Object.entries(materials);
    return entries.map(([key, mat], i) => ({
      x: ws,
      y: ws.map(w => w >= mat.lambdaMin && w <= mat.lambdaMax ? sellmeier(mat, w / 1000) : null),
      type: "scatter" as const,
      mode: "lines" as const,
      name: mat.name,
      connectgaps: false,
      line: { color: colors[i % colors.length], width: key === selected ? 3 : 1.5 },
    }));
  }, [selected]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Infrared Materials" description="Ge, Si, ZnSe, chalcogenides — refractive index and properties for IR optics">
            
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
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={500} max={30000} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n(λ)</p>
          <p className={`text-2xl font-bold mt-1 ${inRange ? "text-blue-400" : "text-red-400"}`}>{n.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Range</p>
          <p className="text-lg font-bold text-green-400 mt-1">{m.lambdaMin/1000}–{m.lambdaMax/1000} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">dn/dT</p>
          <p className="text-lg font-bold text-amber-400 mt-1">{m.dn_dT} ×10⁻⁶/K</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">α (typical)</p>
          <p className="text-lg font-bold text-purple-400 mt-1">{m.absorption} cm⁻¹</p>
        </div>
      </div>

      <div className={`mb-8 p-4 rounded-lg ${inRange ? "bg-green-900/20 border border-green-800" : "bg-red-900/20 border border-red-800"}`}>
        <p className={inRange ? "text-green-400" : "text-red-400"}>
          {inRange ? `✓ ${wavelength} nm = ${(wavelength/1000).toFixed(2)} µm is within ${m.name} transmission range` 
                   : `✗ ${wavelength} nm = ${(wavelength/1000).toFixed(2)} µm is outside ${m.name} transmission range (${m.lambdaMin/1000}–${m.lambdaMax/1000} µm)`}
        </p>
              </div>

      <ChartPanel data={chartData}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Refractive Index n", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 50, l: 60 },
          legend: { orientation: "h", y: -0.2, font: { size: 9 } },
          shapes: [{ type: "line", x0: wavelength, x1: wavelength, y0: 1.3, y1: 4.5, line: { color: "#ffffff", width: 1, dash: "dashdot" } }],
        }}
       
       
      />
    </CalculatorShell>
  );
}
