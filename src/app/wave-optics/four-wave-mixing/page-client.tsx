"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c } from "../../../physics/constants";
import { alphaFromDbPerKm } from "../../../physics/fiber-optics/fiber-nonlinear";
import {
  fwmDetuning, fwmIdlerPower, fwmIdlerWavelength, fwmLinearMismatch, fwmLossyEvolution, fwmNetGain, fwmSignalGain, fwmSummary,
} from "../../../physics/wave-optics/four-wave-mixing";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const dB = (x: number) => 10 * Math.log10(x);
const fmtPower = (W: number) => !Number.isFinite(W)
  ? "—"
  : W >= 1 ? `${fmt(W)} W` : W >= 1e-3 ? `${fmt(W * 1e3)} mW` : W >= 1e-6 ? `${fmt(W * 1e6)} µW` : `${fmt(W * 1e9)} nW`;

export default function FourWaveMixingPage() {
  const [lambdaPumpRaw, setLambdaPump] = useURLState("wavelengthPump", 1550); // nm
  const [lambdaSignalRaw, setLambdaSignal] = useURLState("wavelengthSignal", 1560); // nm
  const [pumpPowerRaw, setPumpPower] = useURLState("pumpPower", 1000); // mW
  const [seedPowerRaw, setSeedPower] = useURLState("seedPower", 0.01); // mW
  const [n2Raw, setN2] = useURLState("n2", 2.6); // ×10⁻²⁰ m²/W (= ×10⁻¹⁶ cm²/W)
  const [areaRaw, setArea] = useURLState("coreArea", 11); // µm²
  const [lengthRaw, setLength] = useURLState("fiberLength", 500); // m
  const [beta2Raw, setBeta2] = useURLState("beta2", -0.1); // ps²/km
  const [beta4Raw, setBeta4] = useURLState("beta4", 0); // ps⁴/km
  const [lossRaw, setLoss] = useURLState("fiberLoss", 0); // dB/km

  const lambdaP = clamp(lambdaPumpRaw, 200, 20000, 1550) * 1e-9;
  const lambdaS = clamp(lambdaSignalRaw, 200, 20000, 1560) * 1e-9;
  const Pp = clamp(pumpPowerRaw, 0, 1e7, 1000) * 1e-3;
  const Ps = clamp(seedPowerRaw, 0, 1e6, 1) * 1e-3;
  const n2 = clamp(n2Raw, 0, 1e4, 2.6) * 1e-20;
  const area = clamp(areaRaw, 0.1, 1e5, 11) * 1e-12;
  const L = clamp(lengthRaw, 1e-3, 1e5, 500);
  const beta2 = clamp(beta2Raw, -1e4, 1e4, -0.1) * 1e-27; // ps²/km → s²/m
  const beta4 = clamp(beta4Raw, -1e3, 1e3, 0) * 1e-51; // ps⁴/km → s⁴/m
  const alpha = alphaFromDbPerKm(clamp(lossRaw, 0, 1e4, 0)); // 1/m
  const lossy = alpha > 0;

  const params = { lambdaPump: lambdaP, lambdaSignal: lambdaS, pumpPower: Pp, seedPower: Ps, n2, area, length: L, beta2, beta4, alpha };
  const {
    gamma, gammaP, lambdaIdler: lambdaI, gain, idlerPower: Pi, deltaBeta, kappa, gainCoefficient: g, peakDetuning: omegaPk, peakGain,
    peakShift, converted,
  } = fwmSummary(params);
  const valid = Number.isFinite(lambdaI);
  const omega = fwmDetuning(lambdaP, lambdaS);

  const warnings = [
    !valid && "The signal frequency is above twice the pump frequency (λ_s < λ_p/2), so there is no idler: 1/λ_i = 2/λ_p − 1/λ_s.",
    valid && lossy && !Number.isFinite(gain) && "The fiber loss αL is in the thousands of nepers: nothing reaches the output.",
    // Converted power before the loss, compared with the launched pump.
    valid && converted > 0.1 * Pp && `Signal and idler take more than 10 % of the pump (${fmt((100 * converted) / Pp, 3)} %): the pump is depleted and the undepleted-pump gain overstates the output.`,
    !Number.isFinite(omegaPk) && Pp > 0 && "No detuning phase-matches (κ = 0 needs β₂ < 0 or β₄ < 0, i.e. anomalous dispersion): the gain band collapses to the pump and the idler grows only quadratically.",
  ].filter(Boolean) as string[];

  // Gain spectrum, symmetric in frequency about the pump.
  const omegaSpan = 1.6 * Math.max(Number.isFinite(omegaPk) ? omegaPk : 0, Math.abs(omega), 2 * Math.PI * 100e9);
  const spectrum = Array.from({ length: 401 }, (_, i) => ((i - 200) / 200) * omegaSpan)
    .map((o) => ({ lambda: 1 / (1 / lambdaP + o / (2 * Math.PI * c)), o }))
    .filter((p) => p.lambda > 0 && Number.isFinite(fwmIdlerWavelength(lambdaP, p.lambda)))
    .map((p) => ({ x: round6(p.lambda * 1e9), y: round6(dB(fwmNetGain(gamma, Pp, fwmLinearMismatch(beta2, p.o, beta4), alpha, L))) }))
    .filter((p) => Number.isFinite(p.y));
  const spectrumSeries = spectrum.length > 1 && Pp > 0 ? [{ name: "Signal gain G_s", color: "#60a5fa", points: spectrum }] : [];
  const marker = valid && Number.isFinite(gain)
    ? [{ name: "This signal", color: "#facc15", showPoints: true, points: [{ x: round6(lambdaS * 1e9), y: round6(dB(gain)) }] }]
    : [];

  const zs = Array.from({ length: 201 }, (_, i) => ((i + 1) / 201) * L);
  // Same grid as fwmLossyEvolution's 201 samples, z = (i + 1)L/201.
  const evolution = lossy && valid ? fwmLossyEvolution(gamma, Pp, deltaBeta, alpha, L, zs.length) : [];
  const signalAt = (i: number) => (lossy ? evolution[i]?.gain ?? NaN : fwmSignalGain(gammaP, deltaBeta, zs[i]));
  const idlerAt = (i: number) => (lossy ? (lambdaS / lambdaI) * (evolution[i]?.idler ?? NaN) : fwmIdlerPower(signalAt(i), 1, lambdaS, lambdaI));
  const lengthSeries = valid && Ps > 0 && Pp > 0 && (!lossy || evolution.length === zs.length) ? [
    { name: "Signal", color: "#60a5fa", points: zs.map((z, i) => ({ x: round6(z), y: round6(signalAt(i) * Ps * 1e3) })) },
    { name: "Idler", color: "#f472b6", points: zs.map((z, i) => ({ x: round6(z), y: round6(idlerAt(i) * Ps * 1e3) })) },
  ] : [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Pump λ_p (nm)" value={lambdaPumpRaw} onChange={setLambdaPump} min={200} max={20000} step="any" />
        <ValidatedNumberInput label="Signal λ_s (nm)" value={lambdaSignalRaw} onChange={setLambdaSignal} min={200} max={20000} step="any" />
        <ValidatedNumberInput label="Pump power P_p (mW)" value={pumpPowerRaw} onChange={setPumpPower} min={0} max={1e7} step="any" />
        <ValidatedNumberInput label="Signal seed power P_s (mW)" value={seedPowerRaw} onChange={setSeedPower} min={0} max={1e6} step="any" />
        <ValidatedNumberInput label="n₂ (×10⁻²⁰ m²/W)" value={n2Raw} onChange={setN2} min={0} max={1e4} step="any" />
        <ValidatedNumberInput label="Effective area A_eff (µm²)" value={areaRaw} onChange={setArea} min={0.1} max={1e5} step="any" />
        <ValidatedNumberInput label="Fiber length L (m)" value={lengthRaw} onChange={setLength} min={0.001} max={1e5} step="any" />
        <ValidatedNumberInput label="β₂ at the pump (ps²/km)" value={beta2Raw} onChange={setBeta2} min={-1e4} max={1e4} step="any" />
        <ValidatedNumberInput label="β₄ at the pump (ps⁴/km)" value={beta4Raw} onChange={setBeta4} min={-1e3} max={1e3} step="any" />
        <ValidatedNumberInput label="Fiber loss α (dB/km)" value={lossRaw} onChange={setLoss} min={0} max={1e4} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Signal gain G_s" value={Number.isFinite(gain) ? `${fmt(dB(gain), 4)} dB` : "—"}
          subtext={lossy ? "net of fiber loss on signal and pump" : Number.isFinite(g) ? `gain coefficient g = ${fmt(g * 1e3, 4)} /km` : "outside the gain band: G oscillates with L"} tone="blue" />
        <ResultCard label="Idler λ_i and power" value={valid ? `${fmt(lambdaI * 1e9, 6)} nm` : "—"}
          subtext={valid ? `P_i = ${fmtPower(Pi)} = (λ_s/λ_i)(G_s − 1)P_s` : "needs λ_s > λ_p/2"} tone="green" />
        <ResultCard label="Nonlinear coefficient γ" value={`${fmt(gamma * 1e3, 4)} /(W·km)`} subtext={`γP_pL = ${fmt(gammaP * L, 4)} rad`} tone="purple" />
        <ResultCard label="Phase mismatch κ = Δβ + 2γP_p" value={`${fmt(kappa * 1e3, 4)} /km`} subtext={`linear Δβ = β₂Ω² + β₄Ω⁴/12 = ${fmt(deltaBeta * 1e3, 4)} /km`} tone="orange" />
        <ResultCard label={lossy ? "Gain where κ = 0 at the input" : "Peak gain (κ = 0)"} value={Number.isFinite(omegaPk) ? `${fmt(dB(peakGain), 4)} dB` : "—"}
          subtext={Number.isFinite(omegaPk) ? `${lossy ? "net, with loss" : "cosh²(γP_pL)"} at ±${fmt(omegaPk / (2 * Math.PI * 1e12), 4)} THz (λ_s ≈ λ_p + ${fmt(peakShift * 1e9, 4)} nm)` : "no phase-matched detuning"} tone="cyan" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>Two pump photons at ω_p become a signal and an idler photon, 2ω_p = ω_s + ω_i. With an undepleted CW pump the
          signal grows as G_s = 1 + [(γP_p/g) sinh(gL)]², with g² = (γP_p)² − (κ/2)² and κ = Δβ + 2γP_p: the linear
          mismatch Δβ = β_s + β_i − 2β_p plus the pump&apos;s self- and cross-phase modulation. Gain is exponential where
          |κ| &lt; 2γP_p and peaks at cosh²(γP_pL) where κ = 0, which needs anomalous dispersion at the pump. Far outside the
          band G − 1 tends to (γP_pL)² sinc²(κL/2), κ = Δβ + 2γP_p; for a weak pump κ → Δβ. The defaults are a
          500 m highly nonlinear fiber pumped with 1 W just on the anomalous side of its zero-dispersion wavelength. With fiber
          loss α the pump decays as P_p e^(−αz), so γP_p and κ change along the fiber: the coupled equations are integrated
          numerically (exact transfer matrices over short segments) and the gains are net of the signal&apos;s own loss; in the weak-pump limit the idler follows
          Inoue&apos;s (γP_pL_eff)² η. Polarization and Raman gain are not modelled.</p>
        {warnings.map((msg) => <p key={msg} className="text-yellow-400">{msg}</p>)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {spectrumSeries.length > 0 && (
          <SimpleLineChart title="Signal gain spectrum" xLabel="Signal wavelength (nm)" yLabel="G_s (dB)" series={[...spectrumSeries, ...marker]} />
        )}
        {lengthSeries.length > 0 && (
          <SimpleLineChart title="Signal and idler power along the fiber" xLabel="Length z (m)" yLabel="Power (mW)" yScale="log" series={lengthSeries} />
        )}
      </div>
    </>
  );
}
