"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { dynamicRangeDb } from "../../../physics/detectors/camera-snr";
import { sensorNoise, shotPrnuCrossover, shotReadCrossover } from "../../../physics/detectors/sensor-noise";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");

export default function DynamicRangePage() {
  const [wellRaw, setFullWellCapacity] = useURLState("fullWellCapacity", 30000);
  const [readRaw, setReadNoise] = useURLState("readNoise", 2);
  const [darkRaw, setDarkCurrent] = useURLState("darkCurrent", 0.05);
  const [exposureRaw, setExposureTime] = useURLState("exposureTime", 100);
  const [bitsRaw, setBitDepth] = useURLState("bitDepth", 14);
  const [prnuRaw, setPrnu] = useURLState("prnu", 1);
  const [dsnuRaw, setDsnu] = useURLState("dsnuE", 0.5);

  const well = clamp(wellRaw, 100, 1e6, 30000);
  const read = clamp(readRaw, 0.1, 100, 2);
  const darkRate = clamp(darkRaw, 0, 1e4, 0.05);
  const exposureMs = clamp(exposureRaw, 0.01, 3.6e6, 100);
  const bits = Math.round(clamp(bitsRaw, 8, 24, 14));
  const prnu = clamp(prnuRaw, 0, 10, 1) / 100;
  const dsnu = clamp(dsnuRaw, 0, 100, 0.5);

  // The ADC full scale is matched to the full well, so one DN is K = FW/(2^bits − 1) electrons.
  const electronsPerDn = well / (2 ** bits - 1);
  const dark = (darkRate * exposureMs) / 1000;
  const noiseAt = (signal: number) => sensorNoise({ signal, read, dark, prnu, dsnu, electronsPerDn });
  const floor = noiseAt(0).temporal;
  const dr = dynamicRangeDb(well, floor, dark);
  const half = noiseAt(well / 2);
  const floorDn = floor / electronsPerDn;

  const signalAxis = Array.from({ length: 201 }, (_, i) => well * 10 ** (-6 + (6 * i) / 200));
  const chartData = [
    {
      x: signalAxis, y: signalAxis.map(s => s / noiseAt(s).total),
      type: "scatter" as const, mode: "lines" as const, name: "SNR with fixed-pattern noise", line: { color: "#60a5fa", width: 2 },
    },
    {
      x: signalAxis, y: signalAxis.map(s => s / noiseAt(s).temporal),
      type: "scatter" as const, mode: "lines" as const, name: "After flat-field correction (temporal noise)", line: { color: "#34d399", width: 2, dash: "dash" },
    },
    ...(prnu > 0
      ? [{ x: [signalAxis[0], well], y: [1 / prnu, 1 / prnu], type: "scatter" as const, mode: "lines" as const, name: "PRNU limit 1/PRNU", line: { color: "#fbbf24", width: 1, dash: "dot" } }]
      : []),
    { x: [signalAxis[0], well], y: [1, 1], type: "scatter" as const, mode: "lines" as const, name: "SNR = 1", line: { color: "#f87171", width: 1, dash: "dot" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Full Well Capacity (e⁻)" value={wellRaw} onChange={setFullWellCapacity} min={100} max={1000000} />
        <ValidatedNumberInput label="Read Noise (e⁻ rms)" value={readRaw} onChange={setReadNoise} min={0.1} max={100} step="0.1" />
        <ValidatedNumberInput label="Dark Current (e⁻/s/pixel)" value={darkRaw} onChange={setDarkCurrent} min={0} max={10000} />
        <ValidatedNumberInput label="Exposure Time (ms)" value={exposureRaw} onChange={setExposureTime} min={0.01} max={3600000} />
        <ValidatedNumberInput label="ADC Bit Depth" value={bitsRaw} onChange={setBitDepth} min={8} max={24} />
        <ValidatedNumberInput label="PRNU (% of signal)" value={prnuRaw} onChange={setPrnu} min={0} max={10} step="0.1" />
        <ValidatedNumberInput label="DSNU (e⁻ rms)" value={dsnuRaw} onChange={setDsnu} min={0} max={100} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Dynamic Range" value={Number.isFinite(dr) ? `${fmt(dr, 2)} dB` : "—"} subtext={Number.isFinite(dr) ? `${fmt(Math.log2((well - dark) / floor), 2)} stops, (FW − D)/temporal dark noise` : "dark charge fills the well"} tone="green" />
        <ResultCard label="Temporal Noise Floor" value={`${fmt(floor, 3)} e⁻`} subtext={`√(σ_read² + D + σ_q²); dark charge ${fmt(dark, 4)} e⁻`} tone="red" />
        <ResultCard label="ADC Step" value={`${fmt(electronsPerDn, 3)} e⁻/DN`} subtext={`Quantization noise ${fmt(half.quantization, 3)} e⁻`} tone="yellow" />
        <ResultCard
          label="Noise Floor in DN"
          value={fmt(floorDn, 2)}
          subtext={floorDn < 0.5 ? "Below 0.5 DN: the ADC step sets the floor, add bits" : "The ADC samples the noise floor"}
          tone={floorDn < 0.5 ? "orange" : "purple"}
        />
        <ResultCard label="SNR at Half Full Well" value={fmt((well / 2) / half.total, 2)} subtext={`${fmt((well / 2) / half.temporal, 2)} after flat-field correction`} tone="blue" />
        <ResultCard label="Shot = Read Noise at" value={`${fmt(shotReadCrossover(read), 2)} e⁻`} subtext="Read-noise-limited below" tone="cyan" />
        <ResultCard label="Shot = PRNU Noise at" value={Number.isFinite(shotPrnuCrossover(prnu)) ? `${fmt(shotPrnuCrossover(prnu), 0)} e⁻` : "never (PRNU 0)"} subtext="PRNU-limited above; SNR → 1/PRNU" tone="cyan" />
        <ResultCard label="Spatial Dark Noise (DSNU)" value={`${fmt(dsnu, 2)} e⁻`} subtext="Removed by dark-frame subtraction" tone="gray" />
      </div>

      <ChartPanel data={chartData} layout={{ xaxis: { title: "Signal (e⁻)", gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR", gridcolor: "#374151", type: "log" } }} />

      <div className="bg-gray-900 rounded-lg p-4 mt-8 text-sm text-gray-300 font-mono space-y-1">
        <p>σ_total² = σ_read² + D + σ_q² + S + DSNU² + (PRNU·S)², σ_q = K/√12, K = FW/(2^bits − 1)</p>
        <p>DR = 20·log₁₀(FW/σ_floor), σ_floor = √(σ_read² + D + σ_q²)</p>
        <p>Shot = read noise at S = σ_read²; shot = PRNU noise at S = 1/PRNU²</p>
      </div>
    </>
  );
}
