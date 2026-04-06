"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function WideBandpassPage() {
  const [nH, setNH] = useState(2.35);
  const [nL, setNL] = useState(1.45);
  const [nSub, setNSub] = useState(1.52);
  const [centerWl, setCenterWl] = useState(800);
  const [shortPassWl, setShortPassWl] = useState(500);
  const [longPassWl, setLongPassWl] = useState(1100);
  const [pairs, setPairs] = useState(4);

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => 300 + i * 800 / N);

    const computeStack = (cutWl: number, type: "sp" | "lp") => {
      return wls.map(wl => {
        const dH = cutWl / (4 * nH);
        const dL = cutWl / (4 * nL);
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

        if (type === "lp") {
          // Long-pass: H/L/H/L... starting with H
          for (let p = 0; p < pairs; p++) { addLayer(nH, dH); addLayer(nL, dL); }
        } else {
          // Short-pass: L/H/L/H... starting with L
          for (let p = 0; p < pairs; p++) { addLayer(nL, dL); addLayer(nH, dH); }
        }

        const nInc = 1.0;
        const num = M[0][0]*nSub + M[0][1]*nSub*nInc - M[1][0] - M[1][1]*nInc;
        const den = M[0][0]*nSub + M[0][1]*nSub*nInc + M[1][0] + M[1][1]*nInc;
        return (num / den) ** 2;
      });
    };

    const Rsp = computeStack(shortPassWl, "sp");
    const Rlp = computeStack(longPassWl, "lp");

    // Combined: T = T_sp * T_lp (cascade)
    const Tcombined = wls.map((_, i) => (1 - Rsp[i]) * (1 - Rlp[i]));
    const Rcombined = wls.map((_, i) => 1 - Tcombined[i]);

    return { wls, Rsp, Rlp, Tcombined, Rcombined };
  }, [nH, nL, nSub, shortPassWl, longPassWl, pairs]);

  const peakT = Math.max(...tmm.Tcombined);
  const peakWl = tmm.wls[tmm.Tcombined.indexOf(peakT)];

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Wide Bandpass Filter" description="Cascaded short-pass + long-pass quarter-wave stacks for broad transmission bands.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>high</sub></span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>low</sub></span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Short-pass λ (nm)" value={shortPassWl} onChange={setShortPassWl} />
        <ValidatedNumberInput label="Long-pass λ (nm)" value={longPassWl} onChange={setLongPassWl} />
        <ValidatedNumberInput label="Pairs per stack" value={pairs} onChange={setPairs} min={1} max={15} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Peak Transmittance</p>
          <p className="text-3xl font-bold text-blue-400">{(peakT * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Passband Width</p>
          <p className="text-3xl font-bold text-green-400">{(longPassWl - shortPassWl).toFixed(0)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
                              </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[
          { x: tmm.wls, y: tmm.Tcombined, type: "scatter", mode: "lines", name: "Combined T", line: { color: "#60a5fa", width: 2 } },
          { x: tmm.wls, y: tmm.Rcombined, type: "scatter", mode: "lines", name: "Combined R", line: { color: "#f87171", width: 1 } },
          { x: tmm.wls, y: tmm.Rsp.map(r => 1 - r), type: "scatter", mode: "lines", name: "SP stack T", line: { color: "#a78bfa", width: 1, dash: "dot" } },
          { x: tmm.wls, y: tmm.Rlp.map(r => 1 - r), type: "scatter", mode: "lines", name: "LP stack T", line: { color: "#34d399", width: 1, dash: "dot" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { orientation: "h", y: 1.12 },
        }} />
      </div>
    </CalculatorShell>
  );
}
