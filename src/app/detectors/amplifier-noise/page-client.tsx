"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

export default function AmplifierNoisePage() {
  const [en, setEn] = useState(5);
  const [gain, setGain] = useState(2);
  const [bandwidth, setBandwidth] = useState(1e6);

  const chartData = useMemo(() => {
    const enVals = Array.from({ length: 200 }, (_, i) => 0.5 + (i / 200) * 49.5);
    const noiseDn = enVals.map(e => e / gain);
    const snrMax = enVals.map(e => 1 / e);
    return [
      { x: enVals, y: noiseDn, type: "scatter" as const, mode: "lines" as const, name: "Noise (DN)", line: { color: "#f87171" }, yaxis: "y" },
      { x: enVals, y: snrMax, type: "scatter" as const, mode: "lines" as const, name: "Max SNR (1/en)", line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [en, gain, bandwidth]);

  const noiseDn = en / gain;
  const maxSnr = 1 / en;

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Amplifier Noise" description="Input-referred noise sets the detection floor. σ_amp = e_n.">
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Input noise eₙ (e⁻ rms)</span><input type="number" value={en} onChange={e => setEn(+e.target.value)} step="0.5" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Conversion gain (e⁻/DN)</span><input type="number" value={gain} onChange={e => setGain(+e.target.value)} step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Bandwidth (Hz)</span><input type="number" value={bandwidth} onChange={e => setBandwidth(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Noise in DN" value={noiseDn.toFixed(2)} tone="red" />
        <ResultCard label="Max SNR" value={maxSnr.toExponential(3)} tone="blue" />
        <ResultCard label="Min Detectable (3σ)" value={`${(en * 3).toFixed(1)} e⁻`} tone="yellow" />
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Input noise eₙ (e⁻ rms)", gridcolor: "#374151" }, yaxis: { title: "Noise (DN)", gridcolor: "#374151" }, yaxis2: { title: "Max SNR", gridcolor: "#374151", overlaying: "y", side: "right" } }} />
    </CalculatorShell>
  );
}
