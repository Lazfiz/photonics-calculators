"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";

const gradingExponent: Record<string, number> = { abrupt: 0.5, graded: 0.33, hyperabrupt: 0.75 };

export default function CapacitancePage() {
  const [zeroBiasCap, setZeroBiasCap] = useState(10);
  const [builtInVoltage, setBuiltInVoltage] = useState(0.6);
  const [reverseBias, setReverseBias] = useState(5);
  const [gradingProfile, setGradingProfile] = useState<"abrupt" | "graded" | "hyperabrupt">("abrupt");
  const [loadResistance, setLoadResistance] = useState(50);
  const [seriesResistance, setSeriesResistance] = useState(10);

  const m = gradingExponent[gradingProfile];
  const capacitance = zeroBiasCap / Math.pow(1 + reverseBias / builtInVoltage, m);
  const totalResistance = loadResistance + seriesResistance;
  const rcBandwidth = 1 / (2 * Math.PI * totalResistance * capacitance * 1e-12);
  const rcTime = totalResistance * capacitance * 1e-12 * 1e9;

  const capVsBias = useMemo(() => {
    const vr = Array.from({ length: 200 }, (_, i) => 0.01 + i * 20 / 200);
    return [
      { x: vr, y: vr.map(v => zeroBiasCap / Math.pow(1 + v / builtInVoltage, 0.5)), type: "scatter" as const, mode: "lines" as const, name: "Abrupt (m=0.5)", line: { color: "#60a5fa", width: 2 } },
      { x: vr, y: vr.map(v => zeroBiasCap / Math.pow(1 + v / builtInVoltage, 0.33)), type: "scatter" as const, mode: "lines" as const, name: "Graded (m=0.33)", line: { color: "#34d399", width: 2 } },
      { x: vr, y: vr.map(v => zeroBiasCap / Math.pow(1 + v / builtInVoltage, 0.75)), type: "scatter" as const, mode: "lines" as const, name: "Hyper-abrupt (m=0.75)", line: { color: "#f87171", width: 2 } },
    ];
  }, [zeroBiasCap, builtInVoltage]);

  const bwVsBias = useMemo(() => {
    const vr = Array.from({ length: 200 }, (_, i) => 0.01 + i * 20 / 200);
    return [
      { x: vr, y: vr.map(v => 1 / (2 * Math.PI * totalResistance * (zeroBiasCap / Math.pow(1 + v / builtInVoltage, m)) * 1e-12) / 1e6), type: "scatter" as const, mode: "lines" as const, name: "RC Bandwidth", line: { color: "#fbbf24", width: 2 } },
    ];
  }, [zeroBiasCap, builtInVoltage, totalResistance, m]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Junction Capacitance" description="Photodiode junction capacitance vs reverse bias, doping profile, and RC bandwidth impact." maxWidthClassName="max-w-5xl">
      <div className="flex gap-2 mb-6">
        {(["abrupt", "graded", "hyperabrupt"] as const).map(p => (
          <button key={p} onClick={() => setGradingProfile(p)} className={`px-4 py-2 rounded text-sm font-medium capitalize ${gradingProfile === p ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>{p}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Zero-Bias Cap (pF)" value={zeroBiasCap} onChange={setZeroBiasCap} min={0.1} step="0.5" />
        <ValidatedNumberInput label="Built-in Voltage (V)" value={builtInVoltage} onChange={setBuiltInVoltage} min={0.1} step="0.05" />
        <ValidatedNumberInput label="Reverse Bias (V)" value={reverseBias} onChange={setReverseBias} min={0} step="0.5" />
        <ValidatedNumberInput label="Load R (Ω)" value={loadResistance} onChange={setLoadResistance} min={1} step="10" />
        <ValidatedNumberInput label="Series R (Ω)" value={seriesResistance} onChange={setSeriesResistance} min={0} step="1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Junction Capacitance" value={`${capacitance.toFixed(2)} pF`} tone="green" />
        <ResultCard label="RC Bandwidth" value={rcBandwidth > 1e9 ? `${(rcBandwidth / 1e9).toFixed(2)} GHz` : `${(rcBandwidth / 1e6).toFixed(1)} MHz`} tone="blue" />
        <ResultCard label="RC Time Constant" value={`${rcTime.toFixed(2)} ns`} tone="yellow" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChartPanel data={capVsBias} layout={{ xaxis: { title: "Reverse Bias (V)", gridcolor: "#374151" }, yaxis: { title: "C_j (pF)", gridcolor: "#374151" } }} title="Capacitance vs Bias" />
        <ChartPanel data={bwVsBias} layout={{ xaxis: { title: "Reverse Bias (V)", gridcolor: "#374151" }, yaxis: { title: "f_3dB (MHz)", gridcolor: "#374151" } }} title="Bandwidth vs Bias" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 font-mono space-y-1"><p>C_j = C_j0 / (1 + V_R/V_bi)^m</p><p>f_3dB = 1 / (2π·(R_L + R_s)·C_j)</p></div>
    </CalculatorShell>
  );
}
