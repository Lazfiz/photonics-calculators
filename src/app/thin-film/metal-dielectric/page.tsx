"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function MetalDielectricPage() {
  const [nMetal, setNMetal] = useState(0.5);
  const [kMetal, setKMetal] = useState(3.0);
  const [nDielectric, setNDielectric] = useState(2.1);
  const [dDielectric, setDDielectric] = useState(50);
  const [dMetal, setDMetal] = useState(10);
  const [nSub, setNSub] = useState(1.52);
  const [designWl, setDesignWl] = useState(550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 2);
    const R = wls.map(wl => {
      // Simplified metal-dielectric bilayer: absorbance + interference
      // Metal complex refractive index: n_c = nMetal + i*kMetal
      // Fresnel reflection at each interface
      const nc = nMetal; // simplified
      const kc = kMetal;
      const r01 = (1 - nc) / (1 + nc);
      const absorption = Math.exp(-4 * Math.PI * kc * dMetal / wl);
      // Dielectric phase
      const delta = (4 * Math.PI * nDielectric * dDielectric) / wl;
      const r12 = (nDielectric - nc) / (nDielectric + nc);
      const r23 = (nDielectric - nSub) / (nDielectric + nSub);
      // Two-beam interference in dielectric layer with metal backing
      const re = r01 + (1 - r01 * r01) * r12 * Math.cos(delta) * absorption;
      const im = (1 - r01 * r01) * r12 * Math.sin(delta) * absorption;
      return Math.min(re * re + im * im, 1);
    });
    const T = wls.map(wl => {
      const absorption = Math.exp(-4 * Math.PI * kMetal * dMetal / wl);
      const delta = (4 * Math.PI * nDielectric * dDielectric) / wl;
      const t01 = 2 / (1 + nDielectric);
      const t12 = 2 * nDielectric / (nDielectric + nSub);
      const t = t01 * t12 * absorption * Math.abs(Math.cos(delta / 2));
      return Math.min(t * t, 1 - R[wls.indexOf(wl)]);
    });
    const A = wls.map((_, i) => Math.max(0, 1 - R[i] - T[i]));
    return [
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#f87171" } },
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "Transmittance", line: { color: "#60a5fa" } },
      { x: wls, y: A, type: "scatter" as const, mode: "lines" as const, name: "Absorptance", line: { color: "#fbbf24" } },
    ];
  }, [nMetal, kMetal, nDielectric, dDielectric, dMetal, nSub, designWl]);

  const absorption550 = Math.exp(-4 * Math.PI * kMetal * dMetal / 550);
  const nEff = nMetal * nMetal - kMetal * kMetal;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/thin-film" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Thin Film</Link>
      <h1 className="text-3xl font-bold mb-2">Metal-Dielectric Coatings</h1>
      <p className="text-gray-400 mb-8">Metal-dielectric coating design. Explore how a dielectric overcoat modifies the reflectance, transmittance, and absorptance of a thin metal layer.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">n (metal, real part)</span>
          <input type="number" value={nMetal} onChange={e => setNMetal(+e.target.value)} step="0.05" min="0" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">k (metal, extinction coeff)</span>
          <input type="number" value={kMetal} onChange={e => setKMetal(+e.target.value)} step="0.1" min="0" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n (dielectric)</span>
          <input type="number" value={nDielectric} onChange={e => setNDielectric(+e.target.value)} step="0.01" min="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Dielectric Thickness (nm)</span>
          <input type="number" value={dDielectric} onChange={e => setDDielectric(+e.target.value)} step="5" min="0" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Metal Thickness (nm)</span>
          <input type="number" value={dMetal} onChange={e => setDMetal(+e.target.value)} step="1" min="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n (substrate)</span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" min="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Metal Absorption @ 550nm</p>
          <p className="text-xl font-bold text-yellow-400">{(absorption550 * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n²−k²</p>
          <p className="text-xl font-bold text-green-400">{nEff.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Skin depth ≈ λ/(4πk)</p>
          <p className="text-xl font-bold text-red-400">{(550 / (4 * Math.PI * kMetal)).toFixed(1)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">Metal-Dielectric Theory</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>Complex index: ñ = n + ik</p>
          <p>Absorption: exp(−4πkd/λ)</p>
          <p>Skin depth: δ = λ/(4πk)</p>
          <p>R + T + A = 1 (energy conservation)</p>
          <p>Dielectric overcoat tunes R via interference</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R / T / A", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.02, y: 0.98 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
