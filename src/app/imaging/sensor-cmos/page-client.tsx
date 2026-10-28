"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { dynamicRangeDb } from "../../../physics/detectors/camera-snr";
import { darkCurrentDensity, darkReadCrossoverTemperature, doublingLawRatio } from "../../../physics/detectors/dark-current";
import { sensorNoise } from "../../../physics/detectors/sensor-noise";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const T_MIN = -120, T_MAX = 60; // °C, range of the sensor-temperature input
const T_REF = 25; // °C, reference temperature of the dark-current input

interface Preset {
  pixelPitch: number; // µm
  wellCapacity: number; // e⁻
  readNoise: number; // e⁻ rms
  darkCurrent: number; // e⁻/s per pixel at 25 °C
  sensorTemp: number; // °C
  quantumEfficiency: number;
  conversionGain: number; // e⁻/DN
  bitDepth: number;
  exposureTime: number; // ms
}

// Representative values, not a specific camera: an air-cooled sCMOS and a deep-cooled back-thinned MPP CCD.
const PRESETS: Record<"cmos" | "ccd", Preset> = {
  cmos: { pixelPitch: 6.5, wellCapacity: 25000, readNoise: 1.5, darkCurrent: 2, sensorTemp: 0, quantumEfficiency: 0.7, conversionGain: 0.5, bitDepth: 16, exposureTime: 100 },
  ccd: { pixelPitch: 16, wellCapacity: 80000, readNoise: 8, darkCurrent: 200, sensorTemp: -70, quantumEfficiency: 0.92, conversionGain: 1.2, bitDepth: 16, exposureTime: 1000 },
};
const D = PRESETS.cmos;

export default function SensorDesignPage() {
  const [photonsRaw, setPhotons] = useURLState("photons", 1000);
  const [qeRaw, setQuantumEfficiency] = useURLState("quantumEfficiency", D.quantumEfficiency);
  const [pitchRaw, setPixelPitch] = useURLState("pixelPitch", D.pixelPitch);
  const [wellRaw, setWellCapacity] = useURLState("wellCapacity", D.wellCapacity);
  const [readRaw, setReadNoise] = useURLState("readNoise", D.readNoise);
  const [darkRaw, setDarkCurrent] = useURLState("darkCurrent", D.darkCurrent);
  const [tempRaw, setSensorTemp] = useURLState("sensorTemp", D.sensorTemp);
  const [doublingRaw, setDoublingTemp] = useURLState("doublingTemp", 6);
  const [exposureRaw, setExposureTime] = useURLState("exposureTime", D.exposureTime);
  const [gainRaw, setConversionGain] = useURLState("conversionGain", D.conversionGain);
  const [bitsRaw, setBitDepth] = useURLState("bitDepth", D.bitDepth);

  const photons = clamp(photonsRaw, 0, 1e7, 1000);
  const qe = clamp(qeRaw, 0.01, 1, D.quantumEfficiency);
  const pitch = clamp(pitchRaw, 0.5, 50, D.pixelPitch);
  const well = clamp(wellRaw, 100, 1e6, D.wellCapacity);
  const read = clamp(readRaw, 0.1, 100, D.readNoise);
  const darkRef = clamp(darkRaw, 0, 1e5, D.darkCurrent);
  const temp = clamp(tempRaw, T_MIN, T_MAX, D.sensorTemp);
  const doubling = clamp(doublingRaw, 3, 12, 6);
  const exposureMs = clamp(exposureRaw, 0.01, 3.6e6, D.exposureTime);
  const electronsPerDn = clamp(gainRaw, 0.01, 1000, D.conversionGain);
  const bits = Math.round(clamp(bitsRaw, 8, 24, D.bitDepth));

  const applyPreset = (p: Preset) => {
    setPixelPitch(p.pixelPitch);
    setWellCapacity(p.wellCapacity);
    setReadNoise(p.readNoise);
    setDarkCurrent(p.darkCurrent);
    setSensorTemp(p.sensorTemp);
    setQuantumEfficiency(p.quantumEfficiency);
    setConversionGain(p.conversionGain);
    setBitDepth(p.bitDepth);
    setExposureTime(p.exposureTime);
  };

  const t = exposureMs / 1000;
  const darkRate = darkRef * doublingLawRatio(temp, T_REF, doubling); // e⁻/s at the sensor temperature
  const dark = darkRate * t;
  const adcFullScale = electronsPerDn * (2 ** bits - 1);
  const maxSignal = Math.min(well, adcFullScale);
  const noiseAt = (signal: number) => sensorNoise({ signal, read, dark, electronsPerDn }).temporal;
  const floor = noiseAt(0);
  const signal = qe * photons;
  const saturated = signal + dark > maxSignal;
  const noise = noiseAt(signal);
  const drExposure = dynamicRangeDb(maxSignal, floor, dark); // the dark charge occupies the well and the ADC range
  const snr = saturated ? NaN : signal / noise;
  const crossoverRaw = darkReadCrossoverTemperature(read, darkRef * t, T_REF, doubling);
  const crossoverInRange = Number.isFinite(crossoverRaw) && crossoverRaw >= T_MIN && crossoverRaw <= T_MAX;
  const density = darkCurrentDensity(darkRef, pitch * 1e-6) * 1e8; // A/m² → pA/cm²

  const photonMax = Math.max(1e6, 10 * photons);
  const photonAxis = Array.from({ length: 241 }, (_, i) => 10 ** ((i / 240) * Math.log10(photonMax)));
  const snrChart = [
    {
      x: photonAxis, y: photonAxis.map(n => (qe * n + dark > maxSignal ? NaN : (qe * n) / noiseAt(qe * n))),
      type: "scatter" as const, mode: "lines" as const, name: "SNR (read + dark + shot + quantization)", line: { color: "#60a5fa", width: 2 },
    },
    {
      x: photonAxis, y: photonAxis.map(n => Math.sqrt(qe * n)),
      type: "scatter" as const, mode: "lines" as const, name: "Shot-noise limit √(QE·N)", line: { color: "#9ca3af", dash: "dash" },
    },
    ...(saturated || !(photons > 0) || !Number.isFinite(snr)
      ? []
      : [{ x: [photons], y: [snr], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#fbbf24", size: 11 } }]),
  ];
  const temps = Array.from({ length: 81 }, (_, i) => -120 + 2.25 * i);
  const darkChart = [
    {
      x: temps, y: temps.map(T => Math.sqrt(darkRef * doublingLawRatio(T, T_REF, doubling) * t)),
      type: "scatter" as const, mode: "lines" as const, name: "Dark shot noise √D", line: { color: "#f87171", width: 2 },
    },
    { x: [temps[0], temps[temps.length - 1]], y: [read, read], type: "scatter" as const, mode: "lines" as const, name: "Read noise", line: { color: "#34d399", dash: "dash" } },
    { x: [temp], y: [Math.sqrt(dark)], type: "scatter" as const, mode: "markers" as const, name: "Sensor temperature", marker: { color: "#60a5fa", size: 10 } },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm text-gray-400 self-center">Load preset:</span>
        <button type="button" onClick={() => applyPreset(PRESETS.cmos)} className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-sm">Air-cooled sCMOS</button>
        <button type="button" onClick={() => applyPreset(PRESETS.ccd)} className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-sm">Deep-cooled CCD</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Signal (photons/pixel)" value={photonsRaw} onChange={setPhotons} min={0} max={10000000} />
        <ValidatedNumberInput label="Quantum Efficiency" value={qeRaw} onChange={setQuantumEfficiency} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="Exposure Time (ms)" value={exposureRaw} onChange={setExposureTime} min={0.01} max={3600000} />
        <ValidatedNumberInput label="Pixel Pitch (µm)" value={pitchRaw} onChange={setPixelPitch} min={0.5} max={50} step="0.1" />
        <ValidatedNumberInput label="Full Well Capacity (e⁻)" value={wellRaw} onChange={setWellCapacity} min={100} max={1000000} />
        <ValidatedNumberInput label="Read Noise (e⁻ rms)" value={readRaw} onChange={setReadNoise} min={0.1} max={100} step="0.1" />
        <ValidatedNumberInput label="Dark Current at 25 °C (e⁻/s/pixel)" value={darkRaw} onChange={setDarkCurrent} min={0} max={100000} />
        <ValidatedNumberInput label="Sensor Temperature (°C)" value={tempRaw} onChange={setSensorTemp} min={T_MIN} max={T_MAX} />
        <ValidatedNumberInput label="Dark Doubling Temperature (K)" value={doublingRaw} onChange={setDoublingTemp} min={3} max={12} step="0.1" />
        <ValidatedNumberInput label="Conversion Gain K (e⁻/DN)" value={gainRaw} onChange={setConversionGain} min={0.01} max={1000} step="0.01" />
        <ValidatedNumberInput label="ADC Bit Depth" value={bitsRaw} onChange={setBitDepth} min={8} max={24} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Signal" value={`${fmt(signal, 1)} e⁻`} subtext={saturated ? "Saturated: above the full well or ADC full scale" : `QE × ${photons} photons`} tone={saturated ? "red" : "blue"} />
        <ResultCard label="SNR" value={fmt(snr, 2)} subtext={`Total temporal noise ${fmt(noise, 2)} e⁻`} tone="green" />
        <ResultCard label="Dark Charge" value={`${fmt(dark, 4)} e⁻`} subtext={`${darkRate.toExponential(3)} e⁻/s at ${temp} °C`} tone="red" />
        <ResultCard label="Noise Floor" value={`${fmt(floor, 3)} e⁻`} subtext={`${fmt(floor / electronsPerDn, 2)} DN${floor / electronsPerDn < 0.5 ? ": below 0.5 DN, the ADC step limits it" : ""}`} tone="purple" />
        <ResultCard label="Dynamic Range (FW/σ_read)" value={`${fmt(dynamicRangeDb(well, read), 2)} dB`} subtext={`${fmt(Math.log2(well / read), 2)} stops, the usual datasheet figure`} tone="green" />
        <ResultCard label="Dynamic Range at this exposure" value={Number.isFinite(drExposure) ? `${fmt(drExposure, 2)} dB` : "—"} subtext={Number.isFinite(drExposure) ? `${fmt(Math.log2((maxSignal - dark) / floor), 2)} stops: (min(FW, ADC full scale) − D)/noise floor` : "The dark charge fills the well"} tone="green" />
        <ResultCard label="ADC Full Scale" value={`${fmt(adcFullScale, 0)} e⁻`} subtext={adcFullScale < well ? "Below the full well: the ADC clips first" : `Quantization noise ${fmt(electronsPerDn / Math.sqrt(12), 3)} e⁻`} tone={adcFullScale < well ? "orange" : "yellow"} />
        <ResultCard label="Peak SNR √FW" value={fmt(Math.sqrt(maxSignal), 1)} subtext="Shot-noise limit at the largest signal" tone="cyan" />
        <ResultCard label="Dark ≤ Read Noise Below" value={crossoverInRange ? `${fmt(crossoverRaw, 1)} °C` : "—"} subtext={crossoverInRange ? "Cooling further gains little at this exposure" : `outside the ${T_MIN.toString().replace("-", "−")}…${T_MAX} °C range`} tone="blue" />
        <ResultCard label="Dark Current Density at 25 °C" value={`${fmt(density, 3)} pA/cm²`} subtext={`q·R/p² for a ${pitch} µm pixel`} tone="gray" />
        <ResultCard label="Full-Well Density" value={`${fmt(well / pitch ** 2, 0)} e⁻/µm²`} subtext="Full well per pixel area" tone="gray" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <ChartPanel data={snrChart} layout={{ xaxis: { title: "Signal (photons/pixel)", gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR", gridcolor: "#374151", type: "log" } }} />
        <ChartPanel data={darkChart} layout={{ xaxis: { title: "Sensor temperature (°C)", gridcolor: "#374151" }, yaxis: { title: "Noise per exposure (e⁻ rms)", gridcolor: "#374151", type: "log" } }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 font-mono space-y-1">
        <p>S = QE·N; D = R₂₅·2^((T − 25 °C)/T_d)·t; σ_q = Δ/√12, Δ in e⁻/DN</p>
        <p>SNR = S / √(S + D + σ_read² + σ_q²)</p>
        <p>DR = 20·log₁₀((S_max − D)/σ_floor), S_max = min(FW, K·(2^bits − 1)), σ_floor = √(σ_read² + D + σ_q²)</p>
        <p>Dark ≤ read noise for T ≤ 25 °C + T_d·log₂(σ_read²/(R₂₅·t))</p>
      </div>
    </>
  );
}
