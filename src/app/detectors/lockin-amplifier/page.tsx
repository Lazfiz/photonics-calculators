"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Lock-in amplifier: V_out = V_signal * cos(Δφ) * (2/π) for square-wave demod
// ENBW = 1/(4*RC) for 1st-order RC output filter
// SNR improvement = sqrt(B_in / B_out)
export default function LockinAmplifierPage() {
  const [signalFreq, setSignalFreq] = useState(1000); // Hz
  const [refFreq, setRefFreq] = useState(1000); // Hz
  const [phaseShift, setPhaseShift] = useState(0); // degrees
  const [signalAmp, setSignalAmp] = useState(1); // μV
  const [noiseDensity, setNoiseDensity] = useState(10); // nV/√Hz
  const [timeConstant, setTimeConstant] = useState(1); // seconds
  const [filterOrder, setFilterOrder] = useState(1); // 1 or 2

  const deltaF = Math.abs(signalFreq - refFreq);
  const phaseRad = (phaseShift * Math.PI) / 180;
  const enbw = 1 / (4 * timeConstant); // Hz, for 1st order
  const enbwActual = filterOrder === 1 ? enbw : enbw * 0.5; // 2nd order: ENBW ≈ half
  const outputSignal = signalAmp * 1e-6 * Math.cos(phaseRad) * (2 / Math.PI); // V (square ref)
  const inputNoiseBW = signalFreq * 0.5; // assume 0.5*f as input bandwidth
  const inputNoise = noiseDensity * 1e-9 * Math.sqrt(inputNoiseBW);
  const outputNoise = noiseDensity * 1e-9 * Math.sqrt(enbwActual);
  const snrInput = signalAmp * 1e-6 / inputNoise;
  const snrOutput = Math.abs(outputSignal) / outputNoise;
  const snrImprovement = snrOutput / snrInput;

  const chartData = useMemo(() => {
    const f = Array.from({ length: 500 }, (_, i) => 0.1 + i * 5000 / 500);
    // PSD of noise floor
    const noiseFloor = f.map(() => noiseDensity * 1e-9);
    // Lock-in transfer: narrow bandpass at ref freq, width = ENBW
    const transfer = f.map(fi => {
      const dist = Math.abs(fi - refFreq);
      return Math.exp(-dist / (enbwActual * 2));
    });
    // Output noise density after lock-in
    const outNoise = f.map((fi, i) => noiseDensity * 1e-9 * transfer[i]);

    return [
      { x: f, y: noiseFloor.map(v => v * 1e9), type: "scatter", mode: "lines",
        name: "Input Noise Floor", line: { color: "#f87171", width: 2 }, yaxis: "y" },
      { x: f, y: outNoise.map(v => v * 1e9), type: "scatter", mode: "lines",
        name: "After Lock-in", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
      { x: f, y: transfer, type: "scatter", mode: "lines",
        name: "Transfer Function", line: { color: "#34d399", dash: "dash" }, yaxis: "y2" },
    ];
  }, [noiseDensity, refFreq, enbwActual]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Lock-in Amplifier</h1>
      <p className="text-gray-400 mb-8">Phase-sensitive detection — recover signals buried deep in noise.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Signal Frequency (Hz)</span>
          <input type="number" value={signalFreq} onChange={e => setSignalFreq(+e.target.value)} min="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Reference Frequency (Hz)</span>
          <input type="number" value={refFreq} onChange={e => setRefFreq(+e.target.value)} min="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Phase Shift (°)</span>
          <input type="number" value={phaseShift} onChange={e => setPhaseShift(+e.target.value)} min="-180" max="180"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Signal Amplitude (μV)</span>
          <input type="number" value={signalAmp} onChange={e => setSignalAmp(+e.target.value)} min="0.001" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Input Noise Density (nV/√Hz)</span>
          <input type="number" value={noiseDensity} onChange={e => setNoiseDensity(+e.target.value)} min="0.1" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Time Constant (s)</span>
          <input type="number" value={timeConstant} onChange={e => setTimeConstant(+e.target.value)} min="0.001" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Δf (mismatch)</p>
          <p className="text-xl font-bold text-yellow-400">{deltaF} Hz</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ENBW</p>
          <p className="text-xl font-bold text-blue-400">{(enbwActual).toFixed(3)} Hz</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output Signal</p>
          <p className="text-xl font-bold text-green-400">{(outputSignal * 1e6).toFixed(2)} μV</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SNR Improvement</p>
          <p className="text-xl font-bold text-purple-400">×{snrImprovement.toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>V<sub>out</sub> = V<sub>sig</sub> · cos(Δφ) · (2/π)  [square-wave reference]</p>
        <p>ENBW = 1 / (4 · RC)  [1st-order low-pass]</p>
        <p>SNR improvement = √(BW<sub>in</sub> / ENBW) = √({inputNoiseBW.toFixed(0)} / {enbwActual.toFixed(3)}) = ×{snrImprovement.toFixed(1)}</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Frequency (Hz)", gridcolor: "#374151", type: "log" },
        yaxis: { title: "Noise Density (nV/√Hz)", gridcolor: "#374151", type: "log" },
        yaxis2: { title: "Transfer", gridcolor: "#374151", overlaying: "y", side: "right", range: [-0.1, 1.2] },
        margin: { t: 30, r: 60, b: 50, l: 80 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} config={{ responsive: true, displayModeBar: false }} />
    </div>
  );
}
