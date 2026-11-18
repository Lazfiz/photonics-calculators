import { afocalSummary, FOCAL_PROBLEM, MIN_FOCAL_LENGTH } from "../../physics/imaging/afocal";
import { defineSchema } from "../types";

const GREIVENKAMP = "Greivenkamp J. E. (2004). Field Guide to Geometrical Optics. SPIE Press, " +
  "two-lens systems, afocal systems and ray-transfer matrices. https://doi.org/10.1117/3.547461";
const AFOCAL_ONLY = "Only an afocal system (spacing within 1 µm of f₁ + f₂) has a single angular magnification, output angle and output beam size.";
const AT_AFOCAL = "The system is afocal (spacing within 1 µm of f₁ + f₂), so its effective focal length and focal distances are infinite.";
const GALILEAN = "A Galilean system (a negative lens) has no real intermediate image.";

export default defineSchema({
  href: "/imaging/afocal",
  inputs: [
    { key: "f1Mm", label: "Lens 1 (objective) focal length f₁", unit: "mm", toSI: 1e-3, siUnit: "m", default: 100, min: -5000, max: 5000 },
    { key: "f2Mm", label: "Lens 2 (eyepiece) focal length f₂", unit: "mm", toSI: 1e-3, siUnit: "m", default: 200, min: -5000, max: 5000 },
    { key: "separationMm", label: "Lens spacing t", unit: "mm", toSI: 1e-3, siUnit: "m", default: 300, min: 0, max: 10000 },
    { key: "objectAngleDeg", label: "Input field half-angle θ", unit: "°", toSI: Math.PI / 180, siUnit: "rad", default: 2, min: 0, max: 30 },
    { key: "beamDiameterMm", label: "Input beam diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0.1, max: 500 },
  ],
  outputs: [
    { key: "afocalSpacing", label: "Afocal spacing f₁ + f₂", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "matrixA", label: "System matrix A", unit: "", toSI: 1, siUnit: "" },
    { key: "matrixB", label: "System matrix B", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "matrixC", label: "System matrix C", unit: "dpt", toSI: 1, siUnit: "1/m" },
    { key: "matrixD", label: "System matrix D", unit: "", toSI: 1, siUnit: "" },
    { key: "power", label: "System power −C", unit: "dpt", toSI: 1, siUnit: "1/m" },
    { key: "efl", label: "Effective focal length −1/C", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "bfd", label: "Back focal distance −A/C (from lens 2)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "ffd", label: "Front focal distance −D/C (before lens 1)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "magnification", label: "Angular magnification M = −f₁/f₂", unit: "×", toSI: 1, siUnit: "" },
    { key: "outputAngle", label: "Output half-angle, tan θ′ = M tan θ", unit: "°", toSI: Math.PI / 180, siUnit: "rad" },
    { key: "outputBeam", label: "Output beam diameter |f₂/f₁|·D", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "fieldStopDiameter", label: "Intermediate image (field stop) diameter 2f₁ tan θ", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  validate({ f1Mm, f2Mm }) {
    return Math.abs(f1Mm) < MIN_FOCAL_LENGTH || Math.abs(f2Mm) < MIN_FOCAL_LENGTH ? FOCAL_PROBLEM : undefined;
  },
  compute({ f1Mm, f2Mm, separationMm, objectAngleDeg, beamDiameterMm }) {
    const r = afocalSummary({ f1: f1Mm, f2: f2Mm, t: separationMm, theta: objectAngleDeg, beam: beamDiameterMm });
    const afocalOnly = r.afocal ? undefined : r.notice;
    const finiteOrNaN = (x: number) => (Number.isFinite(x) ? x : NaN);
    return {
      values: {
        afocalSpacing: r.afocalSpacing,
        matrixA: r.A,
        matrixB: r.B,
        matrixC: r.C,
        matrixD: r.D,
        power: r.power,
        efl: r.afocal ? NaN : finiteOrNaN(r.efl),
        bfd: r.afocal ? NaN : finiteOrNaN(r.bfd),
        ffd: r.afocal ? NaN : finiteOrNaN(r.ffd),
        magnification: r.afocal ? r.magnification : NaN,
        outputAngle: r.afocal ? r.outputAngle : NaN,
        outputBeam: r.afocal ? r.outputBeam : NaN,
        fieldStopDiameter: r.afocal && r.keplerian ? r.fieldStopDiameter : NaN,
      },
      warnings: r.notice ? [r.notice] : [],
      reasons: {
        efl: AT_AFOCAL,
        bfd: AT_AFOCAL,
        ffd: AT_AFOCAL,
        magnification: afocalOnly ?? AFOCAL_ONLY,
        outputAngle: afocalOnly ?? AFOCAL_ONLY,
        outputBeam: afocalOnly ?? AFOCAL_ONLY,
        fieldStopDiameter: r.afocal && !r.keplerian ? GALILEAN : (afocalOnly ?? AFOCAL_ONLY),
      },
    };
  },
  checks: [
    {
      // Keplerian f₁ = 100 mm, f₂ = 200 mm, t = 300 mm = f₁ + f₂: M = −f₁/f₂ = −0.5, A = 1 − t/f₁ = −2, D = 1 − t/f₂ = −0.5, B = t = 300 mm;
      // θ′ = atan(−0.5 tan 2°) = −1.0003047°; output beam |f₂/f₁|·D = 2 · 5 mm = 10 mm;
      // field stop 2f₁ tan θ = 200 mm · tan 2° = 6.9841539 mm.
      source: GREIVENKAMP,
      basis: "computed",
      inputs: { f1Mm: 100, f2Mm: 200, separationMm: 300, objectAngleDeg: 2, beamDiameterMm: 5 },
      expect: {
        afocalSpacing: 300, matrixA: -2, matrixB: 300, matrixD: -0.5, magnification: -0.5,
        outputAngle: -1.0003047102322886, outputBeam: 10, fieldStopDiameter: 6.984153898349546,
      },
      tolerance: 1e-8,
    },
    {
      // Galilean f₁ = 100 mm, f₂ = −25 mm, t = 50 mm (not afocal; afocal at 75 mm). A = 1 − 0.05/0.1 = 0.5, D = 1 − 0.05/(−0.025) = 3,
      // C = −1/f₁ − 1/f₂ + t/(f₁f₂) = −10 + 40 − 20 = 10 dpt, φ = −C = −10 D (φ₁ + φ₂ − tφ₁φ₂ = 10 − 40 + 20),
      // EFL = −1/C = −100 mm, BFD = −A/C = −50 mm, FFD = −D/C = −300 mm.
      source: GREIVENKAMP,
      basis: "computed",
      inputs: { f1Mm: 100, f2Mm: -25, separationMm: 50 },
      expect: { matrixA: 0.5, matrixD: 3, matrixC: 10, power: -10, efl: -100, bfd: -50, ffd: -300 },
      tolerance: 1e-8,
    },
    {
      // Galilean afocal f₁ = 100 mm, f₂ = −25 mm, t = 75 mm: M = −f₁/f₂ = 4, θ′ = atan(4 tan 3°) = 11.8395349°, beam 10 mm · 25/100 = 2.5 mm.
      source: GREIVENKAMP,
      basis: "computed",
      inputs: { f1Mm: 100, f2Mm: -25, separationMm: 75, objectAngleDeg: 3, beamDiameterMm: 10 },
      expect: { magnification: 4, outputAngle: 11.83953489260835, outputBeam: 2.5 },
      tolerance: 1e-8,
    },
  ],
});
