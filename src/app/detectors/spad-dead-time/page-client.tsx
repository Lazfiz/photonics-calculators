"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  DEAD_TIME_MODELS, countLoss, measuredRate, paralyzablePeakRate, parseDeadTimeModel, trueRateAtLoss,
} from "../../../physics/detectors/dead-time";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const TABLE_RATES = [1, 5, 10, 20, 50, 100]; // Mcps

export default function SpadDeadTimePage() {
  const [deadTimeRaw, setDeadTime] = useURLState("deadTime", 25); // ns
  const [trueRateRaw, setTrueRate] = useURLState("trueRate", 10); // Mcps
  const [modeRaw, setMode] = useURLState("mode", "nonparalyzable");

  const deadTime = clamp(deadTimeRaw, 0.1, 1e5, 25);
  const trueRate = clamp(trueRateRaw, 0.001, 1e4, 10);
  const mode = parseDeadTimeModel(modeRaw);

  const tau = deadTime * 1e-9; // s
  const R = trueRate * 1e6; // counts/s
  const measured = measuredRate(R, tau, mode);
  const loss = countLoss(R, tau, mode);
  const rateAt10 = trueRateAtLoss(0.1, tau, mode);
  const pastPeak = mode === "paralyzable" && R * tau > 1;

  // True rates from 0 to 4/τ, so the paralyzable peak at R = 1/τ is always on the chart.
  const rates = Array.from({ length: 201 }, (_, i) => (i * 4) / tau / 200 / 1e6);
  const rateChart = [
    { x: rates, y: rates.map((r) => measuredRate(r * 1e6, tau, "nonparalyzable") / 1e6), type: "scatter" as const, mode: "lines" as const, name: "Non-paralyzable", line: { color: "#60a5fa", width: 2 } },
    { x: rates, y: rates.map((r) => measuredRate(r * 1e6, tau, "paralyzable") / 1e6), type: "scatter" as const, mode: "lines" as const, name: "Paralyzable", line: { color: "#f87171", width: 2 } },
    { x: rates, y: rates.map((r) => Math.min(r, 1 / tau / 1e6)), type: "scatter" as const, mode: "lines" as const, name: "Ideal, capped at 1/τ", line: { color: "#6b7280", width: 1, dash: "dash" as const } },
  ];

  // Dead times from 0 to 4/R (Rτ up to 4) or 100 ns, whichever is longer.
  const dtMax = Math.max(100, 4e9 / R);
  const dts = Array.from({ length: 201 }, (_, i) => (i * dtMax) / 200);
  const dtChart = [
    { x: dts, y: dts.map((d) => countLoss(R, d * 1e-9, "nonparalyzable") * 100), type: "scatter" as const, mode: "lines" as const, name: "Non-paralyzable", line: { color: "#34d399", width: 2 } },
    { x: dts, y: dts.map((d) => countLoss(R, d * 1e-9, "paralyzable") * 100), type: "scatter" as const, mode: "lines" as const, name: "Paralyzable", line: { color: "#fbbf24", width: 2 } },
  ];

  const table = TABLE_RATES.map((r) => ({
    rate: r,
    mnp: measuredRate(r * 1e6, tau, "nonparalyzable") / 1e6,
    mp: measuredRate(r * 1e6, tau, "paralyzable") / 1e6,
    lossNp: countLoss(r * 1e6, tau, "nonparalyzable") * 100,
    lossP: countLoss(r * 1e6, tau, "paralyzable") * 100,
  }));

  return (
    <>
      <div role="group" aria-label="Dead-time model" className="flex gap-2 mb-6">
        {DEAD_TIME_MODELS.map((m) => (
          <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
            className={`px-4 py-2 rounded text-sm font-medium capitalize ${mode === m ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
            {m}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Dead Time (ns)" value={deadTimeRaw} onChange={setDeadTime} min={0.1} max={1e5} step="1" />
        <ValidatedNumberInput label="True count rate without dead time (PDE·Φ + dark) (Mcps)" value={trueRateRaw} onChange={setTrueRate} min={0.001} max={1e4} step="1" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Results</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><span className="text-gray-400 text-sm">Measured Rate ({mode})</span><div className="text-xl font-mono text-green-400">{(measured / 1e6).toFixed(3)} Mcps</div></div>
          <div><span className="text-gray-400 text-sm">Count Loss = dead fraction of the time</span><div className="text-xl font-mono text-red-400">{(loss * 100).toFixed(2)}%</div></div>
          <div><span className="text-gray-400 text-sm">Correction Factor R/m</span><div className="text-xl font-mono">{Number.isFinite(R / measured) ? (R / measured).toFixed(4) : "—"}</div>{!Number.isFinite(R / measured) && <div className="text-xs text-yellow-400">paralyzed: e^(Rτ) overflows, measured rate underflows to 0</div>}</div>
          <div><span className="text-gray-400 text-sm">True Rate at 10 % Loss</span><div className="text-xl font-mono">{(rateAt10 / 1e6).toFixed(2)} Mcps</div></div>
          {mode === "paralyzable" && (
            <div><span className="text-gray-400 text-sm">Peak Recorded Rate 1/(eτ), at R = 1/τ</span><div className="text-xl font-mono">{(paralyzablePeakRate(tau) / 1e6).toFixed(3)} Mcps</div></div>
          )}
        </div>
        {pastPeak && (
          <p className="mt-4 text-sm text-yellow-400">
            Rτ = {(R * tau).toFixed(2)} &gt; 1: past the paralyzable peak, a higher true rate gives fewer counts. The same recorded
            rate also comes from a true rate below 1/τ, so a rate correction is ambiguous here.
          </p>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-sm font-semibold mb-3">Pile-up Correction Table (τ = {deadTime} ns)</h3>
        <table className="text-sm text-gray-300 w-full">
          <thead><tr className="text-gray-400 border-b border-gray-700">
            <th className="py-1 text-left">True rate (Mcps)</th>
            <th className="py-1">Measured NP</th>
            <th className="py-1">Measured P</th>
            <th className="py-1">Loss NP</th>
            <th className="py-1">Loss P</th>
          </tr></thead>
          <tbody>{table.map((r) => (
            <tr key={r.rate} className="border-b border-gray-800">
              <td className="py-1">{r.rate}</td>
              <td className="py-1 text-center">{r.mnp.toFixed(3)}</td>
              <td className="py-1 text-center">{r.mp.toFixed(3)}</td>
              <td className="py-1 text-center text-red-400">{r.lossNp.toFixed(1)}%</td>
              <td className="py-1 text-center text-red-400">{r.lossP.toFixed(1)}%</td>
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
        <p>Non-paralyzable: m = R / (1 + R·τ); correction R = m / (1 − m·τ)</p>
        <p>Paralyzable: m = R·exp(−R·τ); peak m = 1/(e·τ) at R = 1/τ</p>
        <p>Loss 1 − m/R equals the fraction of time the counter is dead</p>
      </div>
    </>
  );
}
