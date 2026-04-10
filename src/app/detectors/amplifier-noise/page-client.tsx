"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function AmplifierNoisePage() {
  const [en, setEn] = useURLState("en", 5);
  const [gain, setGain] = useURLState("gain", 2);
  const [signal, setSignal] = useURLState("signal", 1000);

  const noiseDn = en / gain;
  const shotNoise = Math.sqrt(signal);
  const totalNoise = Math.sqrt(signal + en * en);
  const snrAmp = signal / en;
  const snrTotal = totalNoise > 0 ? signal / totalNoise : 0;
  // Minimum detectable signal: signal where total SNR = 3
  // 3 = S / √(S + en²)  →  9(S + en²) = S²  →  S² - 9S - 9en² = 0
  // S = (9 + √(81 + 36en²)) / 2
  const minDetectable = (9 + Math.sqrt(81 + 36 * en * en)) / 2;

  const chartData = useMemo(() => {
    const enVals = Array.from({ length: 200 }, (_, i) => 0.5 + (i / 200) * 49.5);
    const noiseDnVals = enVals.map(e => e / gain);
    const snrAmpVals = enVals.map(e => signal / e);
    const snrTotalVals = enVals.map(e => {
      const tn = Math.sqrt(signal + e * e);
      return tn > 0 ? signal / tn : 0;
    });
    return [
      { x: enVals, y: noiseDnVals, type: "scatter" as const, mode: "lines" as const, name: "Noise (DN)", line: { color: "#f87171" }, yaxis: "y" },
      { x: enVals, y: snrAmpVals, type: "scatter" as const, mode: "lines" as const, name: `Amp-limited SNR`, line: { color: "#60a5fa", width: 2 }, yaxis: "y2" },
      { x: enVals, y: snrTotalVals, type: "scatter" as const, mode: "lines" as const, name: `Total SNR (shot+amp)`, line: { color: "#34d399", width: 2, dash: "dash" as const }, yaxis: "y2" },
    ];
  }, [en, gain, signal]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Amplifier Noise" description="Input-referred noise sets the detection floor. σ_amp = e_n.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Input noise eₙ (e⁻ rms)" value={en} onChange={setEn} step="0.5" min={0.1} />
        <ValidatedNumberInput label="Conversion gain (e⁻/DN)" value={gain} onChange={setGain} step="0.1" min={0.1} />
        <ValidatedNumberInput label="Signal level (e⁻)" value={signal} onChange={setSignal} step="100" min={1} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <ResultCard label="Noise in DN" value={noiseDn.toFixed(2)} tone="red" />
        <ResultCard label="Shot noise (e⁻)" value={shotNoise.toFixed(1)} tone="orange" />
        <ResultCard label="Total noise (e⁻)" value={totalNoise.toFixed(1)} tone="red" />
        <ResultCard label="Total SNR" value={snrTotal.toFixed(1)} tone="blue" />
        <ResultCard label="Min Detectable (3σ)" value={`${minDetectable.toFixed(1)} e⁻`} tone="yellow" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>σ_total = √(S + eₙ²) — quadrature sum of shot noise and amplifier noise</p>
        <p>SNR = S / σ_total — at high signal, shot noise (√S) dominates; at low signal, amplifier noise (eₙ) dominates</p>
        <p>S_min = (9 + √(81 + 36·eₙ²)) / 2 — signal at which total SNR = 3</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Input noise eₙ (e⁻ rms)", gridcolor: "#374151" }, yaxis: { title: "Noise (DN)", gridcolor: "#374151" }, yaxis2: { title: "SNR", gridcolor: "#374151", overlaying: "y", side: "right" } }} />
    </CalculatorShell>
  );
}
