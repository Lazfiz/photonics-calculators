"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { stopBandEdges } from "../../../physics/thin-film/quarter-wave-stack";
import { quarterWaveLayers, quarterWaveStackReflectance, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function BraggReflectorPage() {
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [designWavelength, setDesignWavelength] = useURLState("designWavelength", 1550);
  const [pairsRaw, setPairs] = useURLState("pairs", 5);
  // useURLState does not clamp URL values, so clamp here and use this everywhere.
  const pairs = Math.min(30, Math.max(1, Math.round(pairsRaw)));

  // Stack: incident | (H L)^N | substrate. One index array feeds the plotted stack and the peak-R card.
  const indices = useMemo(() => Array.from({ length: 2 * pairs }, (_, j) => (j % 2 === 0 ? nH : nL)), [pairs, nH, nL]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => designWavelength * 0.7 + i * designWavelength * 0.6 / 300);
    const layers = quarterWaveLayers(indices, designWavelength * 1e-9);
    const R = reflectanceSpectrum({ incident: nInc, layers, substrate: { n: nSub } }, wls.map((wl) => wl * 1e-9));
    return [{ x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#60a5fa" } }];
  }, [nInc, indices, nSub, designWavelength]);

  // Closed form at λ₀ for the same layers as the plot.
  const peakR = quarterWaveStackReflectance(nInc, indices, nSub);
  const band = stopBandEdges(designWavelength * 1e-9, nH, nL);
  const bandText = Number.isFinite(band.short) && Number.isFinite(band.long)
    ? `${(band.short * 1e9).toFixed(1)}–${(band.long * 1e9).toFixed(1)} nm, width ${((band.long - band.short) * 1e9).toFixed(1)} nm`
    : "—";

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} min={1} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>high</sub></>} value={nH} onChange={setNH} min={0.1} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>low</sub></>} value={nL} onChange={setNL} min={0.1} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={0.1} step="0.01" />
        <ValidatedNumberInput label="Design Wavelength (nm)" value={designWavelength} onChange={setDesignWavelength} />
        <ValidatedNumberInput label="Number of Pairs" value={pairs} onChange={setPairs} min={1} max={30} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Peak Reflectance (at λ₀)</p>
          <p className="text-3xl font-bold text-blue-400">{Number.isFinite(peakR) ? `${(peakR * 100).toFixed(4)}%` : "—"}</p>
          <p className="text-sm text-gray-500 mt-1">Δn = {Number.isFinite(nH - nL) ? (nH - nL).toFixed(2) : "—"}, {pairs} pairs, λ₀ = {designWavelength} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Stop band (infinite-stack edges)</p>
          <p className="text-xl font-bold text-green-400">{bandText}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </>
  );
}
