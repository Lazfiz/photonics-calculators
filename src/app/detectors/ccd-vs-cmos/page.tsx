"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function CcdVsCmosPage() {
  const [signal, setSignal] = useState(10000); // e-
  const [exposureTime, setExposureTime] = useState(1); // s
  const [darkCurrent, setDarkCurrent] = useState(0.01); // e-/pix/s

  const sensors = {
    ccd: { readNoise: 3, darkCurrent: 0.001, wellCapacity: 100000, pixelSize: 15, qe: 0.95, frameRate: 10, power: 0.5, cost: "$$$" },
    cmos_sci: { readNoise: 1.5, darkCurrent: 0.01, wellCapacity: 50000, pixelSize: 6.5, qe: 0.90, frameRate: 100, power: 0.2, cost: "$$" },
    cmos_phone: { readNoise: 2, darkCurrent: 0.05, wellCapacity: 20000, pixelSize: 1.2, qe: 0.65, frameRate: 60, power: 0.05, cost: "$" },
    emccd: { readNoise: 0.001, darkCurrent: 0.001, wellCapacity: 100000, pixelSize: 13, qe: 0.95, frameRate: 30, power: 1.0, cost: "$$$$" },
  };

  const calcSNR = (sig: number, rn: number, dc: number, t: number, wc: number) => {
    const dark = dc * t;
    const total = sig + dark;
    const shotNoise = Math.sqrt(total);
    const snr = sig / Math.sqrt(rn * rn + total);
    const dynamicRange = 20 * Math.log10(wc / rn);
    return { snr, dynamicRange, dark, shotNoise, total };
  };

  const chartData = useMemo(() => {
    const signals = Array.from({ length: 300 }, (_, i) => 1 + i * 100000 / 300);
    const traces: any[] = [];
    const colors = ["#60a5fa", "#34d399", "#fbbf24", "#c084fc"];
    const names = ["CCD", "sCMOS", "Phone CMOS", "EMCCD"];

    Object.entries(sensors).forEach(([key, s], idx) => {
      traces.push({
        x: signals, y: signals.map(sig => calcSNR(sig, s.readNoise, s.darkCurrent, exposureTime, s.wellCapacity).snr),
        type: "scatter" as const, mode: "lines" as const,
        name: names[idx], line: { color: colors[idx] },
      });
    });
    // Mark current signal
    traces.push({
      x: [signal], y: [calcSNR(signal, sensors.ccd.readNoise, darkCurrent, exposureTime, sensors.ccd.wellCapacity).snr],
      type: "scatter" as const, mode: "markers" as const,
      name: "Signal", marker: { color: "#f87171", size: 10 },
    });
    return traces;
  }, [signal, exposureTime, darkCurrent]);

  const results = Object.entries(sensors).map(([key, s]) => ({
    key, snr: calcSNR(signal, s.readNoise, s.darkCurrent, exposureTime, s.wellCapacity),
    sensor: s,
  }));

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">CCD vs CMOS Comparison</h1>
      <p className="text-gray-400 mb-8">Compare sensor architectures — SNR, dynamic range, and performance metrics.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Signal (e⁻)</span>
          <input type="number" value={signal} onChange={e => setSignal(+e.target.value)} min="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Exposure Time (s)</span>
          <input type="number" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} min="0.001" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Dark Current (e⁻/pix/s)</span>
          <input type="number" value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)} min="0" step="0.001"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="py-2 text-left">Sensor</th>
              <th className="py-2">Read Noise</th>
              <th className="py-2">Dark</th>
              <th className="py-2">FWC</th>
              <th className="py-2">Pixel</th>
              <th className="py-2">QE</th>
              <th className="py-2">SNR</th>
              <th className="py-2">DR</th>
              <th className="py-2">FPS</th>
            </tr>
          </thead>
          <tbody>
            {results.map(({ key, snr, sensor }, i) => {
              const names = ["CCD", "sCMOS", "Phone CMOS", "EMCCD"];
              const colors = ["text-blue-400", "text-green-400", "text-yellow-400", "text-purple-400"];
              return (
                <tr key={key} className="border-b border-gray-800/50">
                  <td className={`py-2 font-semibold ${colors[i]}`}>{names[i]}</td>
                  <td className="py-2 text-center">{sensor.readNoise} e⁻</td>
                  <td className="py-2 text-center">{sensor.darkCurrent} e⁻/s</td>
                  <td className="py-2 text-center">{(sensor.wellCapacity / 1000).toFixed(0)}k</td>
                  <td className="py-2 text-center">{sensor.pixelSize} µm</td>
                  <td className="py-2 text-center">{(sensor.qe * 100).toFixed(0)}%</td>
                  <td className={`py-2 text-center font-bold ${colors[i]}`}>{snr.snr.toFixed(1)}</td>
                  <td className="py-2 text-center">{snr.dynamicRange.toFixed(0)} dB</td>
                  <td className="py-2 text-center">{sensor.frameRate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300">
        <p>SNR = S / √(σ<sub>read</sub>² + S + D·t), where S = signal, D = dark current, t = exposure</p>
        <p>Dynamic Range = 20·log₁₀(FWC / σ<sub>read</sub>) dB</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Signal (e⁻)", gridcolor: "#374151", type: "log" },
        yaxis: { title: "SNR", gridcolor: "#374151" },
        margin: { t: 30, r: 30, b: 50, l: 60 }, legend: { bgcolor: "transparent" },
      }} config={{ responsive: true, displayModeBar: false }} />
    </div>
  );
}
