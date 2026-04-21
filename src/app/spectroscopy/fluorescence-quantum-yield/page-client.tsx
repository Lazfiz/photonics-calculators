"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function FluorescenceQuantumYieldPage() {
  const [sampleInt, setSampleInt] = useURLState("sampleInt", 50000);
  const [refInt, setRefInt] = useURLState("refInt", 80000);
  const [sampleAbs, setSampleAbs] = useURLState("sampleAbs", 0.1);
  const [refAbs, setRefAbs] = useURLState("refAbs", 0.1);
  const [refQY, setRefQY] = useURLState("refQY", 0.54);
  const [refrIdxSample, setRefrIdxSample] = useURLState("refrIdxSample", 1.33);
  const [refrIdxRef, setRefrIdxRef] = useURLState("refrIdxRef", 1.33);
  const [useRefrIdx, setUseRefrIdx] = useState(false);

  const qy = (refInt === 0 || sampleAbs === 0) ? 0 : useRefrIdx
    ? (sampleInt / refInt) * (refAbs / sampleAbs) * (refrIdxSample / refrIdxRef) ** 2 * refQY
    : (sampleInt / refInt) * (refAbs / sampleAbs) * refQY;

  const chartData = useMemo(() => {
    const absVals = Array.from({ length: 200 }, (_, i) => 0.01 + (i / 200) * 0.5);
    const qyLine = absVals.map(a => {
      if (a === 0 || refInt === 0) return 0;
      const riFactor = useRefrIdx ? (refrIdxSample / refrIdxRef) ** 2 : 1;
      return (sampleInt / refInt) * (refAbs / a) * riFactor * refQY;
    });
    return [
      { x: absVals, y: qyLine, type: "scatter" as const, mode: "lines" as const, name: "QY vs Sample A", line: { color: "#60a5fa" } },
      { x: [sampleAbs], y: [qy], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [sampleInt, refInt, sampleAbs, refAbs, refQY, qy, useRefrIdx, refrIdxSample, refrIdxRef]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Fluorescence Quantum Yield" description="Φ = Φ_ref · (I_s/I_ref) · (A_ref/A_s) · (n_s/n_ref)² — comparative method using a reference standard.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Sample Integrated Intensity" value={sampleInt} onChange={setSampleInt} min={0} />
        <ValidatedNumberInput label="Reference Integrated Intensity" value={refInt} onChange={setRefInt} min={0} />
        <ValidatedNumberInput label="Sample Absorbance (at λ_ex)" value={sampleAbs} onChange={setSampleAbs} min={0.001} />
        <ValidatedNumberInput label="Reference Absorbance (at λ_ex)" value={refAbs} onChange={setRefAbs} min={0.001} />
        <ValidatedNumberInput label="Reference Φ (e.g. quinine 0.54)" value={refQY} onChange={setRefQY} min={0} max={1} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Apply Refractive Index Correction</span>
          <select value={useRefrIdx ? "yes" : "no"} onChange={e => setUseRefrIdx(e.target.value === "yes")}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
      </div>

      {useRefrIdx && (
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <ValidatedNumberInput label="n (sample solvent)" value={refrIdxSample} onChange={setRefrIdxSample} min={1} />
          <ValidatedNumberInput label="n (reference solvent)" value={refrIdxRef} onChange={setRefrIdxRef} min={1} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Quantum Yield (Φ)</p>
          <p className="text-2xl font-bold text-blue-400">{qy.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Φ as percentage</p>
          <p className="text-2xl font-bold text-green-400">{(qy * 100).toFixed(2)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono text-blue-400">Φ_s = Φ_ref · (I_s / I_ref) · (A_ref / A_s) · (n_s² / n_ref²)</p>
        <p className="text-gray-500 text-xs mt-2">Keep A &lt; 0.1 to avoid inner filter effects and ensure A_ref/A_s ≈ (1−10^−A_ref)/(1−10^−A_s) &lt; 5% error. For higher absorbances, replace A ratio with the exact fraction of absorbed photons."
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Sample Absorbance", gridcolor: "#1f2937" },
          yaxis: { title: "Quantum Yield", gridcolor: "#1f2937" },
          margin: { t: 30 },
        }} />
      </div>
    </CalculatorShell>
  );
}
