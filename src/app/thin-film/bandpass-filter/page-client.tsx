"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { cavityFilterLayers } from "../../../physics/thin-film/cavity-filter";
import { reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function BandpassFilterPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [centerWl, setCenterWl] = useURLState("centerWl", 1550);
  const [cavityPairsRaw, setCavityPairs] = useURLState("cavityPairs", 3);
  const [cavitiesRaw, setCavities] = useURLState("cavities", 2);
  // useURLState does not clamp URL values: keep to the input ranges so a crafted link cannot build a huge stack.
  const cavityPairs = Math.min(15, Math.max(1, Math.round(cavityPairsRaw)));
  const cavities = Math.min(6, Math.max(1, Math.round(cavitiesRaw)));
  const [spacerN, setSpacerN] = useURLState("spacerN", 2.1);

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => centerWl * 0.7 + i * centerWl * 0.6 / N);
    // Fabry-Perot bandpass: each cavity is (HL)^p S (LH)^p with a half-wave spacer S,
    // cavities coupled by a quarter-wave L layer.
    const layers = cavityFilterLayers({
      nH, nL, nSpacer: spacerN, mirrorPairs: cavityPairs, cavities, spacerQuarterWaves: 2, lambda0: centerWl * 1e-9,
    });
    const R = reflectanceSpectrum({ incident: 1, layers, substrate: { n: nSub } }, wls.map((wl) => wl * 1e-9));
    return { wls, R };
  }, [nH, nL, nSub, centerWl, cavityPairs, cavities, spacerN]);

  const T = tmm.R.map(r => 1 - r);
  const peakT = Math.max(...T);
  const peakWl = tmm.wls[T.indexOf(peakT)] ?? NaN;

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>high</sub></>} value={nH} onChange={setNH} min={0.1} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>low</sub></>} value={nL} onChange={setNL} min={0.1} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={0.1} step="0.01" />
        <ValidatedNumberInput label="Center λ (nm)" value={centerWl} onChange={setCenterWl} />
        <ValidatedNumberInput label="Mirror Pairs" value={cavityPairs} onChange={setCavityPairs} min={1} max={15} />
        <ValidatedNumberInput label="Cavities" value={cavities} onChange={setCavities} min={1} max={6} />
        <ValidatedNumberInput label="Spacer n" value={spacerN} onChange={setSpacerN} min={0.1} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Maximum T on the plotted grid</p>
          <p className="text-3xl font-bold text-blue-400">{Number.isFinite(peakT) ? `${(peakT * 100).toFixed(2)}%` : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Wavelength of maximum T on the plotted grid</p>
          <p className="text-3xl font-bold text-green-400">{Number.isFinite(peakWl) ? `${peakWl.toFixed(1)} nm` : "—"}</p>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4">There are no matching layers, so the peak T is below 100 % and the passband ripples (Macleod, Thin-Film Optical Filters, ch. 8).</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
        <p className="text-sm text-gray-300">Each cavity (HL)^p S (LH)^p, S = half-wave spacer; cavities coupled by a quarter-wave L layer; T = 1 − R (lossless)</p>
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
    </>
  );
}
