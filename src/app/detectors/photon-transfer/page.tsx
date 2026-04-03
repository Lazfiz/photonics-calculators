"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function PhotonTransferPage() {
  const [gain, setGain] = useState(2); // e-/DN
  const [readNoise, setReadNoise] = useState(10); // e- rms
  const [wellCapacity, setWellCapacity] = useState(50000); // e-

  const chartData = useMemo(() => {
    const signals = Array.from({ length: 200 }, (_, i) => (i + 1) * (wellCapacity / 200));
    const noiseE = signals.map(s => Math.sqrt(s + readNoise ** 2));
    const noiseDn = noiseE.map(n => n / gain);
    const varianceDn = noiseDn.map(n => n ** 2);
    const signalDn = signals.map(s => s / gain);
    return [
      { x: signalDn, y: noiseDn, type: "scatter" as const, mode: "lines" as const, name: "Noise vs Signal", line: { color: "#f87171" } },
      { x: signalDn, y: varianceDn, type: "scatter" as const, mode: "lines" as const, name: "Variance vs Signal", line: { color: "#60a5fa" } },
    ];
  }, [gain, readNoise, wellCapacity]);

  const readNoiseDn = readNoise / gain;
  const fullWellDn = wellCapacity / gain;
  const dynamicRange = 20 * Math.log10(wellCapacity / readNoise); // dB

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Photon Transfer Curve</h1>
      <p className="text-gray-400 mb-8">Photon transfer: σ²<sub>DN</sub> = (1/K)·S<sub>DN</sub> + σ²<sub>read,DN</sub>. Slope of variance vs signal gives inverse gain (1/K).</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Conversion gain K (e⁻/DN)</span>
          <input type="number" value={gain} onChange={e => setGain(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Read noise (e⁻)</span>
          <input type="number" value={readNoise} onChange={e => setReadNoise(+e.target.value)} step="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Well capacity (e⁻)</span>
          <input type="number" value={wellCapacity} onChange={e => setWellCapacity(+e.target.value)} step="1000" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Read noise = <span className="text-blue-400 font-mono">{readNoiseDn.toFixed(2)} DN</span></p>
        <p className="text-gray-300">Full well = <span className="text-blue-400 font-mono">{fullWellDn.toFixed(0)} DN</span></p>
        <p className="text-gray-300">Dynamic range = <span className="text-blue-400 font-mono">{dynamicRange.toFixed(1)} dB</span> ({(wellCapacity / readNoise).toFixed(0)}:1)</p>
        <p className="text-gray-300">PTC slope (inverse gain) = <span className="text-blue-400 font-mono">{(1 / gain).toFixed(3)} DN</span></p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Signal (DN)", gridcolor: "#374151" },
        yaxis: { title: "Noise (DN) / Variance (DN²)", type: "log", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 70, r: 20 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
