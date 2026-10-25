"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { cornerFlickerRms, sensorNoiseElectrons } from "../../../physics/detectors/noise";

const fmt = (x: number, digits = 2) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function TemporalNoisePage() {
  const [readNoiseRaw, setReadNoise] = useURLState("readNoise", 5); // e⁻ rms, white over 0…B
  const [darkCurrentRaw, setDarkCurrent] = useURLState("darkCurrent", 0.1); // e⁻/pixel/s
  const [exposureTimeRaw, setExposureTime] = useURLState("exposureTime", 0.01); // s
  const [kneeFreqRaw, setKneeFreq] = useURLState("kneeFreq", 1000); // Hz (1/f corner)
  const [bandwidthRaw, setBandwidth] = useURLState("bandwidth", 1e6); // Hz
  const [fLowRaw, setFLow] = useURLState("fLow", 50); // Hz
  const [conversionGainRaw, setConversionGain] = useURLState("conversionGain", 2.0); // μV/e⁻
  const readNoise = clamp(readNoiseRaw, 0, 1e4, 5);
  const darkCurrent = clamp(darkCurrentRaw, 0, 1e9, 0.1);
  const exposureTime = clamp(exposureTimeRaw, 0, 1e6, 0.01);
  const kneeFreq = clamp(kneeFreqRaw, 0, 1e12, 1000);
  const bandwidth = clamp(bandwidthRaw, 1e-3, 1e12, 1e6);
  const fLow = clamp(fLowRaw, 1e-6, 1e12, 50);
  const conversionGain_uV = clamp(conversionGainRaw, 0, 1e6, 2);

  const oneOverFNoise = cornerFlickerRms(readNoise, kneeFreq, bandwidth, fLow);
  const darkShotNoise = Math.sqrt(darkCurrent * exposureTime);
  const totalNoise = sensorNoiseElectrons({ signal: 0, read: readNoise, dark: darkCurrent * exposureTime });
  const totalNoiseWithF = Math.hypot(totalNoise, oneOverFNoise);

  // Read-noise density in e⁻²/Hz: white σ_r²/B plus 1/f (σ_r²/B)·f_c/f, from f_L to B.
  const lo = Math.log10(Math.min(fLow, bandwidth));
  const hi = Math.log10(bandwidth);
  const freq = Array.from({ length: 300 }, (_, i) => 10 ** (lo + ((hi - lo) * i) / 299));
  const white = (readNoise * readNoise) / bandwidth;
  const chartData = [
    { x: freq, y: freq.map(f => white * (kneeFreq / f)), type: "scatter" as const, mode: "lines" as const, name: "1/f noise", line: { color: "#f87171", width: 2 } },
    { x: freq, y: freq.map(() => white), type: "scatter" as const, mode: "lines" as const, name: "White noise", line: { color: "#60a5fa", width: 2, dash: "dash" } },
    { x: freq, y: freq.map(f => white * (1 + kneeFreq / f)), type: "scatter" as const, mode: "lines" as const, name: "Total PSD", line: { color: "#fbbf24", width: 2.5 } },
  ];

  // Noise vs integration time, with the 1/f band fixed by the f_L input.
  const times = Array.from({ length: 200 }, (_, i) => 1e-6 * Math.pow(1e7, i / 199)); // 1 μs to 10 s
  const darkN = times.map(t => Math.sqrt(darkCurrent * t));
  const noiseVsTime = [
    { x: times, y: times.map(() => readNoise), type: "scatter" as const, mode: "lines" as const, name: "Read noise", line: { color: "#60a5fa", width: 2 } },
    { x: times, y: darkN, type: "scatter" as const, mode: "lines" as const, name: "Dark shot noise", line: { color: "#f87171", width: 2 } },
    { x: times, y: times.map(() => oneOverFNoise), type: "scatter" as const, mode: "lines" as const, name: "1/f noise", line: { color: "#a78bfa", width: 2, dash: "dot" } },
    { x: times, y: darkN.map(d => Math.hypot(readNoise, d, oneOverFNoise)), type: "scatter" as const, mode: "lines" as const, name: "Total noise", line: { color: "#fbbf24", width: 2.5 } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="White Read Noise over B (e⁻ rms)" value={readNoiseRaw} onChange={setReadNoise} min={0} max={1e4} />
        <ValidatedNumberInput label="Dark Current (e⁻/pix/s)" value={darkCurrentRaw} onChange={setDarkCurrent} min={0} max={1e9} />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTimeRaw} onChange={setExposureTime} min={0} max={1e6} />
        <ValidatedNumberInput label="1/f Corner Frequency (Hz)" value={kneeFreqRaw} onChange={setKneeFreq} min={0} max={1e12} />
        <ValidatedNumberInput label="Read-out Bandwidth B (Hz)" value={bandwidthRaw} onChange={setBandwidth} min={1e-3} max={1e12} />
        <ValidatedNumberInput label="Lower Band Edge f_L (Hz)" value={fLowRaw} onChange={setFLow} min={1e-6} max={1e12} />
        <ValidatedNumberInput label="Conversion Gain (μV/e⁻)" value={conversionGainRaw} onChange={setConversionGain} min={0} max={1e6} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300">Read noise (white) = <span className="text-blue-400 font-mono">{fmt(readNoise, 1)} e⁻</span></p>
        <p className="text-gray-300">Dark shot noise = <span className="text-blue-400 font-mono">{fmt(darkShotNoise)} e⁻</span></p>
        <p className="text-gray-300">1/f noise from f<sub>L</sub> to B = <span className="text-blue-400 font-mono">{fmt(oneOverFNoise)} e⁻</span></p>
        <p className="text-gray-300">Total noise (with 1/f) = <span className="text-blue-400 font-mono">{fmt(totalNoiseWithF)} e⁻</span>
          {" "}= <span className="font-mono">{fmt(totalNoiseWithF * conversionGain_uV)} μV rms</span> at the sense node</p>
        {!(bandwidth > fLow) && <p className="text-amber-400 text-sm">The read-out bandwidth must be above f<sub>L</sub>.</p>}
        <p className="text-gray-300 text-sm mt-1">σ<sub>1/f</sub> = σ<sub>read</sub>·√((f<sub>c</sub>/B)·ln(B/f<sub>L</sub>)) | σ<sub>dark</sub> = √(I<sub>dark</sub>·t) | σ<sub>total</sub> = √(σ²<sub>read</sub> + σ²<sub>dark</sub> + σ²<sub>1/f</sub>)</p>
        <p className="text-gray-500 text-sm mt-1">f<sub>L</sub> is set by how long the pixel is observed (of order 1/t for a time t; correlated double sampling raises it). The result depends on it only through the logarithm. Sharp band edges stand in for the real sampling filter.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Frequency (Hz)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Noise PSD (e⁻²/Hz)", type: "log", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 70, r: 20 }, autosize: true, showlegend: true
      }} className="w-full mb-6" />

      <ChartPanel data={noiseVsTime} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Integration Time (s)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Noise (e⁻ rms)", type: "log", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 70, r: 20 }, autosize: true, showlegend: true
      }} />
    </>
  );
}
