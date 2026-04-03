"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SaturationPage() {
  const [fullWellCapacity, setFullWellCapacity] = useState(20000); // electrons
  const [readNoise, setReadNoise] = useState(5); // electrons rms
  const [bitDepth, setBitDepth] = useState(16);
  const [nonlinearityPercent, setNonlinearityPercent] = useState(0.5); // % deviation at saturation

  const chartData = useMemo(() => {
    const input = Array.from({ length: 300 }, (_, i) => (i / 300) * fullWellCapacity * 1.2);
    // Ideal linear response
    const ideal = input.map(v => v);
    // Real response with saturation roll-off
    const satPoint = fullWellCapacity;
    const real = input.map(v => {
      if (v <= satPoint * 0.9) return v;
      // Soft saturation using tanh-like rolloff
      const x = (v - satPoint * 0.9) / (satPoint * 0.1);
      return satPoint * 0.9 + satPoint * 0.1 * Math.tanh(x * 0.8) / Math.tanh(0.8);
    });
    // Nonlinearity error (%)
    const error = input.map((v, i) => v > 0 ? ((real[i] - ideal[i]) / ideal[i]) * 100 : 0);
    return [
      { x: input, y: ideal, type: "scatter" as const, mode: "lines" as const, name: "Ideal (linear)", line: { color: "#374151", width: 1, dash: "dash" }, yaxis: "y" },
      { x: input, y: real, type: "scatter" as const, mode: "lines" as const, name: "Actual response", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
      { x: input, y: error, type: "scatter" as const, mode: "lines" as const, name: "Nonlinearity (%)", line: { color: "#f87171", width: 2 }, yaxis: "y2" },
    ];
  }, [fullWellCapacity, nonlinearityPercent]);

  const dynamicRange = 20 * Math.log10(fullWellCapacity / readNoise);
  const snrSat = 20 * Math.log10(fullWellCapacity / readNoise);
  const dnMax = Math.pow(2, bitDepth) - 1;
  const gainE = fullWellCapacity / dnMax; // e-/DN

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Saturation & Linearity</h1>
      <p className="text-gray-400 mb-8">Detector output vs input charge, showing the linear regime, saturation onset, and full well capacity limits.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Full Well Capacity (e⁻)</span>
          <input type="number" value={fullWellCapacity} onChange={e => setFullWellCapacity(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Read Noise (e⁻ rms)</span>
          <input type="number" value={readNoise} onChange={e => setReadNoise(+e.target.value)} step={0.1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Bit Depth</span>
          <select value={bitDepth} onChange={e => setBitDepth(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            {[8, 10, 12, 14, 16].map(b => <option key={b} value={b}>{b}-bit</option>)}
          </select></label>
        <label className="block"><span className="text-gray-300 text-sm">Nonlinearity at Saturation (%)</span>
          <input type="number" value={nonlinearityPercent} onChange={e => setNonlinearityPercent(+e.target.value)} step={0.1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Dynamic range = <span className="text-blue-400 font-mono">{dynamicRange.toFixed(1)} dB</span></p>
        <p className="text-gray-300">Max DN = <span className="text-blue-400 font-mono">{dnMax}</span> | Conversion gain = <span className="text-blue-400 font-mono">{gainE.toFixed(2)} e⁻/DN</span></p>
        <p className="text-gray-300 text-sm mt-1">DR = 20·log₁₀(FWC / σ<sub>read</sub>)</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Input signal (e⁻)", gridcolor: "#374151" },
        yaxis: { title: "Output signal (e⁻)", gridcolor: "#374151" },
        yaxis2: { title: "Nonlinearity (%)", gridcolor: "#374151", overlaying: "y", side: "right", titlefont: { color: "#f87171" }, tickfont: { color: "#f87171" } },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
