"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function QuarterWavePage() {
  const [nFilm, setNFilm] = useURLState("nFilm", 1.38);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [designWl, setDesignWl] = useURLState("designWl", 550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 500 / 300);
    const R = wls.map(wl => {
      const d = designWl / (4 * nFilm);
      const delta = (2 * Math.PI * nFilm * d) / wl;
      // Single layer Fresnel: R = |r|² where r = (r01 + r12*exp(2iδ))/(1 + r01*r12*exp(2iδ))
      const r01 = (nInc - nFilm) / (nInc + nFilm);
      const r12 = (nFilm - nSub) / (nFilm + nSub);
      const cos2d = Math.cos(2 * delta);
      const sin2d = Math.sin(2 * delta);
      const numR = r01 + r12 * cos2d;
      const numI = r12 * sin2d;
      const denR = 1 + r01 * r12 * cos2d;
      const denI = r01 * r12 * sin2d;
      const r2 = (numR * numR + numI * numI) / (denR * denR + denI * denI);
      return r2;
    });
    const T = wls.map((_, i) => 1 - R[i]);
    return [
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#f87171" } },
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "Transmittance", line: { color: "#60a5fa" } },
    ];
  }, [nFilm, nSub, nInc, designWl]);

  const thickness = designWl / (4 * nFilm);
  const optimalN = Math.sqrt(nInc * nSub);
  const rAtDesign = (nInc - nFilm * nFilm / nSub) / (nInc + nFilm * nFilm / nSub);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Quarter-Wave Thickness" description="Quarter-wave optical thickness (QWOT): nd = λ/4. Optimal AR when nfilm = √(ninc·nsub).">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>film</sub></span>
          <input type="number" value={nFilm} onChange={e => setNFilm(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>incident</sub></span>
          <input type="number" value={nInc} onChange={e => setNInc(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Design λ (nm)" value={designWl} onChange={setDesignWl} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">QWOT thickness = <span className="text-blue-400 font-mono">{thickness.toFixed(1)} nm</span></p>
        <p className="text-gray-300">Optimal n<sub>film</sub> = √(n<sub>inc</sub>·n<sub>sub</sub>) = <span className="text-blue-400 font-mono">{optimalN.toFixed(3)}</span></p>
        <p className="text-gray-300">R at design λ = <span className="text-blue-400 font-mono">{(rAtDesign * rAtDesign * 100).toFixed(4)}%</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "R / T", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true }} />
    </CalculatorShell>
  );
}
