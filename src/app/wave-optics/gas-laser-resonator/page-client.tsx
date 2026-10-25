"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { gParameter, resonatorStability, twoMirrorMode } from "../../../physics/wave-optics/two-mirror-resonator";
import { radiusAtDistance } from "../../../physics/wave-optics/gaussian-beam";
import { laserOutput, meanSquareRadius, roundTripLoss } from "../../../physics/wave-optics/laser-resonator";
import { optimumOutputCoupler } from "../../../physics/fiber-optics/doped-fiber-gain";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));

const LINES = [
  { label: "HeNe 632.8 nm", nm: 632.8 },
  { label: "HeNe 3.39 µm", nm: 3391.3 },
  { label: "Ar⁺ 514.5 nm", nm: 514.5 },
  { label: "CO₂ 10.6 µm", nm: 10600 },
];

export default function GasLaserResonatorPage() {
  const [diameterRaw, setDiameter] = useURLState("tubeDiameter", 6); // mm bore
  const [lengthRaw, setLength] = useURLState("tubeLength", 500); // mm, mirror spacing
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 632.8, { min: 100, max: 20000 }); // nm
  const [r1Raw, setR1] = useURLState("R1", 1000); // mm
  const [r2Raw, setR2] = useURLState("R2", 5000); // mm
  const [rOcRaw, setROc] = useURLState("R_oc", 0.99);
  const [rHrRaw, setRHr] = useURLState("R_hr", 0.999);
  const [lossRaw, setLoss] = useURLState("loss", 1); // % per pass
  const [g0Raw, setG0] = useURLState("g0", 0.15); // 1/m
  const [iSatRaw, setISat] = useURLState("Isat", 25); // W/cm²

  const d_mm = clamp(diameterRaw, 0.1, 100, 6);
  const L = clamp(lengthRaw, 10, 1e5, 500) * 1e-3;
  const lambda = clamp(wavelengthRaw, 100, 20000, 632.8) * 1e-9;
  const R1_mm = clamp(r1Raw, -1e7, 1e7, 1000);
  const R2_mm = clamp(r2Raw, -1e7, 1e7, 5000);
  const R_oc = clamp(rOcRaw, 0.01, 0.9999, 0.99);
  const R_hr = clamp(rHrRaw, 0.01, 1, 0.999);
  const internal = -Math.log(1 - clamp(lossRaw, 0, 50, 1) / 100); // single pass, nepers
  const g0 = clamp(g0Raw, 0, 100, 0.15);
  const iSat = clamp(iSatRaw, 1e-3, 1e6, 25) * 1e4; // W/m²

  const toRadius = (R_mm: number) => (R_mm === 0 ? Infinity : R_mm * 1e-3);
  const g1 = gParameter(L, toRadius(R1_mm));
  const g2 = gParameter(L, toRadius(R2_mm));
  const stability = resonatorStability(g1, g2);
  const mode = twoMirrorMode(lambda, L, g1, g2);
  const statusTone = stability === "stable" ? "green" : stability === "marginal" ? "yellow" : "red";
  const a = d_mm * 5e-4; // bore radius, m
  const fresnel = (a * a) / (lambda * L);
  const wMax = Math.max(mode.w1, mode.w2);
  const clipLoss = Math.exp((-2 * a * a) / (wMax * wMax)); // power outside the bore at the larger mirror spot

  // Gain fills the tube: the mode saturates it over its mean-square radius, P_sat = I_sat π⟨w²⟩/2.
  const g0l = g0 * L;
  const pSat = (iSat * Math.PI * meanSquareRadius(mode.w0, mode.zR, mode.z1, L)) / 2;
  const delta = roundTripLoss(R_hr, R_oc, internal);
  const gTh = delta / (2 * L);
  const pOut = laserOutput(g0l, R_hr, R_oc, internal, pSat);
  const rearR = R_hr * Math.exp(-2 * internal);
  const best = optimumOutputCoupler(g0l, rearR);
  const pBest = best.output * pSat;

  const rLo = Math.max(0.5, Math.min(R_oc, Number.isFinite(best.R2) ? best.R2 : 1) - 0.02);
  const curve = Number.isFinite(pSat)
    ? Array.from({ length: 121 }, (_, i) => {
        const r = rLo + ((0.9999 - rLo) * i) / 120;
        return { x: round6(r), y: round6(laserOutput(g0l, R_hr, r, internal, pSat) * 1e3) };
      })
    : [];
  const couplerSeries = [
    { name: "Output power", color: "#a78bfa", points: curve },
    { name: "Optimum coupler", color: "#34d399", showPoints: true, points: pBest > 0 ? [{ x: round6(best.R2), y: round6(pBest * 1e3) }] : [] },
    { name: "This coupler", color: "#facc15", showPoints: true, points: Number.isFinite(pOut) ? [{ x: round6(R_oc), y: round6(pOut * 1e3) }] : [] },
  ];

  const profile = Number.isFinite(mode.w0)
    ? Array.from({ length: 201 }, (_, i) => {
        const z = (L * i) / 200;
        return { x: round6(z * 1e3), y: round6(radiusAtDistance(mode.w0, mode.zR, z - mode.z1) * 1e3) };
      })
    : [];
  const profileSeries = [
    { name: "TEM₀₀ radius w(z)", color: "#60a5fa", points: profile },
    { name: "Bore radius", color: "#9ca3af", dashed: true, points: profile.length ? [{ x: 0, y: round6(a * 1e3) }, { x: round6(L * 1e3), y: round6(a * 1e3) }] : [] },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        {LINES.map((line) => (
          <button
            key={line.label}
            type="button"
            onClick={() => setWavelength(line.nm)}
            className={`rounded-lg border px-3 py-1 text-sm ${Math.abs(wavelengthRaw - line.nm) < 1e-6 ? "border-blue-500 bg-blue-950/60 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}
          >
            {line.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength λ (nm)" value={wavelengthRaw} onChange={setWavelength} min={100} max={20000} step="any" />
        <ValidatedNumberInput label="Small-signal gain g₀ (1/m, measured for your tube)" value={g0Raw} onChange={setG0} min={0} max={100} step="any" />
        <ValidatedNumberInput label="Saturation intensity I_sat (W/cm²)" value={iSatRaw} onChange={setISat} min={1e-3} max={1e6} step="any" />
        <ValidatedNumberInput label="Mirror spacing = gain length L (mm)" value={lengthRaw} onChange={setLength} min={10} max={1e5} step="any" />
        <ValidatedNumberInput label="Bore diameter (mm)" value={diameterRaw} onChange={setDiameter} min={0.1} max={100} step="any" />
        <ValidatedNumberInput label="Other loss per pass (%: windows, scatter)" value={lossRaw} onChange={setLoss} min={0} max={50} step="any" />
        <ValidatedNumberInput label="HR radius R₁ (mm; 0 = flat)" value={r1Raw} onChange={setR1} min={-1e7} max={1e7} step="any" />
        <ValidatedNumberInput label="Output coupler radius R₂ (mm; 0 = flat)" value={r2Raw} onChange={setR2} min={-1e7} max={1e7} step="any" />
        <ValidatedNumberInput label="HR reflectance" value={rHrRaw} onChange={setRHr} min={0.01} max={1} step="any" />
        <ValidatedNumberInput label="Output coupler reflectance" value={rOcRaw} onChange={setROc} min={0.01} max={0.9999} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <ResultCard label="g₁g₂" value={fmt(g1 * g2)} subtext={`g₁ = ${fmt(g1)}, g₂ = ${fmt(g2)}; ${stability}`} tone={statusTone} />
        <ResultCard label="TEM₀₀ waist w₀" value={`${fmt(mode.w0 * 1e6)} µm`} subtext={`${fmt(mode.z1 * 1e3)} mm from the HR`} tone="blue" />
        <ResultCard label="Fresnel number a²/(λL)" value={fmt(fresnel)} subtext={`Largest mirror spot ${fmt(wMax * 1e6)} µm; bore radius ${fmt(a * 1e6)} µm`} tone="green" />
        <ResultCard label="Power outside the bore" value={`${fmt(clipLoss * 100, 3)} %`} subtext="e^(−2a²/w²) at the larger mirror spot (not in the loss)" tone={clipLoss > 0.01 ? "red" : "cyan"} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Threshold gain g_th" value={`${fmt(gTh)} 1/m`} subtext={`δ/(2L), δ = ${fmt(delta * 100)} % round trip; g₀ = ${fmt(g0)} 1/m`} tone="orange" />
        <ResultCard label="Output power" value={`${fmt(pOut * 1e3)} mW`} subtext={`P_sat = I_sat π⟨w²⟩/2 = ${fmt(pSat * 1e3)} mW`} tone="purple" />
        <ResultCard label="Optimum coupler reflectance" value={fmt(best.R2, 5)} subtext={`Rigrod optimum for this gain and loss`} tone="yellow" />
        <ResultCard label="Output at the optimum" value={`${fmt(pBest * 1e3)} mW`} tone="yellow" />
      </div>

      {stability !== "stable" && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          The cavity is {stability === "unstable" ? "unstable" : "on the stability boundary"}: there is no TEM₀₀ mode, so no waist or
          output power.
        </p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>Rigrod: P = P_sat (1 − R₂)√R₁′(g₀L + ln√(R₁′R₂))/((√R₁′ + √R₂)(1 − √(R₁′R₂))), R₁′ = R_HR(1 − loss)²; threshold g₀L = δ/2.
          For small losses the optimum transmission is T ≈ √(2g₀L δᵢ) − δᵢ.</p>
        <p>Mode: Kogelnik–Li, w₀² = (λ/π)L√(g₁g₂(1 − g₁g₂))/|g₁ + g₂ − 2g₁g₂|. Fresnel number N = a²/(λL).</p>
      </div>

      <div className="space-y-6">
        {curve.length > 0 && <SimpleLineChart title="Output power versus output-coupler reflectance" xLabel="Output coupler reflectance" yLabel="Output power (mW)" series={couplerSeries} />}
        {profile.length > 0 && <SimpleLineChart title="TEM₀₀ beam radius along the tube" xLabel="Position from the HR (mm)" yLabel="Radius (mm)" series={profileSeries} />}
      </div>
    </>
  );
}
