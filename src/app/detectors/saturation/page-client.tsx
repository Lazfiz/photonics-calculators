"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function SaturationPage() {
  const [fullWellCapacity, setFullWellCapacity] = useURLState("fullWellCapacity", 20000); // electrons
  const [readNoise, setReadNoise] = useURLState("readNoise", 5); // electrons rms
  const [bitDepth, setBitDepth] = useURLState("bitDepth", 16);
  const [nonlinearityPercent, setNonlinearityPercent] = useURLState("nonlinearityPercent", 0.5); // % deviation at saturation

  const chartData = useMemo(() => {
    const input = Array.from({ length: 300 }, (_, i) => (i / 300) * fullWellCapacity * 1.2);
    // Ideal linear response
    const ideal = input.map(v => v);
    // Real response with saturation roll-off
    const satPoint = fullWellCapacity;
    // Model: output = v * FWC / (FWC + nl·v) where nl = nonlinearityPercent/100
    // At v=FWC: output = FWC/(1+nl) → error = -nl/(1+nl) ≈ -nl
    // Monotonically increasing, always sub-linear (derivative < 1 for v > 0)
    const nl = nonlinearityPercent / 100;
    const real = input.map(v => v * satPoint / (satPoint + nl * v));
    // Nonlinearity error (%)
    const error = input.map((v, i) => v > 0 ? ((real[i] - ideal[i]) / ideal[i]) * 100 : 0);
    return [
      { x: input, y: ideal, type: "scatter" as const, mode: "lines" as const, name: "Ideal (linear)", line: { color: "#374151", width: 1, dash: "dash" }, yaxis: "y" },
      { x: input, y: real, type: "scatter" as const, mode: "lines" as const, name: "Actual response", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
      { x: input, y: error, type: "scatter" as const, mode: "lines" as const, name: "Nonlinearity (%)", line: { color: "#f87171", width: 2 }, yaxis: "y2" },
    ];
  }, [fullWellCapacity, readNoise, bitDepth, nonlinearityPercent]);

  const dynamicRange = 20 * Math.log10(fullWellCapacity / readNoise);
  const snrSat = 20 * Math.log10(fullWellCapacity / Math.sqrt(fullWellCapacity + readNoise * readNoise));
  const dnMax = Math.pow(2, bitDepth) - 1;
  const gainE = fullWellCapacity / dnMax; // e-/DN

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Full Well Capacity (e⁻)" value={fullWellCapacity} onChange={setFullWellCapacity} />
        <ValidatedNumberInput label="Read Noise (e⁻ rms)" value={readNoise} onChange={setReadNoise} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Bit Depth</span>
          <select value={bitDepth} onChange={e => setBitDepth(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {[8, 10, 12, 14, 16].map(b => <option key={b} value={b}>{b}-bit</option>)}
          </select></label>
        <ValidatedNumberInput label="Nonlinearity at Saturation (%)" value={nonlinearityPercent} onChange={setNonlinearityPercent} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Dynamic range = <span className="text-blue-400 font-mono">{dynamicRange.toFixed(1)} dB</span></p>
        <p className="text-gray-300">SNR at FWC = <span className="text-blue-400 font-mono">{snrSat.toFixed(1)} dB</span> (shot + read noise)</p>
        <p className="text-gray-300">Max DN = <span className="text-blue-400 font-mono">{dnMax}</span> | Conversion gain = <span className="text-blue-400 font-mono">{gainE.toFixed(2)} e⁻/DN</span></p>
        <p className="text-gray-300 text-sm mt-1">DR = 20·log₁₀(FWC / σ<sub>read</sub>)</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Input signal (e⁻)", gridcolor: "#374151" },
        yaxis: { title: "Output signal (e⁻)", gridcolor: "#374151" },
        yaxis2: { title: "Nonlinearity (%)", gridcolor: "#374151", overlaying: "y", side: "right", titlefont: { color: "#f87171" }, tickfont: { color: "#f87171" } },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} />
    </div>
  );
}