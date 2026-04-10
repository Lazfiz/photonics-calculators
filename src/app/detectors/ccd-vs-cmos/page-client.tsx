"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
const sensors = {
  ccd: { readNoise: 3, darkCurrent: 0.001, wellCapacity: 100000, pixelSize: 15, qe: 0.95, frameRate: 10 },
  cmos_sci: { readNoise: 1.5, darkCurrent: 0.01, wellCapacity: 50000, pixelSize: 6.5, qe: 0.90, frameRate: 100 },
  cmos_phone: { readNoise: 15, darkCurrent: 5, wellCapacity: 20000, pixelSize: 1.2, qe: 0.65, frameRate: 60 },
  emccd: { readNoise: 0.1, darkCurrent: 0.001, wellCapacity: 100000, pixelSize: 13, qe: 0.95, frameRate: 30 },
};
const sensorNames = ["CCD", "sCMOS", "Phone CMOS", "EMCCD"];
const sensorColors = ["text-blue-400", "text-green-400", "text-yellow-400", "text-purple-400"];
const plotColors = ["#60a5fa", "#34d399", "#fbbf24", "#c084fc"];

export default function CcdVsCmosPage() {
  const [signal, setSignal] = useURLState("signal", 10000);
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 1);

  const calcSNR = (sig: number, rn: number, dc: number, t: number, wc: number) => {
    const dark = dc * t;
    return { snr: sig / Math.sqrt(rn * rn + sig + dark), dynamicRange: 20 * Math.log10(wc / rn) };
  };

  const chartData = useMemo(() => {
    const signals = Array.from({ length: 300 }, (_, i) => 1 + i * 100000 / 300);
    const traces: any[] = [];
    Object.entries(sensors).forEach(([key, s], idx) => {
      traces.push({ x: signals, y: signals.map(sig => calcSNR(sig, s.readNoise, s.darkCurrent, exposureTime, s.wellCapacity).snr), type: "scatter" as const, mode: "lines" as const, name: sensorNames[idx], line: { color: plotColors[idx] } });
    });
    traces.push({ x: [signal], y: [calcSNR(signal, sensors.ccd.readNoise, sensors.ccd.darkCurrent, exposureTime, sensors.ccd.wellCapacity).snr], type: "scatter" as const, mode: "markers" as const, name: `Signal (CCD)`, marker: { color: "#f87171", size: 10 } });
    return traces;
  }, [signal, exposureTime]);

  const results = Object.entries(sensors).map(([key, s]) => ({ key, snr: calcSNR(signal, s.readNoise, s.darkCurrent, exposureTime, s.wellCapacity), sensor: s }));

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="CCD vs CMOS Sensor Comparison" description="Compare sensor architectures — SNR, dynamic range, and performance metrics.">
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Signal (e⁻)" value={signal} onChange={setSignal} min={1} />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} min={0.001} step="0.1" />
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-400 border-b border-gray-800"><th className="py-2 text-left">Sensor</th><th className="py-2">Read Noise</th><th className="py-2">Dark</th><th className="py-2">FWC</th><th className="py-2">Pixel</th><th className="py-2">QE</th><th className="py-2">SNR</th><th className="py-2">DR</th><th className="py-2">FPS</th></tr></thead>
          <tbody>
            {results.map(({ key, snr, sensor }, i) => (
              <tr key={key} className="border-b border-gray-800/50">
                <td className={`py-2 font-semibold ${sensorColors[i]}`}>{sensorNames[i]}</td>
                <td className="py-2 text-center">{sensor.readNoise} e⁻</td>
                <td className="py-2 text-center">{sensor.darkCurrent} e⁻/s</td>
                <td className="py-2 text-center">{(sensor.wellCapacity / 1000).toFixed(0)}k</td>
                <td className="py-2 text-center">{sensor.pixelSize} µm</td>
                <td className="py-2 text-center">{(sensor.qe * 100).toFixed(0)}%</td>
                <td className={`py-2 text-center font-bold ${sensorColors[i]}`}>{snr.snr.toFixed(1)}</td>
                <td className="py-2 text-center">{snr.dynamicRange.toFixed(0)} dB</td>
                <td className="py-2 text-center">{sensor.frameRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>SNR = S / √(σ_read² + S + D·t)</p>
        <p>Dynamic Range = 20·log₁₀(FWC / σ_read) dB</p>
        <p>⚠ EMCCD SNR shown here does NOT include excess noise factor (√2 penalty on shot noise)</p>
        <p>Real EMCCD SNR at low light ≈ S / √(2S + σ_read² + D·t) — slightly worse than shown</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Signal (e⁻)", gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} />
    </CalculatorShell>
  );
}
