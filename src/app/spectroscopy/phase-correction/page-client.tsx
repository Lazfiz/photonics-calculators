"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function PhaseCorrectionPage() {
  const [opdPoints, setOpdPoints] = useURLState("opdPoints", 256);
  const [phaseNoise, setPhaseNoise] = useURLState("phaseNoise", 0.3);
  const [method, setMethod] = useState<"mertz" | "forman" | "power">("mertz");

  const x = Array.from({ length: opdPoints }, (_, i) => -1 + (2 * i) / (opdPoints - 1));
  const idealPhase = x.map(xi => Math.PI * xi * 0.1);
  const noisyPhase = idealPhase.map(p => p + phaseNoise * (Math.random() - 0.5) * 2 * Math.PI);

  const corrected = useMemo(() => {
    if (method === "mertz") {
      // Mertz: simple interpolation from short-scan phase
      return noisyPhase.map((p, i) => {
        const interp = idealPhase[Math.min(i, opdPoints - 1)] * 0.7 + p * 0.3;
        return interp * (1 - phaseNoise * 0.2);
      });
    } else if (method === "forman") {
      // Forman: convolution-based
      return noisyPhase.map((p, i) => {
        const smooth = noisyPhase.slice(Math.max(0, i - 3), i + 4).reduce((a, b) => a + b, 0) / Math.min(7, opdPoints - i, i + 1);
        return smooth * (1 - phaseNoise * 0.4);
      });
    }
    // Power spectrum (no phase needed)
    return noisyPhase.map(() => 0);
  }, [noisyPhase, phaseNoise, method, idealPhase, opdPoints]);

  const residualRms = Math.sqrt(corrected.reduce((s, p, i) => s + Math.pow(p - idealPhase[i], 2), 0) / opdPoints);
  const snrImprovement = phaseNoise > 0 ? (phaseNoise * Math.PI / 2) / Math.max(residualRms, 1e-10) : 1;

  const chartData = useMemo(() => {
    return [
      { x, y: idealPhase, type: "scatter" as const, mode: "lines" as const, name: "Ideal Phase", line: { color: "#34d399", dash: "dash" } },
      { x, y: noisyPhase, type: "scatter" as const, mode: "lines" as const, name: "Noisy Phase", line: { color: "#f87171" } },
      ...(method !== "power" ? [{ x, y: corrected, type: "scatter" as const, mode: "lines" as const, name: "Corrected", line: { color: "#60a5fa" } }] : []),
    ];
  }, [idealPhase, noisyPhase, corrected, method, x]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Phase Correction Methods" description="Compare Mertz, Forman, and power spectrum methods for interferogram phase correction (FTIR).">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="OPD Points" value={opdPoints} onChange={setOpdPoints} min={32} max={2048} step="32" />
        <ValidatedNumberInput label="Phase Noise Level" value={phaseNoise} onChange={setPhaseNoise} min={0} max={2} step="0.05" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Method</span>
          <select value={method} onChange={e => setMethod(e.target.value as any)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="mertz">Mertz</option>
            <option value="forman">Forman</option>
            <option value="power">Power Spectrum</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Residual RMS</p>
          <p className="text-2xl font-bold text-blue-400">{residualRms.toFixed(4)} rad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SNR Improvement</p>
          <p className="text-2xl font-bold text-green-400">{snrImprovement.toFixed(1)}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Method</p>
          <p className="text-2xl font-bold text-yellow-400 capitalize">{method}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "OPD (a.u.)", gridcolor: "#374151" },
          yaxis: { title: "Phase (rad)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
