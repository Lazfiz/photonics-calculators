"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { sinc } from "../../../physics/math";
import { confocalParameter } from "../../../physics/imaging/second-harmonic-generation";
import {
  gaussianMixingPower, mixingEfficiency, qpmPeriod as qpmPeriodOf, sumFrequencyWavelength, threeWaveMismatch,
} from "../../../physics/wave-optics/three-wave";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const fmtPower = (W: number) => !Number.isFinite(W)
  ? "—"
  : W >= 1 ? `${fmt(W)} W` : W >= 1e-3 ? `${fmt(W * 1e3)} mW` : W >= 1e-6 ? `${fmt(W * 1e6)} µW` : `${fmt(W * 1e9)} nW`;

export default function SumFrequencyPage() {
  const [lambda1Raw, setLambda1] = useURLState("lambda1", 1064); // nm
  const [lambda2Raw, setLambda2] = useURLState("lambda2", 1550); // nm
  const [deffRaw, setDeff] = useURLState("deff", 12.4); // pm/V, 2d₃₃/π of LiNbO₃ (Shoji 1997)
  const [lengthRaw, setLength] = useURLState("crystalLength", 10); // mm
  const [power1Raw, setPower1] = useURLState("power1", 100); // mW
  const [power2Raw, setPower2] = useURLState("power2", 50); // mW
  const [waistRaw, setWaist] = useURLState("beamWaist", 50); // µm
  const [n1Raw, setN1] = useURLState("n1", 2.1555);
  const [n2Raw, setN2] = useURLState("n2", 2.1376);
  const [n3Raw, setN3] = useURLState("n3", 2.2027);
  const [deltaKRaw, setDeltaK] = useURLState("deltaK", 0); // rad/mm

  const lambda1 = clamp(lambda1Raw, 200, 20000, 1064) * 1e-9;
  const lambda2 = clamp(lambda2Raw, 200, 20000, 1550) * 1e-9;
  const deff = clamp(deffRaw, 0, 1000, 12.4) * 1e-12;
  const L = clamp(lengthRaw, 0.01, 1000, 10) * 1e-3;
  const P1 = clamp(power1Raw, 0, 1e9, 100) * 1e-3;
  const P2 = clamp(power2Raw, 0, 1e9, 50) * 1e-3;
  const w = clamp(waistRaw, 1, 1e5, 50) * 1e-6;
  const n1 = clamp(n1Raw, 1, 5, 2.1555);
  const n2 = clamp(n2Raw, 1, 5, 2.1376);
  const n3 = clamp(n3Raw, 1, 5, 2.2027);
  const deltaK = clamp(deltaKRaw, -1e4, 1e4, 0) * 1e3;

  const lambda3 = sumFrequencyWavelength(lambda1, lambda2);
  const power = (length: number, dk: number) =>
    gaussianMixingPower(mixingEfficiency({ lambdaOut: lambda3, length, deff, n1, n2, nOut: n3, deltaK: dk }), P1, P2, w, w);
  const P3 = power(L, deltaK);
  const phase = (deltaK * L) / 2;
  const sinc2 = sinc(phase) ** 2;
  const normalized = P1 > 0 && P2 > 0 ? P3 / (P1 * P2) : NaN;
  // Index mismatch without phase matching: Δk = 2π(n₃/λ₃ − n₁/λ₁ − n₂/λ₂); first-order QPM period 2π/|Δk|.
  const deltaKMaterial = threeWaveMismatch(n1, lambda1, n2, lambda2, n3, lambda3);
  const qpmPeriod = qpmPeriodOf(deltaKMaterial);
  const bMin = Math.min(confocalParameter(lambda1, n1, w), confocalParameter(lambda2, n2, w));
  const xi = L / bMin;
  // Fraction of the weaker input's photons converted: (P₃/hν₃) / min(P₁/hν₁, P₂/hν₂).
  const photonFraction = P3 * lambda3 / Math.min(P1 * lambda1, P2 * lambda2);

  const warnings = [
    xi > 0.5 && `L is ${fmt(xi, 3)} times the smaller confocal parameter 2πnw²/λ (${fmt(bMin * 1e3, 3)} mm): the beams change size in the crystal, so the plane-wave value overestimates P₃. Widen the beams or use a Boyd–Kleinman focusing model.`,
    photonFraction > 0.1 && `${fmt(photonFraction * 100, 3)} % of the weaker beam's photons are converted: the inputs deplete and the undepleted-input result no longer holds.`,
  ].filter(Boolean) as string[];

  const lengthCurve = Number.isFinite(P3) ? [{
    name: "P₃(L)", color: "#60a5fa",
    points: Array.from({ length: 201 }, (_, i) => (i / 100) * L).map((l) => ({ x: round6(l * 1e3), y: round6(power(l, deltaK) * 1e6) })),
  }] : [];
  const dkSpan = (4 * Math.PI) / L;
  const mismatchCurve = Number.isFinite(P3) ? [{
    name: "P₃(Δk)", color: "#f472b6",
    points: Array.from({ length: 201 }, (_, i) => ((i - 100) / 100) * dkSpan).map((dk) => ({ x: round6(dk * 1e-3), y: round6(power(L, dk) * 1e6) })),
  }] : [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="λ₁ (nm)" value={lambda1Raw} onChange={setLambda1} min={200} max={20000} step="any" />
        <ValidatedNumberInput label="λ₂ (nm)" value={lambda2Raw} onChange={setLambda2} min={200} max={20000} step="any" />
        <ValidatedNumberInput label="d_eff (pm/V)" value={deffRaw} onChange={setDeff} min={0} max={1000} step="any" />
        <ValidatedNumberInput label="P₁ (mW)" value={power1Raw} onChange={setPower1} min={0} max={1e9} step="any" />
        <ValidatedNumberInput label="P₂ (mW)" value={power2Raw} onChange={setPower2} min={0} max={1e9} step="any" />
        <ValidatedNumberInput label="Beam radius w, 1/e², both beams (µm)" value={waistRaw} onChange={setWaist} min={1} max={1e5} step="any" />
        <ValidatedNumberInput label="Crystal length L (mm)" value={lengthRaw} onChange={setLength} min={0.01} max={1000} step="any" />
        <ValidatedNumberInput label="n₁ at λ₁" value={n1Raw} onChange={setN1} min={1} max={5} step="any" />
        <ValidatedNumberInput label="n₂ at λ₂" value={n2Raw} onChange={setN2} min={1} max={5} step="any" />
        <ValidatedNumberInput label="n₃ at λ₃" value={n3Raw} onChange={setN3} min={1} max={5} step="any" />
        <ValidatedNumberInput label="Residual Δk after phase matching (rad/mm)" value={deltaKRaw} onChange={setDeltaK} min={-1e4} max={1e4} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="SFG power P₃" value={fmtPower(P3)} subtext={`η·2P₁P₂/(π(w₁² + w₂²)), sinc²(ΔkL/2) = ${fmt(sinc2, 3)}`} tone="green" />
        <ResultCard label="SFG wavelength λ₃" value={`${fmt(lambda3 * 1e9, 5)} nm`} subtext="1/λ₃ = 1/λ₁ + 1/λ₂" tone="blue" />
        <ResultCard label="Normalized efficiency" value={`${fmt(normalized * 100, 3)} %/W`} subtext={`P₃/(P₁P₂); ${fmt(photonFraction * 100, 3)} % of the weaker beam's photons`} tone="orange" />
        <ResultCard label="First-order QPM period" value={`${fmt(qpmPeriod * 1e6, 4)} µm`} subtext={`2π/|Δk| from the indices; coherence length ${fmt(qpmPeriod * 5e5, 4)} µm`} tone="cyan" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>Two beams at ω₁ and ω₂ drive a polarization at ω₃ = ω₁ + ω₂ in the χ⁽²⁾ crystal. With both inputs undepleted
          and plane waves, I₃ = 8π² d_eff² L² sinc²(ΔkL/2) I₁I₂/(ε₀ c n₁n₂n₃ λ₃²). Integrated over two Gaussian beams of
          equal radius w this gives P₃ = η P₁P₂/(πw²). Without phase matching Δk = 2π(n₃/λ₃ − n₁/λ₁ − n₂/λ₂) and the
          power only oscillates over a coherence length π/|Δk|. Birefringent phase matching or a periodically poled crystal of
          period 2π/|Δk| removes it. The residual Δk input is what is left after that, from tuning or temperature. The defaults
          are a 1064 + 1550 nm → 631 nm mixer in periodically poled LiNbO₃: extraordinary indices from the Zelmon
          Sellmeier (21 °C) and d_eff = 2d₃₃/π = 12.4 pm/V
          from d₃₃ = 19.5 pm/V of congruent LiNbO₃ for SHG of 1.313 µm (Shoji et al. 1997; 25.2 pm/V at 1.064 µm).</p>
        {warnings.map((msg) => <p key={msg} className="text-yellow-400">{msg}</p>)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {lengthCurve.length > 0 && (
          <SimpleLineChart title="SFG power vs crystal length" xLabel="Crystal length (mm)" yLabel="P₃ (µW)" series={lengthCurve} />
        )}
        {mismatchCurve.length > 0 && (
          <SimpleLineChart title="SFG power vs residual phase mismatch" xLabel="Δk (rad/mm)" yLabel="P₃ (µW)" series={mismatchCurve} />
        )}
      </div>
    </>
  );
}
