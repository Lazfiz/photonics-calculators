"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function NarrowBandpassPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [centerWl, setCenterWl] = useURLState("centerWl", 1550);
  const [mirrorPairs, setMirrorPairs] = useURLState("mirrorPairs", 6);
  const [cavities, setCavities] = useURLState("cavities", 3);
  const [spacerN, setSpacerN] = useURLState("spacerN", 2.1);

  const tmm = useMemo(() => {
    const N = 800;
    const wls = Array.from({ length: N }, (_, i) => centerWl * 0.9 + i * centerWl * 0.2 / N);
    const R = wls.map(wl => {
      const dH = centerWl / (4 * nH);
      const dL = centerWl / (4 * nL);
      const dSpacer = centerWl / (2 * spacerN);

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

      // First mirror
      for (let p = 0; p < mirrorPairs; p++) { addLayer(nH, dH); addLayer(nL, dL); }
      // Cavities + inter-cavity mirrors
      for (let c = 0; c < cavities; c++) {
        addLayer(spacerN, dSpacer);
        for (let p = 0; p < mirrorPairs; p++) { addLayer(nH, dH); addLayer(nL, dL); }
      }

      const nInc = 1.0;
      const num = M[0][0]*nSub + M[0][1]*nSub*nInc - M[1][0] - M[1][1]*nInc;
      const den = M[0][0]*nSub + M[0][1]*nSub*nInc + M[1][0] + M[1][1]*nInc;
      return (num / den) ** 2;
    });
    return { wls, R };
  }, [nH, nL, nSub, centerWl, mirrorPairs, cavities, spacerN]);

  const T = tmm.R.map(r => 1 - r);
  const peakT = Math.max(...T);
  const peakWl = tmm.wls[T.indexOf(peakT)];

  // FWHM calculation
  const halfMax = peakT / 2;
  let fwhmLeft = peakWl, fwhmRight = peakWl;
  for (let i = 0; i < tmm.wls.length; i++) {
    if (T[i] >= halfMax) { fwhmLeft = tmm.wls[i]; break; }
  }
  for (let i = tmm.wls.length - 1; i >= 0; i--) {
    if (T[i] >= halfMax) { fwhmRight = tmm.wls[i]; break; }
  }
  const fwhm = fwhmRight - fwhmLeft;
  const finesse = fwhm > 0 ? (centerWl / fwhm) : 0;

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Narrow Bandpass Filter" description="High-finesse Fabry-Perot with multiple cavities for ultra-narrow transmission peaks.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>high</sub></span>
          <ValidatedNumberInput label="nhigh" value={nH} onChange={setNH} step="0.01" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>low</sub></span>
          <ValidatedNumberInput label="nlow" value={nL} onChange={setNL} step="0.01" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <ValidatedNumberInput label="nsubstrate" value={nSub} onChange={setNSub} step="0.01" /></label>
        <ValidatedNumberInput label="Center λ (nm)" value={centerWl} onChange={setCenterWl} />
        <ValidatedNumberInput label="Mirror Pairs" value={mirrorPairs} onChange={setMirrorPairs} min={2} max={20} />
        <ValidatedNumberInput label="Cavities" value={cavities} onChange={setCavities} min={1} max={6} />
        <ValidatedNumberInput label="Spacer n" value={spacerN} onChange={setSpacerN} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Peak T</p>
          <p className="text-2xl font-bold text-blue-400">{(peakT * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">FWHM</p>
          <p className="text-2xl font-bold text-green-400">{fwhm.toFixed(2)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Finesse</p>
          <p className="text-2xl font-bold text-purple-400">{finesse.toFixed(1)}</p>
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
        }} />
      </div>
    </CalculatorShell>
  );
}
