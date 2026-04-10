"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function ElectronMultiplyingPage() {
  const [signalElectrons, setSignalElectrons] = useURLState("signalElectrons", 10);
  const [darkCurrent, setDarkCurrent] = useURLState("darkCurrent", 0.001);
  const [emccdReadNoise, setEmccdReadNoise] = useURLState("emccdReadNoise", 60);
  const [scmosReadNoise, setScmosReadNoise] = useURLState("scmosReadNoise", 1.5);
  const [emGain, setEmGain] = useURLState("emGain", 1000);

  const enf2 = 2 - 1 / emGain;
  const emccdSNR = signalElectrons / Math.sqrt(signalElectrons * enf2 + darkCurrent * enf2 + (emccdReadNoise / emGain) ** 2);
  const scmosSNR = signalElectrons / Math.sqrt(signalElectrons + darkCurrent + scmosReadNoise ** 2);

  const snrVsSignal = useMemo(() => {
    const signals = Array.from({ length: 200 }, (_, i) => 0.1 + i * 0.5);
    return [
      { x: signals, y: signals.map(s => s / Math.sqrt(s * enf2 + darkCurrent * enf2 + (emccdReadNoise / emGain) ** 2)), type: "scatter" as const, mode: "lines" as const, name: "EMCCD", line: { color: "#60a5fa" } },
      { x: signals, y: signals.map(s => s / Math.sqrt(s + darkCurrent + scmosReadNoise ** 2)), type: "scatter" as const, mode: "lines" as const, name: "sCMOS", line: { color: "#34d399" } },
    ];
  }, [emGain, enf2, darkCurrent, emccdReadNoise, scmosReadNoise]);

  const snrVsGain = useMemo(() => {
    const gains = Array.from({ length: 200 }, (_, i) => 1 + i * 25);
    return [
      { x: gains, y: gains.map(g => { const ef = 2 - 1 / g; return signalElectrons / Math.sqrt(signalElectrons * ef + darkCurrent * ef + (emccdReadNoise / g) ** 2); }), type: "scatter" as const, mode: "lines" as const, name: "EMCCD SNR", line: { color: "#60a5fa" } },
      { x: [1, 5000], y: [scmosSNR, scmosSNR], type: "scatter" as const, mode: "lines" as const, name: "sCMOS SNR", line: { color: "#34d399", dash: "dash" } },
    ];
  }, [signalElectrons, darkCurrent, emccdReadNoise, scmosSNR]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="EMCCD vs sCMOS" description="Compare electron-multiplying CCD with sCMOS for low-light imaging." maxWidthClassName="max-w-5xl">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Signal (e⁻/pix/frame)" value={signalElectrons} onChange={setSignalElectrons} min={0.1} step="1" />
        <ValidatedNumberInput label="Dark Current (e⁻/pix/frame)" value={darkCurrent} onChange={setDarkCurrent} min={0} step="0.001" />
        <ValidatedNumberInput label="EMCCD Read Noise (e⁻)" value={emccdReadNoise} onChange={setEmccdReadNoise} min={1} step="5" />
        <ValidatedNumberInput label="sCMOS Read Noise (e⁻)" value={scmosReadNoise} onChange={setScmosReadNoise} min={0.1} step="0.1" />
        <ValidatedNumberInput label="EM Gain" value={emGain} onChange={setEmGain} min={1} step="50" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="EMCCD SNR" value={emccdSNR.toFixed(2)} tone="blue" />
        <ResultCard label="sCMOS SNR" value={scmosSNR.toFixed(2)} tone="green" />
        <ResultCard label="Winner" value={emccdSNR > scmosSNR ? "EMCCD" : "sCMOS"} tone={emccdSNR > scmosSNR ? "blue" : "green"} />
        <ResultCard label="ENF²" value={enf2.toFixed(3)} tone="yellow" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"><p>EMCCD: σ = √(S·ENF² + D·ENF² + (σ_read/G)²), ENF² = 2 − 1/G</p><p>sCMOS: σ = √(S + D + σ_read²)</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={snrVsSignal} layout={{ xaxis: { title: "Signal (e⁻/pix)", gridcolor: "#374151" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} title="SNR vs Signal" />
        <ChartPanel data={snrVsGain} layout={{ xaxis: { title: "EM Gain", gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} title="EMCCD SNR vs Gain" />
      </div>
    </CalculatorShell>
  );
}
