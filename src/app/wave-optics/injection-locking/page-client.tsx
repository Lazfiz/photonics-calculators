"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function InjectionLockingPage() {
  const [masterPower, setMasterPower] = useState(10); // mW
  const [slavePower, setSlavePower] = useState(1000); // mW
  const [lockingBW, setLockingBW] = useState(10); // MHz

  const chartData = useMemo(() => {
    const f = Array.from({ length: 200 }, (_, i) => -50 + i * 0.5); // MHz offset
    const lockingRange = Math.sqrt(masterPower / slavePower) * lockingBW;
    const phaseNoise = f.map(fi => {
      const inLock = Math.abs(fi) < lockingRange;
      return inLock ? -60 : -30;
    });
    
    return [
      { x: f, y: phaseNoise, type: "scatter" as const, mode: "lines" as const, name: "Phase Noise", line: { color: "#60a5fa" } },
    ];
  }, [masterPower, slavePower, lockingBW]);

  const lockingRange = Math.sqrt(masterPower / slavePower) * lockingBW;

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Injection Locking" description="Phase-locking a slave laser to a master laser through optical injection.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Master Power (mW)" value={masterPower} onChange={setMasterPower} step="1" />
        <ValidatedNumberInput label="Slave Power (mW)" value={slavePower} onChange={setSlavePower} step="10" />
        <ValidatedNumberInput label="Locking BW (MHz)" value={lockingBW} onChange={setLockingBW} step="1" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Locking Range: <span className="text-blue-400 font-mono">{lockingRange.toFixed(2)} MHz</span></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { title: "Frequency Offset (MHz)", gridcolor: "#374151" },
        yaxis: { title: "Phase Noise (dBc/Hz)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true
      }} />
    </CalculatorShell>
  );
}
