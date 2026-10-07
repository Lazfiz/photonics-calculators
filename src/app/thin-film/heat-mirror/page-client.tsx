"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c2_radiation } from "../../../physics/constants";
import { quarterWaveLayers, quarterWaveStackReflectance, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function HeatMirrorPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [numPairs, setNumPairs] = useURLState("numPairs", 5);
  const [designWl, setDesignWl] = useURLState("designWl", 10000); // IR heat mirror: reflect ~10μm

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 250 + i * 14750 / 500);
    const lambdas = wls.map((wl) => wl * 1e-9);

    // (LH)^N quarter-wave stack centred in the IR
    const indices = Array.from({ length: numPairs * 2 }, (_, j) => (j % 2 === 0 ? nL : nH));
    const layers = quarterWaveLayers(indices, designWl * 1e-9);

    const R = reflectanceSpectrum({ incident: nInc, layers, substrate: { n: nSub } }, lambdas);
    const T = R.map((r) => 1 - r); // lossless layers

    // Solar spectrum as a 5800 K blackbody, Planck's law B_λ ∝ λ⁻⁵ / (e^(c₂/λT) − 1), normalized below
    const bbSun = lambdas.map((lam) => lam ** -5 / Math.expm1(Math.min(c2_radiation / (lam * 5800), 700)));
    const maxBBSun = Math.max(...bbSun);
    const normSun = bbSun.map(v => v / maxBBSun);

    return [
      { x: wls, y: normSun, type: "scatter" as const, mode: "lines" as const, name: "Solar BB (5800K, norm.)", line: { color: "#fbbf24", width: 1, dash: "dot" }, yaxis: "y2" },
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#f87171" } },
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "Transmittance", line: { color: "#60a5fa" } },
    ];
  }, [nH, nL, nSub, nInc, numPairs, designWl]);

  const dH = designWl / (4 * nH);
  const dL = designWl / (4 * nL);
  const rMax = quarterWaveStackReflectance(nInc, Array.from({ length: numPairs * 2 }, (_, j) => (j % 2 === 0 ? nL : nH)), nSub);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Heat Mirror Design" description="Heat mirrors reflect infrared (thermal radiation) while transmitting visible light.
        A quarter-wave stack centered in the IR (e.g., 8–12 μm) reflects thermal radiation from room-temperature objects.
        Solar radiation (~0.3–2.5 μm) passes through. Critical for energy-efficient windows and thermal management.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>H</sub> (high index, e.g. TiO₂)</>} value={nH} onChange={setNH} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub> (low index, e.g. SiO₂)</>} value={nL} onChange={setNL} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} step="0.01" />
        <ValidatedNumberInput label="Number of pairs (N)" value={numPairs} onChange={setNumPairs} min={1} max={20} />
        <ValidatedNumberInput label="Design λ₀ (nm) — IR center" value={designWl} onChange={setDesignWl} step="100" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">d<sub>H</sub> = <span className="text-blue-400 font-mono">{dH.toFixed(1)} nm</span>, d<sub>L</sub> = <span className="text-blue-400 font-mono">{dL.toFixed(1)} nm</span></p>
        <p className="text-gray-300">R<sub>max</sub> (at λ₀) = <span className="text-blue-400 font-mono">{(rMax * 100).toFixed(4)}%</span></p>
        <p className="text-gray-300">Total layers = <span className="text-blue-400 font-mono">{numPairs * 2}</span></p>
        <p className="text-gray-300 text-xs mt-2">Formula: R<sub>max</sub> = [(n<sub>inc</sub> − Y) / (n<sub>inc</sub> + Y)]², Y = (n<sub>L</sub>/n<sub>H</sub>)<sup>2N</sup> n<sub>sub</sub></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151", range: [250, 15000] },
        yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
        yaxis2: { title: "Solar BB (norm.)", overlaying: "y", side: "right", gridcolor: "#374151", range: [0, 1.2], showgrid: false },
        margin: { t: 20, b: 40, l: 50, r: 50 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 10 } },
      }} />
    </CalculatorShell>
  );
}
