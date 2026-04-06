"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";

export default function AntibloomingPage() {
  const [wellCapacity, setWellCapacity] = useState(50000);
  const [abThreshold, setAbThreshold] = useState(0.8);
  const [excessCharge, setExcessCharge] = useState(20000);
  const [chargeDumpEfficiency, setChargeDumpEfficiency] = useState(0.99);

  const chartData = useMemo(() => {
    const incidentElectrons = Array.from({ length: 200 }, (_, i) => (i + 1) * 1000);
    const threshold = wellCapacity * abThreshold;
    const collected = incidentElectrons.map(n => Math.min(n, wellCapacity));
    const linearity = incidentElectrons.map(n => {
      if (n <= threshold) return 100;
      return 100 * (threshold + (n - threshold) * chargeDumpEfficiency) / n;
    });
    return [
      { x: incidentElectrons, y: collected, type: "scatter" as const, mode: "lines" as const, name: "Collected (e⁻)", line: { color: "#34d399" }, yaxis: "y" },
      { x: incidentElectrons, y: linearity, type: "scatter" as const, mode: "lines" as const, name: "Linearity (%)", line: { color: "#f87171" }, yaxis: "y2" },
    ];
  }, [wellCapacity, abThreshold, excessCharge, chargeDumpEfficiency]);

  const thresholdElectrons = wellCapacity * abThreshold;
  const dumpedCharge = excessCharge * chargeDumpEfficiency;
  const leakedCharge = excessCharge * (1 - chargeDumpEfficiency);
  const maxLinearSignal = wellCapacity * abThreshold;

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Anti-Blooming Design" description="Anti-blooming shunts excess charge to drain when well exceeds threshold. Trade-off: charge dump efficiency vs full well capacity and linearity.">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Full well capacity (e⁻)" value={wellCapacity} onChange={setWellCapacity} step="1000" />
        <ValidatedNumberInput label="AB threshold (fraction)" value={abThreshold} onChange={setAbThreshold} min={0} max={1} step="0.05" />
        <ValidatedNumberInput label="Excess charge (e⁻)" value={excessCharge} onChange={setExcessCharge} step="1000" />
        <ValidatedNumberInput label="Dump efficiency" value={chargeDumpEfficiency} onChange={setChargeDumpEfficiency} min={0} max={1} step="0.01" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="AB Threshold" value={`${thresholdElectrons.toFixed(0)} e⁻`} tone="blue" />
        <ResultCard label="Max Linear Signal" value={`${maxLinearSignal.toFixed(0)} e⁻`} tone="green" />
        <ResultCard label="Dumped Charge" value={`${dumpedCharge.toFixed(0)} e⁻`} tone="yellow" />
        <ResultCard label="Leaked (Blooming)" value={`${leakedCharge.toFixed(0)} e⁻`} tone="red" />
      </div>
      <ResultCard label="Capacity Loss" value={`${((1 - abThreshold) * 100).toFixed(0)}%`} tone="purple" />
      <div className="mt-6" />
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Incident electrons (e⁻)", gridcolor: "#374151" }, yaxis: { title: "Collected (e⁻)", gridcolor: "#374151" }, yaxis2: { title: "Linearity (%)", gridcolor: "#374151", overlaying: "y", side: "right" } }} />
    </CalculatorShell>
  );
}
