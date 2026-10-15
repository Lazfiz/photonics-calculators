"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { countLoss, measuredRate, nonParalyzableFano } from "../../../physics/detectors/dead-time";
import { poissonPmf } from "../../../physics/math";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const MAX_BARS = 201;

// Photon counting statistics: Poisson P(n) = μ^n·e^{−μ}/n!, shot-noise SNR √μ, and a non-paralyzable dead time.
export default function PhotonCountingPage() {
  const [meanCountsRaw, setMeanCounts] = useURLState("meanCounts", 100); // expected counts per interval
  const [deadTimeRaw, setDeadTime] = useURLState("deadTime", 50); // ns
  const [countRateRaw, setCountRate] = useURLState("countRate", 1e6); // counts/s
  const [integrationTimeRaw, setIntegrationTime] = useURLState("integrationTime", 1); // s

  const mu = clamp(meanCountsRaw, 0.1, 1e12, 100);
  const deadTime = clamp(deadTimeRaw, 0, 1e6, 50);
  const countRate = clamp(countRateRaw, 1, 1e10, 1e6);
  const integrationTime = clamp(integrationTimeRaw, 1e-6, 1e5, 1);

  const snr = Math.sqrt(mu);
  const snrDb = 10 * Math.log10(mu); // 20·log₁₀ of the amplitude ratio √μ
  const tau = deadTime * 1e-9;
  const measured = measuredRate(countRate, tau, "nonparalyzable");
  const loss = countLoss(countRate, tau, "nonparalyzable");
  const recordedCounts = measured * integrationTime;
  const fano = nonParalyzableFano(countRate, tau);
  // The dead-time-corrected rate R̂ = m/(1 − mτ) has relative error 1/√N_recorded (see dead-time.ts tests).
  const correctedSnr = Math.sqrt(recordedCounts);

  // Counts within ±5σ (+2 for small μ); at most MAX_BARS bars, spaced by `stride` counts when the range is wider.
  const sigma = Math.sqrt(mu);
  const start = Math.max(0, Math.floor(mu - 5 * sigma));
  const end = Math.ceil(mu + 5 * sigma) + 2;
  const stride = Math.max(1, Math.ceil((end - start) / (MAX_BARS - 1)));
  const n = Array.from({ length: Math.floor((end - start) / stride) + 1 }, (_, i) => start + i * stride);
  const chartData = [
    { x: n, y: n.map((k) => poissonPmf(k, mu)), type: "bar" as const, name: "Poisson", marker: { color: "#60a5fa", opacity: 0.7 } },
    { x: n, y: n.map((k) => Math.exp(-0.5 * ((k - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI))), type: "scatter" as const, mode: "lines" as const,
      name: "Gaussian approx.", line: { color: "#f87171", width: 2 } },
  ];

  // Counts from 0.1 to 10⁴ on a log grid.
  const N = Array.from({ length: 200 }, (_, i) => 10 ** (-1 + (5 * i) / 199));
  const snrVsCounts = [
    { x: N, y: N.map((v) => Math.sqrt(v)), type: "scatter" as const, mode: "lines" as const, name: "SNR = √N", line: { color: "#34d399", width: 2 } },
    { x: N, y: N.map((v) => 100 / Math.sqrt(v)), type: "scatter" as const, mode: "lines" as const, name: "Relative Error (%)", line: { color: "#fbbf24", width: 2, dash: "dash" as const }, yaxis: "y2" },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Mean Counts per Interval μ" value={meanCountsRaw} onChange={setMeanCounts} min={0.1} max={1e12} step="1" />
        <ValidatedNumberInput label="Dead Time (ns)" value={deadTimeRaw} onChange={setDeadTime} min={0} max={1e6} step="1" />
        <ValidatedNumberInput label="Incident Count Rate (counts/s)" value={countRateRaw} onChange={setCountRate} min={1} max={1e10} />
        <ValidatedNumberInput label="Integration Time (s)" value={integrationTimeRaw} onChange={setIntegrationTime} min={1e-6} max={1e5} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="SNR per Interval √μ" value={`${snr.toFixed(1)} (${snrDb.toFixed(1)} dB)`} tone="green" />
        <ResultCard label="Relative Error 1/√μ" value={`${(100 / snr).toFixed(2)}%`} tone="yellow" />
        <ResultCard label="Dead Time Loss" value={`${(loss * 100).toFixed(1)}%`} tone="red" subtext={`recorded ${(measured / 1e6).toFixed(3)} of ${(countRate / 1e6).toFixed(3)} Mcps`} />
        <ResultCard label={`Corrected-Rate SNR in ${integrationTime} s`} value={correctedSnr >= 1e4 ? correctedSnr.toExponential(3) : correctedSnr.toFixed(1)} tone="purple" subtext={`√N, N = ${recordedCounts.toExponential(3)} recorded`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>P(n) = μ<sup>n</sup>·e<sup>−μ</sup> / n!  [Poisson]; SNR = √μ (shot-noise limit)</p>
        <p>m = R / (1 + R·τ)  [non-paralyzable dead time]; corrected R̂ = m / (1 − m·τ)</p>
        <p>Recorded counts are sub-Poissonian: Var N / N = 1/(1 + R·τ)² = {fano.toFixed(4)}. The correction amplifies that
          smaller spread back, so the corrected rate has relative error 1/√N of the recorded counts.</p>
        {stride > 1 && <p className="text-gray-400">The chart shows every {stride}th count value (P(n) per single count).</p>}
      </div>

      <h2 className="text-xl font-bold mb-4">Count Distribution</h2>
      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Counts", gridcolor: "#374151" },
        yaxis: { title: "Probability", gridcolor: "#374151" },
        margin: { t: 30, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        bargap: 0.05,
      }} />

      <h2 className="text-xl font-bold mt-8 mb-4">SNR &amp; Error vs Counts</h2>
      <ChartPanel data={snrVsCounts} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Number of Counts", gridcolor: "#374151", type: "log" },
        yaxis: { title: "SNR", gridcolor: "#374151" },
        yaxis2: { title: "Relative Error (%)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 30, r: 60, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} />
    </>
  );
}
