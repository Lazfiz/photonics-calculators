"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

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
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/fiber-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Fiber Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Connector Return Loss</h1>
      <p className="text-gray-400 mb-8">Calculate return loss (ORL) from fiber connectors based on polish type and index mismatch.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Connector Type</span>
          <select value={connectorType} onChange={e => setConnectorType(e.target.value)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="flat">Flat</option>
            <option value="pc">PC</option>
            <option value="upc">UPC</option>
            <option value="apc">APC</option>
          </select>
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Fiber Core Index</span>
          <input type="number" value={n1} onChange={e => setN1(+e.target.value)} min={1.0} max={2.0} step="0.001"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">External Index</span>
          <input type="number" value={n2} onChange={e => setN2(+e.target.value)} min={1.0} max={2.0} step="0.001"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={400} max={2000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
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
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "External Index", gridcolor: "#374151" },
          yaxis: { title: "Return Loss (dB)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
