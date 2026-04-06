"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function TemporalNoisePage() {
  const [readNoise, setReadNoise] = useState(5); // e- rms
  const [darkCurrent, setDarkCurrent] = useState(0.1); // e-/pixel/s
  const [exposureTime, setExposureTime] = useState(0.01); // s
  const [kneeFreq, setKneeFreq] = useState(1000); // Hz (1/f corner)
  const [bandwidth, setBandwidth] = useState(1e6); // Hz
  const [conversionGain, setConversionGain] = useState(2.0); // μV/e-

  const chartData = useMemo(() => {
    // Noise PSD vs frequency
    const freq = Array.from({ length: 300 }, (_, i) => 1 + Math.pow(1e8, i / 300));
    // 1/f noise: S(f) = K/f (normalized)
    const oneOverF = freq.map(f => kneeFreq / f);
    // White noise floor
    const whiteNoise = freq.map(() => 1);
    // Total PSD
    const totalPSD = freq.map((f, i) => whiteNoise[i] + oneOverF[i]);
    // Convert to voltage noise density (μV/√Hz)
    const voltagePSD = totalPSD.map(s => conversionGain * Math.sqrt(s));

    return [
      { x: freq, y: oneOverF, type: "scatter" as const, mode: "lines" as const, name: "1/f noise", line: { color: "#f87171", width: 2 } },
      { x: freq, y: whiteNoise, type: "scatter" as const, mode: "lines" as const, name: "White noise", line: { color: "#60a5fa", width: 2, dash: "dash" } },
      { x: freq, y: totalPSD, type: "scatter" as const, mode: "lines" as const, name: "Total PSD", line: { color: "#fbbf24", width: 2.5 } },
    ];
  }, [kneeFreq, bandwidth, conversionGain]);

  // Noise vs integration time
  const noiseVsTime = useMemo(() => {
    const times = Array.from({ length: 200 }, (_, i) => 1e-6 * Math.pow(1e4, i / 200)); // 1μs to 10s
    const readN = times.map(() => readNoise);
    const darkN = times.map(t => Math.sqrt(darkCurrent * t));
    const totalN = times.map((t, i) => Math.sqrt(readN[i]**2 + darkN[i]**2));
    return [
      { x: times, y: readN, type: "scatter" as const, mode: "lines" as const, name: "Read noise", line: { color: "#60a5fa", width: 2 } },
      { x: times, y: darkN, type: "scatter" as const, mode: "lines" as const, name: "Dark shot noise", line: { color: "#f87171", width: 2 } },
      { x: times, y: totalN, type: "scatter" as const, mode: "lines" as const, name: "Total noise", line: { color: "#fbbf24", width: 2.5 } },
    ];
  }, [readNoise, darkCurrent, exposureTime]);

  const darkShotNoise = Math.sqrt(darkCurrent * exposureTime);
  const totalNoise = Math.sqrt(readNoise**2 + darkShotNoise**2);
  // 1/f noise integrated: ~ K * ln(f_high/f_low)
  const oneOverFNoise = readNoise * 0.5 * Math.log10(bandwidth / kneeFreq + 1);
  const totalNoiseWithF = Math.sqrt(readNoise**2 + darkShotNoise**2 + oneOverFNoise**2);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Temporal Noise" description="1/f noise, white (shot) noise, and read noise as functions of frequency and integration time.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Read Noise (e⁻ rms)" value={readNoise} onChange={setReadNoise} />
        <ValidatedNumberInput label="Dark Current (e⁻/pix/s)" value={darkCurrent} onChange={setDarkCurrent} />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} />
        <ValidatedNumberInput label="1/f Corner Frequency (Hz)" value={kneeFreq} onChange={setKneeFreq} />
        <ValidatedNumberInput label="Bandwidth (Hz)" value={bandwidth} onChange={setBandwidth} />
        <ValidatedNumberInput label="Conversion Gain (μV/e⁻)" value={conversionGain} onChange={setConversionGain} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300">Read noise = <span className="text-blue-400 font-mono">{readNoise.toFixed(1)} e⁻</span></p>
        <p className="text-gray-300">Dark shot noise = <span className="text-blue-400 font-mono">{darkShotNoise.toFixed(2)} e⁻</span></p>
        <p className="text-gray-300">1/f noise ≈ <span className="text-blue-400 font-mono">{oneOverFNoise.toFixed(2)} e⁻</span></p>
        <p className="text-gray-300">Total noise (with 1/f) = <span className="text-blue-400 font-mono">{totalNoiseWithF.toFixed(2)} e⁻</span></p>
        <p className="text-gray-300 text-sm mt-1">σ<sub>1/f</sub> ∝ K·ln(f<sub>H</sub>/f<sub>L</sub>) | σ<sub>dark</sub> = √(I<sub>dark</sub>·t) | σ<sub>total</sub> = √(σ²<sub>read</sub> + σ²<sub>dark</sub> + σ²<sub>1/f</sub>)</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Frequency (Hz)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Noise PSD (normalized)", type: "log", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 70, r: 20 }, autosize: true, showlegend: true
      }} className="w-full mb-6" />

      <ChartPanel data={noiseVsTime} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Integration Time (s)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Noise (e⁻ rms)", type: "log", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 70, r: 20 }, autosize: true, showlegend: true
      }} />
    </CalculatorShell>
  );
}
