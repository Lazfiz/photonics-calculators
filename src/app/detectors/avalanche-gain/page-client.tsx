"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";

const materialParams: Record<string, { k: number; n: number; label: string }> = {
  Si: { k: 0.02, n: 3.5, label: "Silicon" },
  InGaAs: { k: 0.45, n: 2.5, label: "InGaAs" },
  Ge: { k: 0.6, n: 2, label: "Germanium" },
};

export default function AvalancheGainPage() {
  const [breakdownVoltage, setBreakdownVoltage] = useState(150);
  const [biasVoltage, setBiasVoltage] = useState(140);
  const [ionizationRatio, setIonizationRatio] = useState(0.02);
  const [material, setMaterial] = useState<"Si" | "InGaAs" | "Ge">("Si");

  const handleMaterialChange = (m: "Si" | "InGaAs" | "Ge") => {
    setMaterial(m);
    setIonizationRatio(materialParams[m].k);
  };

  const n = materialParams[material].n;
  const k = ionizationRatio;
  const voltageRatio = biasVoltage / breakdownVoltage;
  const gain = voltageRatio < 1 ? 1 / Math.pow(1 - voltageRatio, n) : Infinity;
  const excessNoise = gain > 1 ? k * gain + (1 - k) * (2 - 1 / gain) : 1;
  const noiseGain = gain > 1 ? Math.sqrt(excessNoise) * gain : 1;

  const gainVsVoltage = useMemo(() => {
    const vratios = Array.from({ length: 200 }, (_, i) => 0.5 + i * 0.498 / 200);
    return [{ x: vratios.map(r => r * breakdownVoltage), y: vratios.map(r => 1 / Math.pow(1 - r, n)), type: "scatter" as const, mode: "lines" as const, name: "Gain M", line: { color: "#60a5fa", width: 2 } }];
  }, [breakdownVoltage, n]);

  const noiseVsGain = useMemo(() => {
    const M = Array.from({ length: 200 }, (_, i) => 1 + i * 199 / 200);
    return [
      { x: M, y: M.map(m => k * m + (1 - k) * (2 - 1 / m)), type: "scatter" as const, mode: "lines" as const, name: "McIntyre F(M)", line: { color: "#f87171", width: 2 } },
      { x: M, y: M.map(m => Math.pow(m, k)), type: "scatter" as const, mode: "lines" as const, name: "F = M^k (approx)", line: { color: "#fbbf24", width: 2, dash: "dash" as const } },
    ];
  }, [k]);

  const comparisonChart = useMemo(() => {
    const M = Array.from({ length: 200 }, (_, i) => 1 + i * 99 / 200);
    return [
      { x: M, y: M.map(m => 0.02 * m + 0.98 * (2 - 1/m)), type: "scatter" as const, mode: "lines" as const, name: "Si (k=0.02)", line: { color: "#60a5fa", width: 2 } },
      { x: M, y: M.map(m => 0.45 * m + 0.55 * (2 - 1/m)), type: "scatter" as const, mode: "lines" as const, name: "InGaAs (k=0.45)", line: { color: "#34d399", width: 2 } },
      { x: M, y: M.map(m => 0.6 * m + 0.4 * (2 - 1/m)), type: "scatter" as const, mode: "lines" as const, name: "Ge (k=0.6)", line: { color: "#f87171", width: 2 } },
    ];
  }, []);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Avalanche Photodiode Gain" description="APD multiplication gain, excess noise factor (McIntyre), and material comparison." maxWidthClassName="max-w-5xl">
      <div className="flex gap-2 mb-6">
        {(["Si", "InGaAs", "Ge"] as const).map(m => (
          <button key={m} onClick={() => handleMaterialChange(m)} className={`px-4 py-2 rounded text-sm font-medium ${material === m ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>{materialParams[m].label}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Breakdown Voltage (V)" value={breakdownVoltage} onChange={setBreakdownVoltage} min={10} step="1" />
        <ValidatedNumberInput label="Bias Voltage (V)" value={biasVoltage} onChange={setBiasVoltage} min={1} step="1" />
        <ValidatedNumberInput label="Ionization Ratio k" value={ionizationRatio} onChange={setIonizationRatio} min={0.001} max={1} step="0.01" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="V/V_br" value={voltageRatio.toFixed(4)} tone="blue" />
        <ResultCard label="Gain M" value={gain > 1e6 ? "∞ (breakdown)" : gain.toFixed(1)} tone="green" />
        <ResultCard label="Excess Noise F" value={excessNoise.toFixed(3)} tone="yellow" />
        <ResultCard label="Noise Gain (√F·M)" value={noiseGain > 1e6 ? "∞" : noiseGain.toFixed(1)} tone="red" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChartPanel data={gainVsVoltage} layout={{ xaxis: { title: "Bias Voltage (V)", gridcolor: "#374151" }, yaxis: { title: "Gain M", type: "log", gridcolor: "#374151" } }} title="Gain vs Bias" />
        <ChartPanel data={noiseVsGain} layout={{ xaxis: { title: "Gain M", gridcolor: "#374151" }, yaxis: { title: "Excess Noise F", gridcolor: "#374151" } }} title="Excess Noise vs Gain" />
        <div className="md:col-span-2">
          <ChartPanel data={comparisonChart} layout={{ xaxis: { title: "Gain M", gridcolor: "#374151" }, yaxis: { title: "Excess Noise F", gridcolor: "#374151" } }} title="Material Comparison" />
        </div>
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 font-mono space-y-1"><p>M = 1 / (1 - V/V_br)^n</p><p>F(M) = k·M + (1-k)·(2 - 1/M)  [McIntyre]</p></div>
    </CalculatorShell>
  );
}
