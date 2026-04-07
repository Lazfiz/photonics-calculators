"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
export default function FRAPPage() {
  const [w0, setW0] = useState(1.0); // µm, bleach spot radius
  const [tauHalf, setTauHalf] = useState(2.0); // s, half-recovery time
  const [mobileFrac, setMobileFrac] = useState(0.7);
  const [fitModel, setFitModel] = useState<"single" | "uniform">("single");

  const results = useMemo(() => {
    const gamma = 3.7723; // for Gaussian bleach profile
    const tau = tauHalf / gamma;
    const D = w0 * w0 * 1e-12 / (4 * tau); // m²/s
    const D_um2s = D * 1e12; // µm²/s
    const recoveryCurve = (t: number) => mobileFrac * (1 - Math.exp(-2 * t / tauHalf) * (fitModel === "single" ? 1 : 1));
    // Soumpasis model: F(t)/F₀ = F_mobile * (1 - (τ_half/t) * exp(-2τ_half/t) * I₁(2τ_half/t))
    // Simplified exponential: F(t) = F_inf * (1 - exp(-t/τ_eff))
    const tauEff = tauHalf / 1.5; // rough mapping for display
    return { D, D_um2s, tau, tauEff };
  }, [w0, tauHalf, mobileFrac, fitModel]);

  const plotData = useMemo(() => {
    const times = [];
    const recovery = [];
    const tauEff = results.tauEff;
    for (let t = 0; t <= 20; t += 0.1) {
      times.push(t);
      // Soumpasis 1983 approximation
      const x = tauHalf / t;
      const val = x > 0 ? x * Math.exp(-x) : 0;
      const approx = mobileFrac * (1 - val);
      recovery.push(t === 0 ? 0 : Math.max(0, Math.min(1, (1 - mobileFrac) + approx)));
    }
    return [
      { x: times, y: recovery, name: "Recovery curve", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: [0, 20], y: [1 - mobileFrac, 1 - mobileFrac], name: "Pre-bleach", line: { color: "#4ade80", dash: "dash" }, type: "scatter", mode: "lines" },
      { x: [0, 20], y: [1, 1], name: "Full recovery", line: { color: "#f87171", dash: "dash" }, type: "scatter", mode: "lines" },
    ];
  }, [tauHalf, mobileFrac]);

  const diffPlot = useMemo(() => {
    const w0Range = [];
    const dRange = [];
    for (let w = 0.2; w <= 5; w += 0.1) {
      w0Range.push(w);
      const t = tauHalf / 3.7723;
      dRange.push(w * w * 1e-12 / (4 * t) * 1e12);
    }
    return [
      { x: w0Range, y: dRange, name: "D vs bleach radius", line: { color: "#c084fc" }, type: "scatter", mode: "lines" },
    ];
  }, [tauHalf]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="FRAP Diffusion Coefficient Calculator" description="Calculate diffusion coefficients from Fluorescence Recovery After Photobleaching data.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bleach spot radius w₀ (µm)</label>
            <input type="number" step={0.1} value={w0} onChange={e => setW0(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Half-recovery time τ₁/₂ (s)</label>
            <input type="number" step={0.1} value={tauHalf} onChange={e => setTauHalf(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Mobile fraction</label>
            <input type="number" step={0.01} min={0} max={1} value={mobileFrac} onChange={e => setMobileFrac(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fit model</label>
            <select value={fitModel} onChange={e => setFitModel(e.target.value as "single" | "uniform")} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="single">Soumpasis (Gaussian bleach)</option>
              <option value="uniform">Axelrod (uniform disk)</option>
            </select>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Diffusion coefficient D</span><span className="font-mono text-green-400">{results.D.toExponential(2)} m²/s</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">D</span><span className="font-mono text-blue-400">{results.D_um2s.toFixed(3)} µm²/s</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Characteristic time τ</span><span className="font-mono">{results.tau.toFixed(3)} s</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Immobile fraction</span><span className="font-mono text-red-400">{((1 - mobileFrac) * 100).toFixed(1)}%</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Soumpasis model: τ = τ₁/₂ / γ, γ ≈ 3.7723</p>
            <p>D = w₀² / (4τ)</p>
            <p>Typical: GFP in cytoplasm ~20 µm²/s, membrane proteins ~0.1-1 µm²/s</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">FRAP Recovery Curve</h2>
          <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Time (s)", gridcolor: "#333" }, yaxis: { title: "Normalized fluorescence", gridcolor: "#333", range: [0, 1.1] }, legend: { font: { size: 10 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">D vs Bleach Radius (at fixed τ₁/₂)</h2>
          <ChartPanel data={diffPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Bleach radius w₀ (µm)", gridcolor: "#333" }, yaxis: { title: "D (µm²/s)", gridcolor: "#333" }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
