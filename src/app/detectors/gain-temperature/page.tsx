"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Gain vs Temperature for APDs/PMTs
// APD: M(T) = M(T_ref) / [1 + α(T - T_ref)]  where α ≈ 0.003-0.006 /°C
// PMT: gain temperature coefficient typically -0.3 to -0.5 %/°C
// M(T) = M0 * exp(-β * (T - T0)) for PMTs
export default function GainTemperaturePage() {
  const [gainRef, setGainRef] = useState(100); // gain at T_ref
  const [tempRef, setTempRef] = useState(25); // °C
  const [tempCoeff, setTempCoeff] = useState(0.003); // /°C for APD
  const [tempMin, setTempMin] = useState(-40);
  const [tempMax, setTempMax] = useState(80);
  const [detectorType, setDetectorType] = useState<"apd" | "pmt">("apd");
  const [pmtCoeff, setPmtCoeff] = useState(-0.003); // %/°C for PMT

  const gainAtT = (T: number) => {
    if (detectorType === "apd") {
      return gainRef / (1 + tempCoeff * (T - tempRef));
    }
    return gainRef * Math.exp(pmtCoeff * (T - tempRef));
  };

  const gainAtMin = gainAtT(tempMin);
  const gainAtMax = gainAtT(tempMax);
  const gainVariation = gainAtMax / gainAtMin;
  const tempStability = detectorType === "apd"
    ? `±${(tempCoeff * 100).toFixed(1)}%/°C`
    : `${(pmtCoeff * 100).toFixed(1)}%/°C`;

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 300 }, (_, i) => tempMin + i * (tempMax - tempMin) / 300);
    const gains = temps.map(gainAtT);
    const gainDb = gains.map(g => 20 * Math.log10(g));
    return [
      { x: temps, y: gains, type: "scatter", mode: "lines",
        name: "Gain (linear)", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
      { x: temps, y: gainDb, type: "scatter", mode: "lines",
        name: "Gain (dB)", line: { color: "#fbbf24", width: 2, dash: "dash" }, yaxis: "y2" },
    ];
  }, [detectorType, gainRef, tempCoeff, pmtCoeff, tempRef, tempMin, tempMax]);

  const stabilityChart = useMemo(() => {
    const deltaT = Array.from({ length: 100 }, (_, i) => -20 + i * 40 / 100);
    const percentChange = deltaT.map(dT => {
      if (detectorType === "apd") {
        return ((gainRef / (1 + tempCoeff * dT) - gainRef) / gainRef) * 100;
      }
      return (Math.exp(pmtCoeff * dT) - 1) * 100;
    });
    return [
      { x: deltaT, y: percentChange, type: "scatter", mode: "lines",
        name: "Gain Change (%)", line: { color: "#f87171", width: 2 } },
    ];
  }, [detectorType, gainRef, tempCoeff, pmtCoeff]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Gain vs Temperature</h1>
      <p className="text-gray-400 mb-8">Temperature dependence of detector gain for APDs and PMTs.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Detector Type</span>
          <select value={detectorType} onChange={e => setDetectorType(e.target.value as any)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="apd">APD</option>
            <option value="pmt">PMT</option>
          </select>
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Gain at {tempRef}°C</span>
          <input type="number" value={gainRef} onChange={e => setGainRef(+e.target.value)} min="1" step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        {detectorType === "apd" ? (
          <label className="block">
            <span className="text-gray-300 text-sm">APD Temp Coefficient (/°C)</span>
            <input type="number" value={tempCoeff} onChange={e => setTempCoeff(+e.target.value)} min="0.0001" max="0.02" step="0.001"
              className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
        ) : (
          <label className="block">
            <span className="text-gray-300 text-sm">PMT Temp Coefficient (%/°C)</span>
            <input type="number" value={pmtCoeff * 100} onChange={e => setPmtCoeff(+e.target.value / 100)} min="-2" max="0" step="0.1"
              className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
        )}
        <label className="block">
          <span className="text-gray-300 text-sm">Temp Range ({tempMin}°C to {tempMax}°C)</span>
          <div className="flex gap-2 mt-1">
            <input type="number" value={tempMin} onChange={e => setTempMin(+e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
            <input type="number" value={tempMax} onChange={e => setTempMax(+e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Gain @ {tempMin}°C</p>
          <p className="text-xl font-bold text-blue-400">{gainAtMin.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Gain @ {tempMax}°C</p>
          <p className="text-xl font-bold text-red-400">{gainAtMax.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Gain Ratio (max/min)</p>
          <p className="text-xl font-bold text-yellow-400">×{gainVariation.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Temp Stability</p>
          <p className="text-xl font-bold text-green-400">{tempStability}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>APD: M(T) = M<sub>ref</sub> / (1 + α · ΔT), α ≈ 0.003/°C (Si), 0.006/°C (InGaAs)</p>
        <p>PMT: M(T) = M<sub>0</sub> · exp(β · ΔT), β ≈ −0.003/°C (typical)</p>
        <p>Compensation: active temperature control or real-time gain calibration via reference LED.</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Temperature (°C)", gridcolor: "#374151" },
        yaxis: { title: "Gain (linear)", gridcolor: "#374151" },
        yaxis2: { title: "Gain (dB)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 30, r: 60, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} config={{ responsive: true, displayModeBar: false }} />

      <h2 className="text-xl font-bold mt-8 mb-4">Gain Change vs ΔT from Reference</h2>
      <Plot data={stabilityChart} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "ΔT from Reference (°C)", gridcolor: "#374151" },
        yaxis: { title: "Gain Change (%)", gridcolor: "#374151" },
        margin: { t: 30, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} config={{ responsive: true, displayModeBar: false }} />
    </div>
  );
}
