"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
function computeRT(layers: { n: number; d: number }[], nInc: number, nSub: number, wavelengths: number[]) {
  const R: number[] = [];
  for (const wl of wavelengths) {
    let m11r = 1, m11i = 0, m12r = 0, m12i = 0;
    let m21r = 0, m21i = 0, m22r = 1, m22i = 0;
    for (const layer of layers) {
      const delta = (2 * Math.PI * layer.n * layer.d) / wl;
      const cosD = Math.cos(delta), sinD = Math.sin(delta), n = layer.n;
      const a11r = cosD, a12r = 0, a12i = -sinD / n, a21r = 0, a21i = -n * sinD, a22r = cosD, a22i = 0;
      const new11r = m11r * a11r + m12r * a21r - m12i * a21i;
      const new11i = m11i * a11r + m12r * a21i + m12i * a21r;
      const new12r = m11r * a12r + m12r * a22r - m12i * a22i;
      const new12i = m11i * a12r + m12r * a22i + m12i * a22r;
      const new21r = m21r * a11r + m22r * a21r - m22i * a21i;
      const new21i = m21i * a11r + m22r * a21i + m22i * a21r;
      const new22r = m21r * a12r + m22r * a22r - m22i * a22i;
      const new22i = m21i * a12r + m22r * a22i + m22i * a22r;
      m11r = new11r; m11i = new11i; m12r = new12r; m12i = new12i;
      m21r = new21r; m21i = new21i; m22r = new22r; m22i = new22i;
    }
    const numR = m11r * nInc + m12r * nInc * nSub - m21r - m22r * nSub;
    const numI = m11i * nInc + m12i * nInc * nSub - m21i - m22i * nSub;
    const denR = m11r * nInc + m12r * nInc * nSub + m21r + m22r * nSub;
    const denI = m11i * nInc + m12i * nInc * nSub + m21i + m22i * nSub;
    R.push((numR * numR + numI * numI) / (denR * denR + denI * denI));
  }
  return R;
}

export default function ColdMirrorPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [numPairs, setNumPairs] = useURLState("numPairs", 7);
  const [designWl, setDesignWl] = useURLState("designWl", 700);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 300 + i * 1200 / 500);
    const dH = designWl / (4 * nH);
    const dL = designWl / (4 * nL);

    // Cold mirror: (HL)^N stack reflects visible, transmits IR
    const layers: { n: number; d: number }[] = [];
    for (let j = 0; j < numPairs * 2; j++) {
      const n = j % 2 === 0 ? nH : nL;
      const d = j % 2 === 0 ? dH : dL;
      layers.push({ n, d });
    }

    const R = computeRT(layers, nInc, nSub, wls);
    const T = wls.map((_, i) => 1 - R[i]);

    return [
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#f87171" } },
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "Transmittance", line: { color: "#60a5fa" } },
    ];
  }, [nH, nL, nSub, nInc, numPairs, designWl]);

  const dH = designWl / (4 * nH);
  const dL = designWl / (4 * nL);
  const rMax = Math.pow(nH / nL, 2 * numPairs);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Cold Mirror Design" description="Cold mirrors reflect visible light while transmitting infrared. Used in projector systems,
        illumination optics, and laser setups to separate visible from IR (heat). The (HL)N stack
        is a high-reflector centered in the visible band, while IR passes through the stop band edges.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>H</sub> (high index)</span>
          <ValidatedNumberInput label="nH (high index)" value={nH} onChange={setNH} step="0.01" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>L</sub> (low index)</span>
          <ValidatedNumberInput label="nL (low index)" value={nL} onChange={setNL} step="0.01" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <ValidatedNumberInput label="nsubstrate" value={nSub} onChange={setNSub} step="0.01" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>incident</sub></span>
          <ValidatedNumberInput label="nincident" value={nInc} onChange={setNInc} step="0.01" /></label>
        <ValidatedNumberInput label="Number of pairs (N)" value={numPairs} onChange={setNumPairs} min={1} max={20} />
        <ValidatedNumberInput label="Design λ₀ (nm) — visible center" value={designWl} onChange={setDesignWl} step="10" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">d<sub>H</sub> = <span className="text-blue-400 font-mono">{dH.toFixed(1)} nm</span>, d<sub>L</sub> = <span className="text-blue-400 font-mono">{dL.toFixed(1)} nm</span></p>
        <p className="text-gray-300">R<sub>max</sub> ≈ <span className="text-blue-400 font-mono">{(((rMax - 1) / (rMax + 1)) ** 2 * 100).toFixed(4)}%</span></p>
        <p className="text-gray-300">Total layers = <span className="text-blue-400 font-mono">{numPairs * 2}</span></p>
        <p className="text-gray-300 text-xs mt-2">R<sub>max</sub> = [(n<sub>H</sub>/n<sub>L</sub>)<sup>2N</sup> − 1]² / [(n<sub>H</sub>/n<sub>L</sub>)<sup>2N</sup> + 1]²</p>
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
