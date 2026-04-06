"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";

const alpha = 0.015; const vThreshold = 30;
const excessNoise = Math.sqrt(2);

export default function EmccdGainPage() {
  const [numStages, setNumStages] = useState(604);
  const [clockVoltage, setClockVoltage] = useState(40);
  const [readNoise, setReadNoise] = useState(100);
  const [emReadNoise, setEmReadNoise] = useState(1);
  const [darkCurrent, setDarkCurrent] = useState(0.001);
  const [exposureTime, setExposureTime] = useState(1);
  const [signalPhotons, setSignalPhotons] = useState(50);

  const perStageGain = 1 + alpha * Math.max(0, clockVoltage - vThreshold);
  const totalGain = Math.pow(perStageGain, numStages);
  const darkElectrons = darkCurrent * exposureTime;
  const totalInputNoise = Math.sqrt(signalPhotons + darkElectrons);
  const emccdOutputNoise = excessNoise * totalGain * totalInputNoise;
  const emccdTotalNoise = Math.sqrt(emccdOutputNoise ** 2 + emReadNoise ** 2);
  const emccdSNR = signalPhotons * totalGain / emccdTotalNoise;
  const ccdOutputNoise = Math.sqrt(signalPhotons + darkElectrons + readNoise ** 2);
  const ccdSNR = signalPhotons / ccdOutputNoise;
  const crossoverSignal = 2 * readNoise * readNoise / (excessNoise ** 2);

  const gainChart = useMemo(() => {
    const stages = Array.from({ length: 200 }, (_, i) => 100 + i * 800 / 200);
    return [{ x: stages, y: stages.map(n => Math.pow(perStageGain, n)), type: "scatter", mode: "lines", name: `G (g=${perStageGain.toFixed(3)})`, line: { color: "#60a5fa", width: 2 } }];
  }, [perStageGain]);

  const snrChart = useMemo(() => {
    const sig = Array.from({ length: 200 }, (_, i) => 0.5 + i * 200 / 200);
    return [
      { x: sig, y: sig.map(s => { const tn = Math.sqrt(s + darkElectrons); const emn = Math.sqrt((excessNoise * totalGain * tn) ** 2 + emReadNoise ** 2); return s * totalGain / emn; }), type: "scatter", mode: "lines", name: `EMCCD (G=${totalGain.toFixed(0)})`, line: { color: "#60a5fa", width: 2 } },
      { x: sig, y: sig.map(s => s / Math.sqrt(s + darkElectrons + readNoise ** 2)), type: "scatter", mode: "lines", name: "Conventional CCD", line: { color: "#f87171", width: 2 } },
      { x: [crossoverSignal, crossoverSignal], y: [0, 15], type: "scatter", mode: "lines", name: "Crossover", line: { color: "#fbbf24", width: 1, dash: "dash" } },
    ];
  }, [totalGain, darkElectrons, readNoise, emReadNoise, crossoverSignal]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="EMCCD Gain Calculator" description="EM gain stages, excess noise (F=√2), and SNR advantage over conventional CCD." maxWidthClassName="max-w-5xl">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="EM Stages" value={numStages} onChange={setNumStages} min={100} max={1000} step="1" />
        <ValidatedNumberInput label="Clock Voltage (V)" value={clockVoltage} onChange={setClockVoltage} min={30} max={60} step="1" />
        <ValidatedNumberInput label="Conv. Read Noise (e⁻)" value={readNoise} onChange={setReadNoise} min={1} step="1" />
        <ValidatedNumberInput label="EM Read Noise (e⁻)" value={emReadNoise} onChange={setEmReadNoise} min={0.1} step="0.1" />
        <ValidatedNumberInput label="Dark Current (e⁻/s)" value={darkCurrent} onChange={setDarkCurrent} min={0} step="0.0001" />
        <ValidatedNumberInput label="Exposure (s)" value={exposureTime} onChange={setExposureTime} min={0.001} step="0.1" />
        <ValidatedNumberInput label="Signal (e⁻/pix)" value={signalPhotons} onChange={setSignalPhotons} min={0} step="1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Per-Stage Gain" value={perStageGain.toFixed(4)} tone="blue" />
        <ResultCard label="Total Gain G" value={totalGain > 1e4 ? totalGain.toExponential(2) : totalGain.toFixed(1)} tone="green" />
        <ResultCard label="EMCCD SNR" value={emccdSNR.toFixed(2)} tone={emccdSNR > ccdSNR ? "green" : "red"} />
        <ResultCard label="Conv. CCD SNR" value={ccdSNR.toFixed(2)} tone="red" />
        <ResultCard label="SNR Improvement" value={ccdSNR > 0 ? `${(emccdSNR / ccdSNR).toFixed(2)}×` : "N/A"} tone="yellow" />
        <ResultCard label="Crossover Signal" value={`${crossoverSignal.toFixed(1)} e⁻/pix`} tone="purple" />
      </div>
      <div className={`mt-4 p-3 rounded text-sm mb-6 ${emccdSNR > ccdSNR ? "bg-green-900/30 text-green-300 border border-green-800" : "bg-red-900/30 text-red-300 border border-red-800"}`}>
        {emccdSNR > ccdSNR ? "✓ EMCCD provides better SNR at this signal level" : "✗ Conventional CCD is better — signal above crossover"}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChartPanel data={gainChart} layout={{ xaxis: { title: "Stages", gridcolor: "#374151" }, yaxis: { title: "Gain G", type: "log", gridcolor: "#374151" } }} title="Total Gain vs Stages" />
        <ChartPanel data={snrChart} layout={{ xaxis: { title: "Signal (e⁻/pix)", gridcolor: "#374151" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} title="SNR vs Signal" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 font-mono space-y-1"><p>G = g^N, g = 1 + α·(V_clock − V_threshold)</p><p>F = √2 (stochastic multiplication)</p><p>SNR_EMCCD = S·G / √(2·G²·(S+D) + σ_read²)</p></div>
    </CalculatorShell>
  );
}
