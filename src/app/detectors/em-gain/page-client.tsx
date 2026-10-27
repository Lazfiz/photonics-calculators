"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { cameraSnr, EM_REGISTER_STAGES, emExcessNoiseFactorSq, emStageProbability } from "../../../physics/detectors/camera-snr";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fix = (x: number, digits = 2) => (Number.isFinite(x) ? x.toFixed(digits) : "—");

export default function EmGainPage() {
  const [emGainRaw, setEmGain] = useURLState("emGain", 100);
  const [inputSignalRaw, setInputSignal] = useURLState("inputSignal", 10);
  const [cicRaw, setClockInducedCharge] = useURLState("clockInducedCharge", 0.001);
  const [readNoiseRaw, setReadNoise] = useURLState("readNoise", 50);
  const [stagesRaw, setStages] = useURLState("stages", EM_REGISTER_STAGES);

  const emGain = clamp(emGainRaw, 1, 1e4, 100);
  const inputSignal = clamp(inputSignalRaw, 0, 1e5, 10);
  const cic = clamp(cicRaw, 0, 1, 0.001);
  const readNoise = clamp(readNoiseRaw, 0, 500, 50);
  const stages = Math.round(clamp(stagesRaw, 1, 2000, EM_REGISTER_STAGES));

  const enf2 = emExcessNoiseFactorSq(emGain, stages);
  const stageProbability = emStageProbability(emGain, stages);
  const snrAt = (signal: number, gain: number) =>
    cameraSnr({ signal, cic, read: readNoise, gain, excessNoiseFactorSq: emExcessNoiseFactorSq(gain, stages) });
  const snrWithEM = snrAt(inputSignal, emGain);
  const snrWithoutEM = cameraSnr({ signal: inputSignal, cic, read: readNoise });
  const emBenefit = snrWithEM / snrWithoutEM;

  const gains = Array.from({ length: 201 }, (_, i) => 10 ** (i / 50));
  const signals = [1, 5, 10, 50];
  const colors = ["#f87171", "#fbbf24", "#34d399", "#60a5fa"];
  const chartData: Record<string, unknown>[] = signals.map((sig, idx) => ({
    x: gains,
    y: gains.map(g => snrAt(sig, g) / cameraSnr({ signal: sig, cic, read: readNoise })),
    type: "scatter" as const, mode: "lines" as const, name: `${sig} e⁻`, line: { color: colors[idx] },
  }));
  chartData.push({ x: [1, 1e4], y: [1, 1], type: "scatter" as const, mode: "lines" as const, name: "No benefit", line: { color: "#9ca3af", dash: "dash" } });
  if (Number.isFinite(emBenefit)) {
    chartData.push({ x: [emGain], y: [emBenefit], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#c084fc", size: 10 } });
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="EM Gain" value={emGainRaw} onChange={setEmGain} min={1} max={10000} />
        <ValidatedNumberInput label="Input Signal (e⁻)" value={inputSignalRaw} onChange={setInputSignal} min={0} max={100000} step="0.5" />
        <ValidatedNumberInput label="CIC (e⁻/pix/frame)" value={cicRaw} onChange={setClockInducedCharge} min={0} max={1} step="0.0005" />
        <ValidatedNumberInput label="Read Noise (e⁻ rms)" value={readNoiseRaw} onChange={setReadNoise} min={0} max={500} step="1" />
        <ValidatedNumberInput label="Gain-Register Stages N" value={stagesRaw} onChange={setStages} min={1} max={2000} step="1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Output Signal" value={`${(inputSignal * emGain).toFixed(0)} e⁻`} tone="blue" />
        <ResultCard label="Effective Read Noise" value={`${(readNoise / emGain).toFixed(3)} e⁻`} tone="green" />
        <ResultCard label="SNR with EM" value={fix(snrWithEM)} tone="purple" />
        <ResultCard label="SNR at G = 1" value={fix(snrWithoutEM)} tone="gray" subtext="Same EM amplifier and read noise" />
        <ResultCard label="EM Benefit vs G = 1" value={Number.isFinite(emBenefit) ? `×${emBenefit.toFixed(2)}` : "—"} tone="yellow" subtext="A conventional output (a few e⁻ read noise) gains less" />
        <ResultCard label="ENF² (F²)" value={fix(enf2, 4)} tone="orange" />
        <ResultCard label="Gain per Stage" value={Number.isFinite(stageProbability) ? `${(stageProbability * 100).toFixed(3)} %` : "—"} tone="red" />
      </div>
      {!Number.isFinite(enf2) && (
        <p className="mb-6 text-sm text-yellow-400">A gain of {emGain} needs more than 100 % multiplication per stage with {stages} stages (G ≤ 2^N).</p>
      )}
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>SNR_EM = S / √(F²·(S + CIC) + (σ_read/G)²)</p>
        <p>F² = 2(G − 1)·G^(−(N+1)/N) + 1/G  (Robbins &amp; Hadwen 2003)</p>
        <p>G = (1 + p)^N; F² → 2 − 1/G for N → ∞, F² = 1 at G = 1</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "EM Gain", gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR ratio (G / G = 1)", gridcolor: "#374151" } }} />
    </>
  );
}
