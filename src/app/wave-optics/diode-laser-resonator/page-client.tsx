"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c } from "../../../physics/constants";
import {
  differentialEfficiency, facetShare, gaussianFarField, logGainCarrierDensity, mirrorLoss, modeSpacing, radiativeShare, recombinationRate,
  slopeEfficiency, thresholdCurrent, thresholdModalGain,
} from "../../../physics/wave-optics/diode-laser";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const DEG = 180 / Math.PI;

export default function DiodeLaserResonatorPage() {
  const [lengthRaw, setLength] = useURLState("cavityLength", 300); // µm
  const [stripeRaw, setStripe] = useURLState("stripeWidth", 3); // µm
  const [thicknessRaw, setThickness] = useURLState("activeThickness", 24); // nm, total well thickness
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 980); // nm
  const [alphaRaw, setAlpha] = useURLState("alpha_i", 10); // 1/cm
  const [r1Raw, setR1] = useURLState("mirrorR1", 0.32); // rear facet
  const [r2Raw, setR2] = useURLState("mirrorR2", 0.32); // front facet
  const [gammaRaw, setGamma] = useURLState("gamma", 0.06);
  const [etaIRaw, setEtaI] = useURLState("etaI", 0.8);
  const [g0Raw, setG0] = useURLState("g0", 1200); // 1/cm
  const [nTrRaw, setNTr] = useURLState("Ntr", 1.8); // 1e18 cm⁻³
  const [aRaw, setA] = useURLState("A", 4e8); // 1/s
  const [bRaw, setB] = useURLState("B", 1e-10); // cm³/s
  const [cRaw, setC] = useURLState("C", 3.5e-30); // cm⁶/s
  const [wPerpRaw, setWPerp] = useURLState("wPerp", 0.5); // µm
  const [wParRaw, setWPar] = useURLState("wPar", 2); // µm
  const [ngRaw, setNg] = useURLState("ng", 3.9);

  const L = clamp(lengthRaw, 20, 1e4, 300) * 1e-6;
  const w = clamp(stripeRaw, 0.5, 500, 3) * 1e-6;
  const d = clamp(thicknessRaw, 1, 1000, 24) * 1e-9;
  const lambda = clamp(wavelengthRaw, 300, 3000, 980) * 1e-9;
  const alphaI = clamp(alphaRaw, 0, 100, 10) * 100; // 1/m
  const R1 = clamp(r1Raw, 0.001, 1, 0.32);
  const R2 = clamp(r2Raw, 0.001, 1, 0.32);
  const gamma = clamp(gammaRaw, 0.001, 1, 0.06);
  const etaI = clamp(etaIRaw, 0.01, 1, 0.8);
  const g0 = clamp(g0Raw, 1, 1e5, 1200) * 100; // 1/m
  const nTr = clamp(nTrRaw, 0.01, 100, 1.8) * 1e24; // 1/m³
  const A = clamp(aRaw, 0, 1e10, 4e8);
  const B = clamp(bRaw, 0, 1e-8, 1e-10) * 1e-6; // m³/s
  const C = clamp(cRaw, 0, 1e-27, 3.5e-30) * 1e-12; // m⁶/s
  const wPerp = clamp(wPerpRaw, 0.05, 100, 0.5) * 1e-6;
  const wPar = clamp(wParRaw, 0.05, 500, 2) * 1e-6;
  const ng = clamp(ngRaw, 1, 6, 3.9);

  const alphaM = mirrorLoss(L, R1, R2);
  const gTh = thresholdModalGain(alphaI, L, R1, R2);
  const nTh = logGainCarrierDensity(gTh / gamma, g0, nTr);
  const iTh = thresholdCurrent(w * d * L, nTh, A, B, C, etaI);
  const jTh = iTh / (w * L); // A/m²
  const tauN = nTh / recombinationRate(nTh, A, B, C);
  const radShare = radiativeShare(nTh, A, B, C);
  const etaD = differentialEfficiency(etaI, alphaI, alphaM);
  const slope = slopeEfficiency(etaD, lambda);
  const front = facetShare(R1, R2);
  const fast = gaussianFarField(lambda, wPerp);
  const slow = gaussianFarField(lambda, wPar);
  const dLambda = modeSpacing(lambda, ng, L);

  const iMax = Number.isFinite(iTh) ? Math.max(5 * iTh, 1e-3) : 0;
  const liTotal = iMax > 0
    ? Array.from({ length: 121 }, (_, i) => {
        const I = (iMax * i) / 120;
        return { x: round6(I * 1e3), y: round6(Math.max(0, slope * (I - iTh)) * 1e3) };
      })
    : [];
  const liSeries = [
    { name: "Both facets", color: "#60a5fa", points: liTotal },
    { name: "Front facet (R₂)", color: "#34d399", dashed: true, points: Number.isFinite(front) ? liTotal.map((p) => ({ x: p.x, y: round6(p.y * front) })) : [] },
  ];

  // I_th(L): the mirror loss falls as 1/L while the pumped volume grows as L, so the threshold current has a minimum.
  const lengthCurve = Array.from({ length: 160 }, (_, i) => {
    const Lc = (50 + (i * 3950) / 159) * 1e-6;
    const N = logGainCarrierDensity(thresholdModalGain(alphaI, Lc, R1, R2) / gamma, g0, nTr);
    return { x: round6(Lc * 1e6), y: round6(thresholdCurrent(w * d * Lc, N, A, B, C, etaI) * 1e3) };
  }).filter((p) => Number.isFinite(p.y));
  const lengthSeries = [
    { name: "Threshold current", color: "#f97316", points: lengthCurve },
    { name: "This cavity", color: "#facc15", showPoints: true, points: Number.isFinite(iTh) ? [{ x: round6(L * 1e6), y: round6(iTh * 1e3) }] : [] },
  ];

  const farField = (half: number) =>
    Number.isFinite(half)
      ? Array.from({ length: 181 }, (_, i) => {
          const t = (-90 + i) / DEG;
          return { x: -90 + i, y: round6(Math.exp((-2 * t * t) / (half * half))) };
        })
      : [];
  const farSeries = [
    { name: "Fast axis (⊥)", color: "#60a5fa", points: farField(fast.halfAngle) },
    { name: "Slow axis (∥)", color: "#fbbf24", points: farField(slow.halfAngle) },
  ];

  return (
    <>
      <h2 className="text-lg font-semibold mb-3">Cavity</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Cavity length L (µm)" value={lengthRaw} onChange={setLength} min={20} max={1e4} step="any" />
        <ValidatedNumberInput label="Stripe width w (µm)" value={stripeRaw} onChange={setStripe} min={0.5} max={500} step="any" />
        <ValidatedNumberInput label="Rear facet reflectance R₁" value={r1Raw} onChange={setR1} min={0.001} max={1} step="any" />
        <ValidatedNumberInput label="Front facet reflectance R₂" value={r2Raw} onChange={setR2} min={0.001} max={1} step="any" />
        <ValidatedNumberInput label="Internal loss α_i (1/cm)" value={alphaRaw} onChange={setAlpha} min={0} max={100} step="any" />
        <ValidatedNumberInput label="Wavelength λ (nm)" value={wavelengthRaw} onChange={setWavelength} min={300} max={3000} step="any" />
        <ValidatedNumberInput label="Group index n_g" value={ngRaw} onChange={setNg} min={1} max={6} step="any" />
      </div>
      <h2 className="text-lg font-semibold mb-3">Active region (your epitaxy; defaults: three 8 nm InGaAs wells)</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Active thickness d (nm, all wells)" value={thicknessRaw} onChange={setThickness} min={1} max={1000} step="any" />
        <ValidatedNumberInput label="Confinement factor Γ" value={gammaRaw} onChange={setGamma} min={0.001} max={1} step="any" />
        <ValidatedNumberInput label="Injection efficiency η_i" value={etaIRaw} onChange={setEtaI} min={0.01} max={1} step="any" />
        <ValidatedNumberInput label="Gain coefficient g₀ (1/cm)" value={g0Raw} onChange={setG0} min={1} max={1e5} step="any" />
        <ValidatedNumberInput label="Transparency density N_tr (10¹⁸ cm⁻³)" value={nTrRaw} onChange={setNTr} min={0.01} max={100} step="any" />
        <ValidatedNumberInput label="Defect recombination A (1/s)" value={aRaw} onChange={setA} min={0} max={1e10} step="any" />
        <ValidatedNumberInput label="Radiative B (cm³/s)" value={bRaw} onChange={setB} min={0} max={1e-8} step="any" />
        <ValidatedNumberInput label="Auger C (cm⁶/s)" value={cRaw} onChange={setC} min={0} max={1e-27} step="any" />
      </div>
      <h2 className="text-lg font-semibold mb-3">Near field (1/e² intensity radius of the guided mode)</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Fast-axis mode radius w⊥ (µm)" value={wPerpRaw} onChange={setWPerp} min={0.05} max={100} step="any" />
        <ValidatedNumberInput label="Slow-axis mode radius w∥ (µm)" value={wParRaw} onChange={setWPar} min={0.05} max={500} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <ResultCard label="Threshold modal gain Γg_th" value={`${fmt(gTh / 100)} 1/cm`} subtext={`α_i + α_m, mirror loss α_m = ${fmt(alphaM / 100)} 1/cm`} tone="blue" />
        <ResultCard label="Threshold carrier density" value={`${fmt(nTh / 1e24)} × 10¹⁸ cm⁻³`} subtext={`material gain g_th = ${fmt(gTh / gamma / 100)} 1/cm; lifetime ${fmt(tauN * 1e9)} ns`} tone="cyan" />
        <ResultCard label="Threshold current I_th" value={`${fmt(iTh * 1e3)} mA`} subtext={`J_th = ${fmt(jTh / 1e4)} A/cm²; radiative share ${fmt(radShare * 100)} %`} tone="green" />
        <ResultCard label="Differential efficiency η_d" value={`${fmt(etaD * 100)} %`} subtext={`η_i α_m/(α_i + α_m), both facets`} tone="yellow" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Slope efficiency" value={`${fmt(slope)} W/A`} subtext={`${fmt(front * 100)} % of it from the front facet`} tone="purple" />
        <ResultCard label="Fast-axis divergence θ⊥" value={`${fmt(fast.fwhm * DEG)}° FWHM`} subtext={`1/e² half-angle ${fmt(fast.halfAngle * DEG)}°`} tone="red" />
        <ResultCard label="Slow-axis divergence θ∥" value={`${fmt(slow.fwhm * DEG)}° FWHM`} subtext={`1/e² half-angle ${fmt(slow.halfAngle * DEG)}°`} tone="orange" />
        <ResultCard label="Longitudinal mode spacing" value={`${fmt(dLambda * 1e9)} nm`} subtext={`λ²/(2n_gL); c/(2n_gL) = ${fmt(c / (2 * ng * L) / 1e9)} GHz`} tone="cyan" />
      </div>

      {!Number.isFinite(nTh) && Number.isFinite(gTh) && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          The material gain needed, {fmt(gTh / gamma / 100)} 1/cm, is more than 20 g₀: the active region cannot reach threshold in
          this cavity. Lengthen it, raise the facet reflectance or add wells.
        </p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>Γg_th = α_i + ln(1/(R₁R₂))/(2L); g = g₀ ln(N/N_tr) gives N_th = N_tr e^(g_th/g₀).</p>
        <p>I_th = qwdL(AN_th + BN_th² + CN_th³)/η_i; above threshold P = η_d(hc/qλ)(I − I_th), η_d = η_i α_m/(α_i + α_m).</p>
        <p>Front share (1 − R₂)√R₁/((1 − R₂)√R₁ + (1 − R₁)√R₂). Far field of a Gaussian near field: θ₀ = atan(λ/πw), FWHM = √(2 ln 2) θ₀;
          for w⊥ below λ it underestimates the true fast-axis divergence.</p>
        <p>Default material: g₀ = 1200/cm, N_tr = 1.8 × 10¹⁸ cm⁻³, B = 10⁻¹⁰ cm³/s and C = 3.5 × 10⁻³⁰ cm⁶/s from the InGaAs/GaAs
          quantum-well laser model of De Koninck et al. (2025, Suppl. Table 1; g₀ after Tsvid et al. 2008, who measured
          dg/d ln J = 1130/cm at 0.98 µm, a current-density form; B and C after Strand et al. 1995); A = 4 × 10⁸/s and
          n_g = 3.9 from Wenzel et al. (2021, Table I). At threshold the radiative share BN²/(AN + BN² + CN³) is then 44 %, or
          35 % of the injected current with η_i = 0.8. Tsvid et al. measured 40–54 % of the current as spontaneous emission at
          0.98 µm, so this A is on the high side. Their g₀ is per ln J: with J ∝ N^1.55 at this threshold it would be ≈ 1750/cm
          in the carrier-density law.</p>
      </div>

      <div className="space-y-6">
        {liTotal.length > 0 && <SimpleLineChart title="Light–current curve" xLabel="Current (mA)" yLabel="Output power (mW)" series={liSeries} />}
        {lengthCurve.length > 0 && <SimpleLineChart title="Threshold current versus cavity length" xLabel="Cavity length (µm)" yLabel="Threshold current (mA)" series={lengthSeries} />}
        {farSeries[0].points.length > 0 && <SimpleLineChart title="Far-field intensity" xLabel="Angle (°)" yLabel="Relative intensity" series={farSeries} />}
      </div>
    </>
  );
}
