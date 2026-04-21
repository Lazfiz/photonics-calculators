"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function CrosstalkPage() {
  const [pixelPitch, setPixelPitch] = useURLState("pixelPitch", 5.4);
  const [diffusionLength, setDiffusionLength] = useURLState("diffusionLength", 2.0);
  const [absorptionDepth, setAbsorptionDepth] = useURLState("absorptionDepth", 3.0);
  const [depletionWidth, setDepletionWidth] = useURLState("depletionWidth", 2.0);

  const Ldiff = Math.max(diffusionLength, 0.01);
  const Labs = Math.max(absorptionDepth, 0.01);

  const chartData = useMemo(() => {
    const N = 50; const x: number[] = []; const y: number[] = []; const z: number[][] = [];
    for (let i = 0; i < N; i++) {
      const row: number[] = [];
      const xi = (i - N/2) * 3 * pixelPitch / N;
      x.push(xi);
      for (let j = 0; j < N; j++) {
        if (i === 0) y.push((j - N/2) * 3 * pixelPitch / N);
        const yj = (j - N/2) * 3 * pixelPitch / N;
        const r = Math.sqrt(xi*xi + yj*yj);
        // Diffusion comes from charge generated BEYOND depletion (neutral bulk)
        const bulkFraction = Math.exp(-depletionWidth / Labs);
        row.push(Math.exp(-r / Ldiff) * bulkFraction * 100);
      }
      z.push(row);
    }
    return [{ x, y, z, type: "heatmap" as const, colorscale: "Blues", name: "Charge collection %" }];
  }, [pixelPitch, Ldiff, Labs, depletionWidth]);

  const crosstalkLine = useMemo(() => {
    const pitches = Array.from({ length: 100 }, (_, i) => 1 + i * 0.1);
    return [{ x: pitches, y: pitches.map(p => 100 * Math.exp(-p / (2 * Ldiff))), type: "scatter" as const, mode: "lines" as const, name: "Crosstalk (%)", line: { color: "#f87171", width: 2 } }];
  }, [Ldiff]);

  const crosstalkToNeighbor = 100 * Math.exp(-pixelPitch / (2 * Ldiff));
  const chargeInDepletion = (1 - Math.exp(-depletionWidth / Labs)) * 100;
  const mtfAtNyquist = 1 / (1 + Math.pow(Math.PI * diffusionLength / pixelPitch, 2));

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Pixel Crosstalk" description="Optical and electrical crosstalk between adjacent pixels due to charge diffusion.">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Pixel Pitch (μm)" value={pixelPitch} onChange={setPixelPitch} />
        <ValidatedNumberInput label="Diffusion Length (μm)" value={diffusionLength} onChange={setDiffusionLength} />
        <ValidatedNumberInput label="Absorption Depth (μm)" value={absorptionDepth} onChange={setAbsorptionDepth} />
        <ValidatedNumberInput label="Depletion Width (μm)" value={depletionWidth} onChange={setDepletionWidth} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Crosstalk to Neighbor" value={`${crosstalkToNeighbor.toFixed(2)}%`} tone="red" />
        <ResultCard label="Charge in Depletion" value={`${chargeInDepletion.toFixed(1)}%`} tone="green" />
        <ResultCard label="MTF at Nyquist" value={mtfAtNyquist.toFixed(3)} tone="blue" />
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "x (μm)", gridcolor: "#374151" }, yaxis: { title: "y (μm)", gridcolor: "#374151" } }} title="Charge Collection Map" />
      <ChartPanel data={crosstalkLine} layout={{ xaxis: { title: "Pixel Pitch (μm)", gridcolor: "#374151" }, yaxis: { title: "Crosstalk (%)", gridcolor: "#374151" } }} title="Crosstalk vs Pitch" />
    </CalculatorShell>
  );
}
