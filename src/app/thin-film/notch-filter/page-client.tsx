"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function NotchFilterPage() {
  const [nH, setNH] = useState(2.35);
  const [nL, setNL] = useState(1.45);
  const [nSub, setNSub] = useState(1.52);
  const [notchWl, setNotchWl] = useState(1550);
  const [mirrorPairs, setMirrorPairs] = useState(4);
  const [spacerN, setSpacerN] = useState(2.1);

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => notchWl * 0.7 + i * notchWl * 0.6 / N);
    const R = wls.map(wl => {
      const dH = notchWl / (4 * nH);
      const dL = notchWl / (4 * nL);
      const dSpacer = notchWl / (2 * spacerN);

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

      // Bottom mirror
      for (let p = 0; p < mirrorPairs; p++) { addLayer(nH, dH); addLayer(nL, dL); }
      // Half-wave cavity (anti-reflection at center → notch = high T everywhere except at resonance where reflected)
      // For a notch filter we want high reflection at center. Use quarter-wave cavity:
      const dCavity = notchWl / (4 * spacerN); // quarter-wave → resonant reflection
      addLayer(spacerN, dCavity);
      // Top mirror
      for (let p = 0; p < mirrorPairs; p++) { addLayer(nH, dH); addLayer(nL, dL); }

      const nInc = 1.0;
      const num = M[0][0]*nSub + M[0][1]*nSub*nInc - M[1][0] - M[1][1]*nInc;
      const den = M[0][0]*nSub + M[0][1]*nSub*nInc + M[1][0] + M[1][1]*nInc;
      return (num / den) ** 2;
    });
    return { wls, R };
  }, [nH, nL, nSub, notchWl, mirrorPairs, spacerN]);

  const T = tmm.R.map(r => 1 - r);
  const minT = Math.min(...T);
  const notchWlActual = tmm.wls[T.indexOf(minT)];
  // FWHM
  const halfMax = 1 - minT / 2;
  let fwhm = 0;
  let inNotch = false;
  for (let i = 0; i < tmm.wls.length; i++) {
    if (T[i] < halfMax) {
      if (!inNotch) { inNotch = true; fwhm = tmm.wls[i]; }
    } else if (inNotch) {
      fwhm = tmm.wls[i] - fwhm;
      break;
    }
  }

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Notch Filter" description="Rejection notch filter — high reflectance at target wavelength, transmits elsewhere.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>high</sub></span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>low</sub></span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Notch λ (nm)</span>
          <input type="number" value={notchWl} onChange={e => setNotchWl(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Mirror Pairs</span>
          <input type="number" value={mirrorPairs} onChange={e => setMirrorPairs(+e.target.value)} min={1} max={15} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Cavity n</span>
          <input type="number" value={spacerN} onChange={e => setSpacerN(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Notch Depth</p>
          <p className="text-3xl font-bold text-red-400">{((1 - minT) * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Notch λ</p>
          <p className="text-3xl font-bold text-blue-400">{notchWlActual.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">FWHM</p>
          <p className="text-3xl font-bold text-green-400">{fwhm.toFixed(1)} nm</p>
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
