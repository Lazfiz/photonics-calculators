"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function ShotNoisePage() {
  const [photocurrent, setPhotocurrent] = useURLState("photocurrent", 1e-6); // A
  const [q, setQ] = useURLState("q", 1.602176634e-19); // C
  const [bandwidth, setBandwidth] = useURLState("bandwidth", 1e6); // Hz

  const chartData = useMemo(() => {
    const currents = Array.from({ length: 200 }, (_, i) => 1e-9 * Math.pow(1e6, i / 199)); // 1nA to 1mA
    const iNoise = currents.map(I => Math.sqrt(2 * q * Math.abs(I) * bandwidth));
    const snr = currents.map(I => I !== 0 ? Math.abs(I) / Math.sqrt(2 * q * Math.abs(I) * bandwidth) : 0);
    return [
      { x: currents, y: iNoise, type: "scatter" as const, mode: "lines" as const, name: "Shot noise current", line: { color: "#f87171" }, yaxis: "y" },
      { x: currents, y: snr, type: "scatter" as const, mode: "lines" as const, name: "SNR", line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [photocurrent, q, bandwidth]);

  const iShot = Math.sqrt(2 * q * Math.abs(photocurrent) * bandwidth);
  const snrVal = photocurrent !== 0 ? Math.abs(photocurrent) / iShot : 0;
  const snrPower = snrVal * snrVal;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Photocurrent (A)" value={photocurrent} onChange={setPhotocurrent} step="1e-9" />
        <ValidatedNumberInput label="Bandwidth (Hz)" value={bandwidth} onChange={setBandwidth} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Shot noise current = <span className="text-blue-400 font-mono">{iShot.toExponential(3)} A</span></p>
        <p className="text-gray-300">SNR (amplitude) = <span className="text-blue-400 font-mono">{snrVal === Infinity ? "∞" : snrVal.toFixed(1)}</span></p>
        <p className="text-gray-300">SNR (power) = <span className="text-blue-400 font-mono">{snrPower === Infinity ? "∞" : snrPower.toFixed(1)}</span></p>
        <p className="text-sm text-gray-500 mt-2">Note: NEP = noise current / responsivity (see NEP calculator for full analysis)</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Photocurrent (A)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Noise Current (A)", type: "log", gridcolor: "#374151" },
        yaxis2: { title: "SNR", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} />
    </div>
  );
}
