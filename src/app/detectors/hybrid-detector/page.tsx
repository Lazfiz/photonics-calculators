"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Hybrid detector: combines photodiode + amplifier in one package
// High bandwidth, low noise, single-photon sensitivity at moderate gain
// Noise: input-referred = sqrt(en²·BW + in²·R²·BW) / R
export default function HybridDetectorPage() {
  const [wavelength, setWavelength] = useState(530);
  const [qe, setQe] = useState(0.9);
  const [gain, setGain] = useState(1e6); // V/A transimpedance
  const [inputNoiseCurrent, setInputNoiseCurrent] = useState(5); // fA/√Hz
  const [inputNoiseVoltage, setInputNoiseVoltage] = useState(5); // nV/√Hz
  const [bandwidth, setBandwidth] = useState(100); // MHz
  const [feedbackResistance, setFeedbackResistance] = useState(1e6); // Ohm

  const responsivity = qe * 1.602e-19 * wavelength * 1e-9 / (6.626e-34 * 3e8);
  const bwHz = bandwidth * 1e6;
  const currentNoise = inputNoiseCurrent * 1e-15 * Math.sqrt(bwHz);
  const voltageNoiseContrib = inputNoiseVoltage * 1e-9 * Math.sqrt(bwHz) / feedbackResistance;
  const totalNoise = Math.sqrt(currentNoise ** 2 + voltageNoiseContrib ** 2);
  const nep = totalNoise / responsivity * 1e15; // fW

  // Equivalent photons
  const noiseElectrons = totalNoise / 1.602e-19;

  // NEP vs bandwidth
  const nepVsBW = useMemo(() => {
    const bws = Array.from({ length: 200 }, (_, i) => 1 + i * 5);
    const vals = bws.map(bw => {
      const hz = bw * 1e6;
      const in_ = inputNoiseCurrent * 1e-15 * Math.sqrt(hz);
      const vn = inputNoiseVoltage * 1e-9 * Math.sqrt(hz) / feedbackResistance;
      return Math.sqrt(in_ ** 2 + vn ** 2) / responsivity * 1e15;
    });
    return { bws, vals };
  }, [inputNoiseCurrent, inputNoiseVoltage, feedbackResistance, responsivity]);

  // Noise breakdown vs gain
  const noiseVsGain = useMemo(() => {
    const gains = Array.from({ length: 200 }, (_, i) => 1e3 * Math.pow(1e7 / 1e3, i / 199));
    const currentContrib = gains.map(() => inputNoiseCurrent * 1e-15 * Math.sqrt(bwHz) * 1e15);
    const voltageContrib = gains.map(g => inputNoiseVoltage * 1e-9 * Math.sqrt(bwHz) / g * 1e15);
    const total = gains.map((_, i) => Math.sqrt(currentContrib[i] ** 2 + voltageContrib[i] ** 2));
    return { gains, currentContrib, voltageContrib, total };
  }, [inputNoiseCurrent, inputNoiseVoltage, bwHz]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Hybrid Detector Design</h1>
      <p className="text-gray-400 mb-8">Photodiode + transimpedance amplifier hybrid — noise analysis, NEP, and gain optimization.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Quantum Efficiency</span>
          <input type="number" value={qe} onChange={e => setQe(+e.target.value)} min="0.01" max="1" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Input Noise Current (fA/√Hz)</span>
          <input type="number" value={inputNoiseCurrent} onChange={e => setInputNoiseCurrent(+e.target.value)} min="0.1" step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Input Noise Voltage (nV/√Hz)</span>
          <input type="number" value={inputNoiseVoltage} onChange={e => setInputNoiseVoltage(+e.target.value)} min="0.1" step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Bandwidth (MHz)</span>
          <input type="number" value={bandwidth} onChange={e => setBandwidth(+e.target.value)} min="1" step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Feedback Resistance (MΩ)</span>
          <input type="number" value={feedbackResistance / 1e6} onChange={e => setFeedbackResistance(+e.target.value * 1e6)} min="0.01" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Responsivity</p>
          <p className="text-xl font-bold text-blue-400">{(responsivity * 1e3).toFixed(2)} mA/W</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">NEP</p>
          <p className="text-xl font-bold text-green-400">{nep.toFixed(1)} fW/√Hz</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Noise Electrons</p>
          <p className="text-xl font-bold text-yellow-400">{noiseElectrons.toFixed(0)} e⁻ rms</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">R<sub>f</sub>·BW</p>
          <p className="text-xl font-bold text-purple-400">{(feedbackResistance * bwHz / 1e12).toFixed(1)} TΩ·Hz</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>NEP = √(i<sub>n</sub>²·BW + v<sub>n</sub>²·BW/R<sub>f</sub>²) / R</p>
        <p>R<sub>f</sub>·BW product = gain·speed figure of merit</p>
        <p>Optimal R<sub>f</sub> when i<sub>n</sub>·R<sub>f</sub> ≈ v<sub>n</sub></p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Plot data={[{ x: nepVsBW.bws, y: nepVsBW.vals, type: "scatter" as const, mode: "lines" as const,
          name: "NEP", line: { color: "#34d399" } }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "NEP vs Bandwidth", font: { size: 12 } },
          xaxis: { title: "Bandwidth (MHz)", gridcolor: "#374151" },
          yaxis: { title: "NEP (fW/√Hz)", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 70 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} config={{ responsive: true, displayModeBar: false }} />

        <Plot data={[
          { x: noiseVsGain.gains, y: noiseVsGain.currentContrib, type: "scatter" as const, mode: "lines" as const,
            name: "Current noise", line: { color: "#f87171" } },
          { x: noiseVsGain.gains, y: noiseVsGain.voltageContrib, type: "scatter" as const, mode: "lines" as const,
            name: "Voltage noise", line: { color: "#60a5fa" } },
          { x: noiseVsGain.gains, y: noiseVsGain.total, type: "scatter" as const, mode: "lines" as const,
            name: "Total", line: { color: "#34d399", dash: "dash" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Noise vs Feedback Resistance", font: { size: 12 } },
          xaxis: { title: "R_f (Ω)", gridcolor: "#374151", type: "log" },
          yaxis: { title: "Noise (fA)", gridcolor: "#374151", type: "log" },
          margin: { t: 40, r: 20, b: 50, l: 70 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
