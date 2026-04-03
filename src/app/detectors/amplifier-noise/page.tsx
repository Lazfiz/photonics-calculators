"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function AmplifierNoisePage() {
  const [en, setEn] = useState(5); // e- rms input-referred
  const [gain, setGain] = useState(2); // e-/DN
  const [bandwidth, setBandwidth] = useState(1e6); // Hz

  const chartData = useMemo(() => {
    const enVals = Array.from({ length: 200 }, (_, i) => 0.5 + (i / 200) * 49.5);
    const noiseDn = enVals.map(e => e / gain);
    const snrMax = enVals.map(e => 1 / e);
    return [
      { x: enVals, y: noiseDn, type: "scatter" as const, mode: "lines" as const, name: "Noise (DN)", line: { color: "#f87171" }, yaxis: "y" },
      { x: enVals, y: snrMax, type: "scatter" as const, mode: "lines" as const, name: "Max SNR (1/en)", line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [en, gain, bandwidth]);

  const noiseDn = en / gain;
  const maxSnr = 1 / en;
  const noiseInV = en * 1.6e-19 * gain;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Amplifier Noise</h1>
      <p className="text-gray-400 mb-8">Amplifier noise: σ<sub>amp</sub> = e<sub>n</sub>. Input-referred noise sets the detection floor.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Input-referred noise e<sub>n</sub> (e⁻ rms)</span>
          <input type="number" value={en} onChange={e => setEn(+e.target.value)} step="0.5" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Conversion gain (e⁻/DN)</span>
          <input type="number" value={gain} onChange={e => setGain(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Bandwidth (Hz)</span>
          <input type="number" value={bandwidth} onChange={e => setBandwidth(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Noise in DN = <span className="text-blue-400 font-mono">{noiseDn.toFixed(2)}</span></p>
        <p className="text-gray-300">Max achievable SNR = <span className="text-blue-400 font-mono">{maxSnr.toExponential(3)}</span></p>
        <p className="text-gray-300">Min detectable signal ≈ <span className="text-blue-400 font-mono">{(en * 3).toFixed(1)} e⁻</span> (3σ)</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Input noise eₙ (e⁻ rms)", gridcolor: "#374151" },
        yaxis: { title: "Noise (DN)", gridcolor: "#374151" },
        yaxis2: { title: "Max SNR", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 60, r: 60 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
