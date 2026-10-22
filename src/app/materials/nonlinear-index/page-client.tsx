"use client";

import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { nonlinearCoefficient } from "../../../physics/fiber-optics/fiber-nonlinear";
import { KERR_MEDIA, kerrIndexChange, piPhaseIntensity, type KerrMediumId } from "../../../physics/materials/kerr-index";
import { criticalPower, nonlinearPhase } from "../../../physics/wave-optics/kerr";

const IDS = Object.keys(KERR_MEDIA) as KerrMediumId[];
type Choice = KerrMediumId | "custom";
const CHOICES: readonly Choice[] = [...IDS, "custom"];
const DEFAULT_ID: Choice = "silica-fiber";
const WAVELENGTH_MIN_NM = 200;
const WAVELENGTH_MAX_NM = 20000;
const INTENSITY_MAX_W_CM2 = 1e16;
const LENGTH_MIN_MM = 1e-3;
const LENGTH_MAX_MM = 1e7;
const AREA_MIN_UM2 = 0.01;
const AREA_MAX_UM2 = 1e6;
const N2_MIN_CM2_W = 1e-20;
const N2_MAX_CM2_W = 1e-10;
/** Relative wavelength offset from a medium's reference λ above which its n₂ is flagged. */
const LAMBDA_TOLERANCE = 0.05;

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const sig = (x: number, digits: number) => (Number.isFinite(x) ? String(+x.toPrecision(digits)) : "—");
const exp = (x: number, digits: number) => (Number.isFinite(x) ? x.toExponential(digits) : "—");
const watts = (P: number) => {
  if (!Number.isFinite(P)) return "—";
  const [s, u] = P >= 1e9 ? [1e9, "GW"] : P >= 1e6 ? [1e6, "MW"] : P >= 1e3 ? [1e3, "kW"] : [1, "W"];
  return `${sig(P / s, 4)} ${u}`;
};

export default function NonlinearIndexPage() {
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_ID as string);
  const [n2Raw, setN2] = useURLState("n2", 2.6e-16); // cm²/W, custom medium
  const [n0Raw, setN0] = useURLState("n0", 1.45); // custom medium
  const [intensityRaw, setIntensity] = useURLState("intensity", 1e12); // W/cm²
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [lengthRaw, setLength] = useURLState("length", 10); // mm
  const [areaRaw, setArea] = useURLState("area", 80); // µm², fibre effective area
  const choice = (CHOICES as readonly string[]).includes(materialParam) ? (materialParam as Choice) : DEFAULT_ID;
  const medium = choice === "custom" ? null : KERR_MEDIA[choice];
  const n2_cm2W = clamp(n2Raw, N2_MIN_CM2_W, N2_MAX_CM2_W, 2.6e-16);
  const n0Custom = clamp(n0Raw, 1, 5, 1.45);
  const intensity_Wcm2 = clamp(intensityRaw, 0, INTENSITY_MAX_W_CM2, 1e12);
  const wavelength_nm = clamp(wavelengthRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, 1550);
  const length_mm = clamp(lengthRaw, LENGTH_MIN_MM, LENGTH_MAX_MM, 10);
  const area_um2 = clamp(areaRaw, AREA_MIN_UM2, AREA_MAX_UM2, 80);

  const n2 = medium ? medium.n2 : n2_cm2W * 1e-4;
  const n0 = medium ? medium.n0 : n0Custom;
  const lambda = wavelength_nm * 1e-9;
  const I = intensity_Wcm2 * 1e4;
  const L = length_mm * 1e-3;
  const dn = kerrIndexChange(n2, I);
  const phi = nonlinearPhase(lambda, n2, I, L);
  const gamma = nonlinearCoefficient(n2, lambda, area_um2 * 1e-12);
  const Pcr = criticalPower(lambda, n0, n2);
  const Ipi = piPhaseIntensity(lambda, n2, L);
  const offReference = medium !== null && Math.abs(lambda - medium.lambda) > LAMBDA_TOLERANCE * medium.lambda;
  const select = (id: Choice) => {
    setMaterial(id);
    if (id !== "custom") setWavelength(Math.round(KERR_MEDIA[id].lambda * 1e9));
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6" role="group" aria-label="Medium">
        {CHOICES.map((id) => (
          <button key={id} onClick={() => select(id)} aria-pressed={choice === id}
            className={`px-3 py-2 rounded text-sm ${choice === id ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            {id === "custom" ? "Custom" : KERR_MEDIA[id].name}
          </button>
        ))}
      </div>

      {!medium && (
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <ValidatedNumberInput label="n₂ (cm²/W)" value={n2Raw} onChange={setN2} min={N2_MIN_CM2_W} max={N2_MAX_CM2_W} step="any" />
          <ValidatedNumberInput label="Linear index n₀" value={n0Raw} onChange={setN0} min={1} max={5} step="0.01" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <ValidatedNumberInput label="Intensity I (W/cm²)" value={intensityRaw} onChange={setIntensity} min={0} max={INTENSITY_MAX_W_CM2} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={WAVELENGTH_MIN_NM} max={WAVELENGTH_MAX_NM} step="1" />
        <ValidatedNumberInput label="Length L (mm)" value={lengthRaw} onChange={setLength} min={LENGTH_MIN_MM} max={LENGTH_MAX_MM} step="any" />
        <ValidatedNumberInput label="Fibre effective area A_eff (µm²)" value={areaRaw} onChange={setArea} min={AREA_MIN_UM2} max={AREA_MAX_UM2} step="1" />
      </div>
      <p className="text-xs mb-6 text-gray-500">
        {medium
          ? `n₂ = ${exp(medium.n2 * 1e4, 2)} cm²/W (${exp(medium.n2, 2)} m²/W), n₀ = ${sig(medium.n0, 4)} at ${Math.round(medium.lambda * 1e9)} nm; ${medium.source}.`
          : `Custom medium: n₂ = ${exp(n2, 2)} m²/W.`}{" "}
        {offReference && <span className="text-yellow-400">n₂ is the {Math.round(medium!.lambda * 1e9)} nm value; its dispersion is not modelled.</span>}
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ResultCard label="Index change Δn = n₂I" value={exp(dn, 3)} tone="blue" subtext={`I = ${exp(I, 2)} W/m²`} />
        <ResultCard label="Nonlinear phase φ = k₀n₂IL" value={`${sig(phi, 4)} rad`} tone="green"
          subtext={`= ${sig(phi / Math.PI, 4)}π over ${sig(length_mm, 4)} mm; π at ${exp(Ipi * 1e-4, 3)} W/cm²`} />
        <ResultCard label="Critical power P_cr (Gaussian beam)" value={watts(Pcr)} tone="orange" subtext="3.77 λ²/(8π n₀ n₂): bulk self-focusing" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ResultCard label="Fibre nonlinear coefficient γ" value={`${sig(gamma * 1e3, 4)} W⁻¹km⁻¹`} tone="purple"
          subtext={`2πn₂/(λA_eff), A_eff = ${sig(area_um2, 4)} µm²`} />
        <ResultCard label="Fibre SPM phase per watt" value={`${sig(gamma * L, 4)} rad/W`} tone="gray" subtext="γL, lossless length L" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">Reference values</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="pr-4 py-1">Medium</th><th className="pr-4 py-1 text-right">n₂ (cm²/W)</th><th className="pr-4 py-1 text-right">n₀</th>
              <th className="pr-4 py-1 text-right">λ (nm)</th><th className="pr-4 py-1 text-right">P_cr</th><th className="py-1">Source</th>
            </tr>
          </thead>
          <tbody>
            {[...IDS].sort((a, b) => KERR_MEDIA[b].n2 - KERR_MEDIA[a].n2).map((id) => {
              const m = KERR_MEDIA[id];
              return (
                <tr key={id} onClick={() => select(id)} className={`cursor-pointer hover:bg-gray-800 ${id === choice ? "bg-gray-800" : ""}`}>
                  <td className="pr-4 py-1">{m.name}</td>
                  <td className="pr-4 py-1 text-right font-mono">{exp(m.n2 * 1e4, 2)}</td>
                  <td className="pr-4 py-1 text-right">{sig(m.n0, 4)}</td>
                  <td className="pr-4 py-1 text-right">{Math.round(m.lambda * 1e9)}</td>
                  <td className="pr-4 py-1 text-right">{watts(criticalPower(m.lambda, m.n0, m.n2))}</td>
                  <td className="py-1 text-gray-400">{m.source}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">Click a row to select the medium; P_cr at each medium&apos;s own wavelength.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">n = n₀ + n₂I,  φ = (2π/λ) n₂ I L,  γ = 2πn₂/(λA_eff)</p>
          <p>
            The electronic Kerr effect is instantaneous and the intensity uniform over L, so φ is the on-axis phase (the
            B-integral of a slab). In a fibre the same n₂ sets γ through the mode&apos;s effective area. n₂ falls slowly
            towards the infrared below the band gap, so a value measured at one wavelength holds only near it.
          </p>
          <p>
            Values are for linear polarization; circular polarization gives ⅔ of n₂ in isotropic media. Pulses of a few
            picoseconds or longer in liquids and gases add a slower molecular (orientational) part.
          </p>
        </div>
      </div>
    </>
  );
}
