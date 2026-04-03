"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function CrosstalkPage() {
  const [pixelPitch, setPixelPitch] = useState(5.4); // μm
  const [diffusionLength, setDiffusionLength] = useState(2.0); // μm
  const [absorptionDepth, setAbsorptionDepth] = useState(3.0); // μm
  const [depletionWidth, setDepletionWidth] = useState(2.0); // μm

  // 2D crosstalk map
  const chartData = useMemo(() => {
    const N = 50;
    const x: number[] = [], y: number[] = [], z: number[] = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const xi = (i - N/2) * pixelPitch / N;
        const yj = (j - N/2) * pixelPitch / N;
        const r = Math.sqrt(xi*xi + yj*yj);
        // Charge collection probability (exponential decay + diffusion)
        const collected = Math.exp(-r / (diffusionLength + 0.01)) *
          (1 - Math.exp(-depletionWidth / (absorptionDepth + 0.01)));
        x.push(xi);
        y.push(yj);
        z.push(collected * 100);
      }
    }
    return [{ x, y, z, type: "heatmap" as const, colorscale: "Blues", name: "Charge collection %" }];
  }, [pixelPitch, diffusionLength, absorptionDepth, depletionWidth]);

  // Crosstalk vs pixel pitch
  const crosstalkLine = useMemo(() => {
    const pitches = Array.from({ length: 100 }, (_, i) => 1 + i * 0.1); // 1-11 μm
    const ct = pitches.map(p => {
      // Crosstalk ~ exp(-pitch / (2 * diffusion_length))
      return 100 * Math.exp(-p / (2 * diffusionLength + 0.01));
    });
    return [{ x: pitches, y: ct, type: "scatter" as const, mode: "lines" as const, name: "Crosstalk (%)", line: { color: "#f87171", width: 2 } }];
  }, [diffusionLength]);

  // Calculated crosstalk for current pixel pitch
  const crosstalkToNeighbor = 100 * Math.exp(-pixelPitch / (2 * diffusionLength + 0.01));
  const chargeInDepletion = (1 - Math.exp(-depletionWidth / (absorptionDepth + 0.01))) * 100;
  const mtfAtNyquist = 1 / (1 + Math.pow(Math.PI * diffusionLength / pixelPitch, 2));

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Pixel Crosstalk</h1>
      <p className="text-gray-400 mb-8">Optical and electrical crosstalk between adjacent pixels due to charge diffusion and lateral carrier spreading.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Pixel Pitch (μm)</span>
          <input type="number" value={pixelPitch} onChange={e => setPixelPitch(+e.target.value)} step={0.1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Diffusion Length (μm)</span>
          <input type="number" value={diffusionLength} onChange={e => setDiffusionLength(+e.target.value)} step={0.1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Absorption Depth (μm)</span>
          <input type="number" value={absorptionDepth} onChange={e => setAbsorptionDepth(+e.target.value)} step={0.1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Depletion Width (μm)</span>
          <input type="number" value={depletionWidth} onChange={e => setDepletionWidth(+e.target.value)} step={0.1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Crosstalk to neighbor = <span className="text-blue-400 font-mono">{crosstalkToNeighbor.toFixed(2)}%</span></p>
        <p className="text-gray-300">Charge in depletion = <span className="text-blue-400 font-mono">{chargeInDepletion.toFixed(1)}%</span></p>
        <p className="text-gray-300">MTF at Nyquist = <span className="text-blue-400 font-mono">{mtfAtNyquist.toFixed(3)}</span></p>
        <p className="text-gray-300 text-sm mt-1">Crosstalk ∝ exp(−p / 2L<sub>diff</sub>) | MTF = 1 / (1 + (π·L<sub>diff</sub>/p)²)</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "x (μm)", gridcolor: "#374151" },
        yaxis: { title: "y (μm)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true, showlegend: false
      }} className="w-full mb-6" style={{ height: 350 }} />

      <Plot data={crosstalkLine} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Pixel Pitch (μm)", gridcolor: "#374151" },
        yaxis: { title: "Crosstalk (%)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 350 }} />
    </div>
  );
}
