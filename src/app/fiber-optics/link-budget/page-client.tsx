"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function LinkBudgetPage() {
  const [txPower, setTxPower] = useURLState("txPower", 0); // dBm
  const [rxSensitivity, setRxSensitivity] = useState(-28); // dBm
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 50); // km
  const [fiberAttenuation, setFiberAttenuation] = useURLState("fiberAttenuation", 0.2); // dB/km
  const [spliceCount, setSpliceCount] = useURLState("spliceCount", 10);
  const [spliceLoss, setSpliceLoss] = useURLState("spliceLoss", 0.1); // dB each
  const [connectorCount, setConnectorCount] = useURLState("connectorCount", 2);
  const [connectorLoss, setConnectorLoss] = useURLState("connectorLoss", 0.5); // dB each
  const [margin, setMargin] = useURLState("margin", 3); // dB system margin

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
        <ValidatedNumberInput label="Tx Power (dBm)" value={txPower} onChange={setTxPower} step="any" />
        <ValidatedNumberInput label="Rx Sensitivity (dBm)" value={rxSensitivity} onChange={setRxSensitivity} step="any" />
        <ValidatedNumberInput label="Fiber Length (km)" value={fiberLength} onChange={setFiberLength} min={0} step="any" />
        <ValidatedNumberInput label="Fiber Attenuation (dB/km)" value={fiberAttenuation} onChange={setFiberAttenuation} min={0} step="any" />
        <ValidatedNumberInput label="Splices (count)" value={spliceCount} onChange={setSpliceCount} min={0} />
        <ValidatedNumberInput label="Splice Loss (dB each)" value={spliceLoss} onChange={setSpliceLoss} min={0} step="any" />
        <ValidatedNumberInput label="Connectors (count)" value={connectorCount} onChange={setConnectorCount} min={0} />
        <ValidatedNumberInput label="Connector Loss (dB each)" value={connectorLoss} onChange={setConnectorLoss} min={0} step="any" />
        <ValidatedNumberInput label="System Margin (dB)" value={margin} onChange={setMargin} min={0} step="any" />
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
