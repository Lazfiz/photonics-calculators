"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function EtalonFSRPage() {
  const [n, setN] = useState(1.0); // refractive index of gap
  const [d, setD] = useState(10); // gap in μm
  const [theta, setTheta] = useState(0); // angle in degrees
  const [R, setR] = useState(0.8); // mirror reflectance

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 1500 + i * 0.002); // μm range for FSR calc
    // FSR = λ²/(2·n·d·cosθ) at wavelength λ
    const fsr = wls.map(wl => (wl * wl) / (2 * n * d * Math.cos((theta * Math.PI) / 180)));
    // Also show Airy function for reference
    const F = 4 * R / ((1 - R) * (1 - R));
    const T = wls.map(wl => {
      const delta = (4 * Math.PI * n * d * Math.cos((theta * Math.PI) / 180)) / wl;
      return 1 / (1 + F * Math.sin(delta / 2) ** 2);
    });
    return [
      { x: wls, y: fsr, type: "scatter" as const, mode: "lines" as const, name: "FSR (μm)", line: { color: "#f87171" }, yaxis: "y2" },
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "Transmission", line: { color: "#60a5fa" } },
    ];
  }, [n, d, theta, R]);

  const cosTheta = Math.cos((theta * Math.PI) / 180);
  const designWl = 1.55; // μm
  const fsrDesign = (designWl * designWl) / (2 * n * d * cosTheta);
  const finesse = Math.PI * Math.sqrt(R) / (1 - R);
  const FSR_nm = fsrDesign * 1000;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Etalon Free Spectral Range</h1>
      <p className="text-gray-400 mb-8">Fabry-Pérot etalon: FSR = λ²/(2nd cos θ). Transmission follows the Airy function.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">n (gap index)</span>
          <input type="number" value={n} onChange={e => setN(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Gap d (μm)</span>
          <input type="number" value={d} onChange={e => setD(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">θ (degrees)</span>
          <input type="number" value={theta} onChange={e => setTheta(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Mirror R</span>
          <input type="number" value={R} onChange={e => setR(+e.target.value)} step="0.01" min={0} max={0.999} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">FSR at 1550 nm = <span className="text-blue-400 font-mono">{FSR_nm.toFixed(2)} nm</span></p>
        <p className="text-gray-300">Finesse ℱ = <span className="text-blue-400 font-mono">{finesse.toFixed(1)}</span></p>
        <p className="text-gray-300">Finesse coefficient F = <span className="text-blue-400 font-mono">{(4 * R / ((1 - R) ** 2)).toFixed(1)}</span></p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (μm)", gridcolor: "#374151" },
        yaxis: { title: "Transmission", gridcolor: "#374151", range: [0, 1.1] },
        yaxis2: { title: "FSR (μm)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 60, r: 60 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
