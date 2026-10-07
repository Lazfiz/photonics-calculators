"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { quarterWaveLayers, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function BraggReflectorPage() {
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [designWavelength, setDesignWavelength] = useURLState("designWavelength", 1550);
  const [pairs, setPairs] = useURLState("pairs", 5);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => designWavelength * 0.7 + i * designWavelength * 0.6 / 300);
    // Stack: incident | (H L)^N | substrate
    const indices = Array.from({ length: 2 * pairs }, (_, j) => (j % 2 === 0 ? nH : nL));
    const layers = quarterWaveLayers(indices, designWavelength * 1e-9);
    const R = reflectanceSpectrum({ incident: nInc, layers, substrate: { n: nSub } }, wls.map((wl) => wl * 1e-9));
    return [{ x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#60a5fa" } }];
  }, [nInc, nH, nL, nSub, designWavelength, pairs]);

  const peakR = Math.pow((nInc - Math.pow(nH / nL, 2 * pairs) * nSub) / (nInc + Math.pow(nH / nL, 2 * pairs) * nSub), 2);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Bragg Reflector" description="Dielectric distributed Bragg reflector — reflectance spectrum and stopband design.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} min={1} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>high</sub></>} value={nH} onChange={setNH} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>low</sub></>} value={nL} onChange={setNL} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label="Design Wavelength (nm)" value={designWavelength} onChange={setDesignWavelength} />
        <ValidatedNumberInput label="Number of Pairs" value={pairs} onChange={setPairs} min={1} max={50} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <p className="text-sm text-gray-400">Peak Reflectance (at λ₀)</p>
        <p className="text-3xl font-bold text-blue-400">{(peakR * 100).toFixed(4)}%</p>
        <p className="text-sm text-gray-500 mt-1">Δn = {nH - nL}, {pairs} pairs, λ₀ = {designWavelength} nm</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
