"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { sensorNoiseElectrons } from "../../../physics/detectors/noise";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function ReadoutNoisePage() {
  const [readNoiseRaw, setReadNoise] = useURLState("readNoise", 10); // e⁻ rms
  const [darkCurrentRaw, setDarkCurrent] = useURLState("darkCurrent", 0.1); // e⁻/s/pixel
  const [exposureTimeRaw, setExposureTime] = useURLState("exposureTime", 0.01); // s
  const readNoise = clamp(readNoiseRaw, 0, 1e4, 10);
  const darkCurrent = clamp(darkCurrentRaw, 0, 1e9, 0.1);
  const exposureTime = clamp(exposureTimeRaw, 0, 1e6, 0.01);
  const darkElectrons = darkCurrent * exposureTime;

  const chartData = useMemo(() => {
    const signals = Array.from({ length: 200 }, (_, i) => Math.pow(1e5, i / 199)); // 1 to 1e5 e⁻
    const total = signals.map(s => sensorNoiseElectrons({ signal: s, read: readNoise, dark: darkElectrons }));
    return [
      { x: signals, y: signals.map(s => Math.sqrt(s)), type: "scatter" as const, mode: "lines" as const, name: "Shot noise only", line: { color: "#60a5fa" } },
      { x: signals, y: total, type: "scatter" as const, mode: "lines" as const, name: "Total (shot + read + dark)", line: { color: "#f87171" } },
      { x: signals, y: signals.map((s, i) => s / total[i]), type: "scatter" as const, mode: "lines" as const, name: "SNR", line: { color: "#34d399" }, yaxis: "y2" },
    ];
  }, [readNoise, darkElectrons]);

  const noiseFloor = sensorNoiseElectrons({ signal: 0, read: readNoise, dark: darkElectrons });
  const readNoiseLimitedSignal = readNoise ** 2; // signal where shot = read noise

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label={<>Read noise σ<sub>read</sub> (e⁻ rms)</>} value={readNoiseRaw} onChange={setReadNoise} step="1" min={0} max={1e4} />
        <ValidatedNumberInput label="Dark current (e⁻/s/pixel)" value={darkCurrentRaw} onChange={setDarkCurrent} step="0.01" min={0} max={1e9} />
        <ValidatedNumberInput label="Exposure time (s)" value={exposureTimeRaw} onChange={setExposureTime} step="0.001" min={0} max={1e6} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Dark electrons = <span className="text-blue-400 font-mono">{darkElectrons.toFixed(3)} e⁻</span></p>
        <p className="text-gray-300">Noise floor √(σ²<sub>read</sub> + dark) = <span className="text-blue-400 font-mono">{noiseFloor.toFixed(2)} e⁻</span></p>
        <p className="text-gray-300">Read-noise-limited signal = <span className="text-blue-400 font-mono">{readNoiseLimitedSignal.toFixed(0)} e⁻</span> (shot = read noise)</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Signal (e⁻)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Noise (e⁻ rms)", type: "log", gridcolor: "#374151" },
        yaxis2: { title: "SNR", type: "log", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} />
    </>
  );
}
