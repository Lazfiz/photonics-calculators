"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// PMT: Photomultiplier Tube
// Gain = δ^n where δ = secondary emission ratio, n = number of dynodes
// SNR = signal_electrons / sqrt(signal_electrons + gain^2 * (dark + noise))
export default function PMTPage() {
  const [numDynodes, setNumDynodes] = useState(10);
  const [secondaryEmission, setSecondaryEmission] = useState(3.5);
  const [qe, setQe] = useState(0.25);
  const [darkCurrent, setDarkCurrent] = useState(1); // nA
  const [anodeResistance, setAnodeResistance] = useState(50); // Ohm
  const [photonRate, setPhotonRate] = useState(1e6); // photons/s
  const [bandwidth, setBandwidth] = useState(100e6); // Hz

  const gain = Math.pow(secondaryEmission, numDynodes);
  const signalElectrons = photonRate * qe;
  const signalCurrent = signalElectrons * 1.602e-19 * gain;
  const darkElectrons = (darkCurrent * 1e-9) / (1.602e-19 * gain);
  const signalPower = signalCurrent * signalCurrent * anodeResistance;
  const noisePower = 4 * 1.38e-23 * 293 * bandwidth * 1 + signalCurrent * 1.602e-19 * gain * bandwidth; // Johnson + shot simplified

  // Gain vs dynode stages for different δ
  const gainVsDynodes = useMemo(() => {
    const stages = Array.from({ length: 16 }, (_, i) => i + 1);
    const deltas = [2.5, 3.0, 3.5, 4.0, 4.5];
    return stages.map(s => {
      const vals = deltas.map(d => ({ d, g: Math.pow(d, s) }));
      return { stage: s, vals };
    });
  }, []);

  // SNR vs gain (varying secondary emission)
  const snrVsGain = useMemo(() => {
    const deltas = Array.from({ length: 100 }, (_, i) => 2 + i * 0.03);
    const snrVals = deltas.map(d => {
      const g = Math.pow(d, numDynodes);
      const sig = photonRate * qe;
      const darkE = (darkCurrent * 1e-9) / (1.602e-19 * g);
      const enf = 1.1 + 1 / d; // excess noise factor approximation
      return sig / Math.sqrt(sig + darkE + enf * sig);
    });
    return { deltas, snrVals };
  }, [numDynodes, qe, darkCurrent, photonRate]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">PMT Gain &amp; SNR Calculator</h1>
      <p className="text-gray-400 mb-8">Photomultiplier tube — dynode gain, signal current, and signal-to-noise ratio.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Number of Dynodes</span>
          <input type="number" value={numDynodes} onChange={e => setNumDynodes(+e.target.value)} min="4" max="14" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Secondary Emission Ratio (δ)</span>
          <input type="number" value={secondaryEmission} onChange={e => setSecondaryEmission(+e.target.value)} min="1.5" max="6" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Quantum Efficiency</span>
          <input type="number" value={qe} onChange={e => setQe(+e.target.value)} min="0.01" max="0.5" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Dark Current (nA)</span>
          <input type="number" value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)} min="0.01" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Photon Rate (photons/s)</span>
          <input type="number" value={photonRate} onChange={e => setPhotonRate(+e.target.value)} step="1e5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Bandwidth (MHz)</span>
          <input type="number" value={bandwidth / 1e6} onChange={e => setBandwidth(+e.target.value * 1e6)} min="1" step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Gain (δⁿ)</p>
          <p className="text-xl font-bold text-blue-400">{gain.toExponential(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Signal Current</p>
          <p className="text-xl font-bold text-green-400">{(signalCurrent * 1e6).toFixed(2)} μA</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Photoelectrons/s</p>
          <p className="text-xl font-bold text-yellow-400">{signalElectrons.toExponential(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ENF</p>
          <p className="text-xl font-bold text-purple-400">{(1.1 + 1 / secondaryEmission).toFixed(3)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>Gain G = δ<sup>n</sup></p>
        <p>I<sub>signal</sub> = R<sub>ph</sub> · QE · e · G</p>
        <p>ENF = 1.1 + 1/δ (excess noise factor)</p>
        <p>SNR = N<sub>pe</sub> / √(N<sub>pe</sub> · ENF + N<sub>dark</sub>)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Plot data={[2.5, 3.0, 3.5, 4.0, 4.5].map((d, i) => ({
          x: Array.from({ length: 16 }, (_, j) => j + 1),
          y: Array.from({ length: 16 }, (_, j) => Math.pow(d, j + 1)),
          type: "scatter" as const, mode: "lines" as const,
          name: `δ=${d}`,
          line: { color: ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa"][i] },
        }))} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Gain vs Dynode Stages", font: { size: 12 } },
          xaxis: { title: "Dynode Stages", gridcolor: "#374151" },
          yaxis: { title: "Gain", gridcolor: "#374151", type: "log" },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} config={{ responsive: true, displayModeBar: false }} />

        <Plot data={[{ x: snrVsGain.deltas, y: snrVsGain.snrVals, type: "scatter" as const, mode: "lines" as const,
          name: "SNR", line: { color: "#34d399" } }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "SNR vs Secondary Emission Ratio", font: { size: 12 } },
          xaxis: { title: "δ (secondary emission)", gridcolor: "#374151" },
          yaxis: { title: "SNR", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
