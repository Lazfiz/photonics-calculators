"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function BackIlluminationPage() {
  const [fiQE, setFiQE] = useURLState("fiQE", 0.4);
  const [biQE, setBiQE] = useURLState("biQE", 0.95);
  const [cfaTransmission, setCfaTransmission] = useURLState("cfaTransmission", 0.25);
  const [microlensGain, setMicrolensGain] = useURLState("microlensGain", 1.3);

  const chartData = useMemo(() => {
    const wavelengths = Array.from({ length: 200 }, (_, i) => 300 + (i / 200) * 700);
    const fiResponse = wavelengths.map(w => {
      const peak = 550; const sigma = 150;
      const gateAbsorption = w < 400 ? 0.3 : 1;
      return fiQE * Math.exp(-((w - peak) ** 2) / (2 * sigma ** 2)) * cfaTransmission * microlensGain * gateAbsorption;
    });
    const biResponse = wavelengths.map(w => {
      const peak = 550; const sigma = 150;
      return biQE * Math.exp(-((w - peak) ** 2) / (2 * sigma ** 2)) * cfaTransmission * microlensGain;
    });
    const improvement = wavelengths.map((w, i) => biResponse[i] / Math.max(fiResponse[i], 1e-6));
    return [
      { x: wavelengths, y: fiResponse.map(v => v * 100), type: "scatter" as const, mode: "lines" as const, name: "Front-illuminated", line: { color: "#f87171" } },
      { x: wavelengths, y: biResponse.map(v => v * 100), type: "scatter" as const, mode: "lines" as const, name: "Back-illuminated", line: { color: "#60a5fa" } },
      { x: wavelengths, y: improvement, type: "scatter" as const, mode: "lines" as const, name: "Improvement", line: { color: "#34d399", dash: "dash" }, yaxis: "y2" },
    ];
  }, [fiQE, biQE, cfaTransmission, microlensGain]);

  const effectiveFi = fiQE * cfaTransmission * microlensGain;
  const effectiveBi = biQE * cfaTransmission * microlensGain;
  const improvement = effectiveBi / effectiveFi;
  // SNR improvement = √(QE ratio) only in shot-noise-limited regime
  const snrImprovement = Math.sqrt(improvement);
  const sensitivityGain = 10 * Math.log10(improvement);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Back-Illuminated vs Front-Illuminated" description="Back-illuminated sensors bypass gate structures for higher QE and better blue/UV response.">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Front-illuminated peak QE" value={fiQE} onChange={setFiQE} min={0} max={1} step="0.05" />
        <ValidatedNumberInput label="Back-illuminated peak QE" value={biQE} onChange={setBiQE} min={0} max={1} step="0.05" />
        <ValidatedNumberInput label="CFA transmission" value={cfaTransmission} onChange={setCfaTransmission} min={0} max={1} step="0.05" />
        <ValidatedNumberInput label="Microlens fill factor gain" value={microlensGain} onChange={setMicrolensGain} min={0.1} step="0.1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Effective FI QE" value={`${(effectiveFi * 100).toFixed(1)}%`} tone="red" />
        <ResultCard label="Effective BI QE" value={`${(effectiveBi * 100).toFixed(1)}%`} tone="blue" />
        <ResultCard label="QE Improvement" value={`${improvement.toFixed(2)}×`} tone="green" />
        <ResultCard label="SNR Improvement" value={`${snrImprovement.toFixed(2)}×`} tone="yellow" subtext={`${sensitivityGain.toFixed(1)} dB (shot-noise limit)`} />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>Both sensors share the same CFA and microlens — BI advantage comes from removing gate structures</p>
        <p>FI suffers additional gate absorption in blue/UV (hard cutoff approximation at 400 nm)</p>
        <p>SNR improvement assumes shot-noise-limited regime (photon noise dominates)</p>
        <p>For read-noise-limited regime: SNR improvement ≈ QE ratio directly</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "QE (%)", gridcolor: "#374151" }, yaxis2: { title: "Improvement", gridcolor: "#374151", overlaying: "y", side: "right" } }} />
    </CalculatorShell>
  );
}
