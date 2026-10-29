"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  dispersionLength, fundamentalSolitonPower, nonlinearLength, sechT0, solitonContent, solitonOrder, solitonPeriod, solveNls,
} from "../../../physics/wave-optics/soliton";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));

// Split-step budget: step h = min(0.02, 0.05/N²) L_D (N = 1 holds its shape to 3e-5, N = 2 recovers to 4e-3), at most
// 1000 steps and 10 L_D, on 1024 points over 64 T₀. Above N = 4 that grid no longer resolves the compressed peak.
const MAX_ORDER = 4;
const MAX_XI = 10;
const MAX_STEPS = 1000;

function simulate(N: number, LD: number, distance: number, anomalous: boolean) {
  if (!(Number.isFinite(N) && Number.isFinite(LD) && LD > 0) || N > MAX_ORDER) return null;
  const step = Math.min(0.02, 0.05 / Math.max(1, N * N));
  const xiWanted = distance / LD;
  const xiMax = Math.min(xiWanted, MAX_XI, MAX_STEPS * step);
  return { ...solveNls(N, anomalous ? -1 : 1, xiMax, { step }), truncated: xiMax < xiWanted };
}

export default function SolitonPage() {
  const [fwhmRaw, setFwhm] = useURLState("pulseWidth", 100); // fs
  const [powerRaw, setPower] = useURLState("peakPower", 5000); // W
  const [beta2Raw, setBeta2] = useURLState("beta2", -11.83); // ps²/km = fs²/mm
  const [gammaRaw, setGamma] = useURLState("gamma", 1.3); // 1/(W·km)
  const [distanceRaw, setDistance] = useURLState("distance", 2); // m

  const t0 = sechT0(clamp(fwhmRaw, 1, 1e5, 100) * 1e-15);
  const power = clamp(powerRaw, 0, 1e7, 5000);
  const beta2 = clamp(beta2Raw, -1000, 1000, -11.83) * 1e-27;
  const gamma = clamp(gammaRaw, 0.01, 1e5, 1.3) * 1e-3;
  const distance = clamp(distanceRaw, 0, 1e5, 2);

  const LD = dispersionLength(t0, beta2);
  const LNL = nonlinearLength(gamma, power);
  const P1 = fundamentalSolitonPower(beta2, gamma, t0);
  const N = solitonOrder(power, beta2, gamma, t0);
  const z0 = solitonPeriod(t0, beta2);
  const anomalous = beta2 < 0;
  const content = solitonContent(N);

  const sim = simulate(N, LD, distance, anomalous);

  const evolution = sim ? [
    { name: "Peak power / input peak", color: "#60a5fa", points: sim.xi.map((x, i) => ({ x: round6(x * LD), y: round6(sim.peak[i]) })) },
    { name: "RMS width / input RMS width", color: "#f87171", points: sim.xi.map((x, i) => ({ x: round6(x * LD), y: round6(sim.rmsWidth[i] / sim.rmsWidth[0]) })) },
  ] : [];
  const profileSpan = sim ? Math.min(32, Math.max(6, 4 * (sim.rmsWidth.at(-1) ?? 1))) : 0;
  const profile = (values: number[]) => sim
    ? sim.tau.flatMap((tau, i) => (Math.abs(tau) <= profileSpan ? [{ x: round6(tau * t0 * 1e15), y: round6(power * values[i]) }] : []))
    : [];
  const profiles = sim ? [
    { name: "Input, z = 0", color: "#9ca3af", dashed: true, points: profile(sim.input) },
    { name: `Output, z = ${fmt((sim.xi.at(-1) ?? 0) * LD, 3)} m`, color: "#34d399", points: profile(sim.output) },
  ] : [];

  const simNote = !Number.isFinite(LD)
    ? "β₂ = 0: no dispersion length, so the pulse only gains SPM phase and keeps its intensity shape."
    : N > MAX_ORDER
      ? `N > ${MAX_ORDER}: the browser grid can't resolve the compressed peak. The lengths above still hold; ${anomalous ? "such pulses split in real fibres (see supercontinuum generation)." : "with normal dispersion they don't split: SPM and optical wave breaking broaden the spectrum."}`
      : sim?.truncated
        ? `The simulation stops at ${fmt((sim.xi.at(-1) ?? 0) * LD, 3)} m (${fmt(sim.xi.at(-1) ?? 0, 3)} L_D), its step budget.`
        : "";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Pulse FWHM, sech² (fs)" value={fwhmRaw} onChange={setFwhm} min={1} max={1e5} step="any" />
        <ValidatedNumberInput label="Peak power P₀ (W)" value={powerRaw} onChange={setPower} min={0} max={1e7} step="any" />
        <ValidatedNumberInput label="β₂ (ps²/km = fs²/mm)" value={beta2Raw} onChange={setBeta2} min={-1000} max={1000} step="any" />
        <ValidatedNumberInput label="γ (W⁻¹ km⁻¹)" value={gammaRaw} onChange={setGamma} min={0.01} max={1e5} step="any" />
        <ValidatedNumberInput label="Fibre length (m)" value={distanceRaw} onChange={setDistance} min={0} max={1e5} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Half-width T₀" value={`${fmt(t0 * 1e15)} fs`} subtext="FWHM / 2 ln(1 + √2) = FWHM / 1.7627" tone="blue" />
        <ResultCard label="Dispersion length L_D" value={`${fmt(LD)} m`} subtext={`T₀²/|β₂|; soliton period z₀ = (π/2) L_D = ${fmt(z0)} m`} tone="green" />
        <ResultCard label="Fundamental soliton power P₁" value={`${fmt(P1)} W`} subtext={`|β₂|/(γT₀²); nonlinear length 1/(γP₀) = ${fmt(LNL)} m`} tone="orange" />
        <ResultCard
          label="Soliton order N"
          value={fmt(N)}
          subtext={anomalous
            ? content.count > 0
              ? `${content.count} soliton${content.count > 1 ? "s" : ""} inside; the strongest settles at ${fmt(content.amplitude ** 2 * P1)} W, width T₀/${fmt(content.amplitude, 3)}`
              : "N < 1/2: no soliton, the pulse disperses"
            : beta2 === 0
              ? "zero dispersion (β₂ = 0): SPM only, the intensity shape is kept"
              : "normal dispersion (β₂ > 0): no bright soliton, the pulse broadens"}
          tone={anomalous && content.count > 0 ? "cyan" : "red"}
        />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>The nonlinear Schrödinger equation ∂A/∂z = −(iβ₂/2)∂²A/∂T² + iγ|A|²A balances dispersion against self-phase
          modulation. The ratio of their lengths gives the order N = √(L_D/L_NL) = √(γP₀T₀²/|β₂|). With anomalous
          dispersion a sech pulse with N = 1 keeps its shape. Integer N &gt; 1 compresses, splits and recovers every
          soliton period z₀. A non-integer N reshapes into ⌊N + ½⌋ solitons and sheds the rest as dispersive radiation.
          The plots solve the NLS by the split-step Fourier method for the sech input; fibre loss, β₃, self-steepening and
          the Raman response are left out.</p>
        {simNote && <p className="text-yellow-400">{simNote}</p>}
      </div>

      {sim && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SimpleLineChart title="Peak power and width along the fibre" xLabel="Distance z (m)" yLabel="Ratio to the input" series={evolution} />
          <SimpleLineChart title="Pulse intensity" xLabel="Time T (fs)" yLabel="Power (W)" series={profiles} />
        </div>
      )}
    </>
  );
}
