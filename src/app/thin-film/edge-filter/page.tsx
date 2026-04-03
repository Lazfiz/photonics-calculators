"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function EdgeFilterPage() {
  const [nH, setNH] = useState(2.35);
  const [nL, setNL] = useState(1.45);
  const [nSub, setNSub] = useState(1.52);
  const [designWl, setDesignWl] = useState(1550);
  const [pairs, setPairs] = useState(7);
  const [type, setType] = useState<"long" | "short">("long");

  const tmm = useMemo(() => {
    const N = 400;
    const wls = Array.from({ length: N }, (_, i) => designWl * 0.6 + i * designWl * 0.8 / N);
    const R = wls.map(wl => {
      const dH = designWl / (4 * nH);
      const dL = designWl / (4 * nL);
      let M = [[1, 0], [0, 1]] as [number, number][];
      const layerNs = type === "long"
        ? [nH, nL] // starts from substrate side
        : [nL, nH];
      for (let p = 0; p < pairs; p++) {
        for (const n of layerNs) {
          const d = n === nH ? dH : dL;
          const delta = (2 * Math.PI * n * d) / wl;
          const c = Math.cos(delta), s = Math.sin(delta);
          const eta = n;
          const newM: [number, number][] = [
            [c, -s / eta],
            [s * eta, c],
          ];
          M = [[M[0][0]*newM[0][0]+M[0][1]*newM[1][0], M[0][0]*newM[0][1]+M[0][1]*newM[1][1]],
               [M[1][0]*newM[0][0]+M[1][1]*newM[1][0], M[1][0]*newM[0][1]+M[1][1]*newM[1][1]]];
        }
      }
      const nInc = 1.0;
      const num = M[0][0]*nSub + M[0][1]*nSub*nInc - M[1][0] - M[1][1]*nInc;
      const den = M[0][0]*nSub + M[0][1]*nSub*nInc + M[1][0] + M[1][1]*nInc;
      return (num / den) ** 2;
    });
    return { wls, R };
  }, [nH, nL, nSub, designWl, pairs, type]);

  const T = tmm.R.map(r => 1 - r);
  const cutoffIdx = tmm.R.findIndex(r => r > 0.5);
  const cutoffWl = cutoffIdx >= 0 ? tmm.wls[cutoffIdx] : null;

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Edge Filter Design" description="{type === &quot;long&quot; ? &quot;Long-pass&quot; : &quot;Short-pass&quot;} edge filter — quarter-wave stack transition region and cut-on/cut-off wavelength.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>high</sub></span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>low</sub></span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Design Wavelength (nm)</span>
          <input type="number" value={designWl} onChange={e => setDesignWl(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Pairs</span>
          <input type="number" value={pairs} onChange={e => setPairs(+e.target.value)} min={1} max={30} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Type</span>
          <select value={type} onChange={e => setType(e.target.value as "long" | "short")} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="long">Long-pass (reflect short λ)</option>
            <option value="short">Short-pass (reflect long λ)</option>
          </select></label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <p className="text-sm text-gray-400">50% Cutoff Wavelength</p>
        <p className="text-3xl font-bold text-blue-400">{cutoffWl ? cutoffWl.toFixed(1) : "—"} nm</p>
        <p className="text-sm text-gray-500 mt-1">λ₀ = {designWl} nm · {pairs} pairs · Δn = {(nH - nL).toFixed(2)}</p>
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
        }} />
      </div>
    </CalculatorShell>
  );
}
