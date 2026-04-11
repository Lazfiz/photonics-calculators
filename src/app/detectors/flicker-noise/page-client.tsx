"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function FlickerNoisePage() {
  const [kf, setKf] = useURLState("kf", 1e-24);
  const [current, setCurrent] = useURLState("current", 1e-6);
  const [alpha, setAlpha] = useURLState("alpha", 1);
  const [fLow, setFLow] = useURLState("fLow", 1);
  const [fHigh, setFHigh] = useURLState("fHigh", 1e6);

  const thermalPSD = 4 * 1.381e-23 * 300 / 50; // 4kT/R at 300K, 50Ω

  const chartData = useMemo(() => {
    const freqs = Array.from({ length: 200 }, (_, i) => Math.pow(1e8, i / 200));
    return [
      { x: freqs, y: freqs.map(f => kf * current ** alpha / f), type: "scatter" as const, mode: "lines" as const, name: "1/f PSD", line: { color: "#f87171" } },
      { x: freqs, y: freqs.map(() => thermalPSD), type: "scatter" as const, mode: "lines" as const, name: "Thermal floor", line: { color: "#60a5fa", dash: "dash" } },
    ];
  }, [kf, current, alpha]);
  const flickerNoiseRms = Math.sqrt(kf * current ** alpha * Math.log(fHigh / fLow));
  const cornerFreq = kf * current ** alpha / thermalPSD;

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="1/f Flicker Noise" description="Flicker noise: S_i(f) = K_f · I^α / f. Noise spectral density falls as 1/f.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="K_f (A²)" value={kf} onChange={setKf} step="1e-25" />
        <ValidatedNumberInput label="Current (A)" value={current} onChange={setCurrent} step="1e-7" />
        <ValidatedNumberInput label="Exponent α" value={alpha} onChange={setAlpha} step="0.1" />
        <ValidatedNumberInput label="f_low (Hz)" value={fLow} onChange={setFLow} />
        <ValidatedNumberInput label="f_high (Hz)" value={fHigh} onChange={setFHigh} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="1/f Noise (rms)" value={flickerNoiseRms.toExponential(3) + " A"} tone="blue" />
        <ResultCard label="Corner Freq" value={cornerFreq.toExponential(3) + " Hz"} tone="yellow" />
        <ResultCard label="Decade Count" value={Math.log10(fHigh / fLow).toFixed(1)} tone="green" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono"><p>σ_flicker = √(K_f · I^α · ln(f_high/f_low))</p></div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Frequency (Hz)", type: "log", gridcolor: "#374151" }, yaxis: { title: "PSD (A²/Hz)", type: "log", gridcolor: "#374151" } }} />
    </CalculatorShell>
  );
}
