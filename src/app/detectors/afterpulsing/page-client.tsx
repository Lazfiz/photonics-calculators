"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { afterpulseProbability, measuredRate } from "../../../physics/detectors/dead-time";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function AfterpulsingPage() {
  const [tau1Raw, setTau1] = useURLState("trapLifetime", 20); // ns
  const [eta1Raw, setEta1] = useURLState("trapEfficiency", 0.05);
  const [tau2Raw, setTau2] = useURLState("trapLifetime2", 200); // ns
  const [eta2Raw, setEta2] = useURLState("trapEfficiency2", 0);
  const [deadTimeRaw, setDeadTime] = useURLState("deadTime", 50); // ns
  const [countRateRaw, setCountRate] = useURLState("countRate", 1e6); // cps

  const tau1 = clamp(tau1Raw, 0.1, 1e5, 20);
  const eta1 = clamp(eta1Raw, 0, 1, 0.05);
  const tau2 = clamp(tau2Raw, 0.1, 1e5, 200);
  const eta2 = clamp(eta2Raw, 0, 1, 0);
  const deadTime = clamp(deadTimeRaw, 0, 1e5, 50);
  const countRate = clamp(countRateRaw, 0, 1e10, 1e6);

  const trap1 = { eta: eta1, tau: tau1 * 1e-9 };
  const trap2 = { eta: eta2, tau: tau2 * 1e-9 };
  const traps = [trap1, trap2];
  const td = deadTime * 1e-9;

  // Only recorded avalanches fill traps: photons arriving while the diode is dead never trigger one.
  const measured = measuredRate(countRate, td, "nonparalyzable");
  const pAp = afterpulseProbability(traps, td);
  const apRate = measured * pAp; // first order in P_ap: afterpulses of afterpulses are left out
  const release1 = -Math.expm1(-td / trap1.tau);

  // Dead times from 0 to max(200 ns, 5 τ of the slower active trap).
  const tauMax = eta2 > 0 ? Math.max(tau1, tau2) : tau1;
  const dtMax = Math.max(200, 5 * tauMax);
  const dts = Array.from({ length: 201 }, (_, i) => (i * dtMax) / 200);
  const probChart = [
    { x: dts, y: dts.map((d) => afterpulseProbability([trap1], d * 1e-9) * 100), type: "scatter" as const, mode: "lines" as const, name: `Trap 1 (τ = ${tau1} ns)`, line: { color: "#60a5fa", width: 2 } },
    ...(eta2 > 0 ? [
      { x: dts, y: dts.map((d) => afterpulseProbability([trap2], d * 1e-9) * 100), type: "scatter" as const, mode: "lines" as const, name: `Trap 2 (τ = ${tau2} ns)`, line: { color: "#fbbf24", width: 2 } },
      { x: dts, y: dts.map((d) => afterpulseProbability(traps, d * 1e-9) * 100), type: "scatter" as const, mode: "lines" as const, name: "Total", line: { color: "#f87171", width: 2, dash: "dash" as const } },
    ] : []),
  ];
  const rateChart = [
    { x: dts, y: dts.map((d) => measuredRate(countRate, d * 1e-9, "nonparalyzable") * afterpulseProbability(traps, d * 1e-9)), type: "scatter" as const, mode: "lines" as const, name: "Afterpulse Rate (cps)", line: { color: "#fbbf24", width: 2 } },
    { x: dts, y: dts.map((d) => measuredRate(countRate, d * 1e-9, "nonparalyzable") / 1e6), type: "scatter" as const, mode: "lines" as const, name: "Recorded Rate (Mcps)", line: { color: "#34d399", width: 2 }, yaxis: "y2" },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Trap 1 Lifetime τ₁ (ns)" value={tau1Raw} onChange={setTau1} min={0.1} max={1e5} step="1" />
        <ValidatedNumberInput label="Trap 1 Amplitude η₁ (P_ap at t_d = 0)" value={eta1Raw} onChange={setEta1} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Trap 2 Lifetime τ₂ (ns)" value={tau2Raw} onChange={setTau2} min={0.1} max={1e5} step="10" />
        <ValidatedNumberInput label="Trap 2 Amplitude η₂ (0 = off)" value={eta2Raw} onChange={setEta2} min={0} max={1} step="0.005" />
        <ValidatedNumberInput label="Dead Time t_d (ns)" value={deadTimeRaw} onChange={setDeadTime} min={0} max={1e5} step="1" />
        <ValidatedNumberInput label="True Count Rate (cps)" value={countRateRaw} onChange={setCountRate} min={0} max={1e10} step="10000" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label={pAp > 1 ? "Afterpulses per Avalanche" : "Afterpulse Probability"} value={pAp > 1 ? pAp.toFixed(3) : `${(pAp * 100).toFixed(3)}%`} tone="red" subtext={pAp > 1 ? "mean number per recorded avalanche, can exceed 1" : "per recorded avalanche"} />
        <ResultCard label="Afterpulse Rate" value={`${apRate.toExponential(3)} cps`} tone="yellow" subtext="recorded rate × P_ap" />
        <ResultCard label="Recorded Rate" value={`${(measured / 1e6).toFixed(4)} Mcps`} tone="blue" subtext="non-paralyzable dead time" />
        <ResultCard label={`Trap 1 Released in ${deadTime} ns`} value={`${(release1 * 100).toFixed(1)}%`} tone="green" subtext="1 − e^(−t_d/τ₁), harmless" />
      </div>
      {pAp > 0.1 && (
        <p className="mb-6 text-sm text-yellow-400">
          P_ap above 10 %: afterpulses then trigger afterpulses of their own and steal dead time, which this first-order rate leaves out.
        </p>
      )}
      {countRate * tauMax * 1e-9 > 0.1 && (
        <p className="mb-6 text-sm text-yellow-400">
          First-order rate: traps still full at the next photon are partly emptied by that avalanche, so R_ap is overestimated when R·τ ≳ 0.1.
        </p>
      )}
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>P_ap = Σ η_k · exp(−t_d / τ_k)  [Cova 1991; Ziarkash 2018]</p>
        <p>R_ap = m · P_ap,  m = R / (1 + R·t_d)</p>
        <p>A carrier trapped during an avalanche and released after the dead time retriggers the diode. A longer dead time lets
          more traps empty harmlessly, at the cost of a lower maximum count rate.</p>
      </div>
      <ChartPanel data={probChart} layout={{ xaxis: { title: { text: "Dead Time (ns)" }, gridcolor: "#374151" }, yaxis: { title: { text: "Afterpulse Probability (%)" }, gridcolor: "#374151" } }} />
      <h2 className="text-xl font-bold mt-8 mb-4">Rate vs Dead Time</h2>
      <ChartPanel data={rateChart} layout={{ xaxis: { title: { text: "Dead Time (ns)" }, gridcolor: "#374151" }, yaxis: { title: { text: "Afterpulse Rate (cps)" }, gridcolor: "#374151" }, yaxis2: { title: { text: "Recorded Rate (Mcps)" }, gridcolor: "#374151", overlaying: "y", side: "right" } }} />
    </>
  );
}
