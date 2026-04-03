"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function UVBlockingPage() {
  const [nH, setNH] = useState(2.3);
  const [nL, setNL] = useState(1.38);
  const [nSub, setNSub] = useState(1.52);
  const [designWl, setDesignWl] = useState(350);
  const [pairs, setPairs] = useState(6);

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => 200 + i * 600 / N);
    const R = wls.map(wl => {
      const dH = designWl / (4 * nH);
      const dL = designWl / (4 * nL);
      let M = [[1, 0], [0, 1]] as [number, number][];

      const addLayer = (n: number, d: number) => {
        const delta = (2 * Math.PI * n * d) / wl;
        const c = Math.cos(delta), s = Math.sin(delta);
        const L: [number, number][] = [[c, -s / n], [s * n, c]];
        M = [
          [M[0][0]*L[0][0]+M[0][1]*L[1][0], M[0][0]*L[0][1]+M[0][1]*L[1][1]],
          [M[1][0]*L[0][0]+M[1][1]*L[1][0], M[1][0]*L[0][1]+M[1][1]*L[1][1]],
        ];
      };

      // Short-pass structure: L/H starting stack blocks UV, transmits visible
      for (let p = 0; p < pairs; p++) { addLayer(nL, dL); addLayer(nH, dH); }

      const nInc = 1.0;
      const num = M[0][0]*nSub + M[0][1]*nSub*nInc - M[1][0] - M[1][1]*nInc;
      const den = M[0][0]*nSub + M[0][1]*nSub*nInc + M[1][0] + M[1][1]*nInc;
      return (num / den) ** 2;
    });
    return { wls, R };
  }, [nH, nL, nSub, designWl, pairs]);

  const T = tmm.R.map(r => 1 - r);

  // UV blocking metrics
  const uvBand = tmm.wls.filter(w => w <= 400);
  const uvIdx = uvBand.map(w => tmm.wls.indexOf(w));
  const maxUvT = Math.max(...uvIdx.map(i => T[i]));
  const avgUvR = uvIdx.reduce((s, i) => s + tmm.R[i], 0) / uvIdx.length;

  // Visible T
  const visBand = tmm.wls.filter(w => w >= 400 && w <= 700);
  const visIdx = visBand.map(w => tmm.wls.indexOf(w));
  const avgVisT = visIdx.reduce((s, i) => s + T[i], 0) / visIdx.length;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/thin-film" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Thin Film</Link>
      <h1 className="text-3xl font-bold mb-2">UV Blocking Filter</h1>
      <p className="text-gray-400 mb-8">Quarter-wave stack designed to reflect UV (200–400 nm) while transmitting visible light.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">n<sub>high</sub></span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>low</sub></span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Design λ (nm)</span>
          <input type="number" value={designWl} onChange={e => setDesignWl(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Pairs</span>
          <input type="number" value={pairs} onChange={e => setPairs(+e.target.value)} min={1} max={20} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">UV Rejection (avg)</p>
          <p className="text-2xl font-bold text-red-400">{(avgUvR * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Max UV Leak</p>
          <p className="text-2xl font-bold text-yellow-400">{(maxUvT * 100).toFixed(3)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Visible T (avg)</p>
          <p className="text-2xl font-bold text-blue-400">{(avgVisT * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
        <p className="text-gray-400 text-sm font-mono">d<sub>QW</sub> = λ₀/(4n) — quarter-wave layers</p>
        <p className="text-gray-400 text-sm font-mono">Δλ/λ₀ = (4/π) arcsin((nH-nL)/(nH+nL)) — stopband width</p>
        <p className="text-gray-400 text-sm font-mono">R<sub>max</sub> ≈ [1-(nL/nH)^2N / (nSub/nL)^2]^2 — peak reflectance</p>
        <p className="text-gray-400 text-sm font-mono">OD = -log₁₀(T<sub>UV</sub>) — optical density</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={[
          { x: tmm.wls, y: tmm.R, type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#f87171" } },
          { x: tmm.wls, y: T, type: "scatter", mode: "lines", name: "Transmittance", line: { color: "#60a5fa" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          shapes: [
            { type: "rect", x0: 200, x1: 400, y0: 0, y1: 1.05, fillcolor: "#7c3aed", opacity: 0.05, line: { width: 0 } },
          ],
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
