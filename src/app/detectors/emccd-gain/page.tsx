"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// EMCCD Gain Calculator
// EM register: per-stage gain g, total gain G = g^N (N stages, typically 500-700)
// g ≈ 1 + α·V_clock where α depends on impact ionization
// Excess noise factor: F = √2 (constant, independent of gain for EMCCD)
// This is the key advantage: F = √2 vs F ≈ G for ideal electron multiplier
// Effective noise: σ_eff = √(2·G·(signal + dark + read_noise²/G²))
// SNR improvement threshold: signal < 2·read_noise² for EMCCD advantage

export default function EmccdGainPage() {
  const [numStages, setNumStages] = useState(604);
  const [clockVoltage, setClockVoltage] = useState(40); // V
  const [readNoise, setReadNoise] = useState(100); // e- rms (conventional output)
  const [emReadNoise, setEmReadNoise] = useState(1); // e- rms (EM output amp)
  const [darkCurrent, setDarkCurrent] = useState(0.001); // e-/pix/s
  const [exposureTime, setExposureTime] = useState(1); // s
  const [signalPhotons, setSignalPhotons] = useState(50); // e-/pix

  // Per-stage gain model: g = 1 + α(V - V_threshold)
  const alpha = 0.015; // empirical factor per volt
  const vThreshold = 30; // V
  const perStageGain = 1 + alpha * Math.max(0, clockVoltage - vThreshold);
  const totalGain = Math.pow(perStageGain, numStages);

  // Excess noise factor for EMCCD is always √2
  const excessNoise = Math.sqrt(2);

  // Noise analysis
  const darkElectrons = darkCurrent * exposureTime;
  const totalInputNoise = Math.sqrt(signalPhotons + darkElectrons);

  // EMCCD output noise
  const emccdOutputNoise = excessNoise * totalGain * totalInputNoise;
  const emccdTotalNoise = Math.sqrt(emccdOutputNoise ** 2 + emReadNoise ** 2);
  const emccdSNR = signalPhotons * totalGain / emccdTotalNoise;

  // Conventional CCD output
  const ccdOutputNoise = Math.sqrt(signalPhotons + darkElectrons + readNoise ** 2);
  const ccdSNR = signalPhotons / ccdOutputNoise;

  // Crossover point
  const crossoverSignal = 2 * readNoise * readNoise / (excessNoise ** 2);

  const gainChart = useMemo(() => {
    const stages = Array.from({ length: 200 }, (_, i) => 100 + i * 800 / 200);
    return [{
      x: stages, y: stages.map(n => Math.pow(perStageGain, n)), type: "scatter", mode: "lines",
      name: `G (g=${perStageGain.toFixed(3)})`, line: { color: "#60a5fa", width: 2 },
    }];
  }, [perStageGain]);

  const snrChart = useMemo(() => {
    const sig = Array.from({ length: 200 }, (_, i) => 0.5 + i * 200 / 200);
    return [
      { x: sig, y: sig.map(s => {
        const tn = Math.sqrt(s + darkElectrons);
        const emn = Math.sqrt((excessNoise * totalGain * tn) ** 2 + emReadNoise ** 2);
        return s * totalGain / emn;
      }), type: "scatter", mode: "lines", name: `EMCCD (G=${totalGain.toFixed(0)})`, line: { color: "#60a5fa", width: 2 } },
      { x: sig, y: sig.map(s => s / Math.sqrt(s + darkElectrons + readNoise ** 2)), type: "scatter", mode: "lines", name: "Conventional CCD", line: { color: "#f87171", width: 2 } },
      { x: [crossoverSignal, crossoverSignal], y: [0, 15], type: "scatter", mode: "lines", name: "Crossover", line: { color: "#fbbf24", width: 1, dash: "dash" } },
    ];
  }, [totalGain, darkElectrons, readNoise, emReadNoise, excessNoise, crossoverSignal]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">EMCCD Gain Calculator</h1>
      <p className="text-gray-400 mb-8">Electron multiplying CCD gain stages, excess noise (F=√2), and SNR advantage over conventional CCD.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Number of EM Stages</span>
          <input type="number" value={numStages} onChange={e => setNumStages(+e.target.value)} min="100" max="1000" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Clock Voltage (V)</span>
          <input type="number" value={clockVoltage} onChange={e => setClockVoltage(+e.target.value)} min="30" max="60" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Conventional Read Noise (e⁻)</span>
          <input type="number" value={readNoise} onChange={e => setReadNoise(+e.target.value)} min="1" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">EM Output Read Noise (e⁻)</span>
          <input type="number" value={emReadNoise} onChange={e => setEmReadNoise(+e.target.value)} min="0.1" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Dark Current (e⁻/pix/s)</span>
          <input type="number" value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)} min="0" step="0.0001"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Exposure Time (s)</span>
          <input type="number" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} min="0.001" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Signal Photons (e⁻/pix)</span>
          <input type="number" value={signalPhotons} onChange={e => setSignalPhotons(+e.target.value)} min="0" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Results</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><span className="text-gray-400 text-sm">Per-Stage Gain</span><div className="text-xl font-mono">{perStageGain.toFixed(4)}</div></div>
          <div><span className="text-gray-400 text-sm">Total Gain G</span><div className="text-xl font-mono text-green-400">{totalGain > 1e4 ? totalGain.toExponential(2) : totalGain.toFixed(1)}</div></div>
          <div><span className="text-gray-400 text-sm">EMCCD SNR</span><div className={`text-xl font-mono ${emccdSNR > ccdSNR ? "text-green-400" : "text-red-400"}`}>{emccdSNR.toFixed(2)}</div></div>
          <div><span className="text-gray-400 text-sm">Conventional CCD SNR</span><div className="text-xl font-mono">{ccdSNR.toFixed(2)}</div></div>
          <div><span className="text-gray-400 text-sm">SNR Improvement</span><div className="text-xl font-mono">{ccdSNR > 0 ? (emccdSNR / ccdSNR).toFixed(2) + "×" : "N/A"}</div></div>
          <div><span className="text-gray-400 text-sm">Crossover Signal</span><div className="text-xl font-mono">{crossoverSignal.toFixed(1)} e⁻/pix</div></div>
        </div>
        <div className={`mt-4 p-3 rounded text-sm ${emccdSNR > ccdSNR ? "bg-green-900/30 text-green-300 border border-green-800" : "bg-red-900/30 text-red-300 border border-red-800"}`}>
          {emccdSNR > ccdSNR ? "✓ EMCCD provides better SNR at this signal level" : "✗ Conventional CCD is better — signal above crossover point"}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Total Gain vs Stages</h3>
          <Plot data={gainChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Stages", gridcolor: "#374151" },
            yaxis: { title: "Gain G", type: "log", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">SNR vs Signal Level</h3>
          <Plot data={snrChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Signal (e⁻/pix)", gridcolor: "#374151" },
            yaxis: { title: "SNR", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
        </div>
      </div>

      <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-sm text-gray-400">
        <h3 className="text-white font-semibold mb-2">Formulas</h3>
        <p>G = g^N, where g = 1 + α·(V_clock - V_threshold)</p>
        <p>Excess noise: F = √2 (unique to EMCCD — stochastic gain multiplication)</p>
        <p>SNR_EMCCD = S·G / √(2·G²·(S + D) + σ_read²)</p>
        <p>Crossover: S &lt; 2·σ_read² / F²</p>
      </div>
    </div>
  );
}
