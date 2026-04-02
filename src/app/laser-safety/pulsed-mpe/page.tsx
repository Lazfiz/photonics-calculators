"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function PulsedMPEPage() {
  const [wavelength, setWavelength] = useState(1064);
  const [pulseDuration, setPulseDuration] = useState(10); // ns
  const [prf, setPrf] = useState(10); // Hz

  const calc = useMemo(() => {
    const lam = wavelength / 1000; // µm
    const t = pulseDuration * 1e-9; // s
    // Single pulse MPE (simplified ANSI Z136)
    let mpeSingle: number;
    if (lam >= 0.4 && lam < 0.7) {
      mpeSingle = 5e-3 * Math.pow(t, 0.75); // J/cm²
    } else if (lam >= 0.7 && lam < 1.05) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      mpeSingle = 5e-3 * CA * Math.pow(t, 0.75);
    } else if (lam >= 1.05 && lam < 1.4) {
      mpeSingle = 5e-3 * Math.pow(t, 0.75);
    } else {
      mpeSingle = 1e-2; // conservative
    }

    // Average power MPE (CW equivalent)
    let mpeCW: number;
    if (lam >= 0.4 && lam < 0.7) {
      mpeCW = 1.8 * Math.pow(0.25, 0.75) * 1e-3; // J/cm² for 0.25s
    } else if (lam >= 0.7 && lam < 1.05) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      mpeCW = 1.8 * CA * Math.pow(0.25, 0.75) * 1e-3;
    } else {
      mpeCW = 0.01 * 0.25; // W/cm² * s
    }

    // Repetitive pulse correction: N^-0.25
    const Tavg = 0.25; // averaging period
    const N = Math.max(1, prf * Tavg);
    const mpeRep = mpeSingle * Math.pow(N, -0.25);
    const mpeResult = Math.min(mpeRep, mpeCW);

    return { mpeSingle: mpeSingle * 1e6, mpeRep: mpeRep * 1e6, mpeCW: mpeCW * 1e6, mpeResult: mpeResult * 1e6, N };
  }, [wavelength, pulseDuration, prf]);

  const chartData = useMemo(() => {
    const prfs = Array.from({ length: 100 }, (_, i) => 1 + i * 200);
    const Tavg = 0.25;
    const t = pulseDuration * 1e-9;
    const lam = wavelength / 1000;

    let mpeSingle: number;
    if (lam >= 0.4 && lam < 0.7) {
      mpeSingle = 5e-3 * Math.pow(t, 0.75);
    } else if (lam >= 0.7 && lam < 1.05) {
      mpeSingle = 5e-3 * Math.pow(10, 0.02 * (lam - 0.7)) * Math.pow(t, 0.75);
    } else {
      mpeSingle = 1e-2;
    }

    let mpeCW: number;
    if (lam >= 0.4 && lam < 0.7) {
      mpeCW = 1.8 * Math.pow(0.25, 0.75) * 1e-3;
    } else if (lam >= 0.7 && lam < 1.05) {
      mpeCW = 1.8 * Math.pow(10, 0.02 * (lam - 0.7)) * Math.pow(0.25, 0.75) * 1e-3;
    } else {
      mpeCW = 0.01 * 0.25;
    }

    const corrected = prfs.map(f => {
      const N = f * Tavg;
      return Math.min(mpeSingle * Math.pow(N, -0.25), mpeCW) * 1e6;
    });

    return [
      { x: prfs, y: corrected, type: "scatter" as const, mode: "lines" as const, name: "Repetitive MPE", line: { color: "#f87171" } },
      { x: [prfs[0], prfs[prfs.length - 1]], y: [mpeCW * 1e6, mpeCW * 1e6], type: "scatter" as const, mode: "lines" as const, name: "CW MPE limit", line: { color: "#60a5fa", dash: "dash" } },
    ];
  }, [wavelength, pulseDuration]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/laser-safety" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Laser Safety</Link>
      <h1 className="text-3xl font-bold mb-2">Pulsed Laser MPE</h1>
      <p className="text-gray-400 mb-8">Repetitive pulse MPE with N⁻⁰·²⁵ correction factor. Simplified ANSI Z136 model.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={400} max={1800}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Pulse Duration (ns)</span>
          <input type="number" value={pulseDuration} onChange={e => setPulseDuration(+e.target.value)} min={0.1} max={1e6} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">PRF (Hz)</span>
          <input type="number" value={prf} onChange={e => setPrf(+e.target.value)} min={1} max={1e6} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Single Pulse MPE</p>
          <p className="text-xl font-bold text-green-400">{calc.mpeSingle.toExponential(2)} µJ/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Corrected (N={calc.N})</p>
          <p className="text-xl font-bold text-yellow-400">{calc.mpeRep.toExponential(2)} µJ/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Effective MPE</p>
          <p className="text-xl font-bold text-red-400">{calc.mpeResult.toExponential(2)} µJ/cm²</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "PRF (Hz)", gridcolor: "#374151", type: "log" },
          yaxis: { title: "MPE (µJ/cm²)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { x: 0.6, y: 0.99 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
