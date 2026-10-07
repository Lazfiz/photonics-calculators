"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { quarterWaveLayers, reflectanceSpectrum, type Layer } from "../../../physics/thin-film/transfer-matrix";

export default function WavelengthSeparationPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [numPairs, setNumPairs] = useURLState("numPairs", 5);
  const [designWl, setDesignWl] = useURLState("designWl", 550);
  const [bandwidthFactor, setBandwidthFactor] = useURLState("bandwidthFactor", 1.0); // 1.0 = QWL, >1 = broader

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 600 }, (_, i) => 300 + i * 600 / 600);
    const lambdas = wls.map((wl) => wl * 1e-9);

    // Two-stack approach: stack A centered at λ₁, stack B centered at λ₂
    // Reflects λ₁, transmits λ₂ (or vice versa)
    const sepRatio = 1.25; // λ₂/λ₁ ratio
    const lambda1 = designWl;
    const lambda2 = designWl * sepRatio;

    // (HL)^N quarter-wave stacks: A reflects λ₁, B reflects λ₂
    const indices = Array.from({ length: numPairs * 2 }, (_, j) => (j % 2 === 0 ? nH : nL));
    const layersA = quarterWaveLayers(indices, lambda1 * 1e-9);
    const layersB = quarterWaveLayers(indices, lambda2 * 1e-9);

    // Combined: A on top of B
    const layersAB = [...layersA, ...layersB];

    const spectrum = (layers: Layer[]) => reflectanceSpectrum({ incident: nInc, layers, substrate: { n: nSub } }, lambdas);
    const R_A = spectrum(layersA);
    const R_B = spectrum(layersB);
    const R_AB = spectrum(layersAB);

    return [
      { x: wls, y: R_A, type: "scatter" as const, mode: "lines" as const,
        name: `Reflects λ₁ = ${lambda1} nm`, line: { color: "#f87171", width: 2 } },
      { x: wls, y: R_B, type: "scatter" as const, mode: "lines" as const,
        name: `Reflects λ₂ = ${lambda2} nm`, line: { color: "#60a5fa", width: 2 } },
      { x: wls, y: R_AB, type: "scatter" as const, mode: "lines" as const,
        name: "Combined stack", line: { color: "#34d399", width: 2, dash: "dash" } },
    ];
  }, [nH, nL, nSub, nInc, numPairs, designWl, bandwidthFactor]);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Wavelength Separation" description="Wavelength separation coatings combine multiple quarter-wave stacks at different design wavelengths
        to reflect specific bands while transmitting others. Two stacks centered at λ₁ and λ₂ = 1.25·λ₁
        demonstrate dichroic behavior. The combined stack shows how reflectance bands add when cascaded.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>H</sub></>} value={nH} onChange={setNH} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub></>} value={nL} onChange={setNL} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} step="0.01" />
        <ValidatedNumberInput label="Pairs per stack (N)" value={numPairs} onChange={setNumPairs} min={1} max={20} />
        <ValidatedNumberInput label="λ₁ center (nm)" value={designWl} onChange={setDesignWl} step="10" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">λ₁ = <span className="text-blue-400 font-mono">{designWl} nm</span>, λ₂ = <span className="text-blue-400 font-mono">{(designWl * 1.25).toFixed(0)} nm</span></p>
        <p className="text-gray-300">Total layers (combined) = <span className="text-blue-400 font-mono">{numPairs * 4}</span></p>
        <p className="text-gray-300 text-xs mt-2">Each stack: (HL)<sup>N</sup>. Combined: Stack₁ | Stack₂ on substrate.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 10 } },
      }} />
    </CalculatorShell>
  );
}
