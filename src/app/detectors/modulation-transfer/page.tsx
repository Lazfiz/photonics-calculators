"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ModulationTransferPage() {
  const [pixelPitch, setPixelPitch] = useState(5.4); // μm
  const [diffusionLength, setDiffusionLength] = useState(1.5); // μm
  const [fillFactor, setFillFactor] = useState(0.95);
  const [opticalBlur, setOpticalBlur] = useState(0); // μm Gaussian sigma

  const chartData = useMemo(() => {
    const nyquist = 1000 / (2 * pixelPitch); // cycles/mm
    const maxFreq = nyquist * 2;
    const freq = Array.from({ length: 300 }, (_, i) => (i / 300) * maxFreq);

    // Pixel aperture MTF (sinc function for square pixel)
    const mtfPixel = freq.map(f => {
      const fn = f / nyquist;
      if (fn >= 1) return 0;
      return Math.abs(Math.sin(Math.PI * fn) / (Math.PI * fn));
    });

    // Diffusion MTF
    const mtfDiffusion = freq.map(f => {
      const k = 2 * Math.PI * f / 1000; // cycles/mm to rad/μm
      return 1 / (1 + Math.pow(k * diffusionLength, 2));
    });

    // Optical blur MTF
    const mtfOptical = freq.map(f => {
      const k = 2 * Math.PI * f / 1000;
      return Math.exp(-0.5 * Math.pow(k * opticalBlur, 2));
    });

    // Fill factor MTF (simplified)
    const mtfFill = freq.map(f => {
      const fn = f / nyquist;
      return fillFactor + (1 - fillFactor) * Math.cos(Math.PI * fn / 2);
    });

    // Total MTF
    const mtfTotal = freq.map((f, i) => mtfPixel[i] * mtfDiffusion[i] * mtfOptical[i] * mtfFill[i]);

    return [
      { x: freq, y: mtfTotal, type: "scatter" as const, mode: "lines" as const, name: "Total MTF", line: { color: "#fbbf24", width: 2.5 } },
      { x: freq, y: mtfPixel, type: "scatter" as const, mode: "lines" as const, name: "Pixel aperture", line: { color: "#60a5fa", width: 1.5, dash: "dash" } },
      { x: freq, y: mtfDiffusion, type: "scatter" as const, mode: "lines" as const, name: "Diffusion", line: { color: "#34d399", width: 1.5, dash: "dot" } },
      { x: freq, y: mtfOptical, type: "scatter" as const, mode: "lines" as const, name: "Optical blur", line: { color: "#f87171", width: 1.5, dash: "dashdot" } },
    ];
  }, [pixelPitch, diffusionLength, fillFactor, opticalBlur]);

  const nyquist = 1000 / (2 * pixelPitch);
  const mtfAtNyquist = Math.abs(Math.sin(Math.PI * 0.5) / (Math.PI * 0.5)) *
    1 / (1 + Math.pow(Math.PI * diffusionLength / pixelPitch, 2)) *
    Math.exp(-0.5 * Math.pow(Math.PI * opticalBlur / pixelPitch, 2)) * fillFactor;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Modulation Transfer Function (MTF)</h1>
      <p className="text-gray-400 mb-8">MTF describes how well the detector preserves contrast at different spatial frequencies. MTF = product of individual component MTFs.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Pixel Pitch (μm)</span>
          <input type="number" value={pixelPitch} onChange={e => setPixelPitch(+e.target.value)} step={0.1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Diffusion Length (μm)</span>
          <input type="number" value={diffusionLength} onChange={e => setDiffusionLength(+e.target.value)} step={0.1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Fill Factor</span>
          <input type="number" value={fillFactor} onChange={e => setFillFactor(+e.target.value)} step={0.01} min={0.1} max={1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Optical Blur σ (μm)</span>
          <input type="number" value={opticalBlur} onChange={e => setOpticalBlur(+e.target.value)} step={0.1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Nyquist frequency = <span className="text-blue-400 font-mono">{nyquist.toFixed(1)} lp/mm</span></p>
        <p className="text-gray-300">MTF at Nyquist = <span className="text-blue-400 font-mono">{(mtfAtNyquist * 100).toFixed(1)}%</span></p>
        <p className="text-gray-300 text-sm mt-1">MTF<sub>pixel</sub> = |sinc(π·f/f<sub>N</sub>)| | MTF<sub>diff</sub> = 1/(1+(k·L<sub>d</sub>)²) | MTF<sub>opt</sub> = exp(−½(k·σ)²)</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Spatial Frequency (lp/mm)", gridcolor: "#374151", range: [0, nyquist * 2] },
        yaxis: { title: "MTF", range: [0, 1.05], gridcolor: "#374151" },
        shapes: [{ type: "line" as const, x0: nyquist, x1: nyquist, y0: 0, y1: 1, line: { color: "#6b7280", width: 1, dash: "dot" } }],
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
