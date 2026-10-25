"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { gParameter, resonatorStability, twoMirrorMode } from "../../../physics/wave-optics/two-mirror-resonator";
import { radiusAtDistance } from "../../../physics/wave-optics/gaussian-beam";
import {
  fourLevelGain, fourLevelSlopeEfficiency, fourLevelThreshold, gaussianOverlapArea, laserOutput, roundTripLoss,
  saturationIntensity, tripletGainFactor,
} from "../../../physics/wave-optics/laser-resonator";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));

export default function DyeLaserResonatorPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 590); // nm
  const [pumpWavelengthRaw, setPumpWavelength] = useURLState("pumpWavelength", 532); // nm
  const [pumpRaw, setPump] = useURLState("pump", 3); // W absorbed
  const [etaRaw, setEta] = useURLState("etaP", 1);
  const [wpRaw, setWp] = useURLState("pumpSpot", 30); // µm
  const [sigmaRaw, setSigma] = useURLState("sigmaE", 1.1); // 1e-16 cm², Rh6G in ethanol at 590 nm (Falkenstein 1978 Fig. 6)
  const [tauRaw, setTau] = useURLState("tau", 4.2); // ns (Falkenstein 1978)
  const [sigmaTRaw, setSigmaT] = useURLState("sigmaT", 3.7); // 1e-17 cm², ε_T(590) = 9.7e3 /(M cm) (Pavlopoulos & Golich 1988)
  const [kstRaw, setKst] = useURLState("kST", 3.4); // 1e6 /s, air-saturated ethanol (Webb 1970)
  const [tauTRaw, setTauT] = useURLState("tauT", 0.25); // µs, air-saturated ethanol (Webb 1970)
  const [flowRaw, setFlow] = useURLState("flowSpeed", 5); // m/s
  const [lRaw, setL] = useURLState("cavityLength", 99); // mm
  const [r1Raw, setR1] = useURLState("R1", 50); // mm
  const [r2Raw, setR2] = useURLState("R2", 50); // mm
  const [rOcRaw, setROc] = useURLState("R_oc", 0.97);
  const [lossRaw, setLoss] = useURLState("loss", 1); // % per pass

  const lambda = clamp(wavelengthRaw, 300, 1200, 590) * 1e-9;
  const lambdaP = clamp(pumpWavelengthRaw, 200, 1200, 532) * 1e-9;
  const pump = clamp(pumpRaw, 0, 1e3, 3);
  const etaP = clamp(etaRaw, 0.01, 1, 1);
  const wp = clamp(wpRaw, 1, 1e4, 30) * 1e-6;
  const sigmaE = clamp(sigmaRaw, 1e-3, 100, 1.1) * 1e-20; // 1e-16 cm² → m²
  const tau = clamp(tauRaw, 0.01, 1e3, 4.2) * 1e-9;
  const sigmaT = clamp(sigmaTRaw, 0, 1e3, 3.7) * 1e-21; // 1e-17 cm² → m²
  const kST = clamp(kstRaw, 0, 1e4, 3.4) * 1e6;
  const tauT = clamp(tauTRaw, 1e-3, 1e6, 0.25) * 1e-6;
  const flow = clamp(flowRaw, 0.01, 100, 5);
  const L = clamp(lRaw, 1, 1e4, 99) * 1e-3;
  const R1_mm = clamp(r1Raw, -1e7, 1e7, 50);
  const R2_mm = clamp(r2Raw, -1e7, 1e7, 50);
  const R_oc = clamp(rOcRaw, 0.01, 0.9999, 0.97);
  const internal = -Math.log(1 - clamp(lossRaw, 0, 50, 1) / 100); // single pass, nepers

  const toRadius = (R_mm: number) => (R_mm === 0 ? Infinity : R_mm * 1e-3);
  const g1 = gParameter(L, toRadius(R1_mm));
  const g2 = gParameter(L, toRadius(R2_mm));
  const stability = resonatorStability(g1, g2);
  const mode = twoMirrorMode(lambda, L, g1, g2);
  const statusTone = stability === "stable" ? "green" : stability === "marginal" ? "yellow" : "red";

  // Jet at the waist: triplets live τ_eff while the flow carries them across the pump spot (transit 2wₚ/v).
  const factorAt = (v: number) => tripletGainFactor(sigmaE, sigmaT, kST, tauT, (2 * wp) / v);
  const factor = factorAt(flow);
  const sigmaNet = sigmaE * factor;
  const pumpArea = gaussianOverlapArea(mode.w0, wp);
  const modeArea = (Math.PI * mode.w0 * mode.w0) / 2;
  const delta = roundTripLoss(1, R_oc, internal);
  const pTh = factor > 0 ? fourLevelThreshold(delta, lambdaP, sigmaNet, tau, pumpArea, etaP) : NaN;
  const gainAt = (p: number) => (factor > 0 ? fourLevelGain(p, lambdaP, sigmaNet, tau, pumpArea, etaP) : NaN);
  const g0l = gainAt(pump);
  const iSat = saturationIntensity(lambda, sigmaE, tau);
  const pSat = iSat * modeArea;
  const pOut = laserOutput(g0l, 1, R_oc, internal, pSat);
  // The gain grows with the net cross-section but saturates through σₑ, so triplets scale the slope by the same factor.
  const slope = factor > 0 ? factor * fourLevelSlopeEfficiency(lambda, lambdaP, 1, R_oc, internal, modeArea, pumpArea, etaP) : NaN;

  const pMax = Math.max(2 * pump, 1.5 * (Number.isFinite(pTh) ? pTh : 0), 0.1);
  const powerSeries = [
    {
      name: "Output power",
      color: "#60a5fa",
      points: factor > 0 && Number.isFinite(pSat)
        ? Array.from({ length: 101 }, (_, i) => {
            const p = (pMax * i) / 100;
            return { x: round6(p), y: round6(laserOutput(gainAt(p), 1, R_oc, internal, pSat)) };
          })
        : [],
    },
    { name: "Operating point", color: "#facc15", showPoints: true, points: Number.isFinite(pOut) ? [{ x: round6(pump), y: round6(pOut) }] : [] },
  ];

  const vMax = Math.max(20, 2 * flow);
  const flowSeries = [
    {
      name: "Gain left after triplet absorption",
      color: "#f87171",
      points: Array.from({ length: 101 }, (_, i) => {
        const v = (vMax * (i + 1)) / 101;
        return { x: round6(v), y: round6(factorAt(v) * 100) };
      }),
    },
    { name: "This flow speed", color: "#facc15", showPoints: true, points: Number.isFinite(factor) ? [{ x: round6(flow), y: round6(factor * 100) }] : [] },
  ];

  const profileSeries = [
    {
      name: "TEM₀₀ radius w(z)",
      color: "#a78bfa",
      points: Number.isFinite(mode.w0)
        ? Array.from({ length: 201 }, (_, i) => {
            const z = (L * i) / 200;
            return { x: round6(z * 1e3), y: round6(radiusAtDistance(mode.w0, mode.zR, z - mode.z1) * 1e6) };
          })
        : [],
    },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Laser wavelength λ (nm)" value={wavelengthRaw} onChange={setWavelength} min={300} max={1200} step="any" />
        <ValidatedNumberInput label="Emission cross-section σₑ (10⁻¹⁶ cm²)" value={sigmaRaw} onChange={setSigma} min={1e-3} max={100} step="any" />
        <ValidatedNumberInput label="Singlet lifetime τ (ns)" value={tauRaw} onChange={setTau} min={0.01} max={1000} step="any" />
        <ValidatedNumberInput label="Triplet absorption σ_T at λ (10⁻¹⁷ cm²)" value={sigmaTRaw} onChange={setSigmaT} min={0} max={1000} step="any" />
        <ValidatedNumberInput label="Intersystem crossing rate k_ST (10⁶ s⁻¹)" value={kstRaw} onChange={setKst} min={0} max={1e4} step="any" />
        <ValidatedNumberInput label="Triplet lifetime τ_T (µs)" value={tauTRaw} onChange={setTauT} min={1e-3} max={1e6} step="any" />
        <ValidatedNumberInput label="Pump wavelength λₚ (nm)" value={pumpWavelengthRaw} onChange={setPumpWavelength} min={200} max={1200} step="any" />
        <ValidatedNumberInput label="Pump power absorbed in the jet (W)" value={pumpRaw} onChange={setPump} min={0} max={1000} step="any" />
        <ValidatedNumberInput label="Pump efficiency ηₚ" value={etaRaw} onChange={setEta} min={0.01} max={1} step="any" />
        <ValidatedNumberInput label="Pump spot radius wₚ in the jet (µm)" value={wpRaw} onChange={setWp} min={1} max={1e4} step="any" />
        <ValidatedNumberInput label="Jet flow speed v (m/s)" value={flowRaw} onChange={setFlow} min={0.01} max={100} step="any" />
        <ValidatedNumberInput label="Mirror spacing L (mm)" value={lRaw} onChange={setL} min={1} max={1e4} step="any" />
        <ValidatedNumberInput label="Mirror 1 radius R₁ (mm; 0 = flat)" value={r1Raw} onChange={setR1} min={-1e7} max={1e7} step="any" />
        <ValidatedNumberInput label="Mirror 2 radius R₂ (mm; 0 = flat)" value={r2Raw} onChange={setR2} min={-1e7} max={1e7} step="any" />
        <ValidatedNumberInput label="Output coupler reflectance" value={rOcRaw} onChange={setROc} min={0.01} max={0.9999} step="any" />
        <ValidatedNumberInput label="Other loss per pass (%: jet surfaces, scatter)" value={lossRaw} onChange={setLoss} min={0} max={50} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <ResultCard label="g₁g₂" value={fmt(g1 * g2)} subtext={`g₁ = ${fmt(g1)}, g₂ = ${fmt(g2)}; ${stability}`} tone={statusTone} />
        <ResultCard label="TEM₀₀ waist w₀ (in the jet)" value={`${fmt(mode.w0 * 1e6)} µm`} subtext={`${fmt(mode.z1 * 1e3)} mm from mirror 1`} tone="green" />
        <ResultCard label="Gain left after triplet absorption" value={`${fmt(factor * 100)} %`} subtext={`Flow transit 2wₚ/v = ${fmt((2 * wp) / flow * 1e6)} µs`} tone={factor > 0 ? "cyan" : "red"} />
        <ResultCard label="Round-trip loss δ" value={`${fmt(delta * 100)} %`} subtext="−ln R_OC + 2 × loss per pass" tone="orange" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Threshold pump power" value={`${fmt(pTh)} W`} subtext={`Overlap area π(w₀² + wₚ²)/2 = ${fmt(pumpArea * 1e12)} µm²`} tone="red" />
        <ResultCard label="Small-signal gain g₀l" value={fmt(g0l)} subtext={`Single pass at ${fmt(pump)} W; threshold δ/2 = ${fmt(delta / 2)}`} tone="blue" />
        <ResultCard label="Output power" value={`${fmt(pOut)} W`} subtext={`I_sat = hc/(λσₑτ) = ${fmt(iSat / 1e7)} kW/cm²`} tone="yellow" />
        <ResultCard label="Slope efficiency" value={`${fmt(slope * 100)} %`} subtext={`Quantum defect limit λₚ/λ = ${fmt((lambdaP / lambda) * 100)} %`} tone="purple" />
      </div>

      {!(factor > 0) && (
        <p className="mb-6 rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">
          Triplet absorption exceeds the singlet gain (σ_T k_ST τ_eff ≥ σₑ): the dye cannot lase CW. Flow faster, focus the pump
          tighter or quench the triplets (shorter τ_T).
        </p>
      )}
      {stability !== "stable" && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          The cavity is {stability === "unstable" ? "unstable" : "on the stability boundary"}: there is no TEM₀₀ mode, so no waist,
          threshold or output.
        </p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>Gain cross-section net of triplets: σₑ − σ_T k_ST τ_eff, τ_eff = (1/τ_T + v/(2wₚ))⁻¹. The pumped jet (pump fully absorbed) gives
          g₀l = ηₚ(σₑ − σ_T k_ST τ_eff)τPₚλₚ/(hcA), A = π(w₀² + wₚ²)/2, so the jet thickness cancels.</p>
        <p>Threshold g₀l = δ/2; output from Rigrod with the saturation power I_sat πw₀²/2.</p>
        <p>Default dye: rhodamine 6G in ethanol. σₑ(590 nm) = 1.1 × 10⁻¹⁶ cm², read off Fig. 6, and τ = 4.2 ns (Falkenstein, Penzkofer &amp;
          Kaiser 1978); σ_T(590 nm) = 3.7 × 10⁻¹⁷ cm² from ε_T = 9.7 × 10³ M⁻¹cm⁻¹, measured in a 77 K glass (Pavlopoulos &amp; Golich 1988);
          k_ST = 3.4 × 10⁶ s⁻¹ and τ_T = 0.25 µs in air-saturated ethanol, where dissolved O₂ quenches the triplets (Webb et al. 1970;
          degassed solutions keep them much longer). Together K_T = k_ST τ_T σ_T/σₑ = 0.29, against 0.35 ± 0.02 measured in a CW laser
          (Phillion, Kuizenga &amp; Siegman 1974, water with Triton X-100).</p>
      </div>

      <div className="space-y-6">
        {powerSeries[0].points.length > 0 && <SimpleLineChart title="Output power versus absorbed pump power" xLabel="Absorbed pump power (W)" yLabel="Output power (W)" series={powerSeries} />}
        <SimpleLineChart title="Singlet gain left after triplet absorption versus flow speed (below 0 % no CW lasing)" xLabel="Flow speed (m/s)" yLabel="Gain left (%)" series={flowSeries} />
        {profileSeries[0].points.length > 0 && <SimpleLineChart title="TEM₀₀ beam radius between the mirrors" xLabel="Position from mirror 1 (mm)" yLabel="Beam radius (µm)" series={profileSeries} />}
      </div>
    </>
  );
}
