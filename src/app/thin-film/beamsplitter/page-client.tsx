"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { quarterWaveLayers, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function BeamsplitterPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [designWl, setDesignWl] = useURLState("designWl", 550);
  const [targetR, setTargetR] = useURLState("targetR", 50); // 50/50 beamsplitter

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 300 + i * 600 / 500);
    const lambdas = wls.map((wl) => wl * 1e-9);
    const designLambda = designWl * 1e-9;

    const traces: any[] = [];

    // Single quarter-wave layer for several film indices
    const nFilms = [1.7, 2.0, 2.35, 2.7];
    const colors = ["#f87171", "#fbbf24", "#34d399", "#60a5fa"];

    for (let fi = 0; fi < nFilms.length; fi++) {
      const nF = nFilms[fi];
      const R = reflectanceSpectrum({ incident: nInc, layers: quarterWaveLayers([nF], designLambda), substrate: { n: nSub } }, lambdas);

      traces.push({
        x: wls, y: R, type: "scatter" as const, mode: "lines" as const,
        name: `n_film = ${nF}`,
        line: { color: colors[fi], width: 2 },
      });
    }

    // Also show multilayer approach: (HL)^N with varying N
    const Ns = [1, 2, 3];
    const mlColors = ["#a78bfa", "#fb923c", "#f472b6"];

    for (let ni = 0; ni < Ns.length; ni++) {
      const indices = Array.from({ length: Ns[ni] * 2 }, (_, j) => (j % 2 === 0 ? nH : nL));
      const layers = quarterWaveLayers(indices, designLambda);
      const R = reflectanceSpectrum({ incident: nInc, layers, substrate: { n: nSub } }, lambdas);
      traces.push({
        x: wls, y: R, type: "scatter" as const, mode: "lines" as const,
        name: `(HL)^${Ns[ni]}`,
        line: { color: mlColors[ni], width: 1.5, dash: "dash" },
      });
    }

    // 50% line
    traces.push({
      x: [300, 900], y: [0.5, 0.5], type: "scatter" as const, mode: "lines" as const,
      name: "50% line", line: { color: "#6b7280", width: 1, dash: "dot" },
    });

    return traces;
  }, [nH, nL, nSub, nInc, designWl, targetR]);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Beamsplitter Design" description="Dielectric beamsplitters split light into reflected and transmitted beams. A single quarter-wave
        layer gives R &lt; 50% for most materials; multilayer (HL)N stacks approach 100%.
        A 50/50 split is achieved with specific layer thicknesses (non-quarter-wave) or by selecting
        the appropriate number of layer pairs near the stop band edge.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>H</sub> (high index)</>} value={nH} onChange={setNH} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub> (low index)</>} value={nL} onChange={setNL} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} step="0.01" />
        <ValidatedNumberInput label="Design λ₀ (nm)" value={designWl} onChange={setDesignWl} step="10" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300 text-xs">Single layer QWL R<sub>max</sub> = [(n<sub>f</sub>² − n<sub>inc</sub>·n<sub>sub</sub>) / (n<sub>f</sub>² + n<sub>inc</sub>·n<sub>sub</sub>)]²</p>
        <p className="text-gray-300 text-xs">Solid lines: single QWL layer with varying n<sub>film</sub>. Dashed: (HL)<sup>N</sup> multilayer.</p>
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
