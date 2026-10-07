"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { quarterWaveLayers, quarterWaveStackReflectance, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function ColdMirrorPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [numPairs, setNumPairs] = useURLState("numPairs", 7);
  const [designWl, setDesignWl] = useURLState("designWl", 700);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 300 + i * 1200 / 500);

    // Cold mirror: (HL)^N stack reflects visible, transmits IR
    const indices = Array.from({ length: numPairs * 2 }, (_, j) => (j % 2 === 0 ? nH : nL));
    const layers = quarterWaveLayers(indices, designWl * 1e-9);

    const R = reflectanceSpectrum({ incident: nInc, layers, substrate: { n: nSub } }, wls.map((wl) => wl * 1e-9));
    const T = R.map((r) => 1 - r); // lossless layers

    return [
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#f87171" } },
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "Transmittance", line: { color: "#60a5fa" } },
    ];
  }, [nH, nL, nSub, nInc, numPairs, designWl]);

  const dH = designWl / (4 * nH);
  const dL = designWl / (4 * nL);
  const rMax = quarterWaveStackReflectance(nInc, Array.from({ length: numPairs * 2 }, (_, j) => (j % 2 === 0 ? nH : nL)), nSub);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Cold Mirror Design" description="Cold mirrors reflect visible light while transmitting infrared. Used in projector systems,
        illumination optics, and laser setups to separate visible from IR (heat). The (HL)N stack
        is a high-reflector centered in the visible band, while IR passes through the stop band edges.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>H</sub> (high index)</>} value={nH} onChange={setNH} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub> (low index)</>} value={nL} onChange={setNL} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} step="0.01" />
        <ValidatedNumberInput label="Number of pairs (N)" value={numPairs} onChange={setNumPairs} min={1} max={20} />
        <ValidatedNumberInput label="Design λ₀ (nm) — visible center" value={designWl} onChange={setDesignWl} step="10" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">d<sub>H</sub> = <span className="text-blue-400 font-mono">{dH.toFixed(1)} nm</span>, d<sub>L</sub> = <span className="text-blue-400 font-mono">{dL.toFixed(1)} nm</span></p>
        <p className="text-gray-300">R<sub>max</sub> (at λ₀) = <span className="text-blue-400 font-mono">{(rMax * 100).toFixed(4)}%</span></p>
        <p className="text-gray-300">Total layers = <span className="text-blue-400 font-mono">{numPairs * 2}</span></p>
        <p className="text-gray-300 text-xs mt-2">R<sub>max</sub> = [(n<sub>inc</sub> − Y) / (n<sub>inc</sub> + Y)]², Y = (n<sub>H</sub>/n<sub>L</sub>)<sup>2N</sup> n<sub>sub</sub></p>
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
