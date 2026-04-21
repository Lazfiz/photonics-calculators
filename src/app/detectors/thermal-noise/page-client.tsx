"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function ThermalNoisePage() {
  const [resistance, setResistance] = useURLState("resistance", 1000); // Ohms
  const [temperature, setTemperature] = useURLState("temperature", 300); // K
  const [bandwidth, setBandwidth] = useURLState("bandwidth", 1e6); // Hz
  const [kB] = useState(1.381e-23); // J/K

  const chartData = useMemo(() => {
    const resistances = Array.from({ length: 200 }, (_, i) => 10 * Math.pow(1e5, i / 200));
    const vNoise = resistances.map(R => Math.sqrt(4 * kB * temperature * R * bandwidth));
    return [{ x: resistances, y: vNoise, type: "scatter" as const, mode: "lines" as const, name: "RMS noise voltage", line: { color: "#60a5fa" } }];
  }, [resistance, temperature, bandwidth]);

  const vNoise = Math.sqrt(4 * kB * temperature * resistance * bandwidth);
  const iNoise = vNoise / resistance;
  const pNoise = kB * temperature * bandwidth; // available noise power (matched load)

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Johnson (Thermal) Noise" description="vn = √(4kBTRΔf). Thermal noise voltage across a resistor.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Resistance (Ω)" value={resistance} onChange={setResistance} />
        <ValidatedNumberInput label="Temperature (K)" value={temperature} onChange={setTemperature} />
        <ValidatedNumberInput label="Bandwidth (Hz)" value={bandwidth} onChange={setBandwidth} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300">RMS noise voltage = <span className="text-blue-400 font-mono">{vNoise.toExponential(3)} V</span></p>
        <p className="text-gray-300">RMS noise current = <span className="text-blue-400 font-mono">{iNoise.toExponential(3)} A</span></p>
        <p className="text-gray-300">Noise power = <span className="text-blue-400 font-mono">{pNoise.toExponential(3)} W</span></p>
        <p className="text-gray-300">Noise temp equiv = <span className="text-blue-400 font-mono">{temperature} K</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Resistance (Ω)", type: "log", gridcolor: "#374151" }, yaxis: { title: "Noise Voltage (V)", type: "log", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 70, r: 20 }, autosize: true }} />
    </CalculatorShell>
  );
}
