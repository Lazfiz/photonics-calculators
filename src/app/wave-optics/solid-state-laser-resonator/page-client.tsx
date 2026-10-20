"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { gParameter, resonatorStability, twoMirrorMode } from "../../../physics/wave-optics/two-mirror-resonator";
import {
  fourLevelGain, fourLevelSlopeEfficiency, fourLevelThreshold, laserOutput, roundTripLoss, saturationIntensity,
} from "../../../physics/wave-optics/laser-resonator";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));

export default function SolidStateLaserResonatorPage() {
  const [crystalLengthRaw, setCrystalLength] = useURLState("crystalLength", 10); // mm
  const [crystalDiameterRaw, setCrystalDiameter] = useURLState("crystalDiameter", 3); // mm
  const [nRaw, setN] = useURLState("n_crystal", 1.82);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1064); // nm
  const [pumpWavelengthRaw, setPumpWavelength] = useURLState("pumpWavelength", 808); // nm
  const [pumpRaw, setPump] = useURLState("pump", 20); // W absorbed
  const [etaRaw, setEta] = useURLState("etaP", 1);
  const [sigmaRaw, setSigma] = useURLState("sigma", 2.8); // 1e-19 cm²
  const [tauRaw, setTau] = useURLState("tau", 230); // µs
  const [r1Raw, setR1] = useURLState("R1", 0); // mm, 0 = flat
  const [r2Raw, setR2] = useURLState("R2", 200); // mm
  const [lCavRaw, setLCav] = useURLState("L_cav", 150); // mm
  const [rOcRaw, setROc] = useURLState("R_oc", 0.95);
  const [rHrRaw, setRHr] = useURLState("R_hr", 0.999);
  const [alphaRaw, setAlpha] = useURLState("alpha_c", 0.001); // cm⁻¹

  const l_mm = clamp(crystalLengthRaw, 0.1, 300, 10);
  const d_mm = clamp(crystalDiameterRaw, 0.1, 50, 3);
  const n = clamp(nRaw, 1, 4, 1.82);
  const lambda_nm = clamp(wavelengthRaw, 300, 5000, 1064);
  const lambdaP_nm = clamp(pumpWavelengthRaw, 200, 5000, 808);
  const pump = clamp(pumpRaw, 0, 1e5, 20);
  const etaP = clamp(etaRaw, 0.01, 1, 1);
  const sigma = clamp(sigmaRaw, 1e-4, 1e4, 2.8) * 1e-23; // 1e-19 cm² → m²
  const tau = clamp(tauRaw, 1e-3, 1e5, 230) * 1e-6;
  const R1_mm = clamp(r1Raw, -1e7, 1e7, 0);
  const R2_mm = clamp(r2Raw, -1e7, 1e7, 200);
  const L_mm = clamp(lCavRaw, 0.1, 1e5, 150);
  const R_oc = clamp(rOcRaw, 0.01, 0.9999, 0.95);
  const R_hr = clamp(rHrRaw, 0.01, 1, 0.999);
  const alpha = clamp(alphaRaw, 0, 10, 0.001); // cm⁻¹

  // The crystal (index n, against the HR) shortens the cavity's effective length to L − l(1 − 1/n).
  const l = l_mm * 1e-3;
  const L = L_mm * 1e-3;
  const fits = l < L;
  const Leff = fits ? L - l * (1 - 1 / n) : NaN;
  const toRadius = (R_mm: number) => (R_mm === 0 ? Infinity : R_mm * 1e-3);
  const g1 = gParameter(Leff, toRadius(R1_mm));
  const g2 = gParameter(Leff, toRadius(R2_mm));
  const stability = resonatorStability(g1, g2);
  const lambda = lambda_nm * 1e-9;
  const lambdaP = lambdaP_nm * 1e-9;
  const mode = twoMirrorMode(lambda, Leff, g1, g2);
  const radiusAt = (u: number) => mode.w0 * Math.sqrt(1 + ((u - mode.z1) / mode.zR) ** 2); // u: reduced position
  const toPhysical = (u: number) => (u <= l / n ? u * n : u + l * (1 - 1 / n));
  const waistPos = toPhysical(mode.z1);
  const rodSpot = Math.max(radiusAt(0), radiusAt(l / n)); // w(u) is convex: the largest spot in the rod is at a face

  // Rod pumped uniformly over its cross-section, multimode output filling it.
  const rodArea = Math.PI * (d_mm * 5e-4) ** 2;
  const internal = alpha * 100 * l; // single-pass loss αl, nepers
  const delta = roundTripLoss(R_hr, R_oc, internal);
  const pTh = fourLevelThreshold(delta, lambdaP, sigma, tau, rodArea, etaP);
  const g0l = fourLevelGain(pump, lambdaP, sigma, tau, rodArea, etaP);
  const iSat = saturationIntensity(lambda, sigma, tau);
  const pSat = iSat * rodArea;
  const pOut = laserOutput(g0l, R_hr, R_oc, internal, pSat);
  const slope = fourLevelSlopeEfficiency(lambda, lambdaP, R_hr, R_oc, internal, rodArea, rodArea, etaP);
  const statusTone = stability === "stable" ? "green" : stability === "marginal" ? "yellow" : "red";

  const pMax = Math.max(2 * pump, 1.5 * (Number.isFinite(pTh) ? pTh : 0), 1);
  const outputCurve = Array.from({ length: 101 }, (_, i) => {
    const p = (pMax * i) / 100;
    return { x: round6(p), y: round6(laserOutput(fourLevelGain(p, lambdaP, sigma, tau, rodArea, etaP), R_hr, R_oc, internal, pSat)) };
  });
  const powerSeries = [
    { name: "Output power", color: "#60a5fa", points: outputCurve },
    { name: "Operating point", color: "#facc15", showPoints: true, points: Number.isFinite(pOut) ? [{ x: round6(pump), y: round6(pOut) }] : [] },
  ];

  const profile = Number.isFinite(mode.w0)
    ? Array.from({ length: 201 }, (_, i) => {
        const z = (L * i) / 200;
        const u = z <= l ? z / n : z - l * (1 - 1 / n);
        return { x: round6(z * 1e3), y: round6(radiusAt(u) * 1e6) };
      })
    : [];
  const rodEdge = (d_mm / 2) * 1e3;
  const profileSeries = [
    { name: "TEM₀₀ radius w(z)", color: "#34d399", points: profile },
    { name: "Crystal (rod radius)", color: "#9ca3af", dashed: true, points: profile.length ? [{ x: 0, y: round6(rodEdge) }, { x: round6(l_mm), y: round6(rodEdge) }] : [] },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Crystal length l (mm)" value={crystalLengthRaw} onChange={setCrystalLength} min={0.1} max={300} step="any" />
        <ValidatedNumberInput label="Crystal diameter (mm)" value={crystalDiameterRaw} onChange={setCrystalDiameter} min={0.1} max={50} step="any" />
        <ValidatedNumberInput label="Crystal refractive index n" value={nRaw} onChange={setN} min={1} max={4} step="any" />
        <ValidatedNumberInput label="Laser wavelength λ (nm)" value={wavelengthRaw} onChange={setWavelength} min={300} max={5000} step="any" />
        <ValidatedNumberInput label="Emission cross-section σ (10⁻¹⁹ cm²)" value={sigmaRaw} onChange={setSigma} min={1e-4} max={1e4} step="any" />
        <ValidatedNumberInput label="Upper-level lifetime τ (µs)" value={tauRaw} onChange={setTau} min={1e-3} max={1e5} step="any" />
        <ValidatedNumberInput label="Pump wavelength λₚ (nm)" value={pumpWavelengthRaw} onChange={setPumpWavelength} min={200} max={5000} step="any" />
        <ValidatedNumberInput label="Absorbed pump power (W)" value={pumpRaw} onChange={setPump} min={0} max={1e5} step="any" />
        <ValidatedNumberInput label="Pump efficiency ηₚ (upper-level ions per absorbed photon)" value={etaRaw} onChange={setEta} min={0.01} max={1} step="any" />
        <ValidatedNumberInput label="Cavity length L (mm)" value={lCavRaw} onChange={setLCav} min={0.1} max={1e5} step="any" />
        <ValidatedNumberInput label="HR radius R₁ (mm; 0 = flat, < 0 convex)" value={r1Raw} onChange={setR1} min={-1e7} max={1e7} step="any" />
        <ValidatedNumberInput label="Output coupler radius R₂ (mm; 0 = flat)" value={r2Raw} onChange={setR2} min={-1e7} max={1e7} step="any" />
        <ValidatedNumberInput label="Output coupler reflectance" value={rOcRaw} onChange={setROc} min={0.01} max={0.9999} step="any" />
        <ValidatedNumberInput label="HR reflectance" value={rHrRaw} onChange={setRHr} min={0.01} max={1} step="any" />
        <ValidatedNumberInput label="Crystal loss α (cm⁻¹)" value={alphaRaw} onChange={setAlpha} min={0} max={10} step="any" />
      </div>

      {!fits && (
        <p className="mb-6 rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">
          The crystal is longer than the cavity: shorten it or lengthen the cavity.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <ResultCard label="g₁g₂" value={fmt(g1 * g2)} subtext={`g₁ = ${fmt(g1)}, g₂ = ${fmt(g2)}; ${stability}`} tone={statusTone} />
        <ResultCard label="TEM₀₀ waist w₀" value={`${fmt(mode.w0 * 1e6)} µm`} subtext={`${fmt(waistPos * 1e3)} mm from the HR`} tone="green" />
        <ResultCard label="TEM₀₀ spot in the rod" value={`${fmt(rodSpot * 1e6)} µm`} subtext={`Rod radius ${fmt(rodEdge)} µm; spot on OC ${fmt(mode.w2 * 1e6)} µm`} tone="cyan" />
        <ResultCard label="Effective cavity length" value={`${fmt(Leff * 1e3)} mm`} subtext="L − l(1 − 1/n)" tone="blue" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Round-trip loss δ" value={`${fmt(delta * 100)} %`} subtext="−ln(R_HR R_OC) + 2αl" tone="orange" />
        <ResultCard label="Threshold pump power" value={`${fmt(pTh)} W`} subtext={`Small-signal gain g₀l = ${fmt(g0l)} at ${fmt(pump)} W`} tone="red" />
        <ResultCard label="Output power" value={`${fmt(pOut)} W`} subtext={`I_sat = ${fmt(iSat / 1e7)} kW/cm²`} tone="yellow" />
        <ResultCard label="Slope efficiency" value={`${fmt(slope * 100)} %`} subtext={`Quantum defect limit λₚ/λ = ${fmt((lambdaP / lambda) * 100)} %`} tone="purple" />
      </div>

      {stability !== "stable" && fits && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          The cavity is {stability === "unstable" ? "unstable" : "on the stability boundary"}: there is no TEM₀₀ mode. The threshold and
          output still describe a multimode laser only if the cavity confines the light.
        </p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>Four-level rod pumped uniformly over its area A = πd²/4: g₀l = ηₚστPₚλₚ/(hcA), threshold Pₜₕ = δhcA/(2ηₚστλₚ), I_sat = hc/(λστ).</p>
        <p>Rigrod output P = I_sat A (1 − R₂)√R₁′(g₀l + ln√(R₁′R₂))/((√R₁′ + √R₂)(1 − √(R₁′R₂))), R₁′ = R_HR e⁻²ᵅˡ; for small losses
          P ≈ I_sat A (T/2)(2g₀l/δ − 1).</p>
        <p>TEM₀₀ mode: Kogelnik–Li with the crystal (against the HR) folded into the effective length L − l(1 − 1/n).</p>
      </div>

      <div className="space-y-6">
        <SimpleLineChart title="Output power versus absorbed pump power" xLabel="Absorbed pump power (W)" yLabel="Output power (W)" series={powerSeries} />
        {profile.length > 0 && <SimpleLineChart title="TEM₀₀ beam radius along the cavity (crystal against the HR at z = 0)" xLabel="Position from the HR (mm)" yLabel="Beam radius (µm)" series={profileSeries} />}
      </div>
    </>
  );
}
