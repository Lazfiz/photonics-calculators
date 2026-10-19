"use client";

import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { N_A } from "../../../physics/constants";
import { absorbance, crossSectionFromEpsilon, napierianAbsorptionCoefficient } from "../../../physics/spectroscopy/lambert-beer-law";

// Lab units → SI: 1 L mol⁻¹ cm⁻¹ = 0.1 m²/mol, 1 mol/L = 1000 mol/m³, 1 cm = 0.01 m, 1 cm² = 1e-4 m².
const EPS_SI = 0.1, CONC_SI = 1000, CM = 0.01, CM2 = 1e-4;
const EPS_MAX = 1e6, C_MAX = 10;
const SIGMA_PER_EPS = crossSectionFromEpsilon(EPS_SI) / CM2; // cm² per L mol⁻¹ cm⁻¹, 3.8235e-21
const SIGMA_MAX = EPS_MAX * SIGMA_PER_EPS; // cm²
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 1e-3 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(3);

export default function AbsorptionCrossSectionPage() {
  const [fromRaw, setFrom] = useURLState("from", "eps");
  const [extinctionCoeffRaw, setExtinctionCoeff] = useURLState("extinctionCoeff", 50000); // L mol⁻¹ cm⁻¹
  const [sigmaRaw, setSigma] = useURLState("sigma", 1.912e-16); // cm²
  const [concentrationRaw, setConcentration] = useURLState("concentration", 1e-5); // mol/L

  const from = fromRaw === "sigma" ? "sigma" : "eps";
  const concentration = clamp(concentrationRaw, 0, C_MAX, 1e-5);
  const extinctionCoeff = from === "eps" ? clamp(extinctionCoeffRaw, 0, EPS_MAX, 50000) : clamp(sigmaRaw, 0, SIGMA_MAX, 1.912e-16) / SIGMA_PER_EPS;
  const sigma = crossSectionFromEpsilon(extinctionCoeff * EPS_SI); // m²
  const numberDensity_cm3 = (N_A * concentration * CONC_SI) * 1e-6; // m⁻³ → cm⁻³
  const alpha_cm = napierianAbsorptionCoefficient(sigma, concentration * CONC_SI) * CM; // cm⁻¹
  const A1cm = absorbance(extinctionCoeff * EPS_SI, concentration * CONC_SI, CM);

  return (
    <>
      <div role="group" aria-label="Convert from" className="flex gap-2 mb-5 flex-wrap">
        {(["eps", "sigma"] as const).map((f) => (
          <button key={f} onClick={() => setFrom(f)} className={`px-3 py-1 rounded text-sm ${from === f ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}>
            {f === "eps" ? "ε → σ" : "σ → ε"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {from === "eps" ? (
          <ValidatedNumberInput label="ε (L·mol⁻¹·cm⁻¹)" value={extinctionCoeffRaw} onChange={setExtinctionCoeff} min={0} max={EPS_MAX} />
        ) : (
          <ValidatedNumberInput label="σ (cm²)" value={sigmaRaw} onChange={setSigma} min={0} max={SIGMA_MAX} />
        )}
        <ValidatedNumberInput label="Concentration (mol/L)" value={concentrationRaw} onChange={setConcentration} min={0} max={C_MAX} step="0.000001" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {from === "eps" ? (
          <ResultCard label="Cross-section σ" value={`${fmt(sigma / CM2)} cm²`} tone="blue" subtext={`${fmt(sigma)} m², ${fmt(sigma / 1e-20)} Å²`} />
        ) : (
          <ResultCard label="Molar absorption coefficient ε" value={fmt(extinctionCoeff, 5)} tone="blue" subtext="L·mol⁻¹·cm⁻¹" />
        )}
        <ResultCard label="Number density n" value={`${fmt(numberDensity_cm3)} cm⁻³`} tone="green" subtext="n = N_A · c" />
        <ResultCard label="Napierian coefficient α" value={`${fmt(alpha_cm)} cm⁻¹`} tone="purple"
          subtext={alpha_cm > 0 ? `α = σ·n; 1/e length ${fmt(1 / alpha_cm)} cm` : "α = σ·n"} />
        <ResultCard label="Absorbance over 1 cm" value={fmt(A1cm)} tone={A1cm > 2 ? "red" : "orange"}
          subtext={A1cm > 2 ? "above ≈ 2 a spectrometer can't measure it; dilute" : "A = ε·c·l = α·l / ln 10"} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">σ = ln(10) · ε / N_A</p>
        <p className="font-mono text-green-400">σ (cm²) = 3.8235 × 10⁻²¹ × ε (L·mol⁻¹·cm⁻¹)</p>
        <p className="font-mono text-purple-400">T = e^(−σ·n·l) = 10^(−ε·c·l)</p>
        <p>
          The 1000 in the lab-unit form is cm³ per litre, and ln 10 turns the decadic ε into the Napierian σ. Typical
          peak values: fluorescent proteins and dyes, ε ≈ 5 × 10⁴–2.5 × 10⁵, give σ ≈ 2–10 × 10⁻¹⁶ cm² (EGFP, ε = 55 900
          at 488 nm: 2.14 × 10⁻¹⁶ cm²); aromatic amino acids in proteins at 280 nm, ε ≈ 1.5 × 10³ (Tyr) to 5.5 × 10³
          (Trp), give 6 × 10⁻¹⁸–2 × 10⁻¹⁷ cm² per residue. A free atom on a resonance line is far stronger: a two-level
          atom at rest peaks at 3λ²/2π, 1.66 × 10⁻⁹ cm² at the 589 nm sodium line, and Doppler broadening in a vapour
          lowers the peak by roughly two orders of magnitude.
        </p>
        <p className="text-gray-500">
          References: IUPAC Gold Book, &quot;absorption cross section&quot;; FPbase (EGFP); Pace et al. (1995), Protein
          Sci. 4, 2411 (Trp, Tyr at 280 nm); Foot, Atomic Physics (2005) (resonant cross-section).
        </p>
      </div>
    </>
  );
}
