"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  quarterQuarterArInnerIndex,
  quarterWaveLayers,
  quarterWaveStackReflectance,
  reflectanceSpectrum,
} from "../../../physics/thin-film/transfer-matrix";

export default function MultilayerARPage() {
  const [n1, setN1] = useURLState("n1", 1.38);
  const [n2, setN2] = useURLState("n2", 2.1);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [designWl, setDesignWl] = useURLState("designWl", 550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 500 / 300);
    // Quarter-wave layers at λ₀, outer (n₁) first, by the transfer matrix.
    const stack = { incident: nInc, layers: quarterWaveLayers([n1, n2], designWl * 1e-9), substrate: { n: nSub } };
    const R = reflectanceSpectrum(stack, wls.map((wl) => wl * 1e-9));
    return [{ x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#60a5fa" } }];
  }, [n1, n2, nSub, nInc, designWl]);

  const optimalN2 = quarterQuarterArInnerIndex(nInc, n1, nSub);
  const designR = quarterWaveStackReflectance(nInc, [n1, n2], nSub);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Two-Layer AR Coating" description="Design a two-layer quarter-wave anti-reflection coating. Zero reflectance at λ₀ when n₂ = n₁√(n_sub/n_inc).">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="n₁ (outer layer)" value={n1} onChange={setN1} step="0.01" />
        <ValidatedNumberInput label="n₂ (inner layer)" value={n2} onChange={setN2} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} step="0.01" />
        <ValidatedNumberInput label="Design λ (nm)" value={designWl} onChange={setDesignWl} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Optimal n₂ = n₁√(n<sub>sub</sub>/n<sub>inc</sub>) = <span className="text-blue-400 font-mono">{optimalN2.toFixed(3)}</span></p>
        <p className="text-gray-300">R at design λ = <span className="text-blue-400 font-mono">{(designR * 100).toFixed(4)}%</span></p>
        <p className="text-gray-300">d₁ = λ/(4n₁) = <span className="text-blue-400 font-mono">{(designWl / (4 * n1)).toFixed(1)} nm</span></p>
        <p className="text-gray-300">d₂ = λ/(4n₂) = <span className="text-blue-400 font-mono">{(designWl / (4 * n2)).toFixed(1)} nm</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 0.5] }, margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true }} />
    </CalculatorShell>
  );
}
