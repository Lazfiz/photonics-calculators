"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function PMDPage() {
  const [pmdCoeff, setPmdCoeff] = useState(0.5); // ps/√km
  const [length, setLength] = useState(100); // km
  const [bitRate, setBitRate] = useState(10); // Gbps
  const [fiberCount, setFiberCount] = useState(1); // number of fiber spans
  const [probability, setProbability] = useState(99.9); // % Q outage probability

  const calc = useMemo(() => {
    const DGD_rms = pmdCoeff * Math.sqrt(length); // ps
    const DGD_mean = DGD_rms * Math.sqrt(8 / Math.PI); // ps, mean DGD
    const DGD_max = pmdCoeff * Math.sqrt(length * fiberCount); // for concatenated spans

    // Maxwellian distribution stats
    // P(DGD > x) = (4/π²) · (x/σ)² · exp(-x²/2σ²) · Σ ...
    // Simplified: for Q-factor penalty, PMD-induced penalty
    const sigma = DGD_rms;
    const penalty1dB = 0.28 * sigma / (1e12 / (bitRate * 1e9)) * 0.1; // simplified 1dB penalty threshold
    const penaltyThreshold = (0.1 * 1e12) / (bitRate * 1e9); // 10% of bit period for ~1dB penalty
    const aboveThreshold = probability / 100;

    // PMD-limited distance for given bit rate
    const maxDist = Math.pow(penaltyThreshold / pmdCoeff, 2); // km

    // System Q-penalty
    const qPenalty = 0.5 * Math.pow(bitRate * DGD_rms / 1e3, 2); // approximate Q penalty in dB

    // Outage probability (Maxwellian tail)
    // P(DGD > 3σ) ≈ 0.01%, P(DGD > 3.5σ) ≈ 0.001%
    const DGD_outage = sigma * (3.0 + (1 - aboveThreshold) * 5); // rough mapping

    // PMD-induced power penalty (dB) for different modulation formats
    const penaltyNRZ = 10 * Math.log10(1 + 0.5 * Math.pow(bitRate * DGD_rms * 0.001 / 0.1, 2));
    const penaltyRZ = 10 * Math.log10(1 + 0.3 * Math.pow(bitRate * DGD_rms * 0.001 / 0.1, 2));

    return { DGD_rms, DGD_mean, DGD_max, maxDist, qPenalty, penaltyThreshold, DGD_outage, penaltyNRZ, penaltyRZ };
  }, [pmdCoeff, length, bitRate, fiberCount, probability]);

  const distData = useMemo(() => {
    const distances = Array.from({ length: 80 }, (_, i) => (i + 1) * 5);
    const rates = [2.5, 10, 40, 100, 400];
    return rates.map(rate => ({
      x: distances,
      y: distances.map(d => pmdCoeff * Math.sqrt(d) * rate * 1e9 * 1e-12), // DGD/bit period ratio
      type: "scatter" as const, mode: "lines" as const,
      name: `${rate} Gbps`,
      line: { width: 1.5 },
    }));
  }, [pmdCoeff]);

  const distributionData = useMemo(() => {
    // Maxwellian PDF: f(x) = sqrt(2/π) · x²/σ³ · exp(-x²/2σ²)
    const sigma = calc.DGD_rms;
    const x = Array.from({ length: 200 }, (_, i) => i * sigma * 5 / 200);
    const pdf = x.map(xi => {
      if (xi === 0) return 0;
      return Math.sqrt(2 / Math.PI) * Math.pow(xi, 2) / Math.pow(sigma, 3) * Math.exp(-xi * xi / (2 * sigma * sigma));
    });
    const cdf = x.reduce((acc: number[], xi, i) => {
      if (i === 0) return [pdf[0] * (x[1] - x[0])];
      return [...acc, acc[acc.length - 1] + pdf[i] * (x[i] - x[i - 1])];
    }, []);

    return [
      { x, y: pdf, type: "scatter" as const, mode: "lines" as const, name: "PDF (Maxwellian)", line: { color: "#f87171" } },
      { x, y: cdf.map(c => c * 100), type: "scatter" as const, mode: "lines" as const, name: "CDF (%)", line: { color: "#60a5fa" }, yaxis: "y2" },
      { x: [calc.DGD_rms, calc.DGD_rms], y: [0, Math.max(...pdf)], type: "scatter" as const, mode: "lines" as const, name: "DGD_rms", line: { color: "#fbbf24", dash: "dash" } },
    ];
  }, [calc]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Polarization Mode Dispersion (PMD)" description="Calculate PMD-induced differential group delay (DGD), system penalties, and PMD-limited reach using Maxwellian statistics.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="PMD Coefficient (ps/√km)" value={pmdCoeff} onChange={setPmdCoeff} min={0.01} step="0.01" />
        <ValidatedNumberInput label="Fiber Length (km)" value={length} onChange={setLength} min={1} />
        <ValidatedNumberInput label="Bit Rate (Gbps)" value={bitRate} onChange={setBitRate} min={0.1} step="0.1" />
        <ValidatedNumberInput label="Fiber Spans" value={fiberCount} onChange={setFiberCount} min={1} />
        <ValidatedNumberInput label="Outage Prob. (%)" value={probability} onChange={setProbability} min={90} max={99.999} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">DGD (rms)</p>
          <p className="text-xl font-bold text-green-400">{calc.DGD_rms.toFixed(2)} ps</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">DGD (mean)</p>
          <p className="text-xl font-bold text-blue-400">{calc.DGD_mean.toFixed(2)} ps</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">PMD-Limited Distance</p>
          <p className="text-xl font-bold text-yellow-400">{calc.maxDist.toFixed(0)} km</p>
          <p className="text-xs text-gray-500">@ {bitRate} Gbps, 1dB penalty</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">DGD / Bit Period</p>
          <p className="text-xl font-bold text-red-400">{(calc.DGD_rms * bitRate * 1e-3).toFixed(3)}</p>
          <p className="text-xs text-gray-500">&lt;0.1 for &lt;1dB penalty</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">DGD Maxwellian Distribution</h3>
        <ChartPanel data={distributionData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "DGD (ps)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Probability Density", color: "#9ca3af", gridcolor: "#374151" },
          yaxis2: { title: "CDF (%)", color: "#60a5fa", gridcolor: "#374151", overlaying: "y", side: "right", range: [0, 105] },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 60, b: 40, l: 60 }, height: 380,
          legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af" } },
          showlegend: true,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">DGD / Bit Period vs Distance</h3>
        <ChartPanel data={distData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Distance (km)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "DGD / Bit Period", color: "#9ca3af", gridcolor: "#374151" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 350,
          legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af" } },
          shapes: [{ type: "line" as const, x0: 0, x1: 500, y0: 0.1, y1: 0.1, line: { color: "#f87171", width: 1, dash: "dash" } }],
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>DGD_rms = PMD_coeff × √L [ps]</p>
          <p>DGD_mean = DGD_rms × √(8/π) ≈ 1.596 × DGD_rms</p>
          <p>f(x) = √(2/π) · x²/σ³ · exp(-x²/2σ²) [Maxwellian PDF]</p>
          <p>Penalty (NRZ) ≈ 10·log₁₀(1 + 0.5·(B·Δτ/T₀)²)</p>
          <p>Rule of thumb: Δτ &lt; 0.1 × T_bit for &lt;1 dB penalty</p>
          <p>Modern fiber: PMD &lt; 0.1 ps/√km (G.652.D), legacy: up to 2 ps/√km</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
