"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function DielectricHRPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [designWl, setDesignWl] = useURLState("designWl", 1064);
  const [pairs, setPairs] = useURLState("pairs", 10);

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => designWl * 0.5 + i * designWl / N);
    const R = wls.map(wl => {
      const dH = designWl / (4 * nH);
      const dL = designWl / (4 * nL);

      let M = [[1, 0], [0, 1]] as [number, number][];
      for (let p = 0; p < pairs; p++) {
        for (const [n, d] of [[nH, dH], [nL, dL]] as [number, number][]) {
          const delta = (2 * Math.PI * n * d) / wl;
          const c = Math.cos(delta), s = Math.sin(delta);
          const L: [number, number][] = [[c, -s / n], [s * n, c]];
          M = [
            [M[0][0]*L[0][0]+M[0][1]*L[1][0], M[0][0]*L[0][1]+M[0][1]*L[1][1]],
            [M[1][0]*L[0][0]+M[1][1]*L[1][0], M[1][0]*L[0][1]+M[1][1]*L[1][1]],
          ];
        }
      }

      const nInc = 1.0;
      const num = M[0][0]*nSub + M[0][1]*nSub*nInc - M[1][0] - M[1][1]*nInc;
      const den = M[0][0]*nSub + M[0][1]*nSub*nInc + M[1][0] + M[1][1]*nInc;
      return (num / den) ** 2;
    });

    return { wls, R };
  }, [nH, nL, nSub, designWl, pairs]);

  const T = tmm.R.map(r => 1 - r);
  const peakR = Math.max(...tmm.R);
  // Stopband width (where R > 0.5)
  let stopLow = designWl, stopHigh = designWl;
  for (let i = 0; i < tmm.wls.length; i++) {
    if (tmm.R[i] > 0.5) { stopLow = tmm.wls[i]; break; }
  }
  for (let i = tmm.wls.length - 1; i >= 0; i--) {
    if (tmm.R[i] > 0.5) { stopHigh = tmm.wls[i]; break; }
  }
  const stopBand = stopHigh - stopLow;
  const centerIdx = tmm.R.indexOf(peakR);
  const gdd = tmm.wls.map((_, i) => {
    if (i < 2 || i >= tmm.R.length - 2) return 0;
    const dwl = tmm.wls[1] - tmm.wls[0];
    const d2phi = (Math.atan2(Math.sqrt(tmm.R[i+1]) - Math.sqrt(tmm.R[i-1]), 0) -
                   Math.atan2(Math.sqrt(tmm.R[i]) - Math.sqrt(tmm.R[i-2]), 0)) / (dwl * dwl);
    return d2phi;
  });

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Dielectric High Reflector" description="Quarter-wave dielectric stack HR mirror — stopband width, peak reflectance, and dispersion.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>high</sub></span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>low</sub></span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Design λ (nm)" value={designWl} onChange={setDesignWl} />
        <ValidatedNumberInput label="Pairs" value={pairs} onChange={setPairs} min={1} max={50} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Peak Reflectance</p>
          <p className="text-3xl font-bold text-blue-400">{(peakR * 100).toFixed(6)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Stopband Width</p>
          <p className="text-3xl font-bold text-green-400">{stopBand.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Total Layers</p>
          <p className="text-3xl font-bold text-purple-400">{pairs * 2}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
                              </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[
          { x: tmm.wls, y: tmm.R, type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#60a5fa" } },
          { x: tmm.wls, y: T, type: "scatter", mode: "lines", name: "Transmittance", line: { color: "#34d399" } },
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
