"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { dynamicRangeDb, pixelCapacitance } from "../../../physics/detectors/camera-snr";
import { minDetectableSignal } from "../../../physics/detectors/noise";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fix = (x: number, digits = 2) => (Number.isFinite(x) ? x.toFixed(digits) : "—");

export default function WellCapacityPage() {
  const [wellRaw, setWellCapacity] = useURLState("wellCapacity", 50000); // e⁻
  const [readRaw, setReadNoise] = useURLState("readNoise", 5); // e⁻ rms
  const [pixelRaw, setPixelSize] = useURLState("pixelSize", 5); // µm
  const [swingRaw, setVoltageSwing] = useURLState("voltageSwing", 1.5); // V

  const wellCapacity = clamp(wellRaw, 100, 1e7, 50000);
  const readNoise = clamp(readRaw, 0.01, 1000, 5);
  const pixelSize_um = clamp(pixelRaw, 0.1, 100, 5);
  const voltageSwing = clamp(swingRaw, 0.01, 10, 1.5);

  const dynamicRange = dynamicRangeDb(wellCapacity, readNoise);
  const capacitance = pixelCapacitance(wellCapacity, voltageSwing);
  const conversionGain_uV = (voltageSwing / wellCapacity) * 1e6;
  const wellDensity = wellCapacity / (pixelSize_um * pixelSize_um);
  const minDetectable = minDetectableSignal(readNoise, 3);
  const usableBits = Math.log2(wellCapacity / readNoise);

  const wells = Array.from({ length: 201 }, (_, i) => 10 ** (3 + (i / 200) * 3));
  const chartData = [
    { x: wells, y: wells.map(w => dynamicRangeDb(w, readNoise)), type: "scatter" as const, mode: "lines" as const, name: "Dynamic range (dB)", line: { color: "#f87171" }, yaxis: "y" },
    { x: wells, y: wells.map(w => pixelCapacitance(w, voltageSwing) * 1e15), type: "scatter" as const, mode: "lines" as const, name: "Capacitance (fF)", line: { color: "#60a5fa" }, yaxis: "y2" },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Well capacity (e⁻)" value={wellRaw} onChange={setWellCapacity} min={100} max={10000000} step="1000" />
        <ValidatedNumberInput label="Read noise (e⁻ rms)" value={readRaw} onChange={setReadNoise} min={0.01} max={1000} step="1" />
        <ValidatedNumberInput label="Pixel size (μm)" value={pixelRaw} onChange={setPixelSize} min={0.1} max={100} step="0.5" />
        <ValidatedNumberInput label="Voltage swing (V)" value={swingRaw} onChange={setVoltageSwing} min={0.01} max={10} step="0.1" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300">Dynamic range = <span className="text-blue-400 font-mono">{fix(dynamicRange)} dB</span></p>
        <p className="text-gray-300">Usable bits = <span className="text-blue-400 font-mono">{fix(usableBits, 1)} bits</span></p>
        <p className="text-gray-300">Pixel capacitance = <span className="text-blue-400 font-mono">{fix(capacitance * 1e15, 3)} fF</span></p>
        <p className="text-gray-300">Conversion gain = <span className="text-blue-400 font-mono">{fix(conversionGain_uV, 2)} µV/e⁻</span></p>
        <p className="text-gray-300">Full well density = <span className="text-blue-400 font-mono">{fix(wellDensity, 0)} e⁻/μm²</span></p>
        <p className="text-gray-300">Min detectable (SNR = 3, read + shot noise) = <span className="text-blue-400 font-mono">{fix(minDetectable, 1)} e⁻</span></p>
        <p className="text-gray-300 text-sm mt-1">DR = 20·log₁₀(N_well/σ_read), C = N_well·q/V_swing, S_min = (9 + √(81 + 36σ²))/2</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Well capacity (e⁻)", gridcolor: "#374151", type: "log" },
        yaxis: { title: "Dynamic range (dB)", gridcolor: "#374151" },
        yaxis2: { title: "Capacitance (fF)", gridcolor: "#374151", overlaying: "y", side: "right", type: "log" },
        margin: { t: 20, b: 40, l: 70, r: 70 }, autosize: true, showlegend: true
      }} />
    </>
  );
}
