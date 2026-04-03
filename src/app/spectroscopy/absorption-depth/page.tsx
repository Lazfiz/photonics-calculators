"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function AbsorptionDepthPage() {
  const [absorptionCoeff, setAbsorptionCoeff] = useState(1000); // cm⁻¹
  const [wlMin, setWlMin] = useState(300);
  const [wlMax, setWlMax] = useState(1200);
  const [material, setMaterial] = useState("silicon");

  // α(λ) models for common materials (cm⁻¹) - approximate
  const materialModels: Record<string, (wl: number) => number> = {
    silicon: (wl) => {
      if (wl < 350) return 1e6;
      if (wl < 400) return 1e5;
      if (wl < 500) return 1e4;
      if (wl < 800) return 1e3 * Math.exp((wl - 500) * 0.005);
      if (wl < 1100) return 100 * Math.exp((wl - 800) * 0.007);
      return 10;
    },
    glass: (wl) => wl < 300 ? 100 : wl < 2500 ? 0.1 : 10,
    water: (wl) => {
      if (wl < 200) return 1e4;
      if (wl < 300) return 0.1;
      if (wl < 700) return 0.001;
      if (wl < 1000) return 0.5;
      return 50 * Math.exp((wl - 1000) * 0.005);
    },
    custom: () => absorptionCoeff,
  };

  const alphaFn = materialModels[material] || materialModels.silicon;
  const delta = 1 / absorptionCoeff; // absorption depth in cm
  const deltaMicron = delta * 1e4;

  const chartData = useMemo(() => {
    if (material === "custom") return [];
    const wls = Array.from({ length: 300 }, (_, i) => wlMin + i * (wlMax - wlMin) / 300);
    const alphas = wls.map(alphaFn);
    const depths = alphas.map(a => a > 0 ? 1e4 / a : 1e6);
    return [
      { x: wls, y: alphas, type: "scatter", mode: "lines", name: "α (cm⁻¹)",
        line: { color: "#f87171" }, yaxis: "y" },
      { x: wls, y: depths, type: "scatter", mode: "lines", name: "δ (μm)",
        line: { color: "#34d399" }, yaxis: "y2" },
    ];
  }, [material, wlMin, wlMax, absorptionCoeff]);

  const customData = material === "custom" ? [{
    x: [absorptionCoeff], y: [deltaMicron], type: "scatter", mode: "markers",
    name: "Custom point", marker: { color: "#fbbf24", size: 14 },
  }] : [];

  const customRange = material === "custom" ? [{
    x: [0.1, 1e6], y: [1e4 / 0.1, 1e4 / 1e6], type: "scatter", mode: "lines",
    name: "δ = 1/α", line: { color: "#6366f1", dash: "dash" },
  }] : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Absorption Depth Calculator</h1>
      <p className="text-gray-400 mb-8">Calculate absorption depth δ = 1/α and explore spectral dependence for common optical materials.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Material</span>
          <select value={material} onChange={e => setMaterial(e.target.value)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="silicon">Silicon</option>
            <option value="glass">Borosilicate Glass</option>
            <option value="water">Water</option>
            <option value="custom">Custom α</option>
          </select>
        </label>
        {material === "custom" && <label className="block">
          <span className="text-gray-300 text-sm">Absorption Coefficient α (cm⁻¹)</span>
          <input type="number" value={absorptionCoeff} onChange={e => setAbsorptionCoeff(+e.target.value)} min="0.001" step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>}
        {material !== "custom" && <>
          <label className="block">
            <span className="text-gray-300 text-sm">λ Min (nm)</span>
            <input type="number" value={wlMin} onChange={e => setWlMin(+e.target.value)} min="100"
              className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
          <label className="block">
            <span className="text-gray-300 text-sm">λ Max (nm)</span>
            <input type="number" value={wlMax} onChange={e => setWlMax(+e.target.value)} min="200"
              className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
        </>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Absorption Coefficient α</p>
          <p className="text-xl font-bold text-red-400">{absorptionCoeff.toExponential(2)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Absorption Depth δ</p>
          <p className="text-xl font-bold text-green-400">{deltaMicron.toFixed(3)} μm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">δ (mm)</p>
          <p className="text-xl font-bold text-blue-400">{(delta * 10).toFixed(5)} mm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>I(z) = I₀ · exp(−αz)</p>
        <p>δ = 1/α — depth at which intensity falls to 1/e ≈ 36.8%</p>
        <p>Beer-Lambert: A = α · d = log₁₀(I₀/I)</p>
      </div>

      <Plot data={[...chartData, ...customRange, ...customData]} layout={material !== "custom" ? {
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "α (cm⁻¹)", gridcolor: "#374151", type: "log" },
        yaxis2: { title: "δ (μm)", gridcolor: "#374151", type: "log", overlaying: "y", side: "right" },
        margin: { t: 30, r: 70, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
      } : {
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "α (cm⁻¹)", gridcolor: "#374151", type: "log" },
        yaxis: { title: "δ (μm)", gridcolor: "#374151", type: "log" },
        margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
      }} config={{ responsive: true, displayModeBar: false }} />
    </div>
  );
}
