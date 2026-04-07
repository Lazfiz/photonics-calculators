"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
// PMT Gain Calculator
// Total gain: G = δ^n where δ is per-stage gain, n is number of stages
// Per-stage gain: δ = k·V_s^α (α ≈ 0.7-0.8 depending on dynode material)
// SNR: SNR_out = η·G·P·τ / √(η·G²·P·τ + 2·G·I_d·τ·q + σ_amp²)
// Where η is photocathode QE, P is photon flux, τ is integration time
// Equivalent input noise: NEP = √(2qI_d) / (η·G·R_λ)

export default function PmtGainPage() {
  const [numStages, setNumStages] = useState(10);
  const [stageVoltage, setStageVoltage] = useState(100); // V per stage
  const [photocathodeQE, setPhotocathodeQE] = useState(0.25);
  const [darkCurrent, setDarkCurrent] = useState(1); // nA at anode
  const [wavelength, setWavelength] = useState(400); // nm
  const [amplifierNoise, setAmplifierNoise] = useState(1000); // e- rms

  const q = 1.602e-19;
  const h = 6.626e-34;
  const c = 3e8;

  // Dynode gain parameters (typical for Cs-Sb or Cu-Be dynodes)
  const alpha = 0.75; // exponent
  const k_coeff = 0.05; // proportionality constant

  const perStageGain = k_coeff * Math.pow(stageVoltage, alpha);
  const totalGain = Math.pow(perStageGain, numStages);
  const totalVoltage = stageVoltage * numStages;

  // Responsivity at photocathode
  const lambda = wavelength * 1e-9;
  const responsivityCathode = photocathodeQE * lambda * q / (h * c); // A/W
  const anodeResponsivity = responsivityCathode * totalGain; // A/W

  // SNR analysis
  const darkCurrentElectrons = darkCurrent * 1e-9 / q; // electrons/s
  const cathodeDarkCurrent = darkCurrentElectrons / totalGain; // electrons/s

  // Gain chart vs stage voltage
  const gainChart = useMemo(() => {
    const vs = Array.from({ length: 150 }, (_, i) => 50 + i * 150 / 150);
    return [
      { x: vs, y: vs.map(v => Math.pow(k_coeff * Math.pow(v, alpha), 8)), type: "scatter", mode: "lines", name: "8 stages", line: { color: "#60a5fa", width: 2 } },
      { x: vs, y: vs.map(v => Math.pow(k_coeff * Math.pow(v, alpha), 10)), type: "scatter", mode: "lines", name: "10 stages", line: { color: "#34d399", width: 2 } },
      { x: vs, y: vs.map(v => Math.pow(k_coeff * Math.pow(v, alpha), 12)), type: "scatter", mode: "lines", name: "12 stages", line: { color: "#fbbf24", width: 2 } },
    ];
  }, []);

  // SNR vs photon flux
  const snrChart = useMemo(() => {
    const flux = Array.from({ length: 150 }, (_, i) => 1 + i * 10000 / 150);
    const tau = 1; // 1 second integration
    return [
      { x: flux, y: flux.map(P => {
        const signal = photocathodeQE * totalGain * P * tau;
        const noise = Math.sqrt(photocathodeQE * totalGain * totalGain * P * tau + 2 * totalGain * cathodeDarkCurrent * tau + amplifierNoise ** 2);
        return signal / noise;
      }), type: "scatter", mode: "lines", name: `G=${totalGain.toExponential(1)}`, line: { color: "#f87171", width: 2 } },
      { x: flux, y: flux.map(P => {
        const G = totalGain / 10;
        const signal = photocathodeQE * G * P * tau;
        const noise = Math.sqrt(photocathodeQE * G * G * P * tau + 2 * G * cathodeDarkCurrent * tau + amplifierNoise ** 2);
        return signal / noise;
      }), type: "scatter", mode: "lines", name: `G=${(totalGain/10).toExponential(1)}`, line: { color: "#a78bfa", width: 2, dash: "dash" } },
    ];
  }, [totalGain, photocathodeQE, cathodeDarkCurrent, amplifierNoise]);

  // Excess noise factor for PMT ≈ 1 (nearly ideal)
  // F = 1 + 1/δ (approximately for large δ)
  const excessNoiseFactor = 1 + 1 / perStageGain;

  // SNR gain chart vs total voltage
  const snrVsVoltage = useMemo(() => {
    const vt = Array.from({ length: 150 }, (_, i) => 500 + i * 2000 / 150);
    return [{
      x: vt, y: vt.map(V => {
        const vs = V / numStages;
        const G = Math.pow(k_coeff * Math.pow(vs, alpha), numStages);
        return Math.sqrt(2 * G * G / (1 + 1 / perStageGain));
      }), type: "scatter", mode: "lines", name: "SNR improvement factor", line: { color: "#34d399", width: 2 },
    }];
  }, [numStages, perStageGain, alpha]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Number of Dynode Stages" value={numStages} onChange={setNumStages} min={6} max={14} step="1" />
        <ValidatedNumberInput label="Stage Voltage (V)" value={stageVoltage} onChange={setStageVoltage} min={50} max={200} step="5" />
        <ValidatedNumberInput label="Photocathode QE" value={photocathodeQE} onChange={setPhotocathodeQE} min={0.01} max={0.5} step="0.01" />
        <ValidatedNumberInput label="Anode Dark Current (nA)" value={darkCurrent} onChange={setDarkCurrent} min={0.1} step="0.1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={900} step="10" />
        <ValidatedNumberInput label="Amplifier Noise (e⁻ rms)" value={amplifierNoise} onChange={setAmplifierNoise} min={100} step="100" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Results</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ResultCard label="Per-Stage Gain δ" value={perStageGain.toFixed(2)} tone="blue" />
          <ResultCard label="Total Gain G" value={totalGain.toExponential(2)} tone="blue" />
          <ResultCard label="Total Voltage" value="{totalVoltage} V" tone="blue" />
          <ResultCard label="Anode Responsivity" value="{anodeResponsivity.toExponential(2)} A/W" tone="blue" />
          <ResultCard label="Excess Noise Factor" value={excessNoiseFactor.toFixed(4)} tone="blue" />
          <ResultCard label="Cathode Dark Current" value="{(cathodeDarkCurrent * 1e15).toFixed(2)} fA" tone="blue" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Total Gain vs Stage Voltage</h3>
          <ChartPanel data={gainChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Stage Voltage (V)", gridcolor: "#374151" },
            yaxis: { title: "Total Gain G", type: "log", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">SNR vs Photon Flux</h3>
          <ChartPanel data={snrChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Photon Flux (photons/s)", gridcolor: "#374151" },
            yaxis: { title: "Output SNR", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} />
        </div>
      </div>

      <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-sm text-gray-400">
        <h3 className="text-white font-semibold mb-2">Formulas</h3>
        <p>δ = k·V_s^α (per-stage gain, α ≈ 0.7-0.8)</p>
        <p>G = δ^n (total gain, n = number of stages)</p>
        <p>R_anode = η·q·λ/(h·c) · G</p>
        <p>F ≈ 1 + 1/δ (excess noise, nearly ideal)</p>
        <p>SNR_out = η·G·P·τ / √(η·G²·P·τ + 2·G·I_d·τ·q + σ_amp²)</p>
      </div>
    </div>
  );
}
