"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function PhotonicBandgapPage() {
  const [latticeConst, setLatticeConst] = useURLState("latticeConst", 500); // nm
  const [nHigh, setNHigh] = useURLState("nHigh", 3.4); // Si
  const [nLow, setNLow] = useURLState("nLow", 1.45); // SiO2
  const [fillFraction, setFillFraction] = useURLState("fillFraction", 0.3); // filling fraction
  const [numPeriods, setNumPeriods] = useURLState("numPeriods", 10);

  const a = latticeConst * 1e-9; // m
  const lambdaBragg = 2 * (nHigh * fillFraction + nLow * (1 - fillFraction)) * a * 1e9; // nm, quarter-wave
  const freqNorm = 0.5 * (nHigh + nLow) / ((nHigh * fillFraction + nLow * (1 - fillFraction)));
  const deltaN = nHigh - nLow;
  const nAvg = (nHigh + nLow) / 2;
  const bandwidth = (4 / Math.PI) * Math.asin(deltaN / (nHigh + nLow));
  const reflectivity = Math.tanh(numPeriods * Math.asin(deltaN / (nHigh + nLow))) ** 2;

  const chartData = useMemo(() => {
    const N = 500;
    const freqMin = 0.1;
    const freqMax = 2.0;
    const freqs = Array.from({ length: N }, (_, i) => freqMin + i / N * (freqMax - freqMin));
    // Simplified 1D photonic crystal: transfer matrix approximate
    // Use sinusoidal approximation for bandgap
    const transmission = freqs.map(f => {
      const fNorm = f / freqNorm;
      const delta = (nHigh - nLow) / (nHigh + nLow);
      const kappa = Math.PI * delta / (2 * (nHigh * fillFraction + nLow * (1 - fillFraction)));
      const detuning = 2 * Math.PI * (fNorm - 1);
      const gamma = Math.sqrt(kappa * kappa + detuning * detuning / 4);
      const coshGL = Math.cosh(gamma * numPeriods * 2);
      const sinGL = gamma > 0.001 ? Math.sin(gamma * numPeriods * 2) / gamma : numPeriods * 2;
      const tMag = 1 / Math.sqrt(coshGL * coshGL + Math.pow(kappa, 2) * sinGL * sinGL);
      return Math.min(1, tMag * tMag);
    });
    return [
      { x: freqs, y: transmission, type: "scatter" as const, mode: "lines" as const, name: "Transmission", line: { color: "#60a5fa", width: 2 } },
      { x: freqs, y: transmission.map(t => 1 - t), type: "scatter" as const, mode: "lines" as const, name: "Reflection", line: { color: "#f87171", width: 2 } },
    ];
  }, [nHigh, nLow, fillFraction, numPeriods, freqNorm]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Photonic Bandgap" description="1D photonic crystal band structure and reflectivity.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Lattice Constant a (nm)" value={latticeConst} onChange={setLatticeConst} />
        <ValidatedNumberInput label="High Index n₁" value={nHigh} onChange={setNHigh} step="any" />
        <ValidatedNumberInput label="Low Index n₂" value={nLow} onChange={setNLow} step="any" />
        <ValidatedNumberInput label="Fill Fraction" value={fillFraction} onChange={setFillFraction} min={0} max={1} step="any" />
        <ValidatedNumberInput label="Number of Periods" value={numPeriods} onChange={setNumPeriods} min={1} max={100} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bragg Wavelength</p>
          <p className="text-xl font-bold text-blue-400">{lambdaBragg.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Reflectivity</p>
          <p className="text-xl font-bold text-green-400">{(reflectivity * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Index Contrast Δn</p>
          <p className="text-xl font-bold text-orange-400">{deltaN.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bandwidth (Δf/f₀)</p>
          <p className="text-xl font-bold text-purple-400">{(bandwidth * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2 font-mono">λ<sub>Bragg</sub> = 2·n<sub>eff</sub>·a &nbsp;|&nbsp; R = tanh²(N·Δn/(2n̄)) &nbsp;|&nbsp; Δf/f₀ = (4/π)arcsin(Δn/(n₁+n₂))</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Normalised Frequency (f/f₀)", gridcolor: "#374151" },
          yaxis: { title: "Power", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
