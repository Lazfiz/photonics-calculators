"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { dynamicRangeDb } from "../../../physics/detectors/camera-snr";
import { sensorNoise, shotPrnuCrossover, shotReadCrossover } from "../../../physics/detectors/sensor-noise";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fix = (x: number, digits = 2) => (Number.isFinite(x) ? x.toFixed(digits) : "—");

export default function PhotonTransferPage() {
  const [gainRaw, setGain] = useURLState("gain", 2); // e⁻/DN
  const [readRaw, setReadNoise] = useURLState("readNoise", 10); // e⁻ rms
  const [wellRaw, setWellCapacity] = useURLState("wellCapacity", 50000); // e⁻
  const [prnuRaw, setPrnu] = useURLState("prnu", 1); // %

  const gain = clamp(gainRaw, 0.01, 1000, 2);
  const readNoise = clamp(readRaw, 0, 1000, 10);
  const wellCapacity = clamp(wellRaw, 100, 1e7, 50000);
  const prnu = clamp(prnuRaw, 0, 20, 1) / 100;

  const noiseAt = (signal: number) => sensorNoise({ signal, read: readNoise, prnu, electronsPerDn: gain });
  const full = noiseAt(wellCapacity);
  const floor = Math.hypot(readNoise, full.quantization);
  const readCross = shotReadCrossover(floor); // S = σ_r² + K²/12 (e⁻)
  const prnuCross = shotPrnuCrossover(prnu);
  const dynamicRange = dynamicRangeDb(wellCapacity, floor);

  const signals = Array.from({ length: 201 }, (_, i) => wellCapacity ** (i / 200));
  const noises = signals.map(noiseAt);
  const signalDn = signals.map(s => s / gain);
  const trace = (y: number[], name: string, color: string, dash?: string) =>
    ({ x: signalDn, y, type: "scatter" as const, mode: "lines" as const, name, line: { color, ...(dash ? { dash } : {}) } });
  const chartData = [
    trace(noises.map(n => n.total / gain), "Total noise", "#f87171"),
    trace(noises.map(() => floor / gain), "Read + quantization", "#9ca3af", "dot"),
    trace(noises.map(n => n.shot / gain), "Shot noise (slope ½)", "#60a5fa", "dash"),
    trace(noises.map(n => n.prnu / gain), "PRNU (slope 1)", "#fbbf24", "dash"),
    trace(noises.map(n => n.temporal / gain), "Temporal (flat-fielded)", "#34d399"),
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Conversion gain K (e⁻/DN)" value={gainRaw} onChange={setGain} min={0.01} max={1000} step="0.1" />
        <ValidatedNumberInput label="Read noise (e⁻ rms)" value={readRaw} onChange={setReadNoise} min={0} max={1000} step="1" />
        <ValidatedNumberInput label="Full well (e⁻)" value={wellRaw} onChange={setWellCapacity} min={100} max={10000000} step="1000" />
        <ValidatedNumberInput label="PRNU (%)" value={prnuRaw} onChange={setPrnu} min={0} max={20} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ResultCard label="Total noise at full well" value={`${fix(full.total)} e⁻`} subtext={`${fix(full.total / gain)} DN`} tone="red" />
        <ResultCard label="Temporal noise at full well" value={`${fix(full.temporal)} e⁻`} subtext="after flat-field correction" tone="green" />
        <ResultCard label="Noise floor" value={`${fix(floor / gain)} DN`} subtext={`read ${fix(readNoise)} e⁻, quantization K/√12 = ${fix(full.quantization)} e⁻`} tone="gray" />
        <ResultCard label="Read + quantization → shot" value={`${fix(readCross, 0)} e⁻`} subtext={`S = σ_r² + K²/12, ${fix(readCross / gain, 1)} DN`} tone="blue" />
        <ResultCard
          label="Shot → PRNU crossover"
          value={Number.isFinite(prnuCross) ? `${fix(prnuCross, 0)} e⁻` : "—"}
          subtext={!Number.isFinite(prnuCross) ? "no PRNU" : prnuCross > wellCapacity ? "S = 1/PRNU², above full well: PRNU never dominates" : `S = 1/PRNU², ${fix(prnuCross / gain, 0)} DN`}
          tone="yellow"
        />
        <ResultCard label="Dynamic range" value={`${fix(dynamicRange, 1)} dB`} subtext={`full well ${fix(wellCapacity / gain, 0)} DN over the noise floor`} tone="purple" />
      </div>

      <p className="text-gray-400 text-sm mb-6">
        σ_total² = σ_read² + σ_q² + S + (PRNU·S)², all in e⁻; divide by K for DN. In the shot-noise regime σ²(DN) = S(DN)/K,
        so K = S/(σ²_diff/2 − σ_read²) from the offset-subtracted mean S of a frame-differenced (FPN-free) pair of flats (Janesick 2007, ch. 5).
      </p>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Signal (DN)", gridcolor: "#374151", type: "log" },
        yaxis: { title: "Noise (DN rms)", gridcolor: "#374151", type: "log" },
        margin: { t: 20, b: 40, l: 70, r: 20 }, autosize: true, showlegend: true
      }} />
    </>
  );
}
