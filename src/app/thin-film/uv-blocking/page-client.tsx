"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { quarterWaveLayers, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function UVBlockingPage() {
  const [nH, setNH] = useURLState("nH", 2.3);
  const [nL, setNL] = useURLState("nL", 1.38);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [designWl, setDesignWl] = useURLState("designWl", 350);
  const [pairs, setPairs] = useURLState("pairs", 6);

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => 200 + i * 600 / N);
    // Short-pass structure: quarter-wave stack air | (HL)^p | sub blocks UV, transmits visible
    const indices = Array.from({ length: 2 * pairs }, (_, j) => (j % 2 === 0 ? nH : nL));
    const layers = quarterWaveLayers(indices, designWl * 1e-9);
    const R = reflectanceSpectrum({ incident: 1, layers, substrate: { n: nSub } }, wls.map((wl) => wl * 1e-9));
    return { wls, R };
  }, [nH, nL, nSub, designWl, pairs]);

  const T = tmm.R.map(r => 1 - r);

  // UV blocking metrics
  const uvBand = tmm.wls.filter(w => w <= 400);
  const uvIdx = uvBand.map(w => tmm.wls.indexOf(w));
  const maxUvT = Math.max(...uvIdx.map(i => T[i]));
  const avgUvR = uvIdx.reduce((s, i) => s + tmm.R[i], 0) / uvIdx.length;

  // Visible T
  const visBand = tmm.wls.filter(w => w >= 400 && w <= 700);
  const visIdx = visBand.map(w => tmm.wls.indexOf(w));
  const avgVisT = visIdx.reduce((s, i) => s + T[i], 0) / visIdx.length;

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="UV Blocking Filter" description="Quarter-wave stack designed to reflect UV (200–400 nm) while transmitting visible light.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>high</sub></>} value={nH} onChange={setNH} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>low</sub></>} value={nL} onChange={setNL} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label="Design λ (nm)" value={designWl} onChange={setDesignWl} />
        <ValidatedNumberInput label="Pairs" value={pairs} onChange={setPairs} min={1} max={20} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">UV Rejection (avg)</p>
          <p className="text-2xl font-bold text-red-400">{(avgUvR * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Max UV Leak</p>
          <p className="text-2xl font-bold text-yellow-400">{(maxUvT * 100).toFixed(3)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Visible T (avg)</p>
          <p className="text-2xl font-bold text-blue-400">{(avgVisT * 100).toFixed(1)}%</p>
        </div>
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
          shapes: [
            { type: "rect", x0: 200, x1: 400, y0: 0, y1: 1.05, fillcolor: "#7c3aed", opacity: 0.05, line: { width: 0 } },
          ],
        }} />
      </div>
    </CalculatorShell>
  );
}
