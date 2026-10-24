"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { parametricGainCoefficient } from "../../../physics/wave-optics/optical-parametric-oscillator";
import { gaussianMixingPower, idlerWavelength, mixingEfficiency } from "../../../physics/wave-optics/three-wave";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const fmtPower = (W: number) => !Number.isFinite(W)
  ? "—"
  : W >= 1 ? `${fmt(W)} W` : W >= 1e-3 ? `${fmt(W * 1e3)} mW` : W >= 1e-6 ? `${fmt(W * 1e6)} µW` : `${fmt(W * 1e9)} nW`;

export default function DifferenceFrequencyPage() {
  const [lambdaPumpRaw, setLambdaPump] = useURLState("lambdaPump", 1064); // nm
  const [lambdaSignalRaw, setLambdaSignal] = useURLState("lambdaSignal", 1550); // nm
  const [deffRaw, setDeff] = useURLState("deff", 12.4); // pm/V, 2d₃₃/π of LiNbO₃ (Shoji 1997)
  const [lengthRaw, setLength] = useURLState("crystalLength", 20); // mm
  const [pumpPowerRaw, setPumpPower] = useURLState("pumpPower", 500); // mW
  const [signalPowerRaw, setSignalPower] = useURLState("signalPower", 10); // mW
  const [waistRaw, setWaist] = useURLState("beamWaist", 100); // µm
  const [nPumpRaw, setNPump] = useURLState("nPump", 2.1555);
  const [nSignalRaw, setNSignal] = useURLState("nSignal", 2.1376);
  const [nIdlerRaw, setNIdler] = useURLState("nIdler", 2.0814);
  const [deltaKRaw, setDeltaK] = useURLState("deltaK", 0); // rad/mm

  const lambdaP = clamp(lambdaPumpRaw, 200, 20000, 1064) * 1e-9;
  const lambdaS = clamp(lambdaSignalRaw, 200, 20000, 1550) * 1e-9;
  const deff = clamp(deffRaw, 0, 1000, 12.4) * 1e-12;
  const L = clamp(lengthRaw, 0.01, 1000, 20) * 1e-3;
  const Pp = clamp(pumpPowerRaw, 0, 1e9, 500) * 1e-3;
  const Ps = clamp(signalPowerRaw, 0, 1e9, 10) * 1e-3;
  const w = clamp(waistRaw, 1, 1e5, 100) * 1e-6;
  const nP = clamp(nPumpRaw, 1, 5, 2.1555);
  const nS = clamp(nSignalRaw, 1, 5, 2.1376);
  const nI = clamp(nIdlerRaw, 1, 5, 2.0814);
  const deltaK = clamp(deltaKRaw, -1e4, 1e4, 0) * 1e3;

  const lambdaI = idlerWavelength(lambdaP, lambdaS);
  const valid = Number.isFinite(lambdaI);
  const power = (length: number, dk: number) =>
    gaussianMixingPower(mixingEfficiency({ lambdaOut: lambdaI, length, deff, n1: nP, n2: nS, nOut: nI, deltaK: dk }), Pp, Ps, w, w);
  const Pi = power(L, deltaK);
  const normalized = Pp > 0 && Ps > 0 ? Pi / (Pp * Ps) : NaN;
  // Δk = 2π(n_p/λ_p − n_s/λ_s − n_i/λ_i) without phase matching; first-order QPM period 2π/|Δk|.
  const deltaKMaterial = 2 * Math.PI * (nP / lambdaP - nS / lambdaS - nI / lambdaI);
  const qpmPeriod = (2 * Math.PI) / Math.abs(deltaKMaterial);
  // On-axis parametric gain ΓL at the Gaussian peak intensity 2P_p/(πw²): the low-gain law needs ΓL ≪ 1.
  const gamma = parametricGainCoefficient(
    { lambdaPump: lambdaP, lambdaSignal: lambdaS, dEff: Math.max(deff, 1e-30), nPump: nP, nSignal: nS, nIdler: nI },
    (2 * Pp) / (Math.PI * w * w),
  );
  const gammaL = gamma * L;
  const bMin = Math.min((2 * Math.PI * nP * w * w) / lambdaP, (2 * Math.PI * nS * w * w) / lambdaS);
  const xi = L / bMin;

  const warnings = [
    !valid && "The signal wavelength must be longer than the pump wavelength: the idler is at 1/λ_i = 1/λ_p − 1/λ_s.",
    valid && gammaL > 0.5 && `On-axis gain ΓL = ${fmt(gammaL, 3)}: the signal is amplified as well (G = cosh²ΓL), so the low-gain law underestimates the idler. Use the optical parametric amplifier page.`,
    valid && xi > 0.5 && `L is ${fmt(xi, 3)} times the smaller confocal parameter 2πnw²/λ (${fmt(bMin * 1e3, 3)} mm): the beams change size in the crystal, so the plane-wave value overestimates P_i.`,
  ].filter(Boolean) as string[];

  const lengthCurve = Number.isFinite(Pi) ? [{
    name: "P_i(L)", color: "#34d399",
    points: Array.from({ length: 201 }, (_, i) => (i / 100) * L).map((l) => ({ x: round6(l * 1e3), y: round6(power(l, deltaK) * 1e6) })),
  }] : [];
  const dkSpan = (4 * Math.PI) / L;
  const mismatchCurve = Number.isFinite(Pi) ? [{
    name: "P_i(Δk)", color: "#f472b6",
    points: Array.from({ length: 201 }, (_, i) => ((i - 100) / 100) * dkSpan).map((dk) => ({ x: round6(dk * 1e-3), y: round6(power(L, dk) * 1e6) })),
  }] : [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Pump λ_p (nm)" value={lambdaPumpRaw} onChange={setLambdaPump} min={200} max={20000} step="any" />
        <ValidatedNumberInput label="Signal λ_s (nm)" value={lambdaSignalRaw} onChange={setLambdaSignal} min={200} max={20000} step="any" />
        <ValidatedNumberInput label="d_eff (pm/V)" value={deffRaw} onChange={setDeff} min={0} max={1000} step="any" />
        <ValidatedNumberInput label="Pump power P_p (mW)" value={pumpPowerRaw} onChange={setPumpPower} min={0} max={1e9} step="any" />
        <ValidatedNumberInput label="Signal power P_s (mW)" value={signalPowerRaw} onChange={setSignalPower} min={0} max={1e9} step="any" />
        <ValidatedNumberInput label="Beam radius w, 1/e², both beams (µm)" value={waistRaw} onChange={setWaist} min={1} max={1e5} step="any" />
        <ValidatedNumberInput label="Crystal length L (mm)" value={lengthRaw} onChange={setLength} min={0.01} max={1000} step="any" />
        <ValidatedNumberInput label="n_p at λ_p" value={nPumpRaw} onChange={setNPump} min={1} max={5} step="any" />
        <ValidatedNumberInput label="n_s at λ_s" value={nSignalRaw} onChange={setNSignal} min={1} max={5} step="any" />
        <ValidatedNumberInput label="n_i at λ_i" value={nIdlerRaw} onChange={setNIdler} min={1} max={5} step="any" />
        <ValidatedNumberInput label="Residual Δk after phase matching (rad/mm)" value={deltaKRaw} onChange={setDeltaK} min={-1e4} max={1e4} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Idler power P_i" value={fmtPower(Pi)} subtext="η·2P_pP_s/(π(w_p² + w_s²)), low gain" tone="green" />
        <ResultCard label="Idler wavelength λ_i" value={valid ? `${fmt(lambdaI * 1e9, 5)} nm` : "—"} subtext={valid ? `1/λ_i = 1/λ_p − 1/λ_s; ${fmt(1e-2 / lambdaI, 5)} cm⁻¹` : "needs λ_s > λ_p"} tone="blue" />
        <ResultCard label="Normalized efficiency" value={`${fmt(normalized * 100, 3)} %/W`} subtext={`P_i/(P_pP_s); on-axis ΓL = ${fmt(gammaL, 3)}`} tone="orange" />
        <ResultCard label="First-order QPM period" value={valid ? `${fmt(qpmPeriod * 1e6, 4)} µm` : "—"} subtext={valid ? `2π/|Δk| from the indices; coherence length ${fmt(qpmPeriod * 5e5, 4)} µm` : "needs λ_s > λ_p"} tone="cyan" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>A strong pump at ω_p and a weaker signal at ω_s generate the idler at ω_i = ω_p − ω_s, usually in the mid-infrared.
          With both inputs undepleted and the signal not yet amplified, I_i = 8π² d_eff² L² sinc²(ΔkL/2) I_pI_s/(ε₀ c n_pn_sn_i λ_i²):
          the sum-frequency law with the idler wavelength. Integrated over two Gaussian beams of equal radius w it gives
          P_i = η P_pP_s/(πw²). Each idler photon also adds a signal photon. Once ΓL approaches 1 the signal grows too,
          and the process becomes parametric amplification. The defaults are a 1064 nm − 1550 nm → 3.39 µm mixer in
          periodically poled LiNbO₃: extraordinary indices from the Zelmon Sellmeier (21 °C)
          and d_eff = 2d₃₃/π = 12.4 pm/V from d₃₃ = 19.5 pm/V of congruent LiNbO₃ for SHG of 1.313 µm
          (Shoji et al. 1997; 25.2 pm/V at 1.064 µm).</p>
        {warnings.map((msg) => <p key={msg} className="text-yellow-400">{msg}</p>)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {lengthCurve.length > 0 && (
          <SimpleLineChart title="Idler power vs crystal length" xLabel="Crystal length (mm)" yLabel="P_i (µW)" series={lengthCurve} />
        )}
        {mismatchCurve.length > 0 && (
          <SimpleLineChart title="Idler power vs residual phase mismatch" xLabel="Δk (rad/mm)" yLabel="P_i (µW)" series={mismatchCurve} />
        )}
      </div>
    </>
  );
}
