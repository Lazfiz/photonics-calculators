"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SingleARPage() {
  const [nSubstrate, setNSubstrate] = useState(1.52);
  const [nFilm, setNFilm] = useState(1.38);
  const [nIncident, setNIncident] = useState(1.0);
  const [designWavelength, setDesignWavelength] = useState(550);
  const [angle, setAngle] = useState(0);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 300 + i * 5);
    const R = wls.map(wl => {
      const theta = (angle * Math.PI) / 180;
      const cosTheta = Math.cos(theta);
      // Single layer AR: R = ((n0*n2 - n1²)/(n0*n2 + n1²))² at normal incidence
      // With angle and wavelength dependence (simplified):
      const d = designWavelength / (4 * nFilm); // quarter-wave thickness
      const delta = (2 * Math.PI * nFilm * d * cosTheta) / wl;
      const n0 = nIncident, n1 = nFilm, n2 = nSubstrate;
      const r01 = (n0 * cosTheta - n1 * cosTheta) / (n0 * cosTheta + n1 * cosTheta);
      const r12 = (n1 * cosTheta - n2 * cosTheta) / (n1 * cosTheta + n2 * cosTheta);
      // Simplified thin-film reflectance using real part of complex formula
      const cos2d = Math.cos(-2 * delta);
      const sin2d = Math.sin(-2 * delta);
      const rRe = (r01 + r12 * cos2d) / (1 + r01 * r12 * cos2d);
      const rIm = (r12 * sin2d) / (1 + r01 * r12 * cos2d);
      return rRe * rRe + rIm * rIm;
    });
    return [{ x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#60a5fa" } }];
  }, [nSubstrate, nFilm, nIncident, designWavelength, angle]);

  const optimalNFilm = Math.sqrt(nSubstrate * nIncident);
  const designThickness = designWavelength / (4 * nFilm);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/thin-film" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Thin Film</Link>
      <h1 className="text-3xl font-bold mb-2">Single Layer AR Coating</h1>
      <p className="text-gray-400 mb-8">Quarter-wave antireflection coating design and reflectance spectrum.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">n (incident medium)</span>
          <input type="number" value={nIncident} onChange={e => setNIncident(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n (film)</span>
          <input type="number" value={nFilm} onChange={e => setNFilm(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n (substrate)</span>
          <input type="number" value={nSubstrate} onChange={e => setNSubstrate(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Design Wavelength (nm)</span>
          <input type="number" value={designWavelength} onChange={e => setDesignWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Optimal n<sub>film</sub></p>
          <p className="text-xl font-bold text-green-400">{optimalNFilm.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Film Thickness</p>
          <p className="text-xl font-bold text-blue-400">{designThickness.toFixed(1)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Reflectance", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
