"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { minDetectableSignal, quantizationNoiseElectrons, sensorNoiseElectrons } from "../../../physics/detectors/noise";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function AmplifierNoisePage() {
  const [enRaw, setEn] = useURLState("en", 5);
  const [gainRaw, setGain] = useURLState("gain", 2);
  const [signalRaw, setSignal] = useURLState("signal", 1000);
  const en = clamp(enRaw, 0.1, 1e4, 5);
  const gain = clamp(gainRaw, 0.1, 1e5, 2);
  const signal = clamp(signalRaw, 1, 1e9, 1000);

  const quantNoise = quantizationNoiseElectrons(gain);
  const readFloor = Math.hypot(en, quantNoise); // e⁻ rms: amplifier and ADC quantisation in quadrature
  const readFloorAt = (e: number) => Math.hypot(e, quantNoise);
  const noiseDn = readFloor / gain;
  const shotNoise = Math.sqrt(signal);
  const totalNoise = sensorNoiseElectrons({ signal, read: readFloor });
  const snrTotal = signal / totalNoise;
  const minDetectable = minDetectableSignal(readFloor, 3);

  const enMax = Math.max(50, 2 * en);
  const enVals = Array.from({ length: 200 }, (_, i) => 0.5 + (i / 199) * (enMax - 0.5));
  const chartData = [
    { x: enVals, y: enVals.map(e => readFloorAt(e) / gain), type: "scatter" as const, mode: "lines" as const, name: "Read floor (DN)", line: { color: "#f87171" }, yaxis: "y" },
    { x: enVals, y: enVals.map(e => signal / readFloorAt(e)), type: "scatter" as const, mode: "lines" as const, name: `Read-limited SNR`, line: { color: "#60a5fa", width: 2 }, yaxis: "y2" },
    { x: enVals, y: enVals.map(e => signal / sensorNoiseElectrons({ signal, read: readFloorAt(e) })), type: "scatter" as const, mode: "lines" as const, name: `Total SNR (shot+read)`, line: { color: "#34d399", width: 2, dash: "dash" as const }, yaxis: "y2" },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Input noise eₙ (e⁻ rms)" value={enRaw} onChange={setEn} step="0.5" min={0.1} max={1e4} />
        <ValidatedNumberInput label="Conversion gain (e⁻/DN)" value={gainRaw} onChange={setGain} step="0.1" min={0.1} max={1e5} />
        <ValidatedNumberInput label="Signal level (e⁻)" value={signalRaw} onChange={setSignal} step="100" min={1} max={1e9} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <ResultCard label="Read floor (DN)" value={noiseDn.toFixed(2)} tone="red" subtext={`Quantisation g/√12 = ${quantNoise.toFixed(2)} e⁻`} />
        <ResultCard label="Shot noise (e⁻)" value={shotNoise.toFixed(1)} tone="orange" />
        <ResultCard label="Total noise (e⁻)" value={totalNoise.toFixed(1)} tone="red" />
        <ResultCard label="Total SNR" value={snrTotal.toFixed(1)} tone="blue" />
        <ResultCard label="Min Detectable (3σ)" value={`${minDetectable.toFixed(2)} e⁻`} tone="yellow" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>σ_total = √(S + eₙ² + g²/12) — quadrature sum of shot noise, amplifier noise and ADC quantisation (g in e⁻/DN)</p>
        <p>SNR = S / σ_total — at high signal, shot noise (√S) dominates; at low signal, amplifier noise (eₙ) dominates</p>
        <p>S_min = (9 + √(81 + 36·σ_r²)) / 2 with σ_r² = eₙ² + g²/12 — signal at which total SNR = 3</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Input noise eₙ (e⁻ rms)", gridcolor: "#374151" }, yaxis: { title: "Noise (DN)", gridcolor: "#374151" }, yaxis2: { title: "SNR", gridcolor: "#374151", overlaying: "y", side: "right" } }} />
    </>
  );
}
