"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function EmissivityControlPage() {
  const [nH, setNH] = useState(1.9);
  const [nL, setNL] = useState(1.1);
  const [nSub, setNSub] = useState(3.5);
  const [designWl, setDesignWl] = useState(10000);
  const [pairs, setPairs] = useState(5);
  const [lowESilver] = useState(0.02);

  // Kirchhoff's law: emissivity = absorptance at thermal equilibrium
  // For opaque surface: ε = 1 - R (normal incidence)
  // Low-E coating: thin Ag layer + dielectric stacks

  const tmm = useMemo(() => {
    const N = 500;
    // Mid-IR range (2.5 - 25 µm) — thermal radiation
    const wls = Array.from({ length: N }, (_, i) => 2500 + i * 22500 / N);

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

      // Low-E: dielectric stack on Ag surface (simplified TMM model)
      for (let p = 0; p < pairs; p++) { addLayer(nH, dH); addLayer(nL, dL); }

      const nInc = 1.0;
      const num = M[0][0]*nSub + M[0][1]*nSub*nInc - M[1][0] - M[1][1]*nInc;
      const den = M[0][0]*nSub + M[0][1]*nSub*nInc + M[1][0] + M[1][1]*nInc;
      const rStack = (num / den) ** 2;
      // Combine with Ag layer reflectance (simplified cascade)
      const rAg = 0.98; // Ag reflectance in mid-IR
      return rAg * rStack + (1 - rStack) * rAg * 0.5; // simplified
    });

    // Better model: just use stack R with substrate reflectance
    const Rsimple = wls.map(wl => {
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

      for (let p = 0; p < pairs; p++) { addLayer(nH, dH); addLayer(nL, dL); }

      const nInc = 1.0;
      const num = M[0][0]*nSub + M[0][1]*nSub*nInc - M[1][0] - M[1][1]*nInc;
      const den = M[0][0]*nSub + M[0][1]*nSub*nInc + M[1][0] + M[1][1]*nInc;
      return (num / den) ** 2;
    });

    return { wls, R: Rsimple };
  }, [nH, nL, nSub, designWl, pairs]);

  // Effective emissivity: weighted by Planck function at 300K
  const T = 300;
  const c1 = 3.7418e-16, c2 = 1.4388e-2; // W·m², m·K
  const emissivity = useMemo(() => {
    let num = 0, den = 0;
    tmm.wls.forEach((wlNm, i) => {
      const wlM = wlNm * 1e-9;
      const B = c1 / (Math.pow(wlM, 5) * (Math.exp(c2 / (wlM * T)) - 1));
      const e = 1 - tmm.R[i]; // Kirchhoff
      den += B;
      num += B * e;
    });
    return den > 0 ? num / den : 0;
  }, [tmm]);

  const E = tmm.R.map(r => 1 - r);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/thin-film" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Thin Film</Link>
      <h1 className="text-3xl font-bold mb-2">Emissivity Control</h1>
      <p className="text-gray-400 mb-8">Low-emissivity (Low-E) coating for thermal insulation — Kirchhoff's law: ε = 1 - R.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">n<sub>high</sub> (dielectric)</span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>low</sub> (dielectric)</span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Design λ (nm)</span>
          <input type="number" value={designWl} onChange={e => setDesignWl(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Pairs</span>
          <input type="number" value={pairs} onChange={e => setPairs(+e.target.value)} min={1} max={20} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Effective Emissivity (300 K)</p>
          <p className="text-3xl font-bold text-orange-400">{emissivity.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Avg Reflectance (mid-IR)</p>
          <p className="text-3xl font-bold text-blue-400">{(tmm.R.reduce((a, b) => a + b) / tmm.R.length * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
        <p className="text-gray-400 text-sm font-mono">ε = 1 - R — Kirchhoff&apos;s law (opaque surface)</p>
        <p className="text-gray-400 text-sm font-mono">ε<sub>eff</sub> = ∫ B(λ,T)·ε(λ)dλ / ∫ B(λ,T)dλ — Planck-weighted</p>
        <p className="text-gray-400 text-sm font-mono">B(λ,T) = 2hc²/λ⁵ · 1/(e^(hc/λkT)-1) — Planck function</p>
        <p className="text-gray-400 text-sm font-mono">U-value ∝ ε · σ · T⁴ — heat transfer relation</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={[
          { x: tmm.wls.map(w => w / 1000), y: tmm.R, type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#60a5fa" } },
          { x: tmm.wls.map(w => w / 1000), y: E, type: "scatter", mode: "lines", name: "Emissivity (ε)", line: { color: "#f87171" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (µm)", gridcolor: "#374151" },
          yaxis: { title: "R / ε", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
