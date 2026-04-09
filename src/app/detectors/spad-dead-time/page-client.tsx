"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
// SPAD Dead Time Analysis
// Non-paralyzable: R_meas = R_true / (1 + R_true · τ_d)
// Paralyzable: R_meas = R_true · exp(-R_true · τ_d)
// τ_d = dead time (ns)
// Pile-up correction, count rate loss, optimal dead time

export default function SpadDeadTimePage() {
  const [deadTime, setDeadTime] = useURLState("deadTime", 25); // ns
  const [trueRate, setTrueRate] = useURLState("trueRate", 10); // Mcps (Mcountrate/s)
  const [mode, setMode] = useState<"nonparalyzable" | "paralyzable">("nonparalyzable");

  const tau = deadTime * 1e-9; // s
  const Rtrue = trueRate * 1e6; // counts/s

  const measuredNonPara = Rtrue / (1 + Rtrue * tau);
  const measuredPara = Rtrue * Math.exp(-Rtrue * tau);
  const measured = mode === "nonparalyzable" ? measuredNonPara : measuredPara;
  const countLoss = (Rtrue - measured) / Rtrue * 100;

  // Rate loss vs true rate
  const rateChart = useMemo(() => {
    const rates = Array.from({ length: 200 }, (_, i) => 0.1 + i * 100 / 200);
    return [
      { x: rates, y: rates.map(r => r * 1e6 / (1 + r * 1e6 * tau) / 1e6), type: "scatter", mode: "lines", name: "Non-paralyzable", line: { color: "#60a5fa", width: 2 } },
      { x: rates, y: rates.map(r => r * 1e6 * Math.exp(-r * 1e6 * tau) / 1e6), type: "scatter", mode: "lines", name: "Paralyzable", line: { color: "#f87171", width: 2 } },
      { x: rates, y: rates, type: "scatter", mode: "lines", name: "Ideal (no loss)", line: { color: "#6b7280", width: 1, dash: "dash" } },
    ];
  }, [tau]);

  // Count loss % vs true rate
  const lossChart = useMemo(() => {
    const rates = Array.from({ length: 200 }, (_, i) => 0.1 + i * 100 / 200);
    return [
      { x: rates, y: rates.map(r => (1 - 1 / (1 + r * 1e6 * tau)) * 100), type: "scatter", mode: "lines", name: "Non-paralyzable", line: { color: "#60a5fa", width: 2 } },
      { x: rates, y: rates.map(r => (1 - Math.exp(-r * 1e6 * tau)) * 100), type: "scatter", mode: "lines", name: "Paralyzable", line: { color: "#f87171", width: 2 } },
    ];
  }, [tau]);

  // Loss vs dead time
  const dtChart = useMemo(() => {
    const dts = Array.from({ length: 200 }, (_, i) => 1 + i * 100 / 200);
    return [
      { x: dts, y: dts.map(d => (1 - 1 / (1 + Rtrue * d * 1e-9)) * 100), type: "scatter", mode: "lines", name: "Non-paralyzable", line: { color: "#34d399", width: 2 } },
      { x: dts, y: dts.map(d => (1 - Math.exp(-Rtrue * d * 1e-9)) * 100), type: "scatter", mode: "lines", name: "Paralyzable", line: { color: "#fbbf24", width: 2 } },
    ];
  }, [Rtrue]);

  // Pile-up correction table
  const correctionTable = useMemo(() => {
    const rates = [1, 5, 10, 20, 50, 100];
    return rates.map(r => {
      const Rt = r * 1e6;
      const mnp = Rt / (1 + Rt * tau);
      const mp = Rt * Math.exp(-Rt * tau);
      return { rate: r, mnp: mnp / 1e6, mp: mp / 1e6, lossNp: ((Rt - mnp) / Rt * 100).toFixed(1), lossP: ((Rt - mp) / Rt * 100).toFixed(1) };
    });
  }, [tau]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="SPAD Dead Time" description="Dead time effects on measured count rates, pile-up loss, and correction for SPAD detectors.">
            
      <div role="group" aria-label="Options" className="flex gap-2 mb-6">
        {(["nonparalyzable", "paralyzable"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-2 rounded text-sm font-medium capitalize ${mode === m ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
            {m}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Dead Time (ns)" value={deadTime} onChange={setDeadTime} min={1} step="1" />
        <ValidatedNumberInput label="True Incident Rate (Mcps)" value={trueRate} onChange={setTrueRate} min={0.01} step="1" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Results</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><span className="text-gray-400 text-sm">Measured Rate ({mode})</span><div className="text-xl font-mono text-green-400">{(measured / 1e6).toFixed(3)} Mcps</div></div>
          <div><span className="text-gray-400 text-sm">Count Loss</span><div className="text-xl font-mono text-red-400">{countLoss.toFixed(2)}%</div></div>
          <div><span className="text-gray-400 text-sm">Duty Cycle</span><div className="text-xl font-mono">{(measured * tau * 100).toFixed(2)}%</div></div>
          <div><span className="text-gray-400 text-sm">Max Measurable Rate (10% loss)</span><div className="text-xl font-mono">
            {mode === "nonparalyzable" ? `${(0.1 / tau / 1e6).toFixed(1)} Mcps` : `${(0.105 / tau / 1e6).toFixed(1)} Mcps`}
          </div></div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-sm font-semibold mb-3">Pile-up Correction Table</h3>
        <table className="text-sm text-gray-300 w-full">
          <thead><tr className="text-gray-400 border-b border-gray-700">
            <th className="py-1 text-left">Rate (Mcps)</th>
            <th className="py-1">Measured NP</th>
            <th className="py-1">Measured P</th>
            <th className="py-1">Loss NP%</th>
            <th className="py-1">Loss P%</th>
          </tr></thead>
          <tbody>{correctionTable.map(r => (
            <tr key={r.rate} className="border-b border-gray-800">
              <td className="py-1">{r.rate}</td>
              <td className="py-1 text-center">{r.mnp.toFixed(3)}</td>
              <td className="py-1 text-center">{r.mp.toFixed(3)}</td>
              <td className="py-1 text-center text-red-400">{r.lossNp}%</td>
              <td className="py-1 text-center text-red-400">{r.lossP}%</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Measured vs True Rate</h3>
          <ChartPanel data={rateChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "True Rate (Mcps)", gridcolor: "#374151" },
            yaxis: { title: "Measured (Mcps)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Count Loss vs Dead Time</h3>
          <ChartPanel data={dtChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Dead Time (ns)", gridcolor: "#374151" },
            yaxis: { title: "Loss (%)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} />
        </div>
      </div>

      <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-sm text-gray-400">
        <h3 className="text-white font-semibold mb-2">Formulas</h3>
        <p>Non-paralyzable: R_meas = R / (1 + R·τ)</p>
        <p>Paralyzable: R_meas = R·exp(-R·τ)</p>
        <p>Correction (NP): R_true = R_meas / (1 - R_meas·τ)</p>
      </div>
    </CalculatorShell>
  );
}
