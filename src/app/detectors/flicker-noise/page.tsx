"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

export default function FlickerNoisePage() {
  const [kf, setKf] = useState(1e-24);
  const [current, setCurrent] = useState(1e-6);
  const [alpha, setAlpha] = useState(1);
  const [fLow, setFLow] = useState(1);
  const [fHigh, setFHigh] = useState(1e6);

  const chartData = useMemo(() => {
    const freqs = Array.from({ length: 200 }, (_, i) => Math.pow(1e8, i / 200));
    return [
      { x: freqs, y: freqs.map(f => kf * current ** alpha / f), type: "scatter" as const, mode: "lines" as const, name: "1/f PSD", line: { color: "#f87171" } },
      { x: freqs, y: freqs.map(() => 2e-24), type: "scatter" as const, mode: "lines" as const, name: "Thermal floor", line: { color: "#60a5fa", dash: "dash" } },
    ];
  }, [kf, current, alpha]);

  const flickerNoiseRms = Math.sqrt(kf * current ** alpha * Math.log(fHigh / fLow));
  const cornerFreq = kf * current ** alpha / (4e-26);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="1/f Flicker Noise" description="Flicker noise: S_v(f) = K_f · I^α / f. Noise spectral density falls as 1/f.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">K_f (A²·Hz)</span><input type="number" value={kf} onChange={e => setKf(+e.target.value)} step="1e-25" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Current (A)</span><input type="number" value={current} onChange={e => setCurrent(+e.target.value)} step="1e-7" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Exponent α</span><input type="number" value={alpha} onChange={e => setAlpha(+e.target.value)} step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">f_low (Hz)</span><input type="number" value={fLow} onChange={e => setFLow(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">f_high (Hz)</span><input type="number" value={fHigh} onChange={e => setFHigh(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="1/f Noise (rms)" value={flickerNoiseRms.toExponential(3) + " A"} tone="blue" />
        <ResultCard label="Corner Freq" value={cornerFreq.toExponential(3) + " Hz"} tone="yellow" />
        <ResultCard label="Decade Count" value={Math.log10(fHigh / fLow).toFixed(1)} tone="green" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono"><p>σ_flicker = √(K_f · I^α · ln(f_high/f_low))</p></div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Frequency (Hz)", type: "log", gridcolor: "#374151" }, yaxis: { title: "PSD (A²/Hz)", type: "log", gridcolor: "#374151" } }} />
    </CalculatorShell>
  );
}
