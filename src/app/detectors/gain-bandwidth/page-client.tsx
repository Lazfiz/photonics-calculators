"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { closedLoopMagnitude, singlePoleClosedLoop } from "../../../physics/detectors/tia";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmtHz = (f: number) => (f >= 1e9 ? `${(f / 1e9).toFixed(2)} GHz` : f >= 1e6 ? `${(f / 1e6).toFixed(2)} MHz` : f >= 1e3 ? `${(f / 1e3).toFixed(2)} kHz` : f < 1 ? `${f.toExponential(2)} Hz` : `${f.toFixed(2)} Hz`);

export default function GainBandwidthPage() {
  const [gainDCRaw, setGainDC] = useURLState("gainDC", 1000);
  const [gbwProductRaw, setGbwProduct] = useURLState("gbwProduct", 1e6);
  const [feedbackFractionRaw, setFeedbackFraction] = useURLState("feedbackFraction", 0.01);
  const gainDC = clamp(gainDCRaw, 1, 1e8, 1000);
  const gbwProduct = clamp(gbwProductRaw, 1, 1e12, 1e6);
  const beta = clamp(feedbackFractionRaw, 0, 1, 0.01);

  const { openLoopBandwidth, gain: closedLoopGain, bandwidth: closedLoopBW } = singlePoleClosedLoop(gainDC, gbwProduct, beta);

  const fMin = openLoopBandwidth / 100, fMax = gbwProduct * 10;
  const freq = Array.from({ length: 300 }, (_, i) => fMin * Math.pow(fMax / fMin, i / 299));
  const chartData = [
    { x: freq, y: freq.map(f => closedLoopMagnitude(gainDC, gbwProduct, 0, f)), type: "scatter" as const, mode: "lines" as const, name: "Open-loop", line: { color: "#60a5fa", width: 2 } },
    { x: freq, y: freq.map(f => closedLoopMagnitude(gainDC, gbwProduct, beta, f)), type: "scatter" as const, mode: "lines" as const, name: "Closed-loop", line: { color: "#f87171", width: 2, dash: "dash" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="DC Gain A₀ (V/V)" value={gainDCRaw} onChange={setGainDC} min={1} max={1e8} />
        <ValidatedNumberInput label="GBW Product (Hz)" value={gbwProductRaw} onChange={setGbwProduct} min={1} max={1e12} />
        <ValidatedNumberInput label="Feedback Fraction β" value={feedbackFractionRaw} onChange={setFeedbackFraction} min={0} max={1} step="0.001" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Open-loop f₋₃dB" value={fmtHz(openLoopBandwidth)} tone="blue" subtext="GBW / A₀" />
        <ResultCard label="Closed-loop Gain" value={`${closedLoopGain.toFixed(2)} V/V`} tone="green" subtext="A₀ / (1 + β·A₀)" />
        <ResultCard label="Closed-loop BW" value={fmtHz(closedLoopBW)} tone="yellow" subtext="GBW / A_cl" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>A(f) = A₀ / (1 + j·f/f₀),  GBW = A₀·f₀</p>
        <p>A_cl(f) = A₀ / (1 + β·A₀ + j·f/f₀): gain A₀/(1 + β·A₀), bandwidth f₀·(1 + β·A₀)</p>
        <p>The closed-loop gain shown is A₀/(1 + β·A₀), the non-inverting (noise) gain; an inverting stage has the same bandwidth but signal gain −(1 − β)/β.</p>
        <p>Single-pole op amp; higher poles, slew rate and phase margin are left out.</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Frequency (Hz)", type: "log", gridcolor: "#374151" }, yaxis: { title: "Gain (V/V)", type: "log", gridcolor: "#374151" } }} />
    </>
  );
}
