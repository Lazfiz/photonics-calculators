"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";

export default function GainBandwidthPage() {
  const [gainDC, setGainDC] = useState(1000);
  const [gbwProduct, setGbwProduct] = useState(1e6);
  const [feedbackFraction, setFeedbackFraction] = useState(0.01);

  const f3dB = gbwProduct / gainDC;
  const closedLoopGain = 1 / feedbackFraction;
  const closedLoopBW = gbwProduct / closedLoopGain;

  const chartData = useMemo(() => {
    const freq = Array.from({ length: 300 }, (_, i) => 10 + Math.pow(1e8, i / 300));
    const f = gbwProduct / gainDC;
    const openLoop = freq.map(fr => gainDC / Math.sqrt(1 + Math.pow(fr / f, 2)));
    const beta = feedbackFraction;
    const closedLoop = freq.map(fr => {
      const aF = gainDC / Math.sqrt(1 + Math.pow(fr / f, 2));
      const phase = Math.atan(fr / f);
      return Math.abs(aF * Math.cos(phase) / (1 + beta * aF * Math.cos(phase)));
    });
    return [
      { x: freq, y: openLoop, type: "scatter" as const, mode: "lines" as const, name: "Open-loop", line: { color: "#60a5fa", width: 2 } },
      { x: freq, y: closedLoop, type: "scatter" as const, mode: "lines" as const, name: "Closed-loop", line: { color: "#f87171", width: 2, dash: "dash" } },
    ];
  }, [gainDC, gbwProduct, feedbackFraction]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Gain-Bandwidth Product" description="GBW = A₀ · f₋₃dB. The product of DC gain and bandwidth is constant for a single-pole system.">
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="DC Gain (V/V)" value={gainDC} onChange={setGainDC} />
        <ValidatedNumberInput label="GBW Product (Hz)" value={gbwProduct} onChange={setGbwProduct} />
        <ValidatedNumberInput label="Feedback β" value={feedbackFraction} onChange={setFeedbackFraction} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Open-loop f₋₃dB" value={f3dB.toExponential(2) + " Hz"} tone="blue" />
        <ResultCard label="Closed-loop Gain" value={`${closedLoopGain.toFixed(1)} V/V`} tone="green" />
        <ResultCard label="Closed-loop BW" value={closedLoopBW.toExponential(2) + " Hz"} tone="yellow" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono"><p>A(f) = A₀ / √(1 + (f/f₋₃dB)²)</p></div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Frequency (Hz)", type: "log", gridcolor: "#374151" }, yaxis: { title: "Gain (V/V)", type: "log", gridcolor: "#374151" } }} />
    </CalculatorShell>
  );
}
