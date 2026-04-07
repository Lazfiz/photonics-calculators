"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
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
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Gain (M)" value={gain} onChange={setGain} />
        <ValidatedNumberInput label="Excess Noise Factor (F)" value={excessNoiseFactor} onChange={setExcessNoiseFactor} step="0.1" />
        <ValidatedNumberInput label="Quantum Efficiency" value={quantumEff} onChange={setQuantumEff} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Bandwidth (Hz)" value={bandwidth} onChange={setBandwidth} step="1e6" />
        <ValidatedNumberInput label="Dark Current - unmultiplied (A)" value={darkCurrent} onChange={setDarkCurrent} step="1e-9" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Incident Power (W)" value={incidentPower} onChange={setIncidentPower} step="1e-12" />
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

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Gain (M)", gridcolor: "#374151" },
        yaxis: { title: "Current (A)", type: "log", gridcolor: "#374151" },
        yaxis2: { title: "SNR", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} />
    </div>
  );
}
