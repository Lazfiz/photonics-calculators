"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { doublingLawRatio } from "../../../physics/detectors/dark-current";
import { sensorNoise } from "../../../physics/detectors/sensor-noise";
import {
  DARK_REF_TEMP as T_REF,
  SENSOR_PRESETS,
  SENSOR_TEMP_MAX as T_MAX,
  SENSOR_TEMP_MIN as T_MIN,
  type SensorPreset as Preset,
  sensorCmosSummary,
} from "../../../physics/imaging/sensor-cmos";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");

export default function SensorDesignPage() {
  const [photonsRaw, setPhotons] = useURLState("photons", 1000);
  const [qeRaw, setQuantumEfficiency] = useURLState("quantumEfficiency", SENSOR_PRESETS.cmos.quantumEfficiency);
  const [pitchRaw, setPixelPitch] = useURLState("pixelPitch", SENSOR_PRESETS.cmos.pixelPitch);
  const [wellRaw, setWellCapacity] = useURLState("wellCapacity", SENSOR_PRESETS.cmos.wellCapacity);
  const [readRaw, setReadNoise] = useURLState("readNoise", SENSOR_PRESETS.cmos.readNoise);
  const [darkRaw, setDarkCurrent] = useURLState("darkCurrent", SENSOR_PRESETS.cmos.darkCurrent);
  const [tempRaw, setSensorTemp] = useURLState("sensorTemp", SENSOR_PRESETS.cmos.sensorTemp);
  const [doublingRaw, setDoublingTemp] = useURLState("doublingTemp", 6);
  const [exposureRaw, setExposureTime] = useURLState("exposureTime", SENSOR_PRESETS.cmos.exposureTime);
  const [gainRaw, setConversionGain] = useURLState("conversionGain", SENSOR_PRESETS.cmos.conversionGain);
  const [bitsRaw, setBitDepth] = useURLState("bitDepth", SENSOR_PRESETS.cmos.bitDepth);

  const photons = clamp(photonsRaw, 0, 1e7, 1000);
  const qe = clamp(qeRaw, 0.01, 1, SENSOR_PRESETS.cmos.quantumEfficiency);
  const pitch = clamp(pitchRaw, 0.5, 50, SENSOR_PRESETS.cmos.pixelPitch);
  const well = clamp(wellRaw, 100, 1e6, SENSOR_PRESETS.cmos.wellCapacity);
  const read = clamp(readRaw, 0.1, 100, SENSOR_PRESETS.cmos.readNoise);
  const darkRef = clamp(darkRaw, 0, 1e5, SENSOR_PRESETS.cmos.darkCurrent);
  const temp = clamp(tempRaw, T_MIN, T_MAX, SENSOR_PRESETS.cmos.sensorTemp);
  const doubling = clamp(doublingRaw, 3, 12, 6);
  const exposureMs = clamp(exposureRaw, 0.01, 3.6e6, SENSOR_PRESETS.cmos.exposureTime);
  const electronsPerDn = clamp(gainRaw, 0.01, 1000, SENSOR_PRESETS.cmos.conversionGain);
  const bits = Math.round(clamp(bitsRaw, 8, 24, SENSOR_PRESETS.cmos.bitDepth));

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
  const m = sensorCmosSummary({
    photons, quantumEfficiency: qe, pitch: pitch * 1e-6, well, read, darkRef, temp, doubling, exposure: t, electronsPerDn, bits,
  });
  const { signal, darkRate, dark, adcFullScale, maxSignal, floor, noise, saturated, snr, drExposureDb: drExposure, crossoverInRange } = m;
  const crossoverRaw = m.crossoverTemp;
  const density = m.darkDensity * 1e8; // A/m² → pA/cm²
  const noiseAt = (s: number) => sensorNoise({ signal: s, read, dark, electronsPerDn }).temporal;

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
        <button type="button" onClick={() => applyPreset(SENSOR_PRESETS.cmos)} className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-sm">Air-cooled sCMOS</button>
        <button type="button" onClick={() => applyPreset(SENSOR_PRESETS.ccd)} className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-sm">Deep-cooled CCD</button>
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
        <ResultCard label="Noise Floor" value={`${fmt(floor, 3)} e⁻`} subtext={`${fmt(m.floorDn, 2)} DN${m.adcLimitsFloor ? ": below 0.5 DN, the ADC step limits it" : ""}`} tone="purple" />
        <ResultCard label="Dynamic Range (FW/σ_read)" value={`${fmt(m.drDatasheetDb, 2)} dB`} subtext={`${fmt(m.drDatasheetStops, 2)} stops, the usual datasheet figure`} tone="green" />
        <ResultCard label="Dynamic Range at this exposure" value={Number.isFinite(drExposure) ? `${fmt(drExposure, 2)} dB` : "—"} subtext={Number.isFinite(drExposure) ? `${fmt(m.drExposureStops, 2)} stops: (min(FW, ADC full scale) − D)/noise floor` : "The dark charge fills the well"} tone="green" />
        <ResultCard label="ADC Full Scale" value={`${fmt(adcFullScale, 0)} e⁻`} subtext={adcFullScale < well ? "Below the full well: the ADC clips first" : `Quantization noise ${fmt(m.quantization, 3)} e⁻`} tone={adcFullScale < well ? "orange" : "yellow"} />
        <ResultCard label="Peak SNR √FW" value={fmt(m.peakSnr, 1)} subtext="Shot-noise limit at the largest signal" tone="cyan" />
        <ResultCard label="Dark ≤ Read Noise Below" value={crossoverInRange ? `${fmt(crossoverRaw, 1)} °C` : "—"} subtext={crossoverInRange ? "Cooling further gains little at this exposure" : `outside the ${T_MIN.toString().replace("-", "−")}…${T_MAX} °C range`} tone="blue" />
        <ResultCard label="Dark Current Density at 25 °C" value={`${fmt(density, 3)} pA/cm²`} subtext={`q·R/p² for a ${pitch} µm pixel`} tone="gray" />
        <ResultCard label="Full-Well Density" value={`${fmt(m.wellDensity / 1e12, 0)} e⁻/µm²`} subtext="Full well per pixel area" tone="gray" />
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
