"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Boxcar integrator / gated integrator: averages signal over a gate window
// SNR improvement = sqrt(N_gate * N_averages) for N_gate samples per gate, N_averages gates averaged
// Gate width trades temporal resolution vs SNR
export default function BoxcarIntegratorPage() {
  const [gateWidth, setGateWidth] = useState(100); // ns
  const [repRate, setRepRate] = useState(1000); // Hz
  const [signalPeak, setSignalPeak] = useState(1); // mV
  const [noiseRms, setNoiseRms] = useState(5); // mV
  const [averages, setAverages] = useState(100);
  const [pulseWidth, setPulseWidth] = useState(500); // ns total pulse

  const dutyCycle = gateWidth / pulseWidth;
  const samplesPerGate = Math.max(1, Math.round(gateWidth / 10)); // assume 10ns sampling
  const snrPerGate = signalPeak / noiseRms;
  const snrAfterAvg = snrPerGate * Math.sqrt(averages);
  const snrAfterGate = snrPerGate * Math.sqrt(samplesPerGate);
  const snrTotal = snrPerGate * Math.sqrt(samplesPerGate * averages);
  const bandwidth = repRate * dutyCycle / (2 * averages); // approximate noise BW

  const chartData = useMemo(() => {
    const t = Array.from({ length: 500 }, (_, i) => i * pulseWidth * 2 / 500); // ns
    const gateStart = pulseWidth * 0.3;
    const gateEnd = gateStart + gateWidth;
    // Simulated signal pulse (Gaussian)
    const signal = t.map(ti => signalPeak * Math.exp(-0.5 * Math.pow((ti - pulseWidth * 0.5) / (pulseWidth * 0.15), 2)));
    // Noisy signal
    const noisy = t.map((ti, i) => signal[i] + noiseRms * (Math.sin(i * 7.3) * 0.5 + Math.cos(i * 13.7) * 0.5));
    // Gate window
    const gate = t.map(ti => ti >= gateStart && ti <= gateEnd ? signalPeak * 1.2 : 0);

    return [
      { x: t, y: noisy, type: "scatter", mode: "lines",
        name: "Noisy Signal", line: { color: "#6b7280", width: 1 } },
      { x: t, y: signal, type: "scatter", mode: "lines",
        name: "True Signal", line: { color: "#60a5fa", width: 2 } },
      { x: t, y: gate, type: "scatter", mode: "lines", fill: "tozeroy",
        name: "Gate Window", line: { color: "#34d399", dash: "dash" }, fillcolor: "rgba(52,211,153,0.1)" },
    ];
  }, [gateWidth, pulseWidth, signalPeak, noiseRms]);

  const snrVsAvg = useMemo(() => {
    const N = Array.from({ length: 200 }, (_, i) => Math.pow(10, i * 5 / 200));
    return [
      { x: N, y: N.map(n => snrPerGate * Math.sqrt(n)), type: "scatter", mode: "lines",
        name: "SNR vs Averages", line: { color: "#fbbf24", width: 2 } },
      { x: N, y: N.map(n => snrPerGate * Math.sqrt(n * samplesPerGate)), type: "scatter", mode: "lines",
        name: "SNR (gate + avg)", line: { color: "#a78bfa", width: 2 } },
    ];
  }, [snrPerGate, samplesPerGate]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Boxcar Integrator</h1>
      <p className="text-gray-400 mb-8">Gated signal averaging — recover repetitive signals from noise.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Gate Width (ns)</span>
          <input type="number" value={gateWidth} onChange={e => setGateWidth(+e.target.value)} min="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Pulse Width (ns)</span>
          <input type="number" value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} min="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Signal Peak (mV)</span>
          <input type="number" value={signalPeak} onChange={e => setSignalPeak(+e.target.value)} min="0.001" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Noise RMS (mV)</span>
          <input type="number" value={noiseRms} onChange={e => setNoiseRms(+e.target.value)} min="0.01" step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Repetition Rate (Hz)</span>
          <input type="number" value={repRate} onChange={e => setRepRate(+e.target.value)} min="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Number of Averages</span>
          <input type="number" value={averages} onChange={e => setAverages(+e.target.value)} min="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Single-shot SNR</p>
          <p className="text-xl font-bold text-red-400">{snrPerGate.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">After {averages} averages</p>
          <p className="text-xl font-bold text-yellow-400">{snrAfterAvg.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total SNR (gate+avg)</p>
          <p className="text-xl font-bold text-green-400">{snrTotal.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Effective BW</p>
          <p className="text-xl font-bold text-blue-400">{bandwidth.toFixed(2)} Hz</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>SNR<sub>total</sub> = (V<sub>sig</sub> / σ<sub>noise</sub>) · √(N<sub>gate</sub> · N<sub>avg</sub>)</p>
        <p>BW<sub>eff</sub> ≈ f<sub>rep</sub> · (t<sub>gate</sub> / t<sub>pulse</sub>) / (2 · N<sub>avg</sub>)</p>
        <p>Trade-off: wider gate → more signal, but less temporal resolution and more noise bandwidth.</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Time (ns)", gridcolor: "#374151" },
        yaxis: { title: "Signal (mV)", gridcolor: "#374151" },
        margin: { t: 30, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} config={{ responsive: true, displayModeBar: false }} />

      <h2 className="text-xl font-bold mt-8 mb-4">SNR vs Number of Averages</h2>
      <Plot data={snrVsAvg} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Number of Averages", gridcolor: "#374151", type: "log" },
        yaxis: { title: "SNR", gridcolor: "#374151" },
        margin: { t: 30, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} config={{ responsive: true, displayModeBar: false }} />
    </div>
  );
}
