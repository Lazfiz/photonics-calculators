"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { quarterWaveLayers, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function EdgeFilterPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [designWl, setDesignWl] = useURLState("designWl", 1550);
  const [pairs, setPairs] = useURLState("pairs", 7);
  const [type, setType] = useState<"long" | "short">("long");

  const tmm = useMemo(() => {
    const N = 400;
    const wls = Array.from({ length: N }, (_, i) => designWl * 0.6 + i * designWl * 0.8 / N);
    // Quarter-wave layers listed from the air side: long-pass air | (LH)^p | sub (H on the
    // substrate), short-pass air | (HL)^p | sub.
    const pair = type === "long" ? [nL, nH] : [nH, nL];
    const layers = quarterWaveLayers(Array.from({ length: 2 * pairs }, (_, j) => pair[j % 2]), designWl * 1e-9);
    const R = reflectanceSpectrum({ incident: 1, layers, substrate: { n: nSub } }, wls.map((wl) => wl * 1e-9));
    return { wls, R };
  }, [nH, nL, nSub, designWl, pairs, type]);

  const T = tmm.R.map(r => 1 - r);
  const cutoffIdx = tmm.R.findIndex(r => r > 0.5);
  const cutoffWl = cutoffIdx >= 0 ? tmm.wls[cutoffIdx] : null;

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>high</sub></>} value={nH} onChange={setNH} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>low</sub></>} value={nL} onChange={setNL} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label="Design Wavelength (nm)" value={designWl} onChange={setDesignWl} />
        <ValidatedNumberInput label="Pairs" value={pairs} onChange={setPairs} min={1} max={30} />
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
    </>
  );
}
