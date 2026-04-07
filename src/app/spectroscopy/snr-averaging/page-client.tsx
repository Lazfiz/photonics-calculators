"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function SNRAveragingPage() {
  const [snrSingle, setSnrSingle] = useState(10);
  const [maxScans, setMaxScans] = useState(1000);

  const chartData = useMemo(() => {
    const Ns = Array.from({ length: 200 }, (_, i) => Math.max(1, Math.round(Math.pow(10, i * Math.log10(maxScans) / 200))));
    const snr = Ns.map(N => snrSingle * Math.sqrt(N));
    return [{ x: Ns, y: snr, type: "scatter" as const, mode: "lines" as const, name: "SNR after N scans", line: { color: "#60a5fa" } }];
  }, [snrSingle, maxScans]);

  const snrAt10 = snrSingle * Math.sqrt(10);
  const snrAt100 = snrSingle * Math.sqrt(100);
  const snrAtMax = snrSingle * Math.sqrt(maxScans);
  const improvement = Math.sqrt(maxScans);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="SNR Improvement with Co-Adding" description="SNR improves as √N where N is the number of co-added scans. Signal adds linearly, noise as √N.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Single-scan SNR" value={snrSingle} onChange={setSnrSingle} min={0.1} />
        <ValidatedNumberInput label="Max Scans" value={maxScans} onChange={setMaxScans} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">SNR @ 10 scans = <span className="text-blue-400 font-mono">{snrAt10.toFixed(1)}</span></p>
        <p className="text-gray-300">SNR @ 100 scans = <span className="text-blue-400 font-mono">{snrAt100.toFixed(1)}</span></p>
        <p className="text-gray-300">SNR @ {maxScans} scans = <span className="text-blue-400 font-mono">{snrAtMax.toFixed(1)}</span></p>
        <p className="text-gray-300">Improvement factor = <span className="text-blue-400 font-mono">{improvement.toFixed(1)}×</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Number of Scans", type: "log", gridcolor: "#374151" }, yaxis: { title: "SNR", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true }} />
    </CalculatorShell>
  );
}
