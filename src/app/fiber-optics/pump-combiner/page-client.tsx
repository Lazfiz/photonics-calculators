"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
export default function PumpCombinerCalculator() {
  const [numPumpPorts, setNumPumpPorts] = useState(6);
  const [pumpWavelength, setPumpWavelength] = useState(976); // nm
  const [pumpPowerPerPort, setPumpPowerPerPort] = useState(300); // W
  const [combinerEfficiency, setCombinerEfficiency] = useState(98); // %
  const [signalInsertionLoss, setSignalInsertionLoss] = useState(0.1); // dB
  const [pumpNA, setPumpNA] = useState(0.46);
  const [signalNA, setSignalNA] = useState(0.06);
  const [fiberModeField, setFiberModeField] = useState(10.4); // µm
  const [pumpFiberCore, setPumpFiberCore] = useState(105); // µm

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

  // Brightness conservation check
  const brightnessRatio = useMemo(() => {
    // P_combined / P_total vs signal/pump NA ratio
    const naRatio = (signalNA / pumpNA) ** 2;
    const maxEff = naRatio * numPumpPorts / 1; // simplified
    return naRatio;
  }, [signalNA, pumpNA, numPumpPorts]);

  // Power budget
  const powerBudget = useMemo(() => {
    const losses: { label: string; value: number }[] = [];
    losses.push({ label: "Pump per port", value: pumpPowerPerPort });
    losses.push({ label: "Combiner efficiency loss", value: totalPumpPower - combinedPumpPower });
    losses.push({ label: "Signal insertion loss", value: signalInsertionLoss });
    return losses;
  }, [pumpPowerPerPort, totalPumpPower, combinedPumpPower, signalInsertionLoss]);

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
      { x: ["Per Port", "Combined\nInput", "Combined\nOutput"], y: [pumpPowerPerPort, totalPumpPower, combinedPumpPower], type: "bar" as const, marker: { color: ["#3b82f6", "#f59e0b", "#10b981"] } },
    ];
  }, [pumpPowerPerPort, totalPumpPower, combinedPumpPower]);

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
              <input type="number" value={numPumpPorts} onChange={(e) => setNumPumpPorts(Math.max(1, Math.min(20, Number(e.target.value))))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pump Wavelength (nm)</label>
              <input type="number" value={pumpWavelength} onChange={(e) => setPumpWavelength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pump Power per Port (W)</label>
              <input type="number" value={pumpPowerPerPort} onChange={(e) => setPumpPowerPerPort(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Combiner Efficiency (%)</label>
              <input type="number" value={combinerEfficiency} onChange={(e) => setCombinerEfficiency(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Signal Insertion Loss (dB)</label>
              <input type="number" value={signalInsertionLoss} onChange={(e) => setSignalInsertionLoss(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.01" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Pump NA</label>
                <input type="number" value={pumpNA} onChange={(e) => setPumpNA(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Signal NA</label>
                <input type="number" value={signalNA} onChange={(e) => setSignalNA(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.01" />
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
                <div className="flex justify-between"><span className="text-gray-400">NA² ratio (sig/pump):</span><span className="font-mono">{brightnessRatio.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Signal insertion loss:</span><span className="font-mono">{signalInsertionLoss.toFixed(2)} dB</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">P_comb = N · P_pump · η_comb</p>
              <p className="font-mono text-sm mt-1">B = P / (π · NA²)</p>
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
