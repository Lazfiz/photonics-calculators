"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";
import { useURLState } from "../../../hooks/use-url-state";
const concentrationPresets = [0.001, 0.01, 0.05, 0.1];
const pathPresets = [0.1, 1, 5, 10];
const epsilonPresets = [1000, 10000, 50000, 100000];
const currentHref = "/spectroscopy/lambert-beer-law";

export default function LambertBeerLawPage() {
  const [concentration, setConcentration] = useURLState("concentration", 0.01);
  const [pathLength, setPathLength] = useURLState("pathLength", 1);
  const [extinctionCoeff, setExtinctionCoeff] = useURLState("extinctionCoeff", 50000);
  const [plotVar, setPlotVar] = useState<"conc" | "path" | "epsilon">("conc");

  const absorbance = extinctionCoeff * concentration * pathLength;
  const transmission = Math.pow(10, -absorbance);
  const od = absorbance;

  const series = useMemo(() => {
    const n = 200;
    let xs: number[], ys1: number[];
    if (plotVar === "conc") {
      const cMax = Math.max(concentration * 5, 0.05);
      xs = Array.from({ length: n }, (_, i) => (i / n) * cMax);
      ys1 = xs.map((c) => extinctionCoeff * c * pathLength);
    } else if (plotVar === "path") {
      const pMax = Math.max(pathLength * 5, 5);
      xs = Array.from({ length: n }, (_, i) => (i / n) * pMax);
      ys1 = xs.map((l) => extinctionCoeff * concentration * l);
    } else {
      const eMax = Math.max(extinctionCoeff * 2, 100000);
      xs = Array.from({ length: n }, (_, i) => (i / n) * eMax);
      ys1 = xs.map((e) => e * concentration * pathLength);
    }
    return [
      { name: "Absorbance", color: "#60a5fa", points: xs.map((x, i) => ({ x, y: ys1[i] })) },
      { name: "Transmission %", color: "#34d399", dashed: true, points: xs.map((x, i) => ({ x, y: Math.pow(10, -ys1[i]) * 100 })) },
    ];
  }, [concentration, pathLength, extinctionCoeff, plotVar]);

  const xLabel = plotVar === "conc" ? "Concentration (mol/L)" : plotVar === "path" ? "Path Length (cm)" : "ε (L·mol⁻¹·cm⁻¹)";

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Lambert-Beer Law Calculator" description="Comprehensive Beer-Lambert law analysis with sliders, presets, and interactive parameter sweeps.">
      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          {concentrationPresets.map((preset) => (
            <button key={`c-${preset}`} onClick={() => setConcentration(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${concentration === preset ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
              c = {preset}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {pathPresets.map((preset) => (
            <button key={`l-${preset}`} onClick={() => setPathLength(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${pathLength === preset ? "border-green-400 bg-green-500/15 text-green-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
              l = {preset} cm
            </button>
          ))}
          {epsilonPresets.map((preset) => (
            <button key={`e-${preset}`} onClick={() => setExtinctionCoeff(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${extinctionCoeff === preset ? "border-purple-400 bg-purple-500/15 text-purple-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
              ε = {preset.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <InputSlider label="Concentration" value={concentration} onChange={setConcentration} min={0} max={0.2} step={0.001} unit="mol/L" />
        <InputSlider label="Path Length" value={pathLength} onChange={setPathLength} min={0.1} max={10} step={0.1} unit="cm" />
        <InputSlider label="Extinction coefficient ε" value={extinctionCoeff} onChange={setExtinctionCoeff} min={0} max={200000} step={1000} unit="L·mol⁻¹·cm⁻¹" />
      </div>

      <div role="group" aria-label="Options" className="flex gap-2 mb-6 flex-wrap">
        {(["conc", "path", "epsilon"] as const).map((v) => (
          <button key={v} onClick={() => setPlotVar(v)} className={`px-3 py-1 rounded text-sm ${plotVar === v ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}>
            {v === "conc" ? "Sweep Concentration" : v === "path" ? "Sweep Path Length" : "Sweep ε"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Absorbance (A)" value={absorbance.toFixed(4)} tone="blue" />
        <ResultCard label="Optical Density (OD)" value={od.toFixed(4)} tone="green" />
        <ResultCard label="Transmission" value={`${(transmission * 100).toFixed(2)}%`} tone="yellow" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">A = ε · c · l</p>
        <p className="font-mono text-green-400">T = 10⁻ᴬ</p>
        <p className="font-mono text-purple-400">OD = A = −log₁₀(T)</p>
        <p className="text-gray-500 text-xs mt-2">Lambert: intensity decreases exponentially with path length. Beer: proportional to concentration.</p>
      </div>

      <SimpleLineChart title="Beer-Lambert sweep" xLabel={xLabel} yLabel="Value" yScale="log" series={series} />

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
  );
}
