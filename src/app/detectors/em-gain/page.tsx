"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function EmGainPage() {
  const [emGain, setEmGain] = useState(100);
  const [inputSignal, setInputSignal] = useState(10); // e-
  const [clockInducedCharge, setClockInducedCharge] = useState(0.001); // e- per gain stage
  const [excessNoiseFactor, setExcessNoiseFactor] = useState(1.4); // F ≈ √2 for EMCCD
  const [readNoise, setReadNoise] = useState(50); // e- rms (pre-gain)

  const gainStages = 604; // typical
  const gainPerStage = Math.pow(emGain, 1 / gainStages);
  const outputSignal = inputSignal * emGain;
  const outputNoise = Math.sqrt(inputSignal * emGain * emGain * excessNoiseFactor);
  const cicTotal = clockInducedCharge * emGain;
  const effectiveReadNoise = readNoise / emGain;
  const snrWithEM = inputSignal / Math.sqrt(inputSignal * excessNoiseFactor + clockInducedCharge + (readNoise / emGain) ** 2);
  const snrWithoutEM = inputSignal / Math.sqrt(inputSignal + readNoise ** 2);
  const emBenefit = snrWithEM / snrWithoutEM;

  const chartData = useMemo(() => {
    const gains = Array.from({ length: 300 }, (_, i) => 1 + i * 9999 / 300);
    // SNR vs EM gain for different signal levels
    const signals = [1, 5, 10, 50];
    const colors = ["#f87171", "#fbbf24", "#34d399", "#60a5fa"];
    const traces = signals.map((sig, idx) => ({
      x: gains, y: gains.map(g => {
        const snrEm = sig / Math.sqrt(sig * excessNoiseFactor + clockInducedCharge + (readNoise / g) ** 2);
        const snrNoEm = sig / Math.sqrt(sig + readNoise ** 2);
        return snrEm / snrNoEm;
      }),
      type: "scatter" as const, mode: "lines" as const,
      name: `${sig} e⁻`, line: { color: colors[idx] },
    }));
    // Unity line
    traces.push({
      x: [1, 10000], y: [1, 1], type: "scatter" as const, mode: "lines" as const,
      name: "No benefit", line: { color: "#9ca3af", dash: "dash" },
    });
    // Current point
    traces.push({
      x: [emGain], y: [emBenefit], type: "scatter" as const, mode: "markers" as const,
      name: "Current", marker: { color: "#c084fc", size: 10 },
    });
    return traces;
  }, [emGain, inputSignal, clockInducedCharge, excessNoiseFactor, readNoise, emBenefit]);

  // Find optimal gain
  const optimalGainData = useMemo(() => {
    const gains = Array.from({ length: 500 }, (_, i) => 1 + i * 2000 / 500);
    const best = gains.reduce((best, g) => {
      const snr = inputSignal / Math.sqrt(inputSignal * excessNoiseFactor + clockInducedCharge + (readNoise / g) ** 2);
      return snr > best.snr ? { gain: g, snr } : best;
    }, { gain: 1, snr: 0 });
    return best;
  }, [inputSignal, excessNoiseFactor, clockInducedCharge, readNoise]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">EMCCD Gain Calculator</h1>
      <p className="text-gray-400 mb-8">Electron multiplying CCD gain — noise analysis, optimal gain, and SNR comparison.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">EM Gain</span>
          <input type="number" value={emGain} onChange={e => setEmGain(+e.target.value)} min="1" max="10000"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Input Signal (e⁻)</span>
          <input type="number" value={inputSignal} onChange={e => setInputSignal(+e.target.value)} min="0.01" step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">CIC (e⁻/stage)</span>
          <input type="number" value={clockInducedCharge} onChange={e => setClockInducedCharge(+e.target.value)} min="0" step="0.0005"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Excess Noise Factor F</span>
          <input type="number" value={excessNoiseFactor} onChange={e => setExcessNoiseFactor(+e.target.value)} min="1" max="2" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Read Noise (e⁻ rms)</span>
          <input type="number" value={readNoise} onChange={e => setReadNoise(+e.target.value)} min="1" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output Signal</p>
          <p className="text-xl font-bold text-blue-400">{outputSignal.toFixed(0)} e⁻</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Effective Read Noise</p>
          <p className="text-xl font-bold text-green-400">{effectiveReadNoise.toFixed(3)} e⁻</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SNR with EM</p>
          <p className="text-xl font-bold text-purple-400">{snrWithEM.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SNR without EM</p>
          <p className="text-xl font-bold text-gray-400">{snrWithoutEM.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">EM Benefit</p>
          <p className="text-xl font-bold text-yellow-400">{emBenefit > 1 ? `×${emBenefit.toFixed(2)}` : `${emBenefit.toFixed(2)}`}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Optimal Gain</p>
          <p className="text-xl font-bold text-red-400">{optimalGainData.gain.toFixed(0)}×</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>SNR<sub>EM</sub> = S / √(F·S + CIC + (σ<sub>read</sub>/G)²)</p>
        <p>Excess noise: F ≈ √2 for stochastic EM multiplication</p>
        <p>EM helps when σ<sub>read</sub> dominates — for bright signals, conventional CCD is better</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "EM Gain", gridcolor: "#374151", type: "log" },
        yaxis: { title: "SNR Ratio (EM / conventional)", gridcolor: "#374151" },
        margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
      }} config={{ responsive: true, displayModeBar: false }} />
    </div>
  );
}
