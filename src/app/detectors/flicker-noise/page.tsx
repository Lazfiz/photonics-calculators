"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function FlickerNoisePage() {
  const [kf, setKf] = useState(1e-24); // flicker noise coefficient
  const [current, setCurrent] = useState(1e-6); // A
  const [alpha, setAlpha] = useState(1); // exponent
  const [fLow, setFLow] = useState(1); // Hz
  const [fHigh, setFHigh] = useState(1e6); // Hz

  const chartData = useMemo(() => {
    const freqs = Array.from({ length: 200 }, (_, i) => 1 * Math.pow(1e8, i / 200));
    const psd = freqs.map(f => kf * current ** alpha / f);
    return [
      { x: freqs, y: psd, type: "scatter" as const, mode: "lines" as const, name: "1/f PSD", line: { color: "#f87171" },
        yaxis: "y" },
      { x: freqs, y: freqs.map(f => 2e-24), type: "scatter" as const, mode: "lines" as const, name: "Thermal floor", line: { color: "#60a5fa", dash: "dash" },
        yaxis: "y" },
    ];
  }, [kf, current, alpha, fLow, fHigh]);

  const flickerNoiseRms = Math.sqrt(kf * current ** alpha * Math.log(fHigh / fLow));
  const cornerFreq = kf * current ** alpha / (4e-26); // where 1/f = thermal (approx)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">1/f Flicker Noise</h1>
      <p className="text-gray-400 mb-8">Flicker noise: S<sub>v</sub>(f) = K<sub>f</sub>·I<sup>α</sup>/f. Noise spectral density falls as 1/f. Corner frequency marks crossover to thermal noise.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">K<sub>f</sub> (A²·Hz)</span>
          <input type="number" value={kf} onChange={e => setKf(+e.target.value)} step="1e-25" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Current (A)</span>
          <input type="number" value={current} onChange={e => setCurrent(+e.target.value)} step="1e-7" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Exponent α</span>
          <input type="number" value={alpha} onChange={e => setAlpha(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">f<sub>low</sub> (Hz)</span>
          <input type="number" value={fLow} onChange={e => setFLow(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">f<sub>high</sub> (Hz)</span>
          <input type="number" value={fHigh} onChange={e => setFHigh(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">1/f noise (rms) = <span className="text-blue-400 font-mono">{flickerNoiseRms.toExponential(3)} A</span></p>
        <p className="text-gray-300">1/f corner freq ≈ <span className="text-blue-400 font-mono">{cornerFreq.toExponential(3)} Hz</span></p>
        <p className="text-gray-300">Decade count: <span className="text-blue-400 font-mono">{Math.log10(fHigh / fLow).toFixed(1)}</span></p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Frequency (Hz)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "PSD (A²/Hz)", type: "log", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 70, r: 20 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
