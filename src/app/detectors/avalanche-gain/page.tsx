"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// APD Avalanche Gain & Excess Noise
// M = 1 / (1 - V_bias/V_br)^n  (empirical, n = 1-3 depending on material)
// Excess noise factor: F(M) = M^x (McIntyre), x = k_eff (ionization coefficient ratio)
// For Si: k ≈ 0.02-0.1, InGaAs: k ≈ 0.4-0.7
// F = k·M + (1-k)·(2 - 1/M) for McIntyre exact

export default function AvalancheGainPage() {
  const [breakdownVoltage, setBreakdownVoltage] = useState(150); // V
  const [biasVoltage, setBiasVoltage] = useState(140); // V
  const [ionizationRatio, setIonizationRatio] = useState(0.02); // k = α_e/α_h for Si
  const [material, setMaterial] = useState<"Si" | "InGaAs" | "Ge">("Si");

  // Material presets
  const materialParams: Record<string, { k: number; n: number; label: string }> = {
    Si: { k: 0.02, n: 3.5, label: "Silicon" },
    InGaAs: { k: 0.45, n: 2.5, label: "InGaAs" },
    Ge: { k: 0.6, n: 2, label: "Germanium" },
  };

  const handleMaterialChange = (m: "Si" | "InGaAs" | "Ge") => {
    setMaterial(m);
    setIonizationRatio(materialParams[m].k);
  };

  const n = materialParams[material].n;
  const k = ionizationRatio;

  // Gain: M = 1 / (1 - V/Vbr)^n
  const voltageRatio = biasVoltage / breakdownVoltage;
  const gain = voltageRatio < 1 ? 1 / Math.pow(1 - voltageRatio, n) : Infinity;

  // McIntyre excess noise: F = k·M + (1-k)·(2 - 1/M)
  const excessNoise = gain > 1 ? k * gain + (1 - k) * (2 - 1 / gain) : 1;

  // Noise equivalent gain for shot noise: sqrt(F) * M
  const noiseGain = gain > 1 ? Math.sqrt(excessNoise) * gain : 1;

  // Charts
  const gainVsVoltage = useMemo(() => {
    const vratios = Array.from({ length: 200 }, (_, i) => 0.5 + i * 0.498 / 200);
    const gains = vratios.map(r => 1 / Math.pow(1 - r, n));
    return [{
      x: vratios.map(r => r * breakdownVoltage), y: gains, type: "scatter", mode: "lines",
      name: "Gain M", line: { color: "#60a5fa", width: 2 },
    }];
  }, [breakdownVoltage, n]);

  const noiseVsGain = useMemo(() => {
    const M = Array.from({ length: 200 }, (_, i) => 1 + i * 199 / 200);
    const F = M.map(m => k * m + (1 - k) * (2 - 1 / m));
    const Fpow = M.map(m => Math.pow(m, k)); // simplified approximation
    return [
      { x: M, y: F, type: "scatter", mode: "lines", name: "McIntyre F(M)", line: { color: "#f87171", width: 2 } },
      { x: M, y: Fpow, type: "scatter", mode: "lines", name: "F = M^k (approx)", line: { color: "#fbbf24", width: 2, dash: "dash" } },
    ];
  }, [k]);

  const comparisonChart = useMemo(() => {
    const M = Array.from({ length: 200 }, (_, i) => 1 + i * 99 / 200);
    return [
      { x: M, y: M.map(m => 0.02 * m + 0.98 * (2 - 1/m)), type: "scatter", mode: "lines", name: "Si (k=0.02)", line: { color: "#60a5fa", width: 2 } },
      { x: M, y: M.map(m => 0.45 * m + 0.55 * (2 - 1/m)), type: "scatter", mode: "lines", name: "InGaAs (k=0.45)", line: { color: "#34d399", width: 2 } },
      { x: M, y: M.map(m => 0.6 * m + 0.4 * (2 - 1/m)), type: "scatter", mode: "lines", name: "Ge (k=0.6)", line: { color: "#f87171", width: 2 } },
    ];
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Avalanche Photodiode Gain</h1>
      <p className="text-gray-400 mb-8">APD multiplication gain, excess noise factor (McIntyre), and material comparison.</p>

      <div className="flex gap-2 mb-6">
        {(["Si", "InGaAs", "Ge"] as const).map(m => (
          <button key={m} onClick={() => handleMaterialChange(m)}
            className={`px-4 py-2 rounded text-sm font-medium ${material === m ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
            {materialParams[m].label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Breakdown Voltage (V)</span>
          <input type="number" value={breakdownVoltage} onChange={e => setBreakdownVoltage(+e.target.value)} min="10" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Bias Voltage (V)</span>
          <input type="number" value={biasVoltage} onChange={e => setBiasVoltage(+e.target.value)} min="1" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Ionization Coefficient Ratio (k)</span>
          <input type="number" value={ionizationRatio} onChange={e => setIonizationRatio(+e.target.value)} min="0.001" max="1" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Results</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><span className="text-gray-400 text-sm">Voltage Ratio (V/Vbr)</span><div className="text-xl font-mono">{voltageRatio.toFixed(4)}</div></div>
          <div><span className="text-gray-400 text-sm">Multiplication Gain M</span><div className="text-xl font-mono text-green-400">{gain > 1e6 ? "∞ (breakdown)" : gain.toFixed(1)}</div></div>
          <div><span className="text-gray-400 text-sm">Excess Noise Factor F</span><div className="text-xl font-mono">{excessNoise.toFixed(3)}</div></div>
          <div><span className="text-gray-400 text-sm">Noise Gain (√F·M)</span><div className="text-xl font-mono">{noiseGain > 1e6 ? "∞" : noiseGain.toFixed(1)}</div></div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Gain vs Bias Voltage</h3>
          <Plot data={gainVsVoltage} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Bias Voltage (V)", gridcolor: "#374151" },
            yaxis: { title: "Gain M", type: "log", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Excess Noise Factor vs Gain</h3>
          <Plot data={noiseVsGain} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Gain M", gridcolor: "#374151" },
            yaxis: { title: "Excess Noise F", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
        </div>
        <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Material Comparison: Excess Noise</h3>
          <Plot data={comparisonChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Gain M", gridcolor: "#374151" },
            yaxis: { title: "Excess Noise F", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
        </div>
      </div>

      <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-sm text-gray-400">
        <h3 className="text-white font-semibold mb-2">Formulas</h3>
        <p>M = 1 / (1 - V/V_br)^n</p>
        <p>F(M) = k·M + (1-k)·(2 - 1/M)  [McIntyre]</p>
        <p>k = α_ionization_ratio (lower is better — Si excels)</p>
      </div>
    </div>
  );
}
