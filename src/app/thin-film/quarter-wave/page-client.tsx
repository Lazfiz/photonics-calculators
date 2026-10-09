"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { quarterWaveLayers, quarterWaveStackReflectance, stackResponse } from "../../../physics/thin-film/transfer-matrix";

export default function QuarterWavePage() {
  const [nFilm, setNFilm] = useURLState("nFilm", 1.38);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [designWl, setDesignWl] = useURLState("designWl", 550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 500 / 300);
    const stack = { incident: nInc, layers: quarterWaveLayers([nFilm], designWl * 1e-9), substrate: { n: nSub } };
    const response = wls.map((wl) => stackResponse(stack, wl * 1e-9));
    const R = response.map((r) => r.R);
    const T = response.map((r) => r.T);
    return [
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#f87171" } },
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "Transmittance", line: { color: "#60a5fa" } },
    ];
  }, [nFilm, nSub, nInc, designWl]);

  const thickness = designWl / (4 * nFilm);
  const optimalN = Math.sqrt(nInc * nSub);
  const designR = quarterWaveStackReflectance(nInc, [nFilm], nSub);

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>film</sub></>} value={nFilm} onChange={setNFilm} min={0.1} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={0.1} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} min={0.1} step="0.01" />
        <ValidatedNumberInput label="Design λ (nm)" value={designWl} onChange={setDesignWl} min={1} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Quarter-wave thickness d = λ/(4n) = <span className="text-blue-400 font-mono">{thickness.toFixed(1)} nm</span></p>
        <p className="text-gray-300">Optimal n<sub>film</sub> = √(n<sub>inc</sub>·n<sub>sub</sub>) = <span className="text-blue-400 font-mono">{optimalN.toFixed(3)}</span></p>
        <p className="text-gray-300">R at design λ = <span className="text-blue-400 font-mono">{(designR * 100).toFixed(4)}%</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "R / T", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true }} />
    </>
  );
}
