"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { quarterWaveLayers, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function DoubleLayerARPage() {
  const [n1, setN1] = useURLState("n1", 1.38);
  const [n2, setN2] = useURLState("n2", 1.70);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [designWl, setDesignWl] = useURLState("designWl", 550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 400 }, (_, i) => 300 + i * 500 / 400);
    // Quarter-wave pair at λ₀: incident | n1 | n2 | substrate
    const layers = quarterWaveLayers([n1, n2], designWl * 1e-9);
    const R = reflectanceSpectrum({ incident: nInc, layers, substrate: { n: nSub } }, wls.map((wl) => wl * 1e-9));

    const T = wls.map((_, i) => 1 - R[i]);
    return [
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#f87171" } },
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "Transmittance", line: { color: "#60a5fa" } },
    ];
  }, [n1, n2, nSub, nInc, designWl]);

  const d1 = designWl / (4 * n1);
  const d2 = designWl / (4 * n2);
  const optN1 = Math.pow(nInc * nInc * nInc * nSub, 0.25);
  const optN2 = Math.pow(nInc * nSub * nSub * nSub, 0.25);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Two-Layer AR Coating" description="Transfer-matrix method for two-layer V-coat or W-coat AR designs. Both layers at quarter-wave optical thickness.
        Optimal indices: n₁ = (ninc³ · nsub)¼, n₂ = (ninc · nsub³)¼.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="n₁ (outer layer)" value={n1} onChange={setN1} step="0.01" />
        <ValidatedNumberInput label="n₂ (inner layer)" value={n2} onChange={setN2} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} step="0.01" />
        <ValidatedNumberInput label="Design λ (nm)" value={designWl} onChange={setDesignWl} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">d₁ = λ/(4n₁) = <span className="text-blue-400 font-mono">{d1.toFixed(1)} nm</span></p>
        <p className="text-gray-300">d₂ = λ/(4n₂) = <span className="text-blue-400 font-mono">{d2.toFixed(1)} nm</span></p>
        <p className="text-gray-300">Optimal n₁ = <span className="text-green-400 font-mono">{optN1.toFixed(3)}</span></p>
        <p className="text-gray-300">Optimal n₂ = <span className="text-green-400 font-mono">{optN2.toFixed(3)}</span></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "R / T", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </CalculatorShell>
  );
}
