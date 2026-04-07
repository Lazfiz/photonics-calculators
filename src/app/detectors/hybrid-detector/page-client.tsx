"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
export default function HybridDetectorPage() {
  const [wavelength, setWavelength] = useState(530);
  const [qe, setQe] = useState(0.9);
  const [inputNoiseCurrent, setInputNoiseCurrent] = useState(5);
  const [inputNoiseVoltage, setInputNoiseVoltage] = useState(5);
  const [bandwidth, setBandwidth] = useState(100);
  const [feedbackResistance, setFeedbackResistance] = useState(1);

  const responsivity = qe * 1.602e-19 * wavelength * 1e-9 / (6.626e-34 * 3e8);
  const bwHz = bandwidth * 1e6;
  const Rf = feedbackResistance * 1e6;
  const currentNoise = inputNoiseCurrent * 1e-15 * Math.sqrt(bwHz);
  const voltageNoiseContrib = inputNoiseVoltage * 1e-9 * Math.sqrt(bwHz) / Rf;
  const totalNoise = Math.sqrt(currentNoise ** 2 + voltageNoiseContrib ** 2);
  const nep = totalNoise / responsivity * 1e15;
  const noiseElectrons = totalNoise / 1.602e-19;

  const nepVsBW = useMemo(() => {
    const bws = Array.from({ length: 200 }, (_, i) => 1 + i * 5);
    return [{ x: bws, y: bws.map(bw => { const hz = bw * 1e6; const in_ = inputNoiseCurrent * 1e-15 * Math.sqrt(hz); const vn = inputNoiseVoltage * 1e-9 * Math.sqrt(hz) / Rf; return Math.sqrt(in_ ** 2 + vn ** 2) / responsivity * 1e15; }), type: "scatter", mode: "lines", name: "NEP", line: { color: "#34d399" } }];
  }, [inputNoiseCurrent, inputNoiseVoltage, feedbackResistance, responsivity, bwHz, Rf]);

  const noiseVsGain = useMemo(() => {
    const gains = Array.from({ length: 200 }, (_, i) => 1e3 * Math.pow(1e7 / 1e3, i / 199));
    const cur = gains.map(() => inputNoiseCurrent * 1e-15 * Math.sqrt(bwHz) * 1e15);
    const vol = gains.map(g => inputNoiseVoltage * 1e-9 * Math.sqrt(bwHz) / g * 1e15);
    return [
      { x: gains, y: cur, type: "scatter", mode: "lines", name: "Current noise", line: { color: "#f87171" } },
      { x: gains, y: vol, type: "scatter", mode: "lines", name: "Voltage noise", line: { color: "#60a5fa" } },
      { x: gains, y: gains.map((_, i) => Math.sqrt(cur[i] ** 2 + vol[i] ** 2)), type: "scatter", mode: "lines", name: "Total", line: { color: "#34d399", dash: "dash" } },
    ];
  }, [inputNoiseCurrent, inputNoiseVoltage, bwHz]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Hybrid Detector Design" description="Photodiode + TIA hybrid — noise analysis, NEP, and gain optimization." maxWidthClassName="max-w-5xl">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} step="10" />
        <ValidatedNumberInput label="Quantum Efficiency" value={qe} onChange={setQe} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="i_n (fA/√Hz)" value={inputNoiseCurrent} onChange={setInputNoiseCurrent} min={0.1} step="0.5" />
        <ValidatedNumberInput label="e_n (nV/√Hz)" value={inputNoiseVoltage} onChange={setInputNoiseVoltage} min={0.1} step="0.5" />
        <ValidatedNumberInput label="Bandwidth (MHz)" value={bandwidth} onChange={setBandwidth} min={1} step="10" />
        <ValidatedNumberInput label="R_f (MΩ)" value={feedbackResistance} onChange={setFeedbackResistance} min={0.01} step="0.1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Responsivity" value={`${(responsivity * 1e3).toFixed(2)} mA/W`} tone="blue" />
        <ResultCard label="NEP" value={`${nep.toFixed(1)} fW/√Hz`} tone="green" />
        <ResultCard label="Noise Electrons" value={`${noiseElectrons.toFixed(0)} e⁻ rms`} tone="yellow" />
        <ResultCard label="R_f·BW" value={`${(Rf * bwHz / 1e12).toFixed(1)} TΩ·Hz`} tone="purple" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"><p>NEP = √(i_n²·BW + e_n²·BW/R_f²) / R</p><p>Optimal R_f when i_n·R_f ≈ e_n</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={nepVsBW} layout={{ xaxis: { title: "BW (MHz)", gridcolor: "#374151" }, yaxis: { title: "NEP (fW/√Hz)", gridcolor: "#374151" } }} title="NEP vs Bandwidth" />
        <ChartPanel data={noiseVsGain} layout={{ xaxis: { title: "R_f (Ω)", gridcolor: "#374151", type: "log" }, yaxis: { title: "Noise (fA)", gridcolor: "#374151", type: "log" } }} title="Noise vs Feedback R" />
      </div>
    </CalculatorShell>
  );
}
