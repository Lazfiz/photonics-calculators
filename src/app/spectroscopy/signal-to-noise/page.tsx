"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SignalToNoisePage() {
  const [signalPhotons, setSignalPhotons] = useState(10000);
  const [darkCurrent, setDarkCurrent] = useState(100);
  const [readNoise, setReadNoise] = useState(10);
  const [nScans, setNScans] = useState(1);
  const [detectorNoise, setDetectorNoise] = useState(50);

  const snr = useMemo(() => {
    const S = signalPhotons;
    const N_dark = darkCurrent;
    const N_read = readNoise * readNoise;
    const N_det = detectorNoise;
    const N_total = Math.sqrt(S + N_dark + N_read + N_det * N_det);
    return (S / N_total) * Math.sqrt(nScans);
  }, [signalPhotons, darkCurrent, readNoise, nScans, detectorNoise]);

  const chartData = useMemo(() => {
    const photons = Array.from({ length: 200 }, (_, i) => 10 + (i / 200) * 100000);
    const snrSingle = photons.map(S => {
      const N = Math.sqrt(S + darkCurrent + readNoise * readNoise + detectorNoise * detectorNoise);
      return S / N;
    });
    const snrMulti = photons.map(S => {
      const N = Math.sqrt(S + darkCurrent + readNoise * readNoise + detectorNoise * detectorNoise);
      return (S / N) * Math.sqrt(nScans);
    });

    return [
      { x: photons, y: snrSingle, type: "scatter" as const, mode: "lines" as const, name: "1 scan", line: { color: "#60a5fa" } },
      { x: photons, y: snrMulti, type: "scatter" as const, mode: "lines" as const, name: `${nScans} scans`, line: { color: "#34d399" } },
      { x: [signalPhotons], y: [snr], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [signalPhotons, darkCurrent, readNoise, nScans, detectorNoise]);

  const snrShotOnly = signalPhotons / Math.sqrt(signalPhotons);
  const noiseBreakdown = {
    shot: Math.sqrt(signalPhotons),
    dark: Math.sqrt(darkCurrent),
    read: readNoise,
    detector: detectorNoise,
    total: Math.sqrt(signalPhotons + darkCurrent + readNoise * readNoise + detectorNoise * detectorNoise),
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Signal-to-Noise Ratio</h1>
      <p className="text-gray-400 mb-8">Detailed SNR model: shot noise, dark current, read noise, and detector noise contributions.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Signal Photons</span>
          <input type="number" value={signalPhotons} onChange={e => setSignalPhotons(+e.target.value)} min={1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Dark Current (e⁻)</span>
          <input type="number" value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)} min={0}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Read Noise (e⁻)</span>
          <input type="number" value={readNoise} onChange={e => setReadNoise(+e.target.value)} min={0}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Detector Noise (e⁻)</span>
          <input type="number" value={detectorNoise} onChange={e => setDetectorNoise(+e.target.value)} min={0}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm"># Scans (co-adds)</span>
          <input type="number" value={nScans} onChange={e => setNScans(Math.max(1, +e.target.value))} min={1} max={10000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total SNR</p>
          <p className="text-xl font-bold text-green-400">{snr.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Shot-noise-limited SNR</p>
          <p className="text-xl font-bold text-blue-400">{snrShotOnly.toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Noise Breakdown (e⁻ rms)</h3>
        <p className="text-gray-300 text-sm">Shot: <span className="text-blue-400">{noiseBreakdown.shot.toFixed(1)}</span> | Dark: <span className="text-yellow-400">{noiseBreakdown.dark.toFixed(1)}</span> | Read: <span className="text-red-400">{noiseBreakdown.read.toFixed(1)}</span> | Det: <span className="text-purple-400">{noiseBreakdown.detector.toFixed(1)}</span> | Total: <span className="text-green-400">{noiseBreakdown.total.toFixed(1)}</span></p>
        <p className="text-gray-300 text-sm mt-2"><span className="text-blue-400 font-mono">SNR = S·√M / √(S + N_dark + N_read² + N_det²)</span></p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Signal Photons", gridcolor: "#374151", type: "log" },
          yaxis: { title: "SNR", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { x: 0.01, y: 0.99 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
