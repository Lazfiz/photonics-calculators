"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function EmGainPage() {
  const [emGain, setEmGain] = useURLState("emGain", 100);
  const [inputSignal, setInputSignal] = useURLState("inputSignal", 10);
  const [clockInducedCharge, setClockInducedCharge] = useURLState("clockInducedCharge", 0.001);
  const [excessNoiseFactor, setExcessNoiseFactor] = useURLState("excessNoiseFactor", 1.414);
  const [readNoise, setReadNoise] = useURLState("readNoise", 50);

  const gainStages = 604;
  const gainPerStage = Math.pow(emGain, 1 / gainStages);
  const outputSignal = inputSignal * emGain;
  const effectiveReadNoise = readNoise / emGain;
  const enf2HighGain = excessNoiseFactor * excessNoiseFactor;
  const enf2 = enf2HighGain - (enf2HighGain - 1) / emGain; // gain-dependent: F²(G) → 1 at G=1, → F²∞ at high G
  const snrWithEM = inputSignal / Math.sqrt((inputSignal + clockInducedCharge) * enf2 + (readNoise / emGain) ** 2);
  const snrWithoutEM = inputSignal / Math.sqrt(inputSignal + clockInducedCharge + readNoise ** 2);
  const emBenefit = snrWithEM / snrWithoutEM;

  const chartData = useMemo(() => {
    const gains = Array.from({ length: 300 }, (_, i) => 1 + i * 9999 / 300);
    const signals = [1, 5, 10, 50];
    const colors = ["#f87171", "#fbbf24", "#34d399", "#60a5fa"];
    const traces: Record<string, unknown>[] = signals.map((sig, idx) => ({
      x: gains, y: gains.map(g => { const ef = enf2HighGain - (enf2HighGain - 1) / g; const snrEm = sig / Math.sqrt((sig + clockInducedCharge) * ef + (readNoise / g) ** 2); return snrEm / (sig / Math.sqrt(sig + clockInducedCharge + readNoise ** 2)); }),
      type: "scatter" as const, mode: "lines" as const, name: `${sig} e⁻`, line: { color: colors[idx] },
    }));
    traces.push({ x: [1, 10000], y: [1, 1], type: "scatter" as const, mode: "lines" as const, name: "No benefit", line: { color: "#9ca3af", dash: "dash" } });
    traces.push({ x: [emGain], y: [emBenefit], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#c084fc", size: 10 } });
    return traces;
  }, [emGain, inputSignal, clockInducedCharge, excessNoiseFactor, readNoise, emBenefit]);

  const optimalGainData = useMemo(() => {
    const gains = Array.from({ length: 500 }, (_, i) => 1 + i * 10000 / 500);
    return gains.reduce((best, g) => { const ef = enf2HighGain - (enf2HighGain - 1) / g; const snr = inputSignal / Math.sqrt((inputSignal + clockInducedCharge) * ef + (readNoise / g) ** 2); return snr > best.snr ? { gain: g, snr } : best; }, { gain: 1, snr: 0 });
  }, [inputSignal, enf2, clockInducedCharge, readNoise]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="EMCCD Gain Calculator" description="EM gain — noise analysis, optimal gain, and SNR comparison.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="EM Gain" value={emGain} onChange={setEmGain} min={1} max={10000} />
        <ValidatedNumberInput label="Input Signal (e⁻)" value={inputSignal} onChange={setInputSignal} min={0.01} step="0.5" />
        <ValidatedNumberInput label="CIC (e⁻/pix/frame)" value={clockInducedCharge} onChange={setClockInducedCharge} min={0} step="0.0005" />
        <ValidatedNumberInput label="Excess Noise Factor F" value={excessNoiseFactor} onChange={setExcessNoiseFactor} min={1} max={2} step="0.01" />
        <ValidatedNumberInput label="Read Noise (e⁻ rms)" value={readNoise} onChange={setReadNoise} min={1} step="1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Output Signal" value={`${outputSignal.toFixed(0)} e⁻`} tone="blue" />
        <ResultCard label="Effective Read Noise" value={`${effectiveReadNoise.toFixed(3)} e⁻`} tone="green" />
        <ResultCard label="SNR with EM" value={snrWithEM.toFixed(2)} tone="purple" />
        <ResultCard label="SNR without EM" value={snrWithoutEM.toFixed(2)} tone="gray" />
        <ResultCard label="EM Benefit" value={emBenefit > 1 ? `×${emBenefit.toFixed(2)}` : emBenefit.toFixed(2)} tone="yellow" />
        <ResultCard label="ENF² (F²)" value={enf2.toFixed(3)} tone="orange" />
        <ResultCard label="Optimal Gain" value={`${optimalGainData.gain.toFixed(0)}×`} tone="red" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"><p>SNR_EM = S / √(F²(G)·(S + CIC) + (σ_read/G)²)</p><p>F²(G) = F²_∞ − (F²_∞ − 1)/G  (→1 at G=1, →F²_∞ at high G)</p><p>F_∞ ≈ √2 at high gain (Robbins & Hadwen 2003)</p></div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "EM Gain", gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR Ratio (EM / conv)", gridcolor: "#374151" } }} />
    </CalculatorShell>
  );
}
