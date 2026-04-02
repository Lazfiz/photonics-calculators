"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function AngleShiftPage() {
  const [nFilm, setNFilm] = useState(1.38);
  const [nSub, setNSub] = useState(1.52);
  const [designWl, setDesignWl] = useState(550);
  const [maxAngle, setMaxAngle] = useState(60);

  const chartData = useMemo(() => {
    const angles = Array.from({ length: 200 }, (_, i) => (i * maxAngle) / 200);
    const shiftTE = angles.map(theta => {
      const t = (theta * Math.PI) / 180;
      const cosT = Math.cos(t);
      const newWl = designWl * cosT;
      return newWl;
    });
    const shiftTM = angles.map(theta => {
      const t = (theta * Math.PI) / 180;
      const nRatio = nFilm / 1.0;
      const sinT = Math.sin(t);
      const cosThetaFilm = Math.sqrt(1 - (sinT / nRatio) ** 2);
      const newWl = designWl * cosThetaFilm;
      return newWl;
    });
    return [
      { x: angles, y: shiftTE, type: "scatter" as const, mode: "lines" as const, name: "TE (cos θ)", line: { color: "#60a5fa" } },
      { x: angles, y: shiftTM, type: "scatter" as const, mode: "lines" as const, name: "TM (refracted)", line: { color: "#f87171" } },
    ];
  }, [nFilm, nSub, designWl, maxAngle]);

  const shiftAt45 = designWl * Math.cos((45 * Math.PI) / 180);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/thin-film" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Thin Film</Link>
      <h1 className="text-3xl font-bold mb-2">Angle-Dependent Blue Shift</h1>
      <p className="text-gray-400 mb-8">How the effective design wavelength shifts with angle of incidence (blue shift).</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">n<sub>film</sub></span>
          <input type="number" value={nFilm} onChange={e => setNFilm(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Design λ (nm)</span>
          <input type="number" value={designWl} onChange={e => setDesignWl(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Max Angle (°)</span>
          <input type="number" value={maxAngle} onChange={e => setMaxAngle(+e.target.value)} min={1} max={89} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Effective λ at 45° = <span className="text-blue-400 font-mono">{shiftAt45.toFixed(1)} nm</span></p>
        <p className="text-gray-300">Blue shift at 45° = <span className="text-blue-400 font-mono">{(designWl - shiftAt45).toFixed(1)} nm</span></p>
      </div>

      <Plot data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Angle of Incidence (°)", gridcolor: "#374151" }, yaxis: { title: "Effective λ (nm)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
