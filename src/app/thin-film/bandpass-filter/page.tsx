"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function BandpassFilterPage() {
  const [nH, setNH] = useState(2.35);
  const [nL, setNL] = useState(1.45);
  const [nSub, setNSub] = useState(1.52);
  const [centerWl, setCenterWl] = useState(1550);
  const [cavityPairs, setCavityPairs] = useState(3);
  const [cavities, setCavities] = useState(2);
  const [spacerN, setSpacerN] = useState(2.1);

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => centerWl * 0.7 + i * centerWl * 0.6 / N);
    const R = wls.map(wl => {
      // Fabry-Perot bandpass: [mirror] [cavity] [mirror]
      // Mirror = cavityPairs of H/L quarter-wave
      // Cavity = half-wave spacer (n*spacer at centerWl => 2*quarter-wave thickness)
      const dH = centerWl / (4 * nH);
      const dL = centerWl / (4 * nL);
      const dSpacer = centerWl / (2 * spacerN); // half-wave

      let M = [[1, 0], [0, 1]] as [number, number][];

      const addLayer = (n: number, d: number) => {
        const delta = (2 * Math.PI * n * d) / wl;
        const c = Math.cos(delta), s = Math.sin(delta);
        const eta = n;
        const L: [number, number][] = [[c, -s / eta], [s * eta, c]];
        M = [
          [M[0][0]*L[0][0]+M[0][1]*L[1][0], M[0][0]*L[0][1]+M[0][1]*L[1][1]],
          [M[1][0]*L[0][0]+M[1][1]*L[1][0], M[1][0]*L[0][1]+M[1][1]*L[1][1]],
        ];
      };

      // First mirror (from substrate)
      for (let p = 0; p < cavityPairs; p++) {
        addLayer(nH, dH);
        addLayer(nL, dL);
      }
      // Cavities
      for (let c = 0; c < cavities; c++) {
        addLayer(spacerN, dSpacer);
        // Inter-cavity mirrors
        for (let p = 0; p < cavityPairs; p++) {
          addLayer(nH, dH);
          addLayer(nL, dL);
        }
      }

      const nInc = 1.0;
      const num = M[0][0]*nSub + M[0][1]*nSub*nInc - M[1][0] - M[1][1]*nInc;
      const den = M[0][0]*nSub + M[0][1]*nSub*nInc + M[1][0] + M[1][1]*nInc;
      return (num / den) ** 2;
    });
    return { wls, R };
  }, [nH, nL, nSub, centerWl, cavityPairs, cavities, spacerN]);

  const T = tmm.R.map(r => 1 - r);
  const peakT = Math.max(...T);
  const peakWl = tmm.wls[T.indexOf(peakT)];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/thin-film" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Thin Film</Link>
      <h1 className="text-3xl font-bold mb-2">Bandpass Filter</h1>
      <p className="text-gray-400 mb-8">Fabry-Perot bandpass — multi-cavity design with quarter-wave mirrors and half-wave spacers.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">n<sub>high</sub></span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>low</sub></span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Center λ (nm)</span>
          <input type="number" value={centerWl} onChange={e => setCenterWl(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Mirror Pairs</span>
          <input type="number" value={cavityPairs} onChange={e => setCavityPairs(+e.target.value)} min={1} max={15} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Cavities</span>
          <input type="number" value={cavities} onChange={e => setCavities(+e.target.value)} min={1} max={6} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Spacer n</span>
          <input type="number" value={spacerN} onChange={e => setSpacerN(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Peak Transmittance</p>
          <p className="text-3xl font-bold text-blue-400">{(peakT * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Peak Wavelength</p>
          <p className="text-3xl font-bold text-green-400">{peakWl.toFixed(1)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
        <p className="text-gray-400 text-sm font-mono">d<sub>mirror</sub> = λ₀/(4n) — quarter-wave layers</p>
        <p className="text-gray-400 text-sm font-mono">d<sub>cavity</sub> = λ₀/(2n<sub>spacer</sub>) — half-wave spacer</p>
        <p className="text-gray-400 text-sm font-mono">FWHM ∝ λ₀² / (2·n<sub>cavity</sub>·L·F) — finesse F = 4R/(1-R)²</p>
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
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
