"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function CEPStabilizationPage() {
  const [wavelength, setWavelength] = useState(800);
  const [pulseDuration, setPulseDuration] = useState(5); // fs
  const [cepOffset, setCepOffset] = useState(0); // rad
  const [cycles, setCycles] = useState(2);

  const period = wavelength * 1e-9 / 3e8 * 1e15; // fs
  const carrierFreq = 1 / period; // PHz
  const spectralWidth = 0.44 / pulseDuration; // THz (Gaussian TL)
  const phaseSlipPerCycle = 2 * Math.PI;

  const chartData = useMemo(() => {
    const N = 500;
    const tMax = cycles * period;
    const ts = Array.from({ length: N }, (_, i) => i / N * tMax - tMax * 0.1);
    const envelope = ts.map(t => {
      const env = Math.exp(-2.77 * Math.pow(t / pulseDuration, 2));
      return env;
    });
    const carrier = ts.map(t => envelope[ts.indexOf(t)] * Math.cos(2 * Math.PI * carrierFreq * t * 1e-3 + cepOffset));
    // recalc properly
    const carrier2 = ts.map((t, i) => envelope[i] * Math.cos(2 * Math.PI * t / period + cepOffset));
    const envUpper = envelope;
    const envLower = envelope.map(e => -e);
    return [
      { x: ts, y: carrier2, type: "scatter" as const, mode: "lines" as const, name: "E-field", line: { color: "#60a5fa", width: 1.5 } },
      { x: ts, y: envUpper, type: "scatter" as const, mode: "lines" as const, name: "Envelope", line: { color: "#f87171", dash: "dash" } },
      { x: ts, y: envLower, type: "scatter" as const, mode: "lines" as const, name: "", line: { color: "#f87171", dash: "dash" }, showlegend: false },
    ];
  }, [wavelength, pulseDuration, cepOffset, cycles, period]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Carrier-Envelope Phase (CEP)</h1>
      <p className="text-gray-400 mb-8">CEP offset effects on few-cycle pulse electric field.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Pulse Duration (fs FWHM)</span>
          <input type="number" value={pulseDuration} onChange={e => setPulseDuration(+e.target.value)} step="any" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">CEP φ₀ (rad)</span>
          <input type="number" value={cepOffset} onChange={e => setCepOffset(+e.target.value)} step="any" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Display Cycles</span>
          <input type="number" value={cycles} onChange={e => setCycles(+e.target.value)} min={1} max={10} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Optical Period</p>
          <p className="text-xl font-bold text-blue-400">{period.toFixed(3)} fs</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Cycles per Pulse</p>
          <p className="text-xl font-bold text-green-400">{(pulseDuration / period).toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Spectral Bandwidth (TL)</p>
          <p className="text-xl font-bold text-orange-400">{(spectralWidth * 1000).toFixed(0)} GHz</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2 font-mono">E(t) = A(t) · cos(ωt + φ₀) &nbsp;|&nbsp; Δφ<sub>CE</sub> = ω<sub>g</sub>/ω₀ · 2π per pulse</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Time (fs)", gridcolor: "#374151" },
          yaxis: { title: "E-field (a.u.)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
