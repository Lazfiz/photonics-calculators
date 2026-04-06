"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function DualBandARPage() {
  const [nSub, setNSub] = useState(1.52);
  const [wl1, setWl1] = useState(450);
  const [wl2, setWl2] = useState(1064);
  const [n1, setN1] = useState(1.38);
  const [n2, setN2] = useState(2.1);
  const [n3, setN3] = useState(1.65);

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => 350 + i * 900 / N);

    // Optimize thicknesses for dual-band AR using quarter-wave at each wavelength
    // Layer 1 (top): quarter-wave at λ1, Layer 2: quarter-wave at λ2, Layer 3: quarter-wave at geometric mean
    const avgWl = Math.sqrt(wl1 * wl2);
    const d1 = wl1 / (4 * n1);
    const d2 = wl2 / (4 * n2);
    const d3 = avgWl / (4 * n3);

    const R = wls.map(wl => {
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

      // Stack from substrate: layer3, layer2, layer1 (top)
      addLayer(n3, d3);
      addLayer(n2, d2);
      addLayer(n1, d1);

      const nInc = 1.0;
      const num = M[0][0]*nSub + M[0][1]*nSub*nInc - M[1][0] - M[1][1]*nInc;
      const den = M[0][0]*nSub + M[0][1]*nSub*nInc + M[1][0] + M[1][1]*nInc;
      return (num / den) ** 2;
    });

    return { wls, R };
  }, [nSub, wl1, wl2, n1, n2, n3]);

  const T = tmm.R.map(r => 1 - r);
  const r1 = tmm.wls.findIndex(w => Math.abs(w - wl1) < 2);
  const r2 = tmm.wls.findIndex(w => Math.abs(w - wl2) < 2);
  const R1 = r1 >= 0 ? tmm.R[r1] : 0;
  const R2 = r2 >= 0 ? tmm.R[r2] : 0;

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Dual-Band AR Coating" description="Three-layer anti-reflection coating optimized for two distinct wavelength bands.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Band 1 λ (nm)</span>
          <input type="number" value={wl1} onChange={e => setWl1(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Band 2 λ (nm)</span>
          <input type="number" value={wl2} onChange={e => setWl2(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>1</sub> (top layer)</span>
          <input type="number" value={n1} onChange={e => setN1(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>2</sub> (middle layer)</span>
          <input type="number" value={n2} onChange={e => setN2(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>3</sub> (bottom layer)</span>
          <input type="number" value={n3} onChange={e => setN3(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">R at λ₁ = {wl1} nm</p>
          <p className="text-3xl font-bold text-blue-400">{(R1 * 100).toFixed(4)}%</p>
          <p className="text-sm text-gray-500 mt-1">d₁ = {(wl1 / (4 * n1)).toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">R at λ₂ = {wl2} nm</p>
          <p className="text-3xl font-bold text-green-400">{(R2 * 100).toFixed(4)}%</p>
          <p className="text-sm text-gray-500 mt-1">d₂ = {(wl2 / (4 * n2)).toFixed(1)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
                              </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[
          { x: tmm.wls, y: tmm.R, type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#f87171" } },
          { x: tmm.wls, y: T, type: "scatter", mode: "lines", name: "Transmittance", line: { color: "#60a5fa" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          shapes: [
            { type: "line", x0: wl1, x1: wl1, y0: 0, y1: 1, line: { color: "#fbbf24", width: 1, dash: "dash" } },
            { type: "line", x0: wl2, x1: wl2, y0: 0, y1: 1, line: { color: "#fbbf24", width: 1, dash: "dash" } },
          ],
        }} />
      </div>
    </CalculatorShell>
  );
}
