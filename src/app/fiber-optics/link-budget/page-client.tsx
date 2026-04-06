"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function LinkBudgetPage() {
  const [txPower, setTxPower] = useState(0); // dBm
  const [rxSensitivity, setRxSensitivity] = useState(-28); // dBm
  const [fiberLength, setFiberLength] = useState(50); // km
  const [fiberAttenuation, setFiberAttenuation] = useState(0.2); // dB/km
  const [spliceCount, setSpliceCount] = useState(10);
  const [spliceLoss, setSpliceLoss] = useState(0.1); // dB each
  const [connectorCount, setConnectorCount] = useState(2);
  const [connectorLoss, setConnectorLoss] = useState(0.5); // dB each
  const [margin, setMargin] = useState(3); // dB system margin

  const calc = useMemo(() => {
    const fiberLoss = fiberLength * fiberAttenuation;
    const totalSpliceLoss = spliceCount * spliceLoss;
    const totalConnectorLoss = connectorCount * connectorLoss;
    const totalLoss = fiberLoss + totalSpliceLoss + totalConnectorLoss + margin;
    const receivedPower = txPower - totalLoss;
    const linkMargin = receivedPower - rxSensitivity;
    const feasible = linkMargin >= 0;

    return { fiberLoss, totalSpliceLoss, totalConnectorLoss, totalLoss, receivedPower, linkMargin, feasible };
  }, [txPower, rxSensitivity, fiberLength, fiberAttenuation, spliceCount, spliceLoss, connectorCount, connectorLoss, margin]);

  const chartData = useMemo(() => {
    const categories = ["Fiber", "Splices", "Connectors", "Margin", "Received"];
    const values = [calc.fiberLoss, calc.totalSpliceLoss, calc.totalConnectorLoss, margin, calc.receivedPower];
    const colors = ["#f87171", "#fb923c", "#facc15", "#a78bfa", calc.feasible ? "#34d399" : "#f87171"];

    return [
      { x: categories, y: values, type: "bar" as const, marker: { color: colors },
        text: values.map(v => v.toFixed(1) + " dB"), textposition: "outside" },
      { x: ["Sensitivity"], y: [rxSensitivity], type: "bar" as const, marker: { color: "#60a5fa" },
        text: [rxSensitivity.toFixed(1) + " dBm"], textposition: "outside" },
    ];
  }, [calc, margin, rxSensitivity]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Fiber Link Budget" description="Total optical link loss budget calculator. Power budget vs. accumulated losses.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Tx Power (dBm)</span>
          <input type="number" value={txPower} onChange={e => setTxPower(+e.target.value)} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Rx Sensitivity (dBm)</span>
          <input type="number" value={rxSensitivity} onChange={e => setRxSensitivity(+e.target.value)} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Fiber Length (km)</span>
          <input type="number" value={fiberLength} onChange={e => setFiberLength(+e.target.value)} min={0} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Fiber Attenuation (dB/km)</span>
          <input type="number" value={fiberAttenuation} onChange={e => setFiberAttenuation(+e.target.value)} min={0} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Splices (count)</span>
          <input type="number" value={spliceCount} onChange={e => setSpliceCount(+e.target.value)} min={0}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Splice Loss (dB each)</span>
          <input type="number" value={spliceLoss} onChange={e => setSpliceLoss(+e.target.value)} min={0} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Connectors (count)</span>
          <input type="number" value={connectorCount} onChange={e => setConnectorCount(+e.target.value)} min={0}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Connector Loss (dB each)</span>
          <input type="number" value={connectorLoss} onChange={e => setConnectorLoss(+e.target.value)} min={0} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">System Margin (dB)</span>
          <input type="number" value={margin} onChange={e => setMargin(+e.target.value)} min={0} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className={`bg-gray-900 border ${calc.feasible ? "border-green-800" : "border-red-800"} rounded-lg p-6 mb-8`}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-gray-400">Total Loss</p>
            <p className="text-2xl font-bold text-red-400">{calc.totalLoss.toFixed(1)} dB</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Received Power</p>
            <p className="text-2xl font-bold text-blue-400">{calc.receivedPower.toFixed(1)} dBm</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Link Margin</p>
            <p className={`text-2xl font-bold ${calc.feasible ? "text-green-400" : "text-red-400"}`}>
              {calc.linkMargin.toFixed(1)} dB {calc.feasible ? "✓" : "✗"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "", gridcolor: "#374151" },
          yaxis: { title: "Power (dBm) / Loss (dB)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 }, showlegend: false,
        }} />
      </div>
    </CalculatorShell>
  );
}
