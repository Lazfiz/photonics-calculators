"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { cameraSnr, compressiveResponse, dynamicRangeDb, quantizationNoise } from "../../../physics/detectors/camera-snr";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fix = (x: number, digits = 2) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const BIT_DEPTHS = [8, 10, 12, 14, 16];

export default function SaturationPage() {
  const [wellRaw, setFullWellCapacity] = useURLState("fullWellCapacity", 20000); // e⁻
  const [readRaw, setReadNoise] = useURLState("readNoise", 5); // e⁻ rms
  const [bitRaw, setBitDepth] = useURLState("bitDepth", 16);
  const [nlRaw, setNonlinearityPercent] = useURLState("nonlinearityPercent", 0.5); // % of full scale at full well

  const fullWell = clamp(wellRaw, 100, 1e7, 20000);
  const readNoise = clamp(readRaw, 0.01, 1000, 5);
  const bitDepth = BIT_DEPTHS.find(b => b === bitRaw) ?? 16;
  const nonlinearity = clamp(nlRaw, 0, 50, 0.5) / 100;

  const dnMax = 2 ** bitDepth - 1;
  const electronsPerDn = fullWell / dnMax;
  const quantNoise = quantizationNoise(electronsPerDn);
  const noiseFloor = Math.hypot(readNoise, quantNoise);
  const dynamicRange = dynamicRangeDb(fullWell, readNoise);
  const dynamicRangeAdc = dynamicRangeDb(fullWell, noiseFloor);
  const snrSatDb = 20 * Math.log10(cameraSnr({ signal: fullWell, read: noiseFloor }));

  const input = Array.from({ length: 241 }, (_, i) => (i / 200) * fullWell);
  const real = input.map(v => compressiveResponse(v, fullWell, nonlinearity));
  const chartData = [
    { x: input, y: input, type: "scatter" as const, mode: "lines" as const, name: "Ideal (linear)", line: { color: "#9ca3af", width: 1, dash: "dash" }, yaxis: "y" },
    { x: input, y: real, type: "scatter" as const, mode: "lines" as const, name: "Actual response", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
    { x: input, y: input.map((v, i) => (v <= fullWell ? ((real[i] - v) / fullWell) * 100 : NaN)), type: "scatter" as const, mode: "lines" as const, name: "Nonlinearity (% FS)", line: { color: "#f87171", width: 2 }, yaxis: "y2" },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Full Well Capacity (e⁻)" value={wellRaw} onChange={setFullWellCapacity} min={100} max={10000000} />
        <ValidatedNumberInput label="Read Noise (e⁻ rms)" value={readRaw} onChange={setReadNoise} min={0.01} max={1000} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Bit Depth</span>
          <select value={bitDepth} onChange={e => setBitDepth(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {BIT_DEPTHS.map(b => <option key={b} value={b}>{b}-bit</option>)}
          </select></label>
        <ValidatedNumberInput label="Nonlinearity at Full Well (% FS)" value={nlRaw} onChange={setNonlinearityPercent} min={0} max={50} step="0.1" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Dynamic range = <span className="text-blue-400 font-mono">{fix(dynamicRange)} dB</span> (read noise only)</p>
        <p className="text-gray-300">Dynamic range with ADC = <span className="text-blue-400 font-mono">{fix(dynamicRangeAdc)} dB</span> (floor √(σ_read² + Δ²/12) = {fix(noiseFloor, 3)} e⁻)</p>
        <p className="text-gray-300">SNR at FWC = <span className="text-blue-400 font-mono">{fix(snrSatDb)} dB</span> (shot + read + quantization noise)</p>
        <p className="text-gray-300">Max DN = <span className="text-blue-400 font-mono">{dnMax}</span> | Conversion gain Δ = <span className="text-blue-400 font-mono">{fix(electronsPerDn, 3)} e⁻/DN</span></p>
        {quantNoise > readNoise && (
          <p className="text-yellow-400 text-sm mt-1">ADC-limited: the quantization noise Δ/√12 = {fix(quantNoise)} e⁻ exceeds the read noise.</p>
        )}
        <p className="text-gray-300 text-sm mt-1">DR = 20·log₁₀(FWC / σ_floor); response S·(1 − n·S/FWC) up to full well, flat above</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Input signal (e⁻)", gridcolor: "#374151" },
        yaxis: { title: "Output signal (e⁻)", gridcolor: "#374151" },
        yaxis2: { title: "Nonlinearity (% FS)", gridcolor: "#374151", overlaying: "y", side: "right", titlefont: { color: "#f87171" }, tickfont: { color: "#f87171" } },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} />
    </>
  );
}
