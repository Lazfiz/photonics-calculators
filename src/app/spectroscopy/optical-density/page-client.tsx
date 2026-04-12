"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";
import { useURLState } from "../../../hooks/use-url-state";
const odPresets = [0.1, 0.3, 1, 2, 3, 4, 6];
const currentHref = "/spectroscopy/optical-density";

export default function OpticalDensityPage() {
  const [transmission, setTransmission] = useURLState("transmission", 1);
  const [absorbance, setAbsorbance] = useURLState("absorbance", 2);
  const [inputMode, setInputMode] = useState<"trans" | "abs">("abs");

  const abs = inputMode === "abs" ? absorbance : -Math.log10(Math.max(transmission, 1e-9) / 100);
  const trans = inputMode === "trans" ? transmission : Math.pow(10, -absorbance) * 100;
  const attenuationDB = 10 * abs;
  const neutralDensity = abs;

  const series = useMemo(() => {
    const od = Array.from({ length: 300 }, (_, i) => (i / 299) * 8);
    const tPct = od.map((a) => Math.pow(10, -a) * 100);
    const absorbed = od.map((a) => Math.max(0, (1 - Math.pow(10, -a)) * 100));
    return [
      { name: "Transmission (%)", color: "#60a5fa", points: od.map((x, i) => ({ x, y: tPct[i] })) },
      { name: "Absorption (%)", color: "#f87171", dashed: true, points: od.map((x, i) => ({ x, y: absorbed[i] })) },
      { name: "Current", color: "#34d399", showPoints: true, points: [{ x: abs, y: trans }] },
    ];
  }, [abs, trans]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Optical Density" description="Convert optical density (OD), transmission, and attenuation with presets and interactive sliders.">
      <div className="mb-5 flex flex-wrap gap-2">
        {odPresets.map((preset) => (
          <button key={preset} onClick={() => { setAbsorbance(preset); setInputMode("abs"); }} className={`rounded-full border px-3 py-1 text-sm transition ${inputMode === "abs" && absorbance === preset ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
            OD {preset}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <InputSlider label="Absorbance (OD)" value={abs} onChange={(v) => { setAbsorbance(v); setInputMode("abs"); }} min={0} max={8} step={0.01} />
        <InputSlider label="Transmission" value={trans} onChange={(v) => { setTransmission(v); setInputMode("trans"); }} min={0.0001} max={100} step={0.01} unit="%" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard label="Optical Density" value={abs.toFixed(3)} tone="blue" />
        <ResultCard label="Transmission" value={`${trans.toFixed(3)}%`} tone="green" />
        <ResultCard label="Attenuation" value={`${attenuationDB.toFixed(1)} dB`} tone="orange" />
        <ResultCard label="Neutral Density" value={`ND ${neutralDensity.toFixed(3)}`} tone="purple" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Reference Values</h3>
        <div className="grid grid-cols-2 gap-1 text-sm text-gray-300">
          {odPresets.map((od) => (
            <p key={od}>OD <span className="text-blue-400">{od}</span> → <span className="text-green-400">{(Math.pow(10, -od) * 100).toPrecision(4)}%</span> T</p>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400 font-mono">OD = −log₁₀(T)</span></p>
        <p><span className="text-green-400 font-mono">T = 10^(−OD)</span></p>
        <p><span className="text-orange-400 font-mono">Attenuation (dB) = 10 × OD</span></p>
      </div>

      <SimpleLineChart title="Transmission and absorption vs optical density" xLabel="Optical Density (OD)" yLabel="Percentage (%)" yScale="log" series={series} />

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
  );
}
