"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Material {
  name: string;
  // Water absorption rate (μg/cm²/day at given RH)
  absorptionRate: number;
  // Max water content before degradation (%)
  maxWaterContent: number;
  // Refractive index change per % water
  dnPerWater: number;
  // Surface degradation threshold RH (%)
  degradationRH: number;
  // Solubility (mg/L) - for hygroscopic materials
  solubility: number;
  hygroscopic: boolean;
}

const materials: Record<string, Material> = {
  "Fused Silica": { name: "Fused Silica", absorptionRate: 0.001, maxWaterContent: 0.01, dnPerWater: 1e-5, degradationRH: 95, solubility: 0, hygroscopic: false },
  "BK7": { name: "BK7", absorptionRate: 0.002, maxWaterContent: 0.02, dnPerWater: 2e-5, degradationRH: 90, solubility: 0, hygroscopic: false },
  "CaF2": { name: "CaF₂", absorptionRate: 0.01, maxWaterContent: 0.05, dnPerWater: 5e-5, degradationRH: 85, solubility: 1.5, hygroscopic: false },
  "NaCl": { name: "NaCl", absorptionRate: 5.0, maxWaterContent: 0.5, dnPerWater: 1e-3, degradationRH: 40, solubility: 360000, hygroscopic: true },
  "KBr": { name: "KBr", absorptionRate: 8.0, maxWaterContent: 1.0, dnPerWater: 2e-3, degradationRH: 35, solubility: 530000, hygroscopic: true },
  "KRS-5": { name: "KRS-5 (TlBrI)", absorptionRate: 0.05, maxWaterContent: 0.1, dnPerWater: 1e-4, degradationRH: 70, solubility: 50, hygroscopic: false },
  "ZnSe": { name: "ZnSe", absorptionRate: 0.005, maxWaterContent: 0.03, dnPerWater: 8e-5, degradationRH: 90, solubility: 0.001, hygroscopic: false },
  "MgF2": { name: "MgF₂", absorptionRate: 0.005, maxWaterContent: 0.02, dnPerWater: 3e-5, degradationRH: 90, solubility: 0.013, hygroscopic: false },
  "LiF": { name: "LiF", absorptionRate: 2.0, maxWaterContent: 0.3, dnPerWater: 5e-4, degradationRH: 50, solubility: 2700, hygroscopic: true },
  "BaF2": { name: "BaF₂", absorptionRate: 0.02, maxWaterContent: 0.05, dnPerWater: 6e-5, degradationRH: 80, solubility: 1.6, hygroscopic: false },
};

function waterAbsorption(mat: Material, rh: number, days: number): number {
  // RH-dependent absorption: increases dramatically above degradationRH
  const rhFactor = rh > mat.degradationRH
    ? 1 + 10 * Math.pow((rh - mat.degradationRH) / (100 - mat.degradationRH), 2)
    : rh / mat.degradationRH;
  return mat.absorptionRate * rhFactor * days;
}

function dnFromHumidity(mat: Material, rh: number, days: number): number {
  const waterUg = waterAbsorption(mat, rh, days);
  // Approximate water content as fraction
  const waterFrac = waterUg / 1e4; // rough
  return mat.dnPerWater * waterFrac * 100;
}

function surfaceScattering(mat: Material, rh: number, days: number): number {
  // Approximate surface scatter loss (%)
  const water = waterAbsorption(mat, rh, days);
  if (rh < mat.degradationRH) return water * 0.01;
  return water * 0.05;
}

export default function HumidityEffectsPage() {
  const [selected, setSelected] = useState("Fused Silica");
  const [rh, setRh] = useState(60);
  const [exposureDays, setExposureDays] = useState(30);

  const mat = materials[selected];
  const water = useMemo(() => waterAbsorption(mat, rh, exposureDays), [mat, rh, exposureDays]);
  const dn = useMemo(() => dnFromHumidity(mat, rh, exposureDays), [mat, rh, exposureDays]);
  const scatter = useMemo(() => surfaceScattering(mat, rh, exposureDays), [mat, rh, exposureDays]);
  const safe = useMemo(() => rh < mat.degradationRH * 0.8, [rh, mat.degradationRH]);

  const chartData = useMemo(() => {
    const rhs = Array.from({ length: 50 }, (_, i) => 10 + i * 1.8);
    const mat = materials[selected];
    const days = [1, 30, 365];
    const colors = ["#22c55e", "#3b82f6", "#ef4444"];
    return days.map((d, i) => ({
      x: rhs,
      y: rhs.map(r => waterAbsorption(mat, r, d)),
      type: "scatter" as const, mode: "lines" as const,
      name: `${d}d`,
      line: { color: colors[i], width: 2 },
    }));
  }, [selected]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/materials" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Materials</Link>
      <h1 className="text-3xl font-bold mb-2">Humidity Effects on Optics</h1>
      <p className="text-gray-400 mb-4">Water absorption, refractive index changes, and surface degradation</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono">
        <p>H₂O uptake = rate · f(RH) · time &nbsp;|&nbsp; Δn = (dn/dw) · Δw &nbsp;|&nbsp; Scatter loss ∝ surface water</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Material</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(materials).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Relative Humidity (%)</label>
          <input type="range" min={10} max={99} value={rh} onChange={e => setRh(Number(e.target.value))}
            className="w-full" />
          <span className="text-blue-400 text-sm">{rh}%</span>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Exposure time (days)</label>
          <input type="number" value={exposureDays} onChange={e => setExposureDays(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={1} />
        </div>
        <div className="flex items-end">
          <div className={`px-3 py-2 rounded text-sm font-bold ${safe ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
            {mat.hygroscopic ? "⚠ Hygroscopic material" : safe ? "✓ Safe humidity range" : `⚠ Degradation above ${mat.degradationRH}% RH`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Water uptake</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{water.toFixed(3)} μg/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Δn (humidity)</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{dn.toExponential(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Surface scatter</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{scatter.toFixed(3)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Degradation RH</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{mat.degradationRH}%</p>
        </div>
      </div>

      <Plot
        data={chartData}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Relative Humidity (%)", gridcolor: "#374151" },
          yaxis: { title: "Water Absorption (μg/cm²)", gridcolor: "#374151", type: "log" },
          margin: { t: 20, r: 20, b: 50, l: 80 },
          legend: { orientation: "h", y: -0.15 },
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%", height: 500 }}
      />
    </div>
  );
}
