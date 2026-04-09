"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

interface Polymer {
  name: string;
  abbreviation: string;
  n589: number;
  n633: number;
  n1300: number;
  n1550: number;
  dn_dt: number;
  Tg: number;
  attenuation_1300: number; // dB/km
  attenuation_1550: number;
  transparencyMin: number; // μm
  transparencyMax: number;
  stress_optic: number; // stress-optic coefficient ×10⁻¹² Pa⁻¹
  B1: number; B2: number; C1: number; C2: number;
}

const polymers: Record<string, Polymer> = {
  "PMMA": {
    name: "PMMA", abbreviation: "Poly(methyl methacrylate)",
    n589: 1.491, n633: 1.489, n1300: 1.483, n1550: 1.481,
    dn_dt: -105, Tg: 105,
    attenuation_1300: 60, attenuation_1550: 150,
    transparencyMin: 0.4, transparencyMax: 1.7,
    stress_optic: -4.5,
    B1: 1.4710, B2: 0.0080, C1: 0.0060, C2: 0.0180,
  },
  "Polycarbonate": {
    name: "Polycarbonate", abbreviation: "PC (Bisphenol-A)",
    n589: 1.586, n633: 1.585, n1300: 1.579, n1550: 1.577,
    dn_dt: -107, Tg: 150,
    attenuation_1300: 80, attenuation_1550: 200,
    transparencyMin: 0.4, transparencyMax: 1.6,
    stress_optic: -5.5,
    B1: 1.5650, B2: 0.0120, C1: 0.0070, C2: 0.0200,
  },
  "Polystyrene": {
    name: "Polystyrene", abbreviation: "PS",
    n589: 1.592, n633: 1.590, n1300: 1.584, n1550: 1.582,
    dn_dt: -120, Tg: 100,
    attenuation_1300: 100, attenuation_1550: 250,
    transparencyMin: 0.4, transparencyMax: 1.6,
    stress_optic: -6.0,
    B1: 1.5700, B2: 0.0140, C1: 0.0075, C2: 0.0220,
  },
  "CYTOP": {
    name: "CYTOP", abbreviation: "Amorphous Fluoropolymer",
    n589: 1.340, n633: 1.339, n1300: 1.336, n1550: 1.334,
    dn_dt: -100, Tg: 108,
    attenuation_1300: 10, attenuation_1550: 30,
    transparencyMin: 0.2, transparencyMax: 2.0,
    stress_optic: -3.0,
    B1: 1.3250, B2: 0.0050, C1: 0.0050, C2: 0.0150,
  },
  "SU-8": {
    name: "SU-8", abbreviation: "Epoxy-based photoresist",
    n589: 1.575, n633: 1.573, n1300: 1.568, n1550: 1.566,
    dn_dt: -90, Tg: 200,
    attenuation_1300: 50, attenuation_1550: 120,
    transparencyMin: 0.4, transparencyMax: 1.7,
    stress_optic: -4.0,
    B1: 1.5550, B2: 0.0100, C1: 0.0065, C2: 0.0190,
  },
  "Epoxy (NOA)": {
    name: "NOA61", abbreviation: "Norland Optical Adhesive 61",
    n589: 1.560, n633: 1.558, n1300: 1.553, n1550: 1.551,
    dn_dt: -95, Tg: 70,
    attenuation_1300: 40, attenuation_1550: 100,
    transparencyMin: 0.4, transparencyMax: 1.8,
    stress_optic: -4.2,
    B1: 1.5400, B2: 0.0090, C1: 0.0062, C2: 0.0185,
  },
  "PDMS": {
    name: "PDMS", abbreviation: "Polydimethylsiloxane",
    n589: 1.411, n633: 1.410, n1300: 1.406, n1550: 1.404,
    dn_dt: -80, Tg: -125,
    attenuation_1300: 30, attenuation_1550: 80,
    transparencyMin: 0.3, transparencyMax: 2.5,
    stress_optic: -2.5,
    B1: 1.3950, B2: 0.0060, C1: 0.0050, C2: 0.0160,
  },
  "OrmoComp": {
    name: "OrmoComp", abbreviation: "Hybrid ORMOSIL polymer",
    n589: 1.520, n633: 1.518, n1300: 1.513, n1550: 1.511,
    dn_dt: -85, Tg: 120,
    attenuation_1300: 15, attenuation_1550: 40,
    transparencyMin: 0.35, transparencyMax: 2.0,
    stress_optic: -3.5,
    B1: 1.5000, B2: 0.0085, C1: 0.0058, C2: 0.0175,
  },
};

function cauchy(p: Polymer, lambdaUm: number): number {
  return p.B1 + p.B2 / (lambdaUm * lambdaUm);
}

const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export default function PolymerOpticsPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 633);
  const [selected, setSelected] = useState("PMMA");

  const p = polymers[selected];
  const n = useMemo(() => cauchy(p, wavelength / 1000), [selected, wavelength]);

  const chartData = useMemo(() => {
    const ws: number[] = [];
    for (let w = 400; w <= 1700; w += 5) ws.push(w);
    return Object.entries(polymers).map(([key, poly], i) => ({
      x: ws, y: ws.map(w => cauchy(poly, w / 1000)),
      type: "scatter" as const, mode: "lines" as const, name: poly.name,
      line: { color: colors[i % colors.length], width: key === selected ? 3 : 1.5 },
    }));
  }, [selected]);

  const attenuationData = useMemo(() => {
    const entries = Object.entries(polymers);
    return [
      {
        x: entries.map(([, p]) => p.name),
        y: entries.map(([, p]) => p.attenuation_1300),
        type: "bar" as const, name: "1310 nm", marker: { color: "#3b82f6" },
      },
      {
        x: entries.map(([, p]) => p.name),
        y: entries.map(([, p]) => p.attenuation_1550),
        type: "bar" as const, name: "1550 nm", marker: { color: "#ef4444" },
      },
    ];
  }, []);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Polymer Optical Materials" description="Refractive index, dispersion, and loss data for optical polymers">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Polymer</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(polymers).map(([k, v]) => <option key={k} value={k}>{v.name} — {v.abbreviation}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={1700} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n at {wavelength} nm</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{n.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">dn/dT (×10⁻⁶/K)</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{p.dn_dt}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">T<sub>g</sub> (°C)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{p.Tg}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transparency</p>
          <p className="text-lg font-bold text-purple-400 mt-1">{p.transparencyMin}–{p.transparencyMax} μm</p>
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

      <h2 className="text-xl font-bold mt-8 mb-4">Optical Attenuation (dB/km)</h2>
      <ChartPanel data={attenuationData}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Polymer", gridcolor: "#374151" },
          yaxis: { title: "Attenuation (dB/km)", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 80, l: 60 },
          legend: { orientation: "h", y: -0.3 },
          barmode: "group",
        }}
       
       
      />
    </CalculatorShell>
  );
}
