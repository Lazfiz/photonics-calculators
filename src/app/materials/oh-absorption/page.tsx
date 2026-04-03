"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// OH absorption peaks in silica (wavelength in µm, absorption in dB/km)
const OH_PEAKS = [
  { wl: 0.945, alpha: 1.0, label: "2ν₁+ν₃" },
  { wl: 1.244, alpha: 0.5, label: "ν₁+ν₃" },
  { wl: 1.383, alpha: 50.0, label: "ν₁ (fundamental overtone)" },
  { wl: 2.20, alpha: 10.0, label: "Combination band" },
  { wl: 2.72, alpha: 1000.0, label: "ν₁ fundamental" },
];

const MATERIALS: Record<string, { name: string; ohConc: number; baseLoss: number }> = {
  StandardSMF: { name: "Standard SMF-28", ohConc: 0.1, baseLoss: 0.18 },
  LowOH: { name: "Low-OH Fiber", ohConc: 0.01, baseLoss: 0.16 },
  HighOH: { name: "High-OH Fiber", ohConc: 1.0, baseLoss: 0.25 },
  DrySilica: { name: "Dry Silica Bulk", ohConc: 0.005, baseLoss: 0.1 },
};

function ohAbsorption(wl_um: number, ohConc: number): number {
  let alpha = 0;
  for (const peak of OH_PEAKS) {
    const sigma = peak.wl * 0.02;
    alpha += peak.alpha * ohConc * Math.exp(-0.5 * Math.pow((wl_um - peak.wl) / sigma, 2));
  }
  return alpha;
}

export default function OHAbsorptionPage() {
  const [material, setMaterial] = useState<keyof typeof MATERIALS>("StandardSMF");
  const [ohConc, setOhConc] = useState(1.0);
  const [fiberLength, setFiberLength] = useState(10); // km

  const mat = MATERIALS[material];

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 0.7 + i * 0.008);
    const conc = ohConc * mat.ohConc;
    const ohLoss = wls.map(wl => ohAbsorption(wl, conc));
    const rayleigh = wls.map(wl => 0.8 * Math.pow(wl / 1.55, -4));
    const total = wls.map((wl, i) => mat.baseLoss + rayleigh[i] + ohLoss[i]);
    return [
      { x: wls, y: total, type: "scatter" as const, mode: "lines" as const, name: "Total Loss", line: { color: "#f87171", width: 2 } },
      { x: wls, y: ohLoss, type: "scatter" as const, mode: "lines" as const, name: "OH Absorption", line: { color: "#60a5fa", width: 1.5, dash: "dash" } },
      { x: wls, y: rayleigh, type: "scatter" as const, mode: "lines" as const, name: "Rayleigh", line: { color: "#34d399", width: 1.5, dash: "dot" } },
    ];
  }, [material, ohConc]);

  const conc = ohConc * mat.ohConc;
  const loss1383 = ohAbsorption(1.383, conc);
  const loss1550 = mat.baseLoss + 0.8 * Math.pow(1.55 / 1.55, -4) + ohAbsorption(1.55, conc);
  const totalLoss = loss1550 * fiberLength;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/materials" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Materials</Link>
      <h1 className="text-3xl font-bold mb-2">OH Absorption in Silica</h1>
      <p className="text-gray-400 mb-8">Hydroxyl (OH⁻) absorption peaks in silica fibers and bulk glass. The fundamental OH stretch at 2.72 µm and overtones at 1.38 µm and 0.94 µm dominate loss spectra.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Material</label>
          <select value={material} onChange={e => setMaterial(e.target.value as any)} className="w-full bg-gray-800 rounded px-3 py-2">
            {Object.entries(MATERIALS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">OH Concentration Multiplier</label>
          <input type="range" min={0.01} max={5} step={0.01} value={ohConc} onChange={e => setOhConc(+e.target.value)} className="w-full" />
          <div className="text-right text-xs text-gray-500">{ohConc.toFixed(2)}×</div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Fiber Length (km)</label>
          <input type="number" value={fiberLength} onChange={e => setFiberLength(+e.target.value)} className="w-full bg-gray-800 rounded px-3 py-2" />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><div className="text-xs text-gray-500">OH @ 1383 nm</div><div className="text-lg font-bold text-blue-400">{loss1383.toFixed(2)} dB/km</div></div>
        <div><div className="text-xs text-gray-500">Total @ 1550 nm</div><div className="text-lg font-bold text-green-400">{loss1550.toFixed(3)} dB/km</div></div>
        <div><div className="text-xs text-gray-500">Total Loss ({fiberLength} km)</div><div className="text-lg font-bold text-red-400">{totalLoss.toFixed(1)} dB</div></div>
        <div><div className="text-xs text-gray-500">Effective OH Conc.</div><div className="text-lg font-bold text-yellow-400">{conc.toFixed(3)} ppm</div></div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (µm)", gridcolor: "#374151" }, yaxis: { title: "Loss (dB/km)", gridcolor: "#374151", type: "log" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 30, b: 60, l: 60, r: 20 } }} style={{ width: "100%", height: 450 }} />
      </div>

      <div className="mt-8 bg-gray-900 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-3">OH Absorption Peaks</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 border-b border-gray-800"><th className="text-left py-2">Peak (µm)</th><th className="text-left py-2">Assignment</th><th className="text-right py-2">α (dB/km·ppm)</th></tr></thead>
            <tbody>
              {OH_PEAKS.map(p => <tr key={p.wl} className="border-b border-gray-800/50"><td className="py-2">{p.wl}</td><td className="py-2">{p.label}</td><td className="text-right py-2">{p.alpha}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-400">
          <p className="font-mono bg-gray-800 p-2 rounded">α<sub>OH</sub>(λ) = Σ A<sub>i</sub> · C<sub>OH</sub> · exp[−(λ − λ<sub>i</sub>)² / 2σ²]</p>
        </div>
      </div>
    </div>
  );
}
