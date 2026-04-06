"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

// Photon counting statistics: Poisson distribution P(n) = (μ^n / n!) * e^(-μ)
// SNR = sqrt(N) for shot-noise limited detection
// Dead time corrections for high count rates
export default function PhotonCountingPage() {
  const [meanCounts, setMeanCounts] = useState(100); // expected counts per interval
  const [deadTime, setDeadTime] = useState(50); // ns
  const [countRate, setCountRate] = useState(1e6); // counts/s
  const [integrationTime, setIntegrationTime] = useState(1); // s

  const actualMean = meanCounts;
  const snr = Math.sqrt(actualMean);
  const snrDb = 10 * Math.log10(snr);
  const relativeError = 1 / snr;
  // Dead time correction: N_measured = N_true / (1 + N_true * tau)
  // N_true = N_measured / (1 - N_measured * tau)
  const trueRate = countRate; // actual incident rate
  const measuredRate = trueRate / (1 + trueRate * deadTime * 1e-9);
  const deadTimeLoss = (1 - measuredRate / trueRate) * 100;
  const totalCounts = measuredRate * integrationTime;
  const totalSNR = Math.sqrt(totalCounts);

  const chartData = useMemo(() => {
    const n = Array.from({ length: Math.min(200, Math.max(30, Math.round(meanCounts * 3))) }, (_, i) => i);
    // Poisson PMF
    const poisson = n.map(k => {
      let logP = k * Math.log(actualMean) - actualMean;
      for (let i = 2; i <= k; i++) logP -= Math.log(i);
      return Math.exp(logP);
    });
    // Gaussian approximation
    const sigma = Math.sqrt(actualMean);
    const gaussian = n.map(k => (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((k - actualMean) / sigma, 2)));

    return [
      { x: n, y: poisson, type: "bar", name: "Poisson", marker: { color: "#60a5fa", opacity: 0.7 } },
      { x: n, y: gaussian, type: "scatter", mode: "lines",
        name: "Gaussian Approx", line: { color: "#f87171", width: 2 } },
    ];
  }, [actualMean]);

  const snrVsCounts = useMemo(() => {
    const N = Array.from({ length: 200 }, (_, i) => 0.1 + i * 1000 / 200);
    return [
      { x: N, y: N.map(n => Math.sqrt(n)), type: "scatter", mode: "lines",
        name: "SNR = √N", line: { color: "#34d399", width: 2 } },
      { x: N, y: N.map(n => 1 / Math.sqrt(n) * 100), type: "scatter", mode: "lines",
        name: "Relative Error (%)", line: { color: "#fbbf24", width: 2, dash: "dash" }, yaxis: "y2" },
    ];
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Mean Counts per Interval</span>
          <input type="number" value={meanCounts} onChange={e => setMeanCounts(+e.target.value)} min="0.1" step="1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Dead Time (ns)</span>
          <input type="number" value={deadTime} onChange={e => setDeadTime(+e.target.value)} min="0" step="1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Incident Count Rate (counts/s)</span>
          <input type="number" value={countRate} onChange={e => setCountRate(+e.target.value)} min="1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Integration Time (s)</span>
          <input type="number" value={integrationTime} onChange={e => setIntegrationTime(+e.target.value)} min="0.001" step="0.1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="SNR (per interval)" value="{snr.toFixed(1)} ({snrDb.toFixed(1)} dB)" tone="green" />
        <ResultCard label="Relative Error" value="{(relativeError * 100).toFixed(2)}%" tone="yellow" />
        <ResultCard label="Dead Time Loss" value="{deadTimeLoss.toFixed(1)}%" tone="red" />
        <ResultCard label="Total SNR ({integrationTime}s)" value="{totalSNR.toFixed(0)}" tone="purple" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>P(n) = (μ<sup>n</sup> / n!) · e<sup>−μ</sup>  [Poisson distribution]</p>
        <p>SNR = √N  (shot-noise limit)</p>
        <p>N<sub>measured</sub> = N<sub>true</sub> / (1 + N<sub>true</sub> · τ)  [non-paralyzable dead time]</p>
        <p>Measured rate: {(measuredRate / 1e6).toFixed(3)} Mcps vs true: {(trueRate / 1e6).toFixed(3)} Mcps</p>
      </div>

      <h2 className="text-xl font-bold mb-4">Count Distribution</h2>
      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Counts", gridcolor: "#374151" },
        yaxis: { title: "Probability", gridcolor: "#374151" },
        margin: { t: 30, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        bargap: 0.05,
      }} />

      <h2 className="text-xl font-bold mt-8 mb-4">SNR &amp; Error vs Counts</h2>
      <ChartPanel data={snrVsCounts} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Number of Counts", gridcolor: "#374151", type: "log" },
        yaxis: { title: "SNR", gridcolor: "#374151" },
        yaxis2: { title: "Relative Error (%)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 30, r: 60, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} />
    </div>
  );
}
