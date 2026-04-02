"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function MultilayerARPage() {
  const [n1, setN1] = useState(1.38);
  const [n2, setN2] = useState(2.1);
  const [nSub, setNSub] = useState(1.52);
  const [nInc, setNInc] = useState(1.0);
  const [designWl, setDesignWl] = useState(550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 500 / 300);
    // Two-layer AR: R = ((n1²nSub - n2²nInc)/(n1²nSub + n2²nInc))² at design wavelength
    // Wavelength-dependent using admittance method approximation
    const R = wls.map(wl => {
      const f = designWl / wl;
      const d1 = designWl / (4 * n1);
      const d2 = designWl / (4 * n2);
      const delta1 = (2 * Math.PI * n1 * d1 * f) / designWl;
      const delta2 = (2 * Math.PI * n2 * d2 * f) / designWl;
      // Simplified two-layer transfer: use effective admittance
      const eta2 = n2 * nSub / (n2 * Math.cos(2 * delta2) + nSub * Math.sin(2 * delta2));
      const eta1 = n1 * eta2 / (n1 * Math.cos(2 * delta1) + eta2 * Math.sin(2 * delta1));
      const r = (nInc - eta1) / (nInc + eta1);
      return r * r;
    });
    return [{ x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#60a5fa" } }];
  }, [n1, n2, nSub, nInc, designWl]);

  const optimalN2 = n1 * Math.sqrt(nSub);
  const minR = Math.pow((n1 * n1 * nSub - optimalN2 * optimalN2 * nInc) / (n1 * n1 * nSub + optimalN2 * optimalN2 * nInc), 2);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/thin-film" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Thin Film</Link>
      <h1 className="text-3xl font-bold mb-2">Two-Layer AR Coating</h1>
      <p className="text-gray-400 mb-8">Design a two-layer anti-reflection coating. Optimal condition: n₂ = n₁√n<sub>sub</sub>.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">n₁ (outer layer)</span>
          <input type="number" value={n1} onChange={e => setN1(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n₂ (inner layer)</span>
          <input type="number" value={n2} onChange={e => setN2(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>incident</sub></span>
          <input type="number" value={nInc} onChange={e => setNInc(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Design λ (nm)</span>
          <input type="number" value={designWl} onChange={e => setDesignWl(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Optimal n₂ = n₁√n<sub>sub</sub> = <span className="text-blue-400 font-mono">{optimalN2.toFixed(3)}</span></p>
        <p className="text-gray-300">Min R at design λ = <span className="text-blue-400 font-mono">{(minR * 100).toFixed(4)}%</span></p>
        <p className="text-gray-300">d₁ = λ/(4n₁) = <span className="text-blue-400 font-mono">{(designWl / (4 * n1)).toFixed(1)} nm</span></p>
        <p className="text-gray-300">d₂ = λ/(4n₂) = <span className="text-blue-400 font-mono">{(designWl / (4 * n2)).toFixed(1)} nm</span></p>
      </div>

      <Plot data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 0.5] }, margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
