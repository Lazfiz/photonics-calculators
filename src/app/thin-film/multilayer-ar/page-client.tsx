"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function MultilayerARPage() {
  const [n1, setN1] = useURLState("n1", 1.38);
  const [n2, setN2] = useURLState("n2", 2.1);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [designWl, setDesignWl] = useURLState("designWl", 550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 500 / 300);
    // Two-layer AR: R = ((n1²nSub - n2²nInc)/(n1²nSub + n2²nInc))² at design wavelength
    // Wavelength-dependent using admittance method approximation
    const R = wls.map(wl => {
      const f = designWl / wl;
      const d1 = designWl / (4 * n1);
      const d2 = designWl / (4 * n2);
      const delta1 = (2 * Math.PI * n1 * d1 * f) / designWl;
      const delta2 = (2 * Math.PI * n2 * d2 * f) / designWl;
      // Simplified two-layer transfer: use effective admittance
      const eta2 = n2 * nSub / (n2 * Math.cos(2 * delta2) + nSub * Math.sin(2 * delta2));
      const eta1 = n1 * eta2 / (n1 * Math.cos(2 * delta1) + eta2 * Math.sin(2 * delta1));
      const r = (nInc - eta1) / (nInc + eta1);
      return r * r;
    });
    return [{ x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#60a5fa" } }];
  }, [n1, n2, nSub, nInc, designWl]);

  const optimalN2 = Math.pow(nInc * nSub * nSub * nSub, 0.25); // n₂ = (n₀·n_s³)^(1/4)
  const minR = Math.pow((n1 * n1 * nSub - optimalN2 * optimalN2 * nInc) / (n1 * n1 * nSub + optimalN2 * optimalN2 * nInc), 2);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Two-Layer AR Coating" description="Design a two-layer anti-reflection coating. Optimal condition: n₂ = n₁√nsub.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="n₁ (outer layer)" value={n1} onChange={setN1} step="0.01" />
        <ValidatedNumberInput label="n₂ (inner layer)" value={n2} onChange={setN2} step="0.01" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <ValidatedNumberInput label="nsubstrate" value={nSub} onChange={setNSub} step="0.01" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>incident</sub></span>
          <ValidatedNumberInput label="nincident" value={nInc} onChange={setNInc} step="0.01" /></label>
        <ValidatedNumberInput label="Design λ (nm)" value={designWl} onChange={setDesignWl} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Optimal n₂ = n₁√n<sub>sub</sub> = <span className="text-blue-400 font-mono">{optimalN2.toFixed(3)}</span></p>
        <p className="text-gray-300">Min R at design λ = <span className="text-blue-400 font-mono">{(minR * 100).toFixed(4)}%</span></p>
        <p className="text-gray-300">d₁ = λ/(4n₁) = <span className="text-blue-400 font-mono">{(designWl / (4 * n1)).toFixed(1)} nm</span></p>
        <p className="text-gray-300">d₂ = λ/(4n₂) = <span className="text-blue-400 font-mono">{(designWl / (4 * n2)).toFixed(1)} nm</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 0.5] }, margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true }} />
    </CalculatorShell>
  );
}
