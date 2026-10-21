"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  criticalPower, gaussianPeakIntensity, kerrLensFocalLength, nonlinearPhase, rayleighRangeInMedium, selfFocusingDistance,
} from "../../../physics/wave-optics/kerr";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const fmtLength = (m: number) => !Number.isFinite(m)
  ? "∞"
  : Math.abs(m) >= 1 ? `${fmt(m)} m` : Math.abs(m) >= 1e-3 ? `${fmt(m * 1e3)} mm` : `${fmt(m * 1e6)} µm`;

export default function KerrLensPage() {
  const [lambdaRaw, setLambda] = useURLState("wavelength", 800); // nm
  const [waistRaw, setWaist] = useURLState("beamWaist", 20); // µm
  const [n0Raw, setN0] = useURLState("n0", 1.76);
  const [n2Raw, setN2] = useURLState("n2", 3.2); // 1e-16 cm²/W = 1e-20 m²/W
  const [powerRaw, setPower] = useURLState("peakPower", 100); // kW
  const [lengthRaw, setLength] = useURLState("crystalLength", 2); // mm

  const lambda = clamp(lambdaRaw, 200, 20000, 800) * 1e-9;
  const w = clamp(waistRaw, 1, 1e5, 20) * 1e-6;
  const n0 = clamp(n0Raw, 1, 5, 1.76);
  const n2 = clamp(n2Raw, 1e-4, 1e6, 3.2) * 1e-20;
  const power = clamp(powerRaw, 0, 1e9, 100) * 1e3;
  const L = clamp(lengthRaw, 0, 1e4, 2) * 1e-3;

  const Pcr = criticalPower(lambda, n0, n2);
  const ratio = power / Pcr;
  const I0 = gaussianPeakIntensity(power, w);
  const phi0 = nonlinearPhase(lambda, n2, I0, L);
  const f = kerrLensFocalLength(n2, power, L, w);
  const zR = rayleighRangeInMedium(lambda, n0, w);
  const zsf = selfFocusingDistance(ratio, zR);

  const warnings = [
    ratio >= 1 && `P ≥ P_cr: a collimated beam would collapse after z_sf ≈ ${fmtLength(zsf)} (Marburger), so the thin-lens value no longer holds once the crystal approaches that length.`,
    L > zR && `L > z_R (${fmtLength(zR)}): the beam changes size inside the crystal, so treat f as an estimate. A thick Kerr medium is modelled as a stack of thin Kerr lenses.`,
    Number.isFinite(f) && f > 0 && f < 10 * L && "f is less than 10 L: the lens is not thin compared with the crystal.",
  ].filter(Boolean) as string[];

  const profile = phi0 > 0 ? (() => {
    const r = Array.from({ length: 151 }, (_, i) => (i / 100) * w);
    return [
      { name: "Kerr phase k₀n₂I(r)L", color: "#60a5fa", points: r.map((ri) => ({ x: round6(ri * 1e6), y: round6(phi0 * Math.exp(-2 * ri ** 2 / w ** 2)) })) },
      { name: "Parabolic (thin-lens) fit", color: "#f87171", dashed: true, points: r.map((ri) => ({ x: round6(ri * 1e6), y: round6(phi0 * (1 - 2 * ri ** 2 / w ** 2)) })) },
    ];
  })() : [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={lambdaRaw} onChange={setLambda} min={200} max={20000} step="any" />
        <ValidatedNumberInput label="Beam radius w, 1/e² (µm)" value={waistRaw} onChange={setWaist} min={1} max={1e5} step="any" />
        <ValidatedNumberInput label="Linear index n₀" value={n0Raw} onChange={setN0} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="n₂ (×10⁻¹⁶ cm²/W)" value={n2Raw} onChange={setN2} min={1e-4} max={1e6} step="any" />
        <ValidatedNumberInput label="Peak power P (kW)" value={powerRaw} onChange={setPower} min={0} max={1e9} step="any" />
        <ValidatedNumberInput label="Crystal length L (mm)" value={lengthRaw} onChange={setLength} min={0} max={1e4} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Kerr focal length f" value={fmtLength(f)} subtext={`πw⁴/(8n₂PL); lens power ${fmt(1 / f)} m⁻¹`} tone="green" />
        <ResultCard label="On-axis nonlinear phase" value={`${fmt(phi0)} rad`} subtext={`k₀n₂I₀L, peak intensity I₀ = 2P/(πw²) = ${fmt(I0 * 1e-4)} W/cm²`} tone="orange" />
        <ResultCard label="Critical power P_cr" value={`${fmt(Pcr * 1e-6)} MW`} subtext={`3.77 λ²/(8π n₀ n₂); P/P_cr = ${fmt(ratio)}`} tone={ratio >= 1 ? "red" : "blue"} />
        <ResultCard label="Rayleigh range in the crystal" value={fmtLength(zR)} subtext={`π n₀ w²/λ; L/z_R = ${fmt(L / zR)}`} tone="cyan" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>The intensity raises the index, n = n₀ + n₂I. Near the axis a Gaussian beam&apos;s I(r) = I₀ e^(−2r²/w²) is a
          parabola, I₀(1 − 2r²/w²), so a crystal of length L adds the phase of a thin lens with 1/f = 4n₂I₀L/w² =
          8n₂PL/(πw⁴). In a Kerr-lens mode-locked laser the pulse peak sees this lens and the low-power continuous light
          doesn&apos;t. An aperture or the gain spot then favours the pulse. The lens holds for L below z_R and f, and for P
          well below P_cr. The plot shows how the real Gaussian phase leaves the parabola beyond r ≈ w/2.</p>
        {warnings.map((msg) => <p key={msg} className="text-yellow-400">{msg}</p>)}
      </div>

      {profile.length > 0 && (
        <SimpleLineChart title="Nonlinear phase across the beam" xLabel="Radius r (µm)" yLabel="Phase (rad)" series={profile} />
      )}
    </>
  );
}
