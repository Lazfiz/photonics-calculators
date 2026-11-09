import { IEC_IL_GRADES, IEC_RL_GRADES, connectorLoss } from "../../physics/fiber-optics/gaussian-coupling";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const MARCUSE = "Marcuse D. (1977). Loss analysis of single-mode fiber splices. Bell Syst. Tech. J. 56(5), 703–718, " +
  "doi:10.1002/j.1538-7305.1977.tb00534.x: offset η = exp(−d²/w²) and tilt η = exp(−(π n w θ/λ)²) for equal mode radii w; " +
  "gap η = 1/(1 + (λz/(2π n w²))²) (Gaussian-beam diffraction, Kogelnik H., Li T. (1966), Appl. Opt. 5, 1550–1567, " +
  "doi:10.1364/AO.5.001550).";

export default defineSchema({
  href: "/fiber-optics/connector-insertion-loss",
  inputs: [
    { key: "numConnectors", label: "Number of connections", unit: "", toSI: 1, siUnit: "", default: 4, min: 1, max: 1000 },
    { key: "fiberCoreDiam", label: "Mode field diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 9, min: 1, max: 30 },
    { key: "lateralOffset", label: "Lateral offset", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0.3, min: 0, max: 20 },
    { key: "angularMisalign", label: "Angular misalignment", unit: "°", toSI: DEG, siUnit: "rad", default: 0.3, min: 0, max: 29 },
    { key: "gapDistance", label: "End-face gap (≤ 5 µm)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0.05, min: 0, max: 5 },
    { key: "refractiveIndex", label: "Fibre phase index", unit: "", toSI: 1, siUnit: "", default: 1.447, min: 1, max: 2 },
    { key: "gapIndex", label: "Gap medium index", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 2 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 5000 },
  ],
  choices: [
    {
      key: "ilGrade", label: "IEC 61753-1 attenuation grade",
      options: Object.entries(IEC_IL_GRADES).map(([value, g]) => ({ value, label: `Grade ${value}: ${g.mean} dB mean, ${g.max} dB max${g.note ? ` (${g.note})` : ""}` })),
      default: "C",
    },
    {
      key: "rlGrade", label: "IEC 61753-1 return-loss grade",
      options: Object.entries(IEC_RL_GRADES).map(([value, g]) => ({ value, label: `Grade ${value}: ≥ ${g.rl} dB${g.note ? ` (${g.note})` : ""}` })),
      default: "2",
    },
  ],
  outputs: [
    { key: "lateralLoss", label: "Lateral-offset loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "angularLoss", label: "Angular loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "gapLoss", label: "Gap loss (diffraction + reflection)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "totalLoss", label: "Total loss per connection", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "totalLossN", label: "Total loss of all connections", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "gradeMeanN", label: "Grade mean loss of all connections", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "gradeLimitN", label: "Grade limit of all connections", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "jointReturnLoss", label: "Return loss of the gap", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "rlGradeMin", label: "Return loss required by the grade", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ numConnectors, fiberCoreDiam, lateralOffset, angularMisalign, gapDistance, refractiveIndex, gapIndex, wavelength, ilGrade, rlGrade }) {
    const r = connectorLoss({
      w: fiberCoreDiam / 2, lambda: wavelength, nFiber: refractiveIndex, nGap: gapIndex,
      offset: lateralOffset, tilt: angularMisalign, gap: gapDistance,
    });
    const n = Math.max(1, Math.round(numConnectors));
    const grade = IEC_IL_GRADES[ilGrade];
    const warnings: string[] = [];
    if (r.jointReturnLoss === Infinity) warnings.push("No gap (physical contact) or an index-matched gap: the gap reflects nothing, so its return loss is infinite.");
    return {
      values: {
        lateralLoss: r.lateral,
        angularLoss: r.angular,
        gapLoss: r.gap,
        totalLoss: r.total,
        totalLossN: r.total * n,
        gradeMeanN: grade.mean * n,
        gradeLimitN: grade.max * n,
        jointReturnLoss: r.jointReturnLoss,
        rlGradeMin: IEC_RL_GRADES[rlGrade].rl,
      },
      warnings,
    };
  },
  checks: [
    {
      // Physical contact (z = 0), w = 4.5 µm, 1550 nm, n = 1.447. Offset 0.3 µm: loss = (10/ln 10)(d/w)² = 4.342945 · 0.0044444 = 0.019302 dB.
      // Tilt 0.3° = 5.23599e-3 rad: x = π n w θ/λ = π · 1.447 · 4.5e-6 · 5.23599e-3/1.55e-6 = 0.0691031, loss = 4.342945 x² = 0.020739 dB.
      // At z = 0 the two factors multiply, so the total is their sum, 0.040041 dB.
      source: MARCUSE,
      basis: "computed",
      inputs: { gapDistance: 0, lateralOffset: 0.3, angularMisalign: 0.3, fiberCoreDiam: 9, refractiveIndex: 1.447, wavelength: 1550 },
      expect: { lateralLoss: 0.019301976973477856, angularLoss: 0.020738626723160736, totalLoss: 0.04004060369663859 },
      tolerance: 1e-8,
    },
    {
      // Index-matched gap (n_gap = n_fibre = 1.447, no Fresnel step) of 5 µm, no offset or tilt: u = λz/(2π n w²) =
      // 1.55e-6 · 5e-6/(2π · 1.447 · 2.025e-11) = 0.0420948; loss = 10 log10(1 + u²) = 0.0076888 dB.
      source: MARCUSE,
      basis: "computed",
      inputs: { gapDistance: 5, lateralOffset: 0, angularMisalign: 0, gapIndex: 1.447, refractiveIndex: 1.447 },
      expect: { gapLoss: 0.007688761108432429, totalLoss: 0.007688761108432429 },
      tolerance: 1e-8,
    },
  ],
});
