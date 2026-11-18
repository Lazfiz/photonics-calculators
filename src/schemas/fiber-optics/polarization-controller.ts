import { LOW_LOSS_LOOP_DIAMETER, MAX_BEND_STRAIN, polarizationControllerSummary } from "../../physics/fiber-optics/polarization-controller";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const ULRICH_1980 = "Ulrich R., Rashleigh S. C., Eickhoff W. (1980). Bending-induced birefringence in single-mode fibers. Opt. Lett. 5, 273–275, " +
  "doi:10.1364/OL.5.000273; B = 0.133 (d/D)² for silica; Lefèvre H. C. (1980). Single-mode fibre fractional wave devices and polarisation controllers. " +
  "Electron. Lett. 16, 778–780, doi:10.1049/el:19800552; retardance of N loops Γ = 2π² · 0.133 · N d²/(λ D); " +
  "loop diameter for retardance Γ: D = 2π² · 0.133 · N d²/(λ Γ).";
const GOLDSTEIN = "Goldstein D. H. (2011). Polarized Light, 3rd ed., CRC Press, doi:10.1201/b10436: Stokes vector of an ellipse S = (1, cos2χ cos2ψ, cos2χ sin2ψ, sin2χ), " +
  "Mueller matrix of a rotated linear retarder M(Γ, θ) = R(−2θ) M₀(Γ) R(2θ), M₀ with S₂′ = S₂ cosΓ + S₃ sinΓ, S₃′ = −S₂ sinΓ + S₃ cosΓ.";

const NO_AXIS = "A circular output polarization has no major axis.";

export default defineSchema({
  href: "/fiber-optics/polarization-controller",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2000 },
    { key: "claddingDiameter", label: "Cladding diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 125, min: 50, max: 400 },
    { key: "loopDiameter", label: "Loop diameter D", unit: "mm", toSI: 1e-3, siUnit: "m", default: 30, min: 5, max: 300 },
    { key: "loops1", label: "Paddle 1 loops", unit: "", toSI: 1, siUnit: "", default: 2, min: 0, max: 20 },
    { key: "loops2", label: "Paddle 2 loops", unit: "", toSI: 1, siUnit: "", default: 4, min: 0, max: 20 },
    { key: "loops3", label: "Paddle 3 loops", unit: "", toSI: 1, siUnit: "", default: 2, min: 0, max: 20 },
    { key: "angle1", label: "Paddle 1 angle", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: -180, max: 180 },
    { key: "angle2", label: "Paddle 2 angle", unit: "°", toSI: DEG, siUnit: "rad", default: 45, min: -180, max: 180 },
    { key: "angle3", label: "Paddle 3 angle", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: -180, max: 180 },
    { key: "inputAzimuth", label: "Input azimuth ψ", unit: "°", toSI: DEG, siUnit: "rad", default: 45, min: -90, max: 90 },
    { key: "inputEllipticity", label: "Input ellipticity χ", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: -45, max: 45 },
  ],
  outputs: [
    { key: "perLoop", label: "Retardance per loop", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "bendBirefringence", label: "Bend birefringence", unit: "", toSI: 1, siUnit: "" },
    { key: "retardance1", label: "Paddle 1 retardance", unit: "waves", toSI: 2 * Math.PI, siUnit: "rad" },
    { key: "retardance2", label: "Paddle 2 retardance", unit: "waves", toSI: 2 * Math.PI, siUnit: "rad" },
    { key: "retardance3", label: "Paddle 3 retardance", unit: "waves", toSI: 2 * Math.PI, siUnit: "rad" },
    { key: "dQuarter", label: "Loop diameter for λ/4 (paddle 1 loops)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "dHalf", label: "Loop diameter for λ/2 (paddle 2 loops)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "outAzimuth", label: "Output azimuth ψ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "outEllipticity", label: "Output ellipticity χ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "s1", label: "Output Stokes S₁ (S₀ = 1)", unit: "", toSI: 1, siUnit: "" },
    { key: "s2", label: "Output Stokes S₂ (S₀ = 1)", unit: "", toSI: 1, siUnit: "" },
    { key: "s3", label: "Output Stokes S₃ (S₀ = 1)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ wavelength, claddingDiameter, loopDiameter, loops1, loops2, loops3, angle1, angle2, angle3, inputAzimuth, inputEllipticity }) {
    const s = polarizationControllerSummary({
      lambda: wavelength, claddingDiameter, loopDiameter, loops: [loops1, loops2, loops3],
      angles: [angle1, angle2, angle3], psi: inputAzimuth, chi: inputEllipticity,
    });
    const warnings: string[] = [];
    const strain = claddingDiameter / loopDiameter;
    if (strain > MAX_BEND_STRAIN) {
      warnings.push(`Bend strain d/D = ${(strain * 100).toFixed(1)} % exceeds the ≈ ${MAX_BEND_STRAIN * 100} % proof-test strain of standard fibre: the fibre may break. Use loops of at least ${(claddingDiameter * 100 * 1e3).toFixed(1)} mm.`);
    }
    if (loopDiameter < LOW_LOSS_LOOP_DIAMETER) {
      warnings.push(`Below ≈ ${LOW_LOSS_LOOP_DIAMETER * 1e3} mm loop diameter the bend loss of standard single-mode fibre at 1550 nm rises steeply; check it with the macro-bending loss calculator or the datasheet.`);
    }
    const reasons: Record<string, string> = {};
    if (!Number.isFinite(s.ell.psi)) reasons.outAzimuth = NO_AXIS;
    return {
      values: {
        perLoop: s.perLoop, bendBirefringence: s.Bbend,
        retardance1: s.paddles[0].retardance, retardance2: s.paddles[1].retardance, retardance3: s.paddles[2].retardance,
        dQuarter: s.dQuarter, dHalf: s.dHalf, outAzimuth: s.ell.psi, outEllipticity: s.ell.chi,
        s1: s.out[1], s2: s.out[2], s3: s.out[3],
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // d = 125 µm, D = 30 mm, λ = 1550 nm, loops 2/4/2 at 0°/45°/0°, input ψ = 45°, χ = 0 (S = (0, 1, 0) for S₁..S₃).
      // Per loop Γ = 2π² · 0.133 · d²/(λ D) = 0.8821622 rad; B = 0.133 (d/D)² = 2.3090278e-6;
      // paddles Γ = 2Γ₁, 4Γ₁, 2Γ₁ = 0.2808010, 0.5616019, 0.2808010 waves; λ/4: D = 2π² · 0.133 · 2 d²/(λ π/2) = 33.696115 mm;
      // λ/2: D = 2π² · 0.133 · 4 d²/(λ π) = 33.696115 mm.
      source: ULRICH_1980,
      basis: "computed",
      inputs: {},
      expect: {
        perLoop: 0.882162221333928, bendBirefringence: 2.309027777777778e-6,
        retardance1: 0.2808009562684426, retardance2: 0.5616019125368852, retardance3: 0.2808009562684426,
        dQuarter: 33.69611475221311, dHalf: 33.69611475221311,
      },
      tolerance: 1e-8,
    },
    {
      // Same defaults, Mueller chain worked by hand (rotate (S₁, S₂) by 2θ, rotate (S₂, S₃) by Γ, rotate back):
      // S = (−0.3704175, 0.9287604, 0.0139616); ψ = ½ atan2(S₂, S₁) = 55.871797°; χ = ½ asin(S₃/|S|) = 0.3999832°.
      source: GOLDSTEIN,
      basis: "computed",
      inputs: {},
      expect: { s1: -0.3704174826281026, s2: 0.9287604440385978, s3: 0.01396159563538216, outAzimuth: 55.8717970317018, outEllipticity: 0.3999832478381889 },
      tolerance: 1e-8,
    },
    {
      // λ = 780 nm, D = 20 mm, loops 1/3/2 at 10°/−30°/70°, input ψ = 20°, χ = 15°: Γ₁ = 2.6295220 rad per loop;
      // paddles 0.4185014, 1.2555043, 0.8370029 waves; λ/4 (1 loop): 33.480114 mm; λ/2 (3 loops): 50.220171 mm;
      // S = (−0.6844362, −0.7176302, 0.1286623); ψ = −66.821884°, χ = 3.696149°.
      source: GOLDSTEIN,
      basis: "computed",
      inputs: {
        wavelength: 780, loopDiameter: 20, loops1: 1, loops2: 3, loops3: 2, angle1: 10, angle2: -30, angle3: 70,
        inputAzimuth: 20, inputEllipticity: 15,
      },
      expect: {
        perLoop: 2.629522005899208, retardance1: 0.4185014252077749, retardance2: 1.255504275623325, retardance3: 0.8370028504155499,
        dQuarter: 33.480114016622, dHalf: 50.22017102493299,
        s1: -0.6844361510382025, s2: -0.717630247121593, s3: 0.1286622849486672,
        outAzimuth: -66.82188433083218, outEllipticity: 3.696148860968318,
      },
      tolerance: 1e-8,
    },
  ],
});
