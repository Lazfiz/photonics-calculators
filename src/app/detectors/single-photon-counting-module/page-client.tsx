"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function SPCMPage() {
  const [deadTime, setDeadTime] = useURLState("deadTime", 50); // ns
  const [darkCountRate, setDarkCountRate] = useURLState("darkCountRate", 100); // counts/s
  const [quantumEff, setQuantumEff] = useURLState("quantumEff", 0.65);
  const [incidentPower, setIncidentPower] = useURLState("incidentPower", 1e-12); // W
  const [wavelength, setWavelength] = useURLState("wavelength", 550); // nm

  const results = useMemo(() => {
    const h = 6.626e-34;
    const c = 3e8;
    const freq = c / (wavelength * 1e-9);
    const photonsPerSec = incidentPower / (h * freq);
    const detectedRate = photonsPerSec * quantumEff;
    const dt = deadTime * 1e-9;
    const nonparalyzableRate = detectedRate / (1 + detectedRate * dt);
    const totalRate = nonparalyzableRate + darkCountRate;
    const snr = detectedRate / Math.sqrt(detectedRate + darkCountRate);
    const afterpulsingProb = darkCountRate * dt * 0.01; // simplified estimate
    const jitter = 350; // ps typical
    return { photonsPerSec, detectedRate, nonparalyzableRate, totalRate, snr, afterpulsingProb, jitter };
  }, [deadTime, darkCountRate, quantumEff, incidentPower, wavelength]);

  const chartData = useMemo(() => {
    const powers = Array.from({ length: 200 }, (_, i) => 1e-15 * Math.pow(1e6, i / 200));
    const h = 6.626e-34;
    const c = 3e8;
    const freq = c / (wavelength * 1e-9);
    const dt = deadTime * 1e-9;
    const detected = powers.map(p => (p / (h * freq)) * quantumEff);
    const measured = detected.map(r => r / (1 + r * dt));
    const snr = detected.map(r => r / Math.sqrt(r + darkCountRate));
    return [
      { x: powers, y: detected, type: "scatter", mode: "lines", name: "True count rate", line: { color: "#60a5fa" } },
      { x: powers, y: measured, type: "scatter", mode: "lines", name: "Measured (dead-time corrected)", line: { color: "#f87171", dash: "dash" } },
      { x: powers, y: snr, type: "scatter", mode: "lines", name: "SNR", line: { color: "#34d399" }, yaxis: "y2" },
    ];
  }, [deadTime, darkCountRate, quantumEff, wavelength]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Dead Time (ns)" value={deadTime} onChange={setDeadTime} />
        <ValidatedNumberInput label="Dark Count Rate (counts/s)" value={darkCountRate} onChange={setDarkCountRate} />
        <ValidatedNumberInput label="Quantum Efficiency" value={quantumEff} onChange={setQuantumEff} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Incident Power (W)" value={incidentPower} onChange={setIncidentPower} step="1e-15" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Incident photons/s = <span className="text-blue-400 font-mono">{results.photonsPerSec.toExponential(3)}</span></p>
        <p className="text-gray-300">Detected rate = <span className="text-blue-400 font-mono">{results.detectedRate.toExponential(3)} counts/s</span></p>
        <p className="text-gray-300">Measured rate (dead-time) = <span className="text-blue-400 font-mono">{results.nonparalyzableRate.toExponential(3)} counts/s</span></p>
        <p className="text-gray-300">Total rate (with dark) = <span className="text-blue-400 font-mono">{results.totalRate.toExponential(3)} counts/s</span></p>
        <p className="text-gray-300">SNR = <span className="text-blue-400 font-mono">{results.snr.toFixed(1)}</span></p>
        <p className="text-gray-300">Timing jitter ≈ <span className="text-blue-400 font-mono">{results.jitter} ps</span></p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>N<sub>photon</sub> = P / (h·c/λ)</p>
        <p>R<sub>detected</sub> = N<sub>photon</sub> · η</p>
        <p>R<sub>measured</sub> = R / (1 + R·τ<sub>d</sub>)  [non-paralyzable]</p>
        <p>SNR = R<sub>signal</sub> / √(R<sub>signal</sub> + R<sub>dark</sub>)</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Incident Power (W)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Count Rate (counts/s)", type: "log", gridcolor: "#374151" },
        yaxis2: { title: "SNR", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 80, r: 60 }, autosize: true, showlegend: true
      }} />
    </div>
  );
}
