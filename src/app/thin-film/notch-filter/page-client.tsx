"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { cavityFilterLayers } from "../../../physics/thin-film/cavity-filter";
import { reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function NotchFilterPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [notchWl, setNotchWl] = useURLState("notchWl", 1550);
  const [mirrorPairs, setMirrorPairs] = useURLState("mirrorPairs", 4);
  const [spacerN, setSpacerN] = useURLState("spacerN", 2.1);

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => notchWl * 0.7 + i * notchWl * 0.6 / N);
    // (HL)^p S (LH)^p with a quarter-wave "cavity" layer S: every layer is a quarter wave at the
    // notch wavelength, so the stack reflects strongly there.
    const layers = cavityFilterLayers({
      nH, nL, nSpacer: spacerN, mirrorPairs: Math.round(mirrorPairs), cavities: 1, spacerQuarterWaves: 1, lambda0: notchWl * 1e-9,
    });
    const R = reflectanceSpectrum({ incident: 1, layers, substrate: { n: nSub } }, wls.map((wl) => wl * 1e-9));
    return { wls, R };
  }, [nH, nL, nSub, notchWl, mirrorPairs, spacerN]);

  const T = tmm.R.map(r => 1 - r);
  const minT = Math.min(...T);
  const minIdx = T.indexOf(minT);
  const notchWlActual = tmm.wls[minIdx] ?? NaN;
  // FWHM: the contiguous band around the minimum where T is below half depth, (1 + T_min) / 2
  const halfDepth = (1 + minT) / 2;
  let lo = minIdx, hi = minIdx;
  while (lo > 0 && T[lo - 1] < halfDepth) lo--;
  while (hi < T.length - 1 && T[hi + 1] < halfDepth) hi++;
  const fwhm = minIdx >= 0 ? tmm.wls[hi] - tmm.wls[lo] : NaN;

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Notch Filter" description="Rejection notch filter — high reflectance at target wavelength, transmits elsewhere.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>high</sub></>} value={nH} onChange={setNH} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>low</sub></>} value={nL} onChange={setNL} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label="Notch λ (nm)" value={notchWl} onChange={setNotchWl} />
        <ValidatedNumberInput label="Mirror Pairs" value={mirrorPairs} onChange={setMirrorPairs} min={1} max={15} />
        <ValidatedNumberInput label="Cavity n" value={spacerN} onChange={setSpacerN} step="0.01" />
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
