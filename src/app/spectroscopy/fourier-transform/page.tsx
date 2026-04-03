"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function FourierTransformPage() {
  const [freq1, setFreq1] = useState(10);
  const [freq2, setFreq2] = useState(25);
  const [amp1, setAmp1] = useState(1.0);
  const [amp2, setAmp2] = useState(0.5);
  const [noise, setNoise] = useState(0.1);
  const [nPoints, setNPoints] = useState(256);

  const chartData = useMemo(() => {
    const N = nPoints;
    const dt = 1 / 100; // sampling interval
    const time = Array.from({ length: N }, (_, i) => i * dt);
    const signal = time.map(t => amp1 * Math.sin(2 * Math.PI * freq1 * t) + amp2 * Math.sin(2 * Math.PI * freq2 * t) + noise * (Math.random() - 0.5));

    // DFT magnitude
    const freqs = Array.from({ length: N / 2 }, (_, i) => i / (N * dt));
    const magnitude = freqs.map((_, k) => {
      let real = 0, imag = 0;
      for (let n = 0; n < N; n++) {
        const phase = (2 * Math.PI * k * n) / N;
        real += signal[n] * Math.cos(phase);
        imag -= signal[n] * Math.sin(phase);
      }
      return Math.sqrt(real * real + imag * imag) / N;
    });

    return [
      { x: time, y: signal, type: "scatter" as const, mode: "lines" as const, name: "Signal", line: { color: "#60a5fa" } },
      { x: freqs, y: magnitude, type: "scatter" as const, mode: "lines" as const, name: "Magnitude", line: { color: "#f87171" }, xaxis: "x2", yaxis: "y2" },
    ];
  }, [freq1, freq2, amp1, amp2, noise, nPoints]);

  const nyquist = 100 / 2;
  const resolution = 100 / nPoints;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Fourier Transform Basics</h1>
      <p className="text-gray-400 mb-8">Decompose a composite time-domain signal into its frequency components via DFT.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Frequency 1 (Hz)</span>
          <input type="number" value={freq1} onChange={e => setFreq1(+e.target.value)} min={0.1} step={1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Frequency 2 (Hz)</span>
          <input type="number" value={freq2} onChange={e => setFreq2(+e.target.value)} min={0.1} step={1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Amplitude 1</span>
          <input type="number" value={amp1} onChange={e => setAmp1(+e.target.value)} min={0} step={0.1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Amplitude 2</span>
          <input type="number" value={amp2} onChange={e => setAmp2(+e.target.value)} min={0} step={0.1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Noise Level</span>
          <input type="number" value={noise} onChange={e => setNoise(+e.target.value)} min={0} step={0.05} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">N Points</span>
          <input type="number" value={nPoints} onChange={e => setNPoints(Math.max(4, +e.target.value))} min={4} max={1024} step={8} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Nyquist Frequency</p>
          <p className="text-xl font-bold text-blue-400">{nyquist.toFixed(1)} Hz</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Frequency Resolution</p>
          <p className="text-xl font-bold text-green-400">{resolution.toFixed(3)} Hz</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm"><span className="text-blue-400 font-mono">X(f) = ∫ x(t)·e^(−j2πft) dt</span></p>
        <p className="text-gray-300 text-sm"><span className="text-green-400 font-mono">Δf = f_s / N</span> — resolution improves with more points or lower sampling rate.</p>
        <p className="text-gray-300 text-sm"><span className="text-red-400 font-mono">f_Nyquist = f_s / 2</span> — max detectable frequency.</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        grid: { rows: 2, columns: 1, pattern: "independent" },
        xaxis: { title: "Time (s)", gridcolor: "#374151" },
        yaxis: { title: "Amplitude", gridcolor: "#374151" },
        xaxis2: { title: "Frequency (Hz)", gridcolor: "#374151" },
        yaxis2: { title: "Magnitude", gridcolor: "#374151" },
        height: 700, margin: { t: 30, b: 40 },
      }} config={{ responsive: true }} />
    </div>
  );
}
