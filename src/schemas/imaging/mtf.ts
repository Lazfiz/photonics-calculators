import { MAX_HIGH_NA_PHASE } from "../../physics/imaging/diffraction-mtf";
import { PARAXIAL_OPTIMISTIC_RATIO, mtfSummary } from "../../physics/imaging/mtf";
import { defineSchema } from "../types";

const GOODMAN = "Goodman J. W. (2005). Introduction to Fourier Optics, 3rd ed., Roberts & Company, §6.3 " +
  "(incoherent transfer function of a diffraction-limited circular pupil: cutoff 2NA/λ, MTF (2/π)[arccos ν − ν√(1 − ν²)]).";
const HOPKINS = "Hopkins H. H. (1955). The frequency response of a defocused optical system. Proc. R. Soc. A 231, " +
  "91–103 (W₀₂₀ = Δz·NA²/(2n) and the defocused OTF). https://doi.org/10.1098/rspa.1955.0158";
const MAHAJAN = "Mahajan V. N. (1982). Strehl ratio for primary aberrations: some analytical results for circular and annular pupils. " +
  "J. Opt. Soc. Am. 72, 1258 (paraxial defocus Strehl sinc²(πW₀₂₀/λ)). https://doi.org/10.1364/JOSA.72.001258";
const RICHARDS_WOLF = "Richards B., Wolf E. (1959). Electromagnetic diffraction in optical systems II. Structure of the " +
  "image field in an aplanatic system. Proc. R. Soc. A 253, 358–379 (scalar Debye integral, defocus phase " +
  "2π(nΔz/λ)cos θ, uniform pupil in ρ = sin θ/(NA/n); Strehl = |2∫₀¹ e^(iB(ρ)) ρ dρ|²). https://doi.org/10.1098/rspa.1959.0200; " +
  "Sheppard C. J. R. (1988). Aberrations in high aperture conventional and confocal imaging systems. Appl. Opt. 27(22), 4782. " +
  "https://doi.org/10.1364/AO.27.004782";

const NO_EXACT = `The exact-phase OTF is not computed past ${MAX_HIGH_NA_PHASE} rad of phase across the pupil overlap; the OTF there is close to 0.`;

export default defineSchema({
  href: "/imaging/mtf",
  inputs: [
    { key: "na", label: "Numerical aperture NA (at most n)", unit: "", toSI: 1, siUnit: "", default: 0.4, min: 0.01, max: 1.8 },
    { key: "wavelength", label: "Wavelength (vacuum)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 2000 },
    { key: "n", label: "Refractive index on the NA side n", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 1.8 },
    { key: "defocus", label: "Defocus Δz on the NA side", unit: "µm", toSI: 1e-6, siUnit: "m", default: 3, min: -20, max: 20 },
    { key: "nu", label: "Normalised frequency ν = f/f_c", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0, max: 1 },
  ],
  outputs: [
    { key: "cutoff", label: "Cutoff f_c = 2NA/λ", unit: "lp/mm", toSI: 1e3, siUnit: "cycles/m" },
    { key: "inFocusMtf", label: "In-focus MTF(ν)", unit: "", toSI: 1, siUnit: "" },
    { key: "w020", label: "Paraxial W₀₂₀ = Δz·NA²/(2n)", unit: "λ", toSI: 1, siUnit: "waves" },
    { key: "edgeWaves", label: "Exact edge path difference n·Δz(1 − cos θ)", unit: "λ", toSI: 1, siUnit: "waves" },
    { key: "otfParaxial", label: "Defocused OTF(ν), paraxial (Hopkins)", unit: "", toSI: 1, siUnit: "" },
    { key: "otfExact", label: "Defocused OTF(ν), exact phase", unit: "", toSI: 1, siUnit: "" },
    { key: "strehlParaxial", label: "Strehl ratio, paraxial sinc²(kW₀₂₀/2)", unit: "", toSI: 1, siUnit: "" },
    { key: "strehlExact", label: "Strehl ratio, exact phase", unit: "", toSI: 1, siUnit: "" },
  ],
  validate({ na, n }) {
    if (na > n) return `The numerical aperture (${na}) cannot exceed the refractive index on the NA side (n = ${n}).`;
    return undefined;
  },
  compute({ na, wavelength, n, defocus, nu }) {
    const r = mtfSummary(na, wavelength, n, defocus, nu);
    const warnings: string[] = [];
    if (r.paraxialOptimistic) {
      warnings.push(`The exact edge path n·Δz(1 − cos θ) exceeds the paraxial W₀₂₀ by more than ${Math.round((PARAXIAL_OPTIMISTIC_RATIO - 1) * 100)} %: the wavefront is not quadratic at this NA, so use the exact-phase values; the paraxial ones are unreliable (usually optimistic).`);
    }
    if (r.defocusedExact < 0) warnings.push("Negative OTF: the pattern is imaged with reversed contrast.");
    return {
      values: {
        cutoff: r.cutoff,
        inFocusMtf: r.inFocus,
        w020: r.w020Waves,
        edgeWaves: r.edgeWaves,
        otfParaxial: r.defocusedParaxial,
        otfExact: r.defocusedExact,
        strehlParaxial: r.strehlParaxial,
        strehlExact: r.strehlExact,
      },
      warnings,
      reasons: { otfExact: NO_EXACT },
    };
  },
  checks: [
    {
      // NA 0.4, 550 nm: f_c = 2 · 0.4/550 nm = 1454.5454 lp/mm; MTF(0.5) = (2/π)(arccos 0.5 − 0.5 √0.75) = 0.6366198 · 0.6141848 = 0.391002.
      source: GOODMAN,
      basis: "computed",
      inputs: {},
      expect: { cutoff: 1454.545454545, inFocusMtf: 0.391002218956 },
      tolerance: 1e-8,
    },
    {
      // Δz = 3 µm: W₀₂₀ = 3 µm · 0.16/(2 · 0.55 µm) = 0.4363636 λ; Strehl = (sin x/x)², x = π W₀₂₀ = 1.370871 → 0.5111266.
      source: `${HOPKINS} ${MAHAJAN}`,
      basis: "computed",
      inputs: {},
      expect: { w020: 0.436363636364, strehlParaxial: 0.511126588917 },
      tolerance: 1e-8,
    },
    {
      // NA 0.5, n = 1, Δz = 2 µm, 550 nm: D = 3.636364, s = 0.5; with u = √(1 − s²ρ²), κ = 2πD, c = √(1 − s²) the integral has the closed
      // form Strehl = |(2/s²)[e^(iκ)(1/κ² − i/κ) − e^(iκc)(1/κ² − ic/κ)]|² = 0.4270283764184.
      source: RICHARDS_WOLF,
      basis: "computed",
      inputs: { na: 0.5, defocus: 2 },
      expect: { strehlExact: 0.4270283764184104 },
      tolerance: 1e-9,
    },
  ],
});
