"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function PumpCombinerCalculator() {
  const [numPumpPorts, setNumPumpPorts] = useURLState("numPumpPorts", 6);
  const [pumpWavelength, setPumpWavelength] = useURLState("pumpWavelength", 976); // nm
  const [pumpPowerPerPort, setPumpPowerPerPort] = useURLState("pumpPowerPerPort", 300); // W
  const [combinerEfficiency, setCombinerEfficiency] = useURLState("combinerEfficiency", 98); // %
  const [signalInsertionLoss, setSignalInsertionLoss] = useURLState("signalInsertionLoss", 0.1); // dB
  const [pumpNA, setPumpNA] = useURLState("pumpNA", 0.46);
  const [signalNA, setSignalNA] = useURLState("signalNA", 0.06);

  // Total pump power
  const totalPumpPower = numPumpPorts * pumpPowerPerPort;

  // Combined pump power (after combiner)
  const combinedPumpPower = totalPumpPower * combinerEfficiency / 100;

  // Pump brightness
  const pumpBrightness = useMemo(() => {
    // B = P / (π·NA²)  (W/sr)
    const NA = pumpNA;
    return pumpPowerPerPort / (Math.PI * NA ** 2);
  }, [pumpPowerPerPort, pumpNA]);

  // Brightness conservation check: (NA_sig/NA_pump)² ≥ N/η for feasible combining
  const brightnessRatio = useMemo(() => {
    const naRatio = (signalNA / pumpNA) ** 2;
    const requiredRatio = numPumpPorts / (combinerEfficiency / 100);
    return { naRatio, requiredRatio, feasible: naRatio >= requiredRatio };
  }, [signalNA, pumpNA, numPumpPorts, combinerEfficiency]);

  // Power budget
  const powerBudget = useMemo(() => {
    return [
      { label: "Pump per port", value: pumpPowerPerPort },
      { label: "Total pump input", value: totalPumpPower },
      { label: "Combiner output", value: combinedPumpPower },
      { label: "Combiner loss", value: totalPumpPower - combinedPumpPower },
    ];
  }, [pumpPowerPerPort, totalPumpPower, combinedPumpPower]);

  // Efficiency vs number of pump ports
  const efficiencyCurve = useMemo(() => {
    const ports: number[] = [];
    const powers: number[] = [];
    for (let n = 1; n <= 12; n++) {
      ports.push(n);
      // Efficiency typically drops slightly with more ports
      const eff = combinerEfficiency - (n - 1) * 0.3;
      powers.push(n * pumpPowerPerPort * Math.max(eff, 80) / 100);
    }
    return [
      { x: ports, y: powers, type: "scatter" as const, mode: "lines+markers" as const, name: "Combined Power (W)", line: { color: "#f59e0b", width: 2 }, yaxis: "y" },
      { x: ports, y: ports.map(n => n * pumpPowerPerPort), type: "scatter" as const, mode: "lines" as const, name: "Input Power (W)", line: { color: "#6b7280", width: 1, dash: "dash" }, yaxis: "y" },
    ];
  }, [pumpPowerPerPort, combinerEfficiency]);

  // Power bar chart
  const powerBar = useMemo(() => {
    return [
      { x: powerBudget.map(b => b.label), y: powerBudget.map(b => b.value), type: "bar" as const, marker: { color: ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"] } },
    ];
  }, [powerBudget]);

  const layout1 = {
    title: "Combined Power vs Number of Pump Ports",
    xaxis: { title: "Number of Pump Ports", gridcolor: "#374151", dtick: 1 },
    yaxis: { title: "Power (W)", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
  };

  const layout2 = {
    title: "Power Budget",
    yaxis: { title: "Power (W)", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: false, height: 380,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
                
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Pump Ports</label>
              <ValidatedNumberInput label="Number of Pump Ports" value={numPumpPorts} onChange={setNumPumpPorts} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pump Wavelength (nm)</label>
              <ValidatedNumberInput label="Pump Wavelength (nm)" value={pumpWavelength} onChange={setPumpWavelength} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pump Power per Port (W)</label>
              <ValidatedNumberInput label="Pump Power per Port (W)" value={pumpPowerPerPort} onChange={setPumpPowerPerPort} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Combiner Efficiency (%)</label>
              <ValidatedNumberInput label="Combiner Efficiency (%)" value={combinerEfficiency} onChange={setCombinerEfficiency} step="0.5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Signal Insertion Loss (dB)</label>
              <ValidatedNumberInput label="Signal Insertion Loss (dB)" value={signalInsertionLoss} onChange={setSignalInsertionLoss} step="0.01" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Pump NA</label>
                <ValidatedNumberInput label="Pump NA" value={pumpNA} onChange={setPumpNA} step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Signal NA</label>
                <ValidatedNumberInput label="Signal NA" value={signalNA} onChange={setSignalNA} step="0.01" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Total input pump power:</span><span className="font-mono">{totalPumpPower.toFixed(0)} W</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Combined pump power:</span><span className="font-mono text-green-400 text-lg">{combinedPumpPower.toFixed(1)} W</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Power lost in combiner:</span><span className="font-mono text-red-400">{(totalPumpPower - combinedPumpPower).toFixed(1)} W</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Pump brightness:</span><span className="font-mono">{pumpBrightness.toFixed(0)} W/sr</span></div>
                <div className="flex justify-between"><span className="text-gray-400">NA² ratio (sig/pump):</span><span className="font-mono">{brightnessRatio.naRatio.toFixed(4)} <span className="text-xs">/ need ≥{brightnessRatio.requiredRatio.toFixed(4)}</span></span></div>
                <div className="flex justify-between"><span className="text-gray-400">Brightness feasible:</span><span className={`font-mono ${brightnessRatio.feasible ? "text-green-400" : "text-red-400"}`}>{brightnessRatio.feasible ? "✓ Yes" : "✗ No"}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Signal insertion loss:</span><span className="font-mono">{signalInsertionLoss.toFixed(2)} dB</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">P_comb = N · P_pump · η_comb</p>
              <p className="font-mono text-sm mt-1">B = P / (π · NA²) [W/sr]</p>
              <p className="font-mono text-sm mt-1">NA_match: (NA_sig/NA_pump)² ≥ N/η</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <ChartPanel data={efficiencyCurve} layout={layout1} />
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <ChartPanel data={powerBar} layout={layout2} />
          </div>
        </div>
      </div>
    </div>
  );
}
