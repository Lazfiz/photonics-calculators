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

  const chartData = useMemo(() => {
    const enVals = Array.from({ length: 200 }, (_, i) => 0.5 + (i / 200) * 49.5);
    const noiseDn = enVals.map(e => e / gain);
    const snrAtSignal = enVals.map(e => signal / e);
    return [
      { x: enVals, y: noiseDn, type: "scatter" as const, mode: "lines" as const, name: "Noise (DN)", line: { color: "#f87171" }, yaxis: "y" },
      { x: enVals, y: snrAtSignal, type: "scatter" as const, mode: "lines" as const, name: `SNR at ${signal} e⁻`, line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [en, gain, signal]);

  const noiseDn = en / gain;
  const snr = signal / en;

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Amplifier Noise" description="Input-referred noise sets the detection floor. σ_amp = e_n.">
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Input noise eₙ (e⁻ rms)" value={en} onChange={setEn} step="0.5" />
        <ValidatedNumberInput label="Conversion gain (e⁻/DN)" value={gain} onChange={setGain} step="0.1" />
        <ValidatedNumberInput label="Signal level (e⁻)" value={signal} onChange={setSignal} step="100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Noise in DN" value={noiseDn.toFixed(2)} tone="red" />
        <ResultCard label="SNR" value={snr.toFixed(1)} tone="blue" />
        <ResultCard label="Min Detectable (3σ)" value={`${(en * 3).toFixed(1)} e⁻`} tone="yellow" />
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Input noise eₙ (e⁻ rms)", gridcolor: "#374151" }, yaxis: { title: "Noise (DN)", gridcolor: "#374151" }, yaxis2: { title: "Max SNR", gridcolor: "#374151", overlaying: "y", side: "right" } }} />
    </CalculatorShell>
  );
}
