"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function TimeResolvedPage() {
  const [laserRepRate, setLaserRepRate] = useState(80); // MHz
  const [pulseWidthFs, setPulseWidthFs] = useState(100); // fs
  const [instrumentResponse, setInstrumentResponse] = useState(0.3); // ps
  const [lifetime, setLifetime] = useState(2); // ns
  const [timeRange, setTimeRange] = useState(10); // ns

  const chartData = useMemo(() => {
    const N = 500;
    const times = Array.from({ length: N }, (_, i) => (i / N) * timeRange);

    // Instrument response function (Gaussian)
    const sigma = instrumentResponse / 2.355; // FWHM to sigma
    const irf = times.map(t => Math.exp(-t * t / (2 * sigma * sigma)));

    // Intrinsic decay (single exponential)
    const decay = times.map(t => Math.exp(-t / lifetime));

    // Convolution of IRF with decay (approximate via numerical)
    const dt = timeRange / N;
    const convolved = times.map((_, i) => {
      let sum = 0;
      for (let j = 0; j <= i; j++) {
        sum += irf[i - j] * decay[j] * dt;
      }
      return sum;
    });

    // Normalize
    const maxConv = Math.max(...convolved);
    const normConv = convolved.map(v => v / maxConv);

    // Log scale plot
    const logTimes = times.filter(t => t > 0);
    const logDecay = logTimes.map(t => Math.log10(Math.exp(-t / lifetime)));
    const logIRF = logTimes.map(t => Math.log10(Math.max(irf[Math.round(t / dt)], 1e-10)));

    return [
      { x: times, y: normConv, type: "scatter", mode: "lines", name: "Measured (IRF convolved)",
        line: { color: "#60a5fa", width: 2 } },
      { x: times, y: decay, type: "scatter", mode: "lines", name: "Intrinsic Decay",
        line: { color: "#f59e0b", dash: "dash" } },
      { x: times, y: irf, type: "scatter", mode: "lines", name: "IRF",
        line: { color: "#f87171", dash: "dot" } },
    ];
  }, [pulseWidthFs, instrumentResponse, lifetime, timeRange]);

  const c = 3e8;
  const repPeriod = 1 / (laserRepRate * 1e6); // seconds
  const spectralWidth = 0.44 / (pulseWidthFs * 1e-15); // Hz, time-bandwidth product
  const spectralWidthNm = pulseWidthFs * 1e-15 * spectralWidth * (800e-9) ** 2 / c * 1e9; // approx for 800nm

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Time-Resolved Spectroscopy" description="TCSPC and streak camera fundamentals. IRF convolution, temporal resolution, and decay analysis.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Laser Rep Rate (MHz)</span>
          <input type="number" value={laserRepRate} onChange={e => setLaserRepRate(+e.target.value)} min={1} max={1000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Pulse Width (fs)</span>
          <input type="number" value={pulseWidthFs} onChange={e => setPulseWidthFs(+e.target.value)} min={5} max={10000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Instrument Response (ps)</span>
          <input type="number" value={instrumentResponse} onChange={e => setInstrumentResponse(+e.target.value)} min={0.01} max={10} step={0.01}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Fluorescence Lifetime (ns)</span>
          <input type="number" value={lifetime} onChange={e => setLifetime(+e.target.value)} min={0.01} max={1000} step={0.01}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Time Range (ns)</span>
          <input type="number" value={timeRange} onChange={e => setTimeRange(+e.target.value)} min={0.1} max={1000} step={0.1}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">IRF:</span> R(t) = exp(−t²/2σ²), σ = FWHM/2.355</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Measured:</span> I(t) = R(t) ⊗ exp(−t/τ)</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">TCSPC:</span> Δt = 1/(rep_rate), timing jitter = IRF</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Time-bandwidth:</span> Δν·Δt ≥ 0.44 (transform limit)</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Computed Values</h3>
        <p className="text-sm text-gray-300"><span className="text-green-400">Rep period:</span> {(repPeriod * 1e9).toFixed(1)} ns</p>
        <p className="text-sm text-gray-300"><span className="text-green-400">Min resolvable τ:</span> {instrumentResponse < lifetime ? "✓ Below lifetime" : "✗ Exceeds lifetime — poor resolution"}</p>
        <p className="text-sm text-gray-300"><span className="text-green-400">Spectral bandwidth:</span> {(spectralWidth / 1e12).toFixed(1)} THz (~{spectralWidthNm.toFixed(1)} nm at 800 nm)</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "Time-Resolved Decay with IRF", font: { color: "white" } },
          xaxis: { title: "Time (ns)", gridcolor: "#374151" },
          yaxis: { title: "Intensity (norm.)", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
          showlegend: true, legend: { x: 0.99, y: 0.99, bgcolor: "rgba(0,0,0,0)", xanchor: "right" },
        }} />
      </div>
    </CalculatorShell>
  );
}
