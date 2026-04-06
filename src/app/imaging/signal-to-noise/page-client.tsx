"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function SignalToNoisePage() {
  const [signalPhotons, setSignalPhotons] = useState(5000);
  const [backgroundPhotons, setBackgroundPhotons] = useState(500);
  const [quantumEfficiency, setQuantumEfficiency] = useState(0.7);
  const [readNoise, setReadNoise] = useState(1.5);
  const [darkCurrent, setDarkCurrent] = useState(0.1);
  const [exposureTime, setExposureTime] = useState(100);
  const [binning, setBinning] = useState(1);
  const [numFrames, setNumFrames] = useState(1);

  const results = useMemo(() => {
    const signalE = signalPhotons * quantumEfficiency * binning * binning;
    const bgE = backgroundPhotons * quantumEfficiency * binning * binning;
    const darkE = darkCurrent * exposureTime / 1000 * binning * binning;
    const shotNoise = Math.sqrt(signalE + bgE);
    const totalNoise = Math.sqrt(signalE + bgE + darkE + readNoise * readNoise);
    const snr = signalE / totalNoise;
    const snrSingle = snr;
    const snrMulti = snr * Math.sqrt(numFrames);
    const snrOnly = Math.sqrt(signalE);
    const snrNoiseFloor = Math.sqrt(readNoise * readNoise + darkE);
    const roseCriterion = snr >= 5;

    const bgLevels: number[] = [];
    const snrVals: number[] = [];
    const snrIdeal: number[] = [];
    for (let bg = 0; bg <= 10000; bg += 50) {
      bgLevels.push(bg);
      const sE = signalPhotons * quantumEfficiency * binning * binning;
      const bE = bg * quantumEfficiency * binning * binning;
      const tNoise = Math.sqrt(sE + bE + darkE + readNoise * readNoise);
      snrVals.push(sE / tNoise);
      snrIdeal.push(Math.sqrt(sE));
    }

    return { signalE, bgE, darkE, shotNoise, totalNoise, snr, snrSingle, snrMulti, snrOnly, roseCriterion, bgLevels, snrVals, snrIdeal };
  }, [signalPhotons, backgroundPhotons, quantumEfficiency, readNoise, darkCurrent, exposureTime, binning, numFrames]);

  const plotData = useMemo(() => [
    {
      x: results.bgLevels, y: results.snrVals,
      type: "scatter" as const, mode: "lines" as const,
      name: "SNR (with background)", line: { color: "#60a5fa", width: 2 },
    },
    {
      x: results.bgLevels, y: Array(results.bgLevels.length).fill(results.snrIdeal),
      type: "scatter" as const, mode: "lines" as const,
      name: "Shot-noise limit", line: { color: "#34d399", width: 1, dash: "dash" },
    },
    {
      x: results.bgLevels, y: Array(results.bgLevels.length).fill(5),
      type: "scatter" as const, mode: "lines" as const,
      name: "Rose criterion (SNR=5)", line: { color: "#f87171", width: 1, dash: "dot" },
    },
  ], [results]);

  const darkLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#d1d5db" }, xaxis: { title: "Background (photons/pixel)", gridcolor: "#374151" },
    yaxis: { title: "SNR", gridcolor: "#374151" },
    legend: { x: 0.02, y: 0.95 }, margin: { t: 30, r: 30, b: 50, l: 60 },
  };

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Imaging Signal-to-Noise Ratio" description="Comprehensive SNR calculation for microscopy imaging systems.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Signal Photons (per pixel)</label>
            <input type="number" step={100} min={1} max={1000000} value={signalPhotons} onChange={e => setSignalPhotons(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Background Photons (per pixel)</label>
            <input type="number" step={10} min={0} max={100000} value={backgroundPhotons} onChange={e => setBackgroundPhotons(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Quantum Efficiency</label>
            <input type="number" step={0.01} min={0.01} max={1} value={quantumEfficiency} onChange={e => setQuantumEfficiency(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Read Noise (e⁻ rms)</label>
            <input type="number" step={0.1} min={0.1} max={100} value={readNoise} onChange={e => setReadNoise(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Dark Current (e⁻/s/pixel)</label>
            <input type="number" step={0.01} min={0} max={100} value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Exposure Time (ms)</label>
            <input type="number" step={1} min={1} max={60000} value={exposureTime} onChange={e => setExposureTime(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pixel Binning</label>
            <input type="number" step={1} min={1} max={8} value={binning} onChange={e => setBinning(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Number of Frames (averaged)</label>
            <input type="number" step={1} min={1} max={1000} value={numFrames} onChange={e => setNumFrames(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg">Results</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Signal Electrons</div>
              <div className="text-xl font-mono text-green-400">{results.signalE.toFixed(0)} e⁻</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Background Electrons</div>
              <div className="text-xl font-mono text-yellow-400">{results.bgE.toFixed(0)} e⁻</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Dark Electrons</div>
              <div className="text-xl font-mono text-red-400">{results.darkE.toFixed(2)} e⁻</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Total Noise (σ)</div>
              <div className="text-xl font-mono text-purple-400">{results.totalNoise.toFixed(2)} e⁻</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Single-Frame SNR</div>
              <div className="text-xl font-mono text-blue-400">{results.snrSingle.toFixed(2)}</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Multi-Frame SNR</div>
              <div className="text-xl font-mono text-blue-400">{results.snrMulti.toFixed(2)}</div>
            </div>
            <div className="bg-gray-800 rounded p-3 col-span-2">
              <div className="text-xs text-gray-400">Rose Criterion (SNR ≥ 5)</div>
              <div className="text-xl font-mono">{results.roseCriterion ? "✅ MET" : "❌ NOT MET"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <ChartPanel data={plotData} layout={darkLayout} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>S = N_photons · QE · B² (B = binning)</p>
          <p>σ²_total = S + B_sig + N_dark + σ²_read</p>
          <p>SNR = S / σ_total</p>
          <p>SNR_shot-limited = √S</p>
          <p>SNR_multi = SNR_single · √N_frames</p>
          <p>Rose criterion: SNR ≥ 5 for reliable detection</p>
        </div>
        <div className="text-sm text-gray-400 mt-4 space-y-1">
          <p>In fluorescence microscopy, the three fundamental noise sources are shot noise (√N from Poisson statistics), read noise (sensor electronics), and dark noise (thermal electron generation). Background fluorescence from out-of-focus light, autofluorescence, or stray excitation often dominates the noise budget.</p>
          <p>Binning improves SNR by combining charge from adjacent pixels (signal scales as B², shot noise as B), but reduces spatial resolution. Frame averaging improves SNR as √N at the cost of temporal resolution. The Rose criterion (SNR ≥ 5) is a practical threshold for reliable feature detection.</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
