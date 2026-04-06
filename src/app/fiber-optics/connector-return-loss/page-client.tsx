"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function ConnectorReturnLossPage() {
  const [connectorType, setConnectorType] = useState("pc");
  const [n1, setN1] = useState(1.4682);
  const [n2, setN2] = useState(1.0);
  const [wavelength, setWavelength] = useState(1550);

  const fresnelRL = -10 * Math.log10(Math.pow((n1 - n2) / (n1 + n2), 2));
  const connectorRL: Record<string, number> = { pc: 40, upc: 50, apc: 60, flat: 14 };
  const totalRL = connectorRL[connectorType] || 40;
  const reflectivity = Math.pow(10, -totalRL / 10);
  const reflectedPower = reflectivity * 100;

  const chartData = useMemo(() => {
    const ns = Array.from({ length: 100 }, (_, i) => 1.0 + i * 0.01);
    return [
      { x: ns, y: ns.map(n => -10 * Math.log10(Math.pow((n1 - n) / (n1 + n), 2))), type: "scatter" as const, mode: "lines" as const, name: "Fresnel RL", line: { color: "#f87171" } },
      { x: [n2], y: [fresnelRL], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#60a5fa", size: 12 } },
    ];
  }, [n1, n2, fresnelRL]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Connector Return Loss" description="Calculate return loss (ORL) from fiber connectors based on polish type and index mismatch.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Connector Type</span>
          <select value={connectorType} onChange={e => setConnectorType(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="flat">Flat</option>
            <option value="pc">PC</option>
            <option value="upc">UPC</option>
            <option value="apc">APC</option>
          </select>
        </label>
        <ValidatedNumberInput label="Fiber Core Index" value={n1} onChange={setN1} min={1.0} max={2.0} step="0.001" />
        <ValidatedNumberInput label="External Index" value={n2} onChange={setN2} min={1.0} max={2.0} step="0.001" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={2000} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Return Loss</p>
          <p className="text-2xl font-bold text-blue-400">{totalRL} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Fresnel RL</p>
          <p className="text-2xl font-bold text-green-400">{fresnelRL.toFixed(1)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Reflectivity</p>
          <p className="text-2xl font-bold text-yellow-400">{reflectivity.toExponential(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Reflected Power</p>
          <p className="text-2xl font-bold text-red-400">{reflectedPower.toFixed(4)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "External Index", gridcolor: "#374151" },
          yaxis: { title: "Return Loss (dB)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
