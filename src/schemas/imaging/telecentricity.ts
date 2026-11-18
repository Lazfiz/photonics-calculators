import { telecentricitySummary } from "../../physics/imaging/telecentricity";
import { defineSchema } from "../types";

const GREIVENKAMP = "Greivenkamp J. E. (2004). Field Guide to Geometrical Optics. SPIE Press, https://doi.org/10.1117/3.547461, " +
  "Telecentricity (chief ray through the entrance-pupil centre, so with the sensor fixed Δm/m = −Δz/(s_EP + Δz)).";
const INOUE = "Inoué S., Spring K. R. (1997). Microscope Image Formation. In: Video Microscopy, 2nd ed., ch. 2, pp. 13–117, Plenum, " +
  "https://doi.org/10.1007/978-1-4615-5859-0_2 (total depth of field d = λ₀n/NA² + n·e/(M·NA), here in air, n = 1).";

const POLE = "the displacement would move the object through the entrance pupil";
const INFINITE = "residual slope 0: the equivalent entrance pupil is at infinity (perfectly telecentric)";

export default defineSchema({
  href: "/imaging/telecentricity",
  inputs: [
    { key: "magnification", label: "Magnification |m|", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0.01, max: 10 },
    { key: "na", label: "Object-side NA", unit: "", toSI: 1, siUnit: "", default: 0.025, min: 0.001, max: 0.5 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 2000 },
    { key: "blur", label: "Acceptable blur at the sensor", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10, min: 0.5, max: 100 },
    { key: "fieldHeight", label: "Object field height h", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0.1, max: 200 },
    { key: "pupilDistance", label: "Ordinary lens: entrance pupil distance", unit: "mm", toSI: 1e-3, siUnit: "m", default: 200, min: 10, max: 10000 },
    { key: "dz", label: "Object displacement Δz, + away", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0.5, min: -50, max: 50 },
    { key: "slope", label: "Telecentric lens: residual slope at h", unit: "°", toSI: Math.PI / 180, siUnit: "rad", default: 0.1, min: -2, max: 2 },
  ],
  outputs: [
    { key: "chiefAngle", label: "Ordinary: chief ray at h, atan(h/s_EP)", unit: "°", toSI: Math.PI / 180, siUnit: "rad" },
    { key: "ordinary", label: "Ordinary: Δm/m = −Δz/(s_EP + Δz)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "ordinaryShift", label: "Ordinary: edge image shift", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "teleDistance", label: "Telecentric: equivalent pupil h/tan θ_t", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "telecentric", label: "Telecentric: Δm/m", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "teleShift", label: "Telecentric: edge image shift", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "dofWave", label: "Depth of field, wave λ/NA²", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "dofDetector", label: "Depth of field, geometric e/(m·NA)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "dofTotal", label: "Depth of field, total", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ magnification, na, wavelength, blur, fieldHeight, pupilDistance, dz, slope }) {
    const t = telecentricitySummary({
      magnification, NA: na, lambda: wavelength, blur, fieldHeight, pupilDistance, dz, slope,
    });
    const warnings: string[] = [];
    if (t.outOfFocus) {
      warnings.push("|Δz| exceeds half the total depth of field: the image is out of focus; the edge shift is the blur centroid.");
    }
    const reasons: Record<string, string> = {};
    if (Number.isNaN(t.ordinary)) {
      reasons.ordinary = POLE;
      reasons.ordinaryShift = POLE;
    }
    if (Number.isNaN(t.telecentric)) {
      reasons.telecentric = POLE;
      reasons.teleShift = POLE;
    }
    if (!Number.isFinite(t.teleDistance)) reasons.teleDistance = INFINITE;
    return {
      values: {
        chiefAngle: t.chiefAngle,
        ordinary: t.ordinary,
        ordinaryShift: t.ordinaryShift,
        teleDistance: t.teleDistance,
        telecentric: t.telecentric,
        teleShift: t.teleShift,
        dofWave: t.dofWave,
        dofDetector: t.dofDetector,
        dofTotal: t.dofTotal,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // s_EP = 200 mm, Δz = 0.5 mm: Δm/m = −0.5/200.5 = −0.0024937655860349 → −0.24937655860349126 %;
      // edge shift m·h·Δm/m = 0.5 · 5 mm · (−0.0024937655860349) = −6.234413965087282 µm; chief ray atan(5/200) = 1.4320961841646465°.
      source: GREIVENKAMP,
      basis: "computed",
      inputs: {},
      expect: { ordinary: -0.24937655860349126, ordinaryShift: -6.234413965087282, chiefAngle: 1.4320961841646465 },
      tolerance: 1e-8,
    },
    {
      // Residual 0.1° at h = 5 mm: s = 5/tan(0.1°) = 2864.7860667714385 mm; Δm/m = −0.5/(2864.786 + 0.5) = −1.7450264593070544e-4 → −0.017450264593070544 %;
      // edge shift 0.5 · 5 mm · (−1.7450264593e-4) = −0.4362566148267636 µm.
      source: GREIVENKAMP,
      basis: "computed",
      inputs: {},
      expect: { teleDistance: 2864.7860667714385, telecentric: -0.017450264593070544, teleShift: -0.4362566148267636 },
      tolerance: 1e-8,
    },
    {
      // λ = 550 nm, NA 0.025, e = 10 µm, m = 0.5, n = 1: λ/NA² = 550e-9/6.25e-4 = 0.88 mm; e/(m·NA) = 10e-6/0.0125 = 0.8 mm; total 1.68 mm.
      source: INOUE,
      basis: "computed",
      inputs: {},
      expect: { dofWave: 0.88, dofDetector: 0.8, dofTotal: 1.68 },
      tolerance: 1e-8,
    },
  ],
});
