"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function AntibloomingPage() {
  const [wellCapacity, setWellCapacity] = useURLState("wellCapacity", 50000);
  const [abThreshold, setAbThreshold] = useURLState("abThreshold", 0.8);
  const [excessCharge, setExcessCharge] = useURLState("excessCharge", 20000);
  const [chargeDumpEfficiency, setChargeDumpEfficiency] = useURLState("chargeDumpEfficiency", 0.99);

  const chartData = useMemo(() => {
    const incidentElectrons = Array.from({ length: 200 }, (_, i) => (i + 1) * 1000);
    const threshold = wellCapacity * abThreshold;
    // AB dumps excess charge to drain. Only (1-efficiency) fraction leaks into the well.
    // Collected = threshold + excess × leak_fraction, capped at well capacity
    // Note: real AB circuits have gradual onset; this uses a hard-threshold approximation.
    const collected = incidentElectrons.map(n => {
      if (n <= threshold) return n;
      const leaked = (n - threshold) * (1 - chargeDumpEfficiency);
      return Math.min(threshold + leaked, wellCapacity);
    });
    const collectionEff = incidentElectrons.map((n, i) => {
      if (n === 0) return 100;
      return 100 * collected[i] / n;
    });
    return [
      { x: incidentElectrons, y: collected, type: "scatter" as const, mode: "lines" as const, name: "Collected (e⁻)", line: { color: "#34d399" }, yaxis: "y" },
      { x: incidentElectrons, y: collectionEff, type: "scatter" as const, mode: "lines" as const, name: "Collection Eff. (%)", line: { color: "#f87171" }, yaxis: "y2" },
    ];
  }, [wellCapacity, abThreshold, chargeDumpEfficiency]);

  const thresholdElectrons = wellCapacity * abThreshold;
  const dumpedCharge = excessCharge * chargeDumpEfficiency;
  const leakedCharge = excessCharge * (1 - chargeDumpEfficiency);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Anti-Blooming Design" description="Anti-blooming shunts excess charge to drain when well exceeds threshold. Trade-off: charge dump efficiency vs full well capacity and linearity.">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Full well capacity (e⁻)" value={wellCapacity} onChange={setWellCapacity} step="1000" min={1000} />
        <ValidatedNumberInput label="AB threshold (fraction of well)" value={abThreshold} onChange={setAbThreshold} min={0} max={1} step="0.05" />
        <ValidatedNumberInput label="Excess charge above threshold (e⁻)" value={excessCharge} onChange={setExcessCharge} step="1000" min={0} />
        <ValidatedNumberInput label="Dump efficiency" value={chargeDumpEfficiency} onChange={setChargeDumpEfficiency} min={0} max={1} step="0.01" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="AB Threshold" value={`${thresholdElectrons.toFixed(0)} e⁻`} tone="blue" />
        <ResultCard label="Full Well Capacity" value={`${wellCapacity.toFixed(0)} e⁻`} tone="green" />
        <ResultCard label="Dumped Charge" value={`${dumpedCharge.toFixed(0)} e⁻`} tone="yellow" />
        <ResultCard label="Leaked Charge (in well)" value={`${leakedCharge.toFixed(0)} e⁻`} tone="red" />
      </div>
      <ResultCard label="Capacity Reserved for AB" value={`${((1 - abThreshold) * 100).toFixed(0)}%`} tone="purple" />
      <div className="bg-gray-900 rounded-lg p-4 mt-6 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>Below threshold: all charge collected linearly</p>
        <p>Above threshold: linearity is lost; excess × (1 − η) leaks into well; rest shunted to drain</p>
        <p>Note: real AB circuits have gradual onset — this uses a hard-threshold approximation</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Incident electrons (e⁻)", gridcolor: "#374151" }, yaxis: { title: "Collected (e⁻)", gridcolor: "#374151" }, yaxis2: { title: "Collection Efficiency (%)", gridcolor: "#374151", overlaying: "y", side: "right" } }} />
    </CalculatorShell>
  );
}
