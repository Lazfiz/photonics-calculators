"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ConfocalPinholePage() {
  const [wavelength, setWavelength] = useState(488); // nm
  const [na, setNA] = useState(1.4);
  const [magnification, setMagnification] = useState(60);

  const chartData = useMemo(() => {
    const ratios = Array.from({ length: 200 }, (_, i) => (i * 3) / 200);
    // Axial resolution vs pinhole size (in Airy units)
    const airyDiam = 1.22 * wavelength / na;
    const axialIdeal = 2 * wavelength * na / (na * na); // nm, ideal confocal
    const axial = ratios.map(r => {
      // Larger pinhole → worse axial resolution, approaching widefield
      const widefield = 2 * wavelength / (na * na);
      return axialIdeal + (widefield - axialIdeal) * (1 - Math.exp(-r * r));
    });
    // Signal throughput vs pinhole size
    const throughput = ratios.map(r => 1 - Math.exp(-r * r * 2));
    return [
      { x: ratios, y: axial, type: "scatter" as const, mode: "lines" as const, name: "Axial Resolution", line: { color: "#60a5fa" } },
      { x: ratios, y: throughput, type: "scatter" as const, mode: "lines" as const, name: "Throughput", line: { color: "#f87171" } },
    ];
  }, [wavelength, na, magnification]);

  const airyDiam = 1.22 * wavelength / na;
  const optimalPinhole = airyDiam / magnification;
  const axialRes = 2 * wavelength * na / (na * na);
  const lateralRes = 0.61 * wavelength / na;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Confocal Pinhole Size</h1>
      <p className="text-gray-400 mb-8">Optimal pinhole ≈ 1 Airy unit (d<sub>AU</sub>/M). Trade-off: resolution vs signal.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">NA</span>
          <input type="number" value={na} onChange={e => setNA(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Magnification</span>
          <input type="number" value={magnification} onChange={e => setMagnification(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Airy disk diameter = <span className="text-blue-400 font-mono">{airyDiam.toFixed(1)} nm</span></p>
        <p className="text-gray-300">Optimal pinhole = <span className="text-blue-400 font-mono">{optimalPinhole.toFixed(2)} nm</span></p>
        <p className="text-gray-300">Lateral resolution = <span className="text-blue-400 font-mono">{lateralRes.toFixed(1)} nm</span></p>
        <p className="text-gray-300">Axial resolution = <span className="text-blue-400 font-mono">{axialRes.toFixed(1)} nm</span></p>
      </div>

      <Plot data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Pinhole Size (Airy Units)", gridcolor: "#374151" }, yaxis: { title: "Normalized Value", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true, showlegend: true }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
