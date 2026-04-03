"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function LinearModeAPDPage() {
  const [gain, setGain] = useState(100);
  const [excessNoiseFactor, setExcessNoiseFactor] = useState(2.5);
  const [quantumEff, setQuantumEff] = useState(0.8);
  const [bandwidth, setBandwidth] = useState(100e6); // Hz
  const [darkCurrent, setDarkCurrent] = useState(10e-9); // A (unmultiplied)
  const [wavelength, setWavelength] = useState(800); // nm
  const [incidentPower, setIncidentPower] = useState(1e-9); // W

  const results = useMemo(() => {
    const h = 6.626e-34;
    const c = 3e8;
    const q = 1.6e-19;
    const resp = (quantumEff * q * wavelength * 1e-9) / (h * c); // A/W
    const iPhoto = incidentPower * resp;
    const iPhotoOut = iPhoto * gain;
    const iDarkOut = darkCurrent * gain;
    const shotNoise = Math.sqrt(2 * q * iPhotoOut * excessNoiseFactor * bandwidth);
    const darkNoise = Math.sqrt(2 * q * iDarkOut * excessNoiseFactor * bandwidth);
    const totalNoise = Math.sqrt(shotNoise ** 2 + darkNoise ** 2);
    const snr = iPhotoOut / totalNoise;
    const nep = totalNoise / resp; // W/√Hz
    const detectivity = 1 / nep;
    return { resp, iPhoto, iPhotoOut, iDarkOut, shotNoise, darkNoise, totalNoise, snr, nep, detectivity };
  }, [gain, excessNoiseFactor, quantumEff, bandwidth, darkCurrent, wavelength, incidentPower]);

  const chartData = useMemo(() => {
    const gains = Array.from({ length: 100 }, (_, i) => 1 + i * 2);
    const h = 6.626e-34;
    const c = 3e8;
    const q = 1.6e-19;
    const resp = (quantumEff * q * wavelength * 1e-9) / (h * c);
    const iPhoto = incidentPower * resp;
    const signal = gains.map(g => iPhoto * g);
    const noise = gains.map(g => Math.sqrt(2 * q * iPhoto * g * excessNoiseFactor * bandwidth + 2 * q * darkCurrent * g * excessNoiseFactor * bandwidth));
    const snr = signal.map((s, i) => s / noise[i]);
    return [
      { x: gains, y: signal, type: "scatter", mode: "lines", name: "Signal (A)", line: { color: "#60a5fa" } },
      { x: gains, y: noise, type: "scatter", mode: "lines", name: "Noise (A)", line: { color: "#f87171" } },
      { x: gains, y: snr, type: "scatter", mode: "lines", name: "SNR", line: { color: "#34d399" }, yaxis: "y2" },
    ];
  }, [gain, excessNoiseFactor, quantumEff, bandwidth, darkCurrent, wavelength, incidentPower]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Linear-Mode APD</h1>
      <p className="text-gray-400 mb-8">Linear-mode avalanche photodiode calculator. Models gain, excess noise, responsivity, NEP, and SNR for analog detection.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Gain (M)</span>
          <input type="number" value={gain} onChange={e => setGain(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Excess Noise Factor (F)</span>
          <input type="number" value={excessNoiseFactor} onChange={e => setExcessNoiseFactor(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Quantum Efficiency</span>
          <input type="number" value={quantumEff} onChange={e => setQuantumEff(+e.target.value)} step="0.01" min="0" max="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Bandwidth (Hz)</span>
          <input type="number" value={bandwidth} onChange={e => setBandwidth(+e.target.value)} step="1e6" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Dark Current - unmultiplied (A)</span>
          <input type="number" value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)} step="1e-9" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Incident Power (W)</span>
          <input type="number" value={incidentPower} onChange={e => setIncidentPower(+e.target.value)} step="1e-12" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Responsivity = <span className="text-blue-400 font-mono">{(results.resp * 1e3).toFixed(2)} mA/W (unmultiplied)</span></p>
        <p className="text-gray-300">Output photocurrent = <span className="text-blue-400 font-mono">{results.iPhotoOut.toExponential(3)} A</span></p>
        <p className="text-gray-300">Output dark current = <span className="text-blue-400 font-mono">{results.iDarkOut.toExponential(3)} A</span></p>
        <p className="text-gray-300">Shot noise = <span className="text-blue-400 font-mono">{results.shotNoise.toExponential(3)} A</span></p>
        <p className="text-gray-300">Total noise = <span className="text-blue-400 font-mono">{results.totalNoise.toExponential(3)} A</span></p>
        <p className="text-gray-300">SNR = <span className="text-blue-400 font-mono">{results.snr.toFixed(1)}</span></p>
        <p className="text-gray-300">NEP = <span className="text-blue-400 font-mono">{results.nep.toExponential(3)} W/√Hz</span></p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>R = η·q·λ / (h·c)</p>
        <p>I<sub>out</sub> = M · I<sub>photo</sub></p>
        <p>i<sub>shot</sub> = √(2·q·M·I·F·Δf)</p>
        <p>NEP = i<sub>total</sub> / R</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Gain (M)", gridcolor: "#374151" },
        yaxis: { title: "Current (A)", type: "log", gridcolor: "#374151" },
        yaxis2: { title: "SNR", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
