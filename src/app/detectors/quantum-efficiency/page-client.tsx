"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";
import { useURLState } from "../../../hooks/use-url-state";
const detectorPresets = {
  silicon: { label: "Silicon (Si)", fill: 0.95, gain: 1.0 },
  ingaas: { label: "InGaAs", fill: 0.92, gain: 1.0 },
  ccd: { label: "CCD (Back-illuminated)", fill: 0.98, gain: 1.0 },
  mcd: { label: "CMOS (Front-illuminated)", fill: 0.75, gain: 1.1 },
} as const;

type DetType = keyof typeof detectorPresets;
const currentHref = "/detectors/quantum-efficiency";

function qeAt(detType: DetType, w: number, fillFactor: number, microlensGain: number) {
  let base = 0;
  if (detType === "silicon") {
    if (w < 350) base = 0;
    else if (w < 600) base = 0.82 * (1 - Math.exp(-(w - 350) / 90));
    else if (w < 900) base = 0.82 + 0.08 * Math.sin(Math.PI * (w - 600) / 600);
    else if (w <= 1100) base = 0.9 * Math.exp(-(w - 900) / 90);
  } else if (detType === "ingaas") {
    if (w < 900) base = 0;
    else if (w < 1100) base = 0.86 * (1 - Math.exp(-(w - 900) / 70));
    else if (w < 1600) base = 0.86 + 0.04 * Math.sin(Math.PI * (w - 1100) / 500);
    else if (w <= 1700) base = 0.86 * Math.exp(-(w - 1600) / 45);
  } else if (detType === "ccd") {
    if (w < 300) base = 0;
    else if (w < 500) base = 0.9 * (1 - Math.exp(-(w - 300) / 70));
    else if (w < 850) base = 0.9 + 0.05 * Math.sin(Math.PI * (w - 500) / 700);
    else if (w <= 1000) base = 0.95 * Math.exp(-(w - 850) / 70);
  } else {
    if (w < 350) base = 0;
    else if (w < 550) base = 0.6 * (1 - Math.exp(-(w - 350) / 80));
    else if (w < 750) base = 0.6 + 0.08 * Math.sin(Math.PI * (w - 550) / 400);
    else if (w <= 950) base = 0.68 * Math.exp(-(w - 750) / 90);
  }
  return base * Math.min(1, fillFactor * microlensGain);
}

export default function QuantumEfficiencyPage() {
  const [detType, setDetType] = useState<DetType>("silicon");
  const [fillFactor, setFillFactor] = useState<number>(detectorPresets.silicon.fill);
  const [microlensGain, setMicrolensGain] = useState<number>(detectorPresets.silicon.gain);
  const [probeWavelength, setProbeWavelength] = useURLState("probeWavelength", 850);

  const qeModel = useMemo(() => qeAt(detType, probeWavelength, fillFactor, microlensGain), [detType, probeWavelength, fillFactor, microlensGain]);

  const chartSeries = useMemo(() => {
    const wl = Array.from({ length: 320 }, (_, i) => 300 + i * 4.5);
    const curve = wl.map((w) => qeAt(detType, w, fillFactor, microlensGain) * 100);
    return [{ name: "QE", color: "#60a5fa", points: wl.map((x, i) => ({ x, y: curve[i] })) }, { name: "Probe", color: "#22c55e", showPoints: true, points: [{ x: probeWavelength, y: qeModel * 100 }] }];
  }, [detType, fillFactor, microlensGain, probeWavelength, qeModel]);

  const peakWl = useMemo(() => {
    let bestW = 300;
    let best = -1;
    for (let w = 300; w <= 1700; w += 1) {
      const val = qeAt(detType, w, fillFactor, microlensGain);
      if (val > best) {
        best = val;
        bestW = w;
      }
    }
    return { peakWl: bestW, peakQE: best };
  }, [detType, fillFactor, microlensGain]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Quantum Efficiency" description="Interactive detector QE explorer with detector presets, fill factor, microlens gain, and wavelength response curves.">
      <div className="mb-5 flex flex-wrap gap-2">
        {(Object.entries(detectorPresets) as [DetType, typeof detectorPresets[DetType]][]).map(([key, preset]) => (
          <button key={key} onClick={() => { setDetType(key); setFillFactor(preset.fill); setMicrolensGain(preset.gain); }} className={`rounded-full border px-3 py-1 text-sm transition ${detType === key ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>{preset.label}</button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <InputSlider label="Fill factor" value={fillFactor} onChange={setFillFactor} min={0.1} max={1} step={0.01} />
        <InputSlider label="Microlens gain" value={microlensGain} onChange={setMicrolensGain} min={0.5} max={1.5} step={0.01} />
        <InputSlider label="Probe wavelength" value={probeWavelength} onChange={setProbeWavelength} min={300} max={1700} step={1} unit="nm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="QE at probe λ" value={`${(qeModel * 100).toFixed(1)}%`} tone="blue" />
        <ResultCard label="Peak QE" value={`${(peakWl.peakQE * 100).toFixed(1)}%`} tone="green" />
        <ResultCard label="Peak wavelength" value={`${peakWl.peakWl.toFixed(0)} nm`} tone="yellow" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-300">
        Effective QE = η<sub>intrinsic</sub> × fill factor × microlens gain
      </div>

      <SimpleLineChart title="Detector quantum efficiency" xLabel="Wavelength (nm)" yLabel="QE (%)" series={chartSeries} />

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
  );
}
