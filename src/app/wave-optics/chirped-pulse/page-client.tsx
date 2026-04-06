"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function ChirpedPulsePage() {
  const [pulseEnergy, setPulseEnergy] = useState(1); // mJ
  const [inputDuration, setInputDuration] = useState(30); // fs
  const [stretchRatio, setStretchRatio] = useState(1000);
  const [gratingLines, setGratingLines] = useState(1740); // lines/mm
  const [centralWavelength, setCentralWavelength] = useState(800);

  const stretchedDuration = inputDuration * stretchRatio; // ps
  const peakPowerIn = pulseEnergy * 1e-3 / (inputDuration * 1e-15) / 1e9; // GW
  const peakPowerStretched = pulseEnergy * 1e-3 / (stretchedDuration * 1e-12) / 1e9; // GW
  const recompressedDuration = inputDuration * 1.1; // ~10% overhead
  const peakPowerOut = pulseEnergy * 1e-3 / (recompressedDuration * 1e-15) / 1e9; // GW
  const bIntegralLimit = 1;
  const gratingSpacing = 1e-3 / gratingLines * 1e6; // µm

  const chartData = useMemo(() => {
    const N = 300;
    const tMax = stretchedDuration * 1.5;
    const ts = Array.from({ length: N }, (_, i) => (i / N - 0.5) * tMax);
    const stretched = ts.map(t => Math.exp(-2.77 * Math.pow(t / stretchedDuration, 2)));
    const recompressed = ts.map(t => Math.exp(-2.77 * Math.pow(t / recompressedDuration, 2)));
    const timeAxis = ts.map(t => t); // in ps
    const recompAxis = ts.map(t => t * 1000); // in fs for recompressed
    return [
      { x: timeAxis, y: stretched, type: "scatter" as const, mode: "lines" as const, name: "Stretched", line: { color: "#f87171", width: 2 } },
      { x: recompAxis, y: recompressed, type: "scatter" as const, mode: "lines" as const, name: "Recompressed", line: { color: "#60a5fa", width: 2 }, xaxis: "x2" },
    ];
  }, [stretchedDuration, recompressedDuration]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Chirped Pulse Amplification (CPA)" description="Stretch, amplify, compress — bypassing damage thresholds.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Pulse Energy (mJ)" value={pulseEnergy} onChange={setPulseEnergy} step="any" />
        <ValidatedNumberInput label="Input Pulse Duration (fs)" value={inputDuration} onChange={setInputDuration} />
        <ValidatedNumberInput label="Stretch Ratio" value={stretchRatio} onChange={setStretchRatio} />
        <ValidatedNumberInput label="Grating Lines (lines/mm)" value={gratingLines} onChange={setGratingLines} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stretched Duration</p>
          <p className="text-xl font-bold text-red-400">{stretchedDuration.toFixed(0)} ps</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Input Peak Power</p>
          <p className="text-xl font-bold text-orange-400">{peakPowerIn.toFixed(1)} GW</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stretched Peak Power</p>
          <p className="text-xl font-bold text-green-400">{peakPowerStretched.toFixed(2)} GW</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output Peak Power (recompressed)</p>
          <p className="text-xl font-bold text-blue-400">{peakPowerOut.toFixed(1)} GW</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2 font-mono">GDD = λ³/(2πc²) · d²n/dλ² · L &nbsp;|&nbsp; B-integral &lt; 1 rad &nbsp;|&nbsp; d<sub>grating</sub> = 1/N</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Stretched Time (ps)", gridcolor: "#374151" },
          xaxis2: { title: "Recompressed Time (fs)", gridcolor: "#374151", overlaying: "x", side: "top" },
          yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
          margin: { t: 60, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
