"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ChirpedPulsePage() {
  const [pulseEnergy, setPulseEnergy] = useState(1); // mJ
  const [inputDuration, setInputDuration] = useState(30); // fs
  const [stretchRatio, setStretchRatio] = useState(1000);
  const [gratingLines, setGratingLines] = useState(1740); // lines/mm
  const [centralWavelength, setCentralWavelength] = useState(800);

  const stretchedDuration = inputDuration * stretchRatio; // ps
  const peakPowerIn = pulseEnergy * 1e-3 / (inputDuration * 1e-15) / 1e9; // GW
  const peakPowerStretched = pulseEnergy * 1e-3 / (stretchedDuration * 1e-12) / 1e9; // GW
  const recompressedDuration = inputDuration * 1.1; // ~10% overhead
  const peakPowerOut = pulseEnergy * 1e-3 / (recompressedDuration * 1e-15) / 1e9; // GW
  const bIntegralLimit = 1;
  const gratingSpacing = 1e-3 / gratingLines * 1e6; // µm

  const chartData = useMemo(() => {
    const N = 300;
    const tMax = stretchedDuration * 1.5;
    const ts = Array.from({ length: N }, (_, i) => (i / N - 0.5) * tMax);
    const stretched = ts.map(t => Math.exp(-2.77 * Math.pow(t / stretchedDuration, 2)));
    const recompressed = ts.map(t => Math.exp(-2.77 * Math.pow(t / recompressedDuration, 2)));
    const timeAxis = ts.map(t => t); // in ps
    const recompAxis = ts.map(t => t * 1000); // in fs for recompressed
    return [
      { x: timeAxis, y: stretched, type: "scatter" as const, mode: "lines" as const, name: "Stretched", line: { color: "#f87171", width: 2 } },
      { x: recompAxis, y: recompressed, type: "scatter" as const, mode: "lines" as const, name: "Recompressed", line: { color: "#60a5fa", width: 2 }, xaxis: "x2" },
    ];
  }, [stretchedDuration, recompressedDuration]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Chirped Pulse Amplification (CPA)</h1>
      <p className="text-gray-400 mb-8">Stretch, amplify, compress — bypassing damage thresholds.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Pulse Energy (mJ)</span>
          <input type="number" value={pulseEnergy} onChange={e => setPulseEnergy(+e.target.value)} step="any" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Input Pulse Duration (fs)</span>
          <input type="number" value={inputDuration} onChange={e => setInputDuration(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Stretch Ratio</span>
          <input type="number" value={stretchRatio} onChange={e => setStretchRatio(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Grating Lines (lines/mm)</span>
          <input type="number" value={gratingLines} onChange={e => setGratingLines(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stretched Duration</p>
          <p className="text-xl font-bold text-red-400">{stretchedDuration.toFixed(0)} ps</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Input Peak Power</p>
          <p className="text-xl font-bold text-orange-400">{peakPowerIn.toFixed(1)} GW</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stretched Peak Power</p>
          <p className="text-xl font-bold text-green-400">{peakPowerStretched.toFixed(2)} GW</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output Peak Power (recompressed)</p>
          <p className="text-xl font-bold text-blue-400">{peakPowerOut.toFixed(1)} GW</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2 font-mono">GDD = λ³/(2πc²) · d²n/dλ² · L &nbsp;|&nbsp; B-integral &lt; 1 rad &nbsp;|&nbsp; d<sub>grating</sub> = 1/N</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Stretched Time (ps)", gridcolor: "#374151" },
          xaxis2: { title: "Recompressed Time (fs)", gridcolor: "#374151", overlaying: "x", side: "top" },
          yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
          margin: { t: 60, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
