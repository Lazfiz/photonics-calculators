"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
export default function MicrochannelPlatePage() {
  const [numPlates, setNumPlates] = useState(2);
  const [channelDiameter, setChannelDiameter] = useState(10); // µm
  const [channelLength, setChannelLength] = useState(0.5); // mm
  const [openAreaRatio, setOpenAreaRatio] = useState(0.6);
  const [biasAngle, setBiasAngle] = useState(8); // degrees
  const [appliedVoltage, setAppliedVoltage] = useState(1000); // V per plate

  const results = useMemo(() => {
    const ldr = channelLength * 1000 / channelDiameter; // L/D ratio
    const singlePlateGain = Math.pow(10, 2.5 + 0.05 * (appliedVoltage / 100 - 8)); // empirical
    const totalGain = Math.pow(singlePlateGain, numPlates);
    const spatialRes = channelDiameter * 1.2; // µm
    const openArea = openAreaRatio * 100;
    const effectiveQE = openAreaRatio * 0.15; // photocathode + open area
    const temporalRes = 80 + 20 * numPlates; // ps, rough
    return { ldr, singlePlateGain, totalGain, spatialRes, openArea, effectiveQE, temporalRes };
  }, [numPlates, channelDiameter, channelLength, openAreaRatio, biasAngle, appliedVoltage]);

  const chartData = useMemo(() => {
    const voltages = Array.from({ length: 100 }, (_, i) => 500 + i * 10);
    const gains1 = voltages.map(v => Math.pow(10, 2.5 + 0.05 * (v / 100 - 8)));
    const gains2 = gains1.map(g => g * g);
    const ldrs = [channelLength * 1000 / channelDiameter];
    return [
      { x: voltages, y: gains1, type: "scatter", mode: "lines", name: "Single plate gain", line: { color: "#60a5fa" } },
      { x: voltages, y: gains2, type: "scatter", mode: "lines", name: "Dual plate gain", line: { color: "#f87171" } },
    ];
  }, [appliedVoltage, channelDiameter, channelLength]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Number of Plates (chevron/Z)" value={numPlates} onChange={setNumPlates} min={1} max={3} />
        <ValidatedNumberInput label="Channel Diameter (µm)" value={channelDiameter} onChange={setChannelDiameter} />
        <ValidatedNumberInput label="Channel Length (mm)" value={channelLength} onChange={setChannelLength} step="0.1" />
        <ValidatedNumberInput label="Open Area Ratio" value={openAreaRatio} onChange={setOpenAreaRatio} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Bias Angle (°)" value={biasAngle} onChange={setBiasAngle} />
        <ValidatedNumberInput label="Voltage per Plate (V)" value={appliedVoltage} onChange={setAppliedVoltage} step="50" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">L/D ratio = <span className="text-blue-400 font-mono">{results.ldr.toFixed(1)}</span></p>
        <p className="text-gray-300">Single plate gain = <span className="text-blue-400 font-mono">{results.singlePlateGain.toExponential(2)}</span></p>
        <p className="text-gray-300">Total gain ({numPlates} plates) = <span className="text-blue-400 font-mono">{results.totalGain.toExponential(2)}</span></p>
        <p className="text-gray-300">Spatial resolution ≈ <span className="text-blue-400 font-mono">{results.spatialRes.toFixed(1)} µm</span></p>
        <p className="text-gray-300">Open area = <span className="text-blue-400 font-mono">{results.openArea.toFixed(0)}%</span></p>
        <p className="text-gray-300">Effective detection QE ≈ <span className="text-blue-400 font-mono">{(results.effectiveQE * 100).toFixed(1)}%</span></p>
        <p className="text-gray-300">Temporal resolution ≈ <span className="text-blue-400 font-mono">{results.temporalRes} ps</span></p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>L/D = channel length / channel diameter</p>
        <p>G ≈ 10^(2.5 + 0.05·(V/100 - 8))  [empirical per plate]</p>
        <p>G<sub>total</sub> = G<sub>plate</sub>^N</p>
        <p>Spatial res. ≈ 1.2 × d<sub>channel</sub></p>
        <p>η<sub>eff</sub> = η<sub>cathode</sub> × ε<sub>open</sub></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Voltage per Plate (V)", gridcolor: "#374151" },
        yaxis: { title: "Gain", type: "log", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} />
    </div>
  );
}
