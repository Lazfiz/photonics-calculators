"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { quarterWaveLayers, quarterWaveStackReflectance, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function DielectricStackPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.38);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [numPairs, setNumPairs] = useURLState("numPairs", 5);
  const [designWl, setDesignWl] = useURLState("designWl", 550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 2);
    // Quarter-wave stack air | (HL)^N | sub
    const layers = quarterWaveLayers(Array.from({ length: 2 * numPairs }, (_, j) => (j % 2 === 0 ? nH : nL)), designWl * 1e-9);
    const R = reflectanceSpectrum({ incident: nInc, layers, substrate: { n: nSub } }, wls.map((wl) => wl * 1e-9));
    return [
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#60a5fa" } },
      { x: wls, y: wls.map(() => 1 - Math.pow((nInc - nSub) / (nInc + nSub), 2)), type: "scatter" as const, mode: "lines" as const, name: "Substrate T baseline", line: { color: "#4b5563", dash: "dash" } },
    ];
  }, [nH, nL, nSub, nInc, numPairs, designWl]);

  // Exact at λ₀ for air | (HL)^N | sub: Y = (nH/nL)^(2N)·n_sub, so q = n₀/n_sub
  const peakR = quarterWaveStackReflectance(nInc, Array.from({ length: 2 * numPairs }, (_, j) => (j % 2 === 0 ? nH : nL)), nSub);
  const bandwidthNm = (4 * designWl) / Math.PI * Math.asin((1 - nL / nH) / (1 + nL / nH));

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Dielectric Stack Theory" description="Quarter-wave dielectric stack reflectance. Alternating high/low index layers create high-reflectance mirrors — the basis of dielectric mirrors and VCSELs.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="n (high index)" value={nH} onChange={setNH} min={0.1} step="0.01" />
        <ValidatedNumberInput label="n (low index)" value={nL} onChange={setNL} min={0.1} step="0.01" />
        <ValidatedNumberInput label="n (substrate)" value={nSub} onChange={setNSub} min={0.1} step="0.01" />
        <ValidatedNumberInput label="n (incident)" value={nInc} onChange={setNInc} min={0.1} step="0.01" />
        <ValidatedNumberInput label="Number of HL Pairs" value={numPairs} onChange={setNumPairs} min={1} max={20} step="1" />
        <ValidatedNumberInput label="Design Wavelength (nm)" value={designWl} onChange={setDesignWl} step="10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Reflectance</p>
          <p className="text-xl font-bold text-green-400">{(peakR * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">nH/nL Ratio</p>
          <p className="text-xl font-bold text-blue-400">{(nH / nL).toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Layers</p>
          <p className="text-xl font-bold text-yellow-400">{numPairs * 2}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">Quarter-Wave Stack Theory</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>Structure: n₀ | (H L)^N | n_sub</p>
          <p>d_H = λ₀/(4n_H), &nbsp; d_L = λ₀/(4n_L)</p>
          <p>R_peak = {`{[(nH/nL)^(2N) − q] / [(nH/nL)^(2N) + q]}`}²</p>
          <p>q = n₀ / n_sub</p>
          <p>Transfer Matrix: M = ∏ M_j, &nbsp; M_j = [[cosδ, iη⁻¹sinδ], [iηsinδ, cosδ]]</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.02, y: 0.98 },
        }} />
      </div>
    </CalculatorShell>
  );
}
