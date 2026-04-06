"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function ShortPassPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [numPairs, setNumPairs] = useURLState("numPairs", 5);
  const [designWl, setDesignWl] = useURLState("designWl", 700);

  // Short pass: (LH)^N stack - reverses the layer order vs long pass
  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 300 + i * 700 / 500);
    const dH = designWl / (4 * nH);
    const dL = designWl / (4 * nL);

    const R = wls.map(wl => {
      let m11r = 1, m11i = 0, m12r = 0, m12i = 0;
      let m21r = 0, m21i = 0, m22r = 1, m22i = 0;

      const layers = numPairs * 2;
      for (let j = 0; j < layers; j++) {
        const n = j % 2 === 0 ? nL : nH; // LH order for short pass
        const d = j % 2 === 0 ? dL : dH;
        const delta = (2 * Math.PI * n * d) / wl;
        const cosD = Math.cos(delta);
        const sinD = Math.sin(delta);
        const a11r = cosD, a11i = 0;
        const a12r = 0, a12i = -sinD / n;
        const a21r = 0, a21i = -n * sinD;
        const a22r = cosD, a22i = 0;
        const new11r = m11r * a11r - m11i * a11i + m12r * a21r - m12i * a21i;
        const new11i = m11r * a11i + m11i * a11r + m12r * a21i + m12i * a21r;
        const new12r = m11r * a12r - m11i * a12i + m12r * a22r - m12i * a22i;
        const new12i = m11r * a12i + m11i * a12r + m12r * a22i + m12i * a22r;
        const new21r = m21r * a11r - m21i * a11i + m22r * a21r - m22i * a21i;
        const new21i = m21r * a11i + m21i * a11r + m22r * a21i + m22i * a21r;
        const new22r = m21r * a12r - m21i * a12i + m22r * a22r - m22i * a22i;
        const new22i = m21r * a12i + m21i * a12r + m22r * a22i + m22i * a22r;
        m11r = new11r; m11i = new11i; m12r = new12r; m12i = new12i;
        m21r = new21r; m21i = new21i; m22r = new22r; m22i = new22i;
      }

      const numR = m11r * nInc + m12r * nInc * nSub - m21r - m22r * nSub;
      const numI = m11i * nInc + m12i * nInc * nSub - m21i - m22i * nSub;
      const denR = m11r * nInc + m12r * nInc * nSub + m21r + m22r * nSub;
      const denI = m11i * nInc + m12i * nInc * nSub + m21i + m22i * nSub;
      return (numR * numR + numI * numI) / (denR * denR + denI * denI);
    });

    const T = wls.map((_, i) => 1 - R[i]);
    return [
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#f87171" } },
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "Transmittance", line: { color: "#60a5fa" } },
    ];
  }, [nH, nL, nSub, nInc, numPairs, designWl]);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Short Pass Filter" description="Quarter-wave stack (LH)N short-pass filter. Transmits λ &lt; λedge, reflects longer wavelengths.
        Uses reversed layer order compared to long-pass design.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>H</sub> (high index)</span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>L</sub> (low index)</span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>incident</sub></span>
          <input type="number" value={nInc} onChange={e => setNInc(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Number of pairs (N)" value={numPairs} onChange={setNumPairs} min={1} max={20} />
        <ValidatedNumberInput label="Design λ₀ (nm)" value={designWl} onChange={setDesignWl} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">d<sub>H</sub> = <span className="text-blue-400 font-mono">{(designWl / (4 * nH)).toFixed(1)} nm</span>, d<sub>L</sub> = <span className="text-blue-400 font-mono">{(designWl / (4 * nL)).toFixed(1)} nm</span></p>
        <p className="text-gray-300">R<sub>max</sub> ≈ <span className="text-blue-400 font-mono">{(((Math.pow(nH / nL, 2 * numPairs) - 1) / (Math.pow(nH / nL, 2 * numPairs) + 1)) ** 2 * 100).toFixed(4)}%</span></p>
        <p className="text-gray-300">Total layers = <span className="text-blue-400 font-mono">{numPairs * 2}</span></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </CalculatorShell>
  );
}
