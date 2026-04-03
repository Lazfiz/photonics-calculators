"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

export default function ElectronMultiplyingPage() {
  const [signalElectrons, setSignalElectrons] = useState(10);
  const [darkCurrent, setDarkCurrent] = useState(0.001);
  const [emccdReadNoise, setEmccdReadNoise] = useState(60);
  const [scmosReadNoise, setScmosReadNoise] = useState(1.5);
  const [emGain, setEmGain] = useState(1000);
  const [exposureTime, setExposureTime] = useState(0.1);

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
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Signal (e⁻/pix/frame)</span><input type="number" value={signalElectrons} onChange={e => setSignalElectrons(+e.target.value)} min="0.1" step="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Dark Current (e⁻/pix/frame)</span><input type="number" value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)} min="0" step="0.001" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">EMCCD Read Noise (e⁻)</span><input type="number" value={emccdReadNoise} onChange={e => setEmccdReadNoise(+e.target.value)} min="1" step="5" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">sCMOS Read Noise (e⁻)</span><input type="number" value={scmosReadNoise} onChange={e => setScmosReadNoise(+e.target.value)} min="0.1" step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">EM Gain</span><input type="number" value={emGain} onChange={e => setEmGain(+e.target.value)} min="1" step="50" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Exposure Time (s)</span><input type="number" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} min="0.001" step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
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
