"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c } from "../../../physics/constants";
import {
  absorptionFromRingDown, cavityFinesse, minDetectableAbsorption, noiseEquivalentAbsorption, ringDownTime, roundTripLoss,
} from "../../../physics/spectroscopy/cavity-ring-down";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const r6 = (x: number) => (Number.isFinite(x) ? Math.round(x * 1e6) / 1e6 : NaN);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const fmtTime = (t: number) =>
  !Number.isFinite(t) ? "—" : t >= 1e-3 ? `${fmt(t * 1e3)} ms` : t >= 1e-6 ? `${fmt(t * 1e6)} µs` : `${fmt(t * 1e9)} ns`;

const chartLayout = (title: string, xTitle: string, yTitle: string, log: boolean) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  title: { text: title, font: { size: 13 } },
  xaxis: { title: xTitle, gridcolor: "#374151", ...(log ? { type: "log" } : {}) },
  yaxis: { title: yTitle, gridcolor: "#374151", ...(log ? { type: "log" } : { range: [0, 1.05] }) },
  margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent" },
});

export default function CavityRingDownPage() {
  const [rRaw, setMirrorReflectivity] = useURLState("mirrorReflectivity", 99.99); // %
  const [lRaw, setCavityLength] = useURLState("cavityLength", 100); // cm
  const [lossRaw, setBaseLoss] = useURLState("baseLoss", 0); // % additional round-trip loss
  const [aRaw, setSampleAbsorbance] = useURLState("sampleAbsorbance", 0.001); // base-10, per pass
  const [noiseRaw, setTauNoise] = useURLState("tauNoise", 1); // % Δτ/τ per decay
  const [repRaw, setRepRate] = useURLState("repRate", 10); // Hz

  const R = clamp(rRaw, 50, 99.99999, 99.99) / 100;
  const Lcm = clamp(lRaw, 1, 1000, 100);
  const L = Lcm / 100;
  const other = clamp(lossRaw, 0, 50, 0) / 100;
  const A = clamp(aRaw, 0, 1, 0.001);
  const noise = clamp(noiseRaw, 0.001, 50, 1) / 100;
  const rep = clamp(repRaw, 0.01, 1e6, 10);

  const loss0 = roundTripLoss(R, R, other, 0);
  const loss = roundTripLoss(R, R, other, A);
  const tau0 = ringDownTime(L, loss0);
  const tau = ringDownTime(L, loss);
  const alpha = absorptionFromRingDown(tau, tau0); // m⁻¹
  const aMin = minDetectableAbsorption(tau0, noise); // m⁻¹
  const nea = noiseEquivalentAbsorption(aMin, rep);
  const finesse = cavityFinesse(loss);
  const fsr = c / (2 * L);

  const decay = (() => {
    const tMax = 5 * Math.max(tau, Math.min(tau0, 5 * tau));
    const ts = Array.from({ length: 401 }, (_, i) => (i / 400) * tMax);
    const line = (tc: number, name: string, color: string) =>
      ({ x: ts.map((t) => r6(t * 1e6)), y: ts.map((t) => r6(Math.exp(-t / tc))), type: "scatter", mode: "lines", name, line: { color, width: 2 } });
    return [line(tau0, `Empty, τ₀ = ${fmtTime(tau0)}`, "#60a5fa"), line(tau, `With sample, τ = ${fmtTime(tau)}`, "#34d399")];
  })();

  const tauVsLoss = (() => {
    const losses = Array.from({ length: 121 }, (_, i) => 1e-6 * 1e6 ** (i / 120));
    return [
      { x: losses, y: losses.map((l) => ringDownTime(L, l) * 1e6), type: "scatter", mode: "lines", name: `τ, L = ${fmt(Lcm, 3)} cm`, line: { color: "#a78bfa", width: 2 } },
      { x: [loss], y: [tau * 1e6], type: "scatter", mode: "markers", name: "Current", line: { color: "#fbbf24" }, marker: { color: "#fbbf24", size: 10 } },
    ];
  })();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Mirror Reflectivity R (%)" value={rRaw} onChange={setMirrorReflectivity} min={50} max={99.99999} step="0.001" />
        <ValidatedNumberInput label="Cavity Length (cm)" value={lRaw} onChange={setCavityLength} min={1} max={1000} />
        <ValidatedNumberInput label="Other Round-Trip Loss (%)" value={lossRaw} onChange={setBaseLoss} min={0} max={50} step="0.001" />
        <ValidatedNumberInput label="Sample Absorbance per Pass (base 10)" value={aRaw} onChange={setSampleAbsorbance} min={0} max={1} step="0.0001" />
        <ValidatedNumberInput label="Ring-Down Time Noise Δτ/τ per Decay (%)" value={noiseRaw} onChange={setTauNoise} min={0.001} max={50} />
        <ValidatedNumberInput label="Decays Averaged per Second (Hz)" value={repRaw} onChange={setRepRate} min={0.01} max={1000000} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Empty-Cavity Ring-Down τ₀" value={fmtTime(tau0)} tone="blue" subtext={`effective path cτ₀ = ${fmt((c * tau0) / 1000)} km`} />
        <ResultCard label="Ring-Down with Sample τ" value={fmtTime(tau)} tone="green" subtext={`round-trip loss Λ = ${fmt(loss)}`} />
        <ResultCard label="Sample Absorption α" value={`${fmt(alpha / 100)} cm⁻¹`} tone="yellow" subtext="(1/c)(1/τ − 1/τ₀) = A ln 10/L" />
        <ResultCard label="Minimum Detectable α" value={`${fmt(aMin / 100, 3)} cm⁻¹`} tone="red"
          subtext={`(Δτ/τ)/(cτ₀); ${fmt(nea / 100, 3)} cm⁻¹ Hz⁻¹ᐟ² averaged`} />
        <ResultCard label="Finesse ℱ" value={fmt(finesse)} tone="purple" subtext="π√ρ/(1 − ρ), ρ = e^(−Λ/2) ≈ 2π/Λ" />
        <ResultCard label="Mode Spacing c/2L" value={`${fmt(fsr / 1e6)} MHz`} tone="cyan" subtext={`mode FWHM 1/(2πτ) = ${fmt(1 / (2 * Math.PI * tau) / 1e3)} kHz`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={decay} layout={chartLayout("Ring-Down Decay", "Time (µs)", "I/I₀", false)} />
        <ChartPanel data={tauVsLoss} layout={chartLayout("τ vs Round-Trip Loss", "Round-Trip Loss Λ", "τ (µs)", true)} />
      </div>
    </>
  );
}
