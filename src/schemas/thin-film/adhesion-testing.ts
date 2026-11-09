import {
  benjaminWeaver, bendTest, kendallPeelEnergy, kendallStretchShare, tapeClass,
} from "../../physics/thin-film/adhesion";
import { defineSchema } from "../types";

const BENJAMIN = "Benjamin P., Weaver C. (1960). Measurement of adhesion of thin films. Proc. R. Soc. Lond. A 254, 163–176, " +
  "doi:10.1098/rspa.1960.0012 (shear stress at the edge of the contact of a spherical stylus, a = √(L/(πH)), prefactor k = 1; " +
  "Bull S. J., Berasetegui E. G. (2006), Tribol. Int. 39, 99–114, doi:10.1016/j.triboint.2005.04.013, eq. 1: τ = kHa/√(R² − a²)).";
const KENDALL = "Kendall K. (1975). Thin-film peeling: the elastic term. J. Phys. D: Appl. Phys. 8, 1449–1452, " +
  "doi:10.1088/0022-3727/8/13/005: G = (F/b)(1 − cos θ) + (F/b)²/(2Eh).";
const HUTCHINSON = "Hutchinson J. W., Suo Z. (1991). Mixed mode cracking in layered materials. Adv. Appl. Mech. 29, 63–191, " +
  "doi:10.1016/S0065-2156(08)70164-9: G = Z σ² h/Ē_f with Z = 1.976 (channel crack, matched moduli) and Z = 1/2 " +
  "(steady-state delamination); film strain ε = h_s/(2R) at the convex side of a substrate bent to radius R, " +
  "σ = σ_res + Ē_f ε, Ē_f = E_f/(1 − ν_f²).";

export default defineSchema({
  href: "/thin-film/adhesion-testing",
  choices: [
    {
      key: "method",
      label: "Test method",
      options: [
        { value: "scratch", label: "Scratch test" },
        { value: "peel", label: "Peel test" },
        { value: "tape", label: "Tape test (ASTM D3359 B)" },
        { value: "bend", label: "Bend test" },
      ],
      default: "scratch",
    },
  ],
  inputs: [
    { key: "criticalLoad", label: "Scratch test: critical load", unit: "N", toSI: 1, siUnit: "N", default: 10, min: 0, max: 1000 },
    { key: "tipRadius", label: "Scratch test: stylus tip radius", unit: "µm", toSI: 1e-6, siUnit: "m", default: 200, min: 1, max: 5000 },
    { key: "hardness", label: "Scratch test: substrate hardness", unit: "GPa", toSI: 1e9, siUnit: "Pa", default: 6, min: 0.01, max: 100 },
    { key: "peelForce", label: "Peel test: force per unit width F/b", unit: "N/m", toSI: 1, siUnit: "N/m", default: 100, min: 0, max: 100000 },
    { key: "peelAngle", label: "Peel test: peel angle θ", unit: "°", toSI: Math.PI / 180, siUnit: "rad", default: 90, min: 0, max: 180 },
    { key: "armModulus", label: "Peel test: Young's modulus of the peel arm", unit: "GPa", toSI: 1e9, siUnit: "Pa", default: 3, min: 0.001, max: 1500 },
    { key: "armThickness", label: "Peel test: thickness of the peel arm", unit: "µm", toSI: 1e-6, siUnit: "m", default: 50, min: 0.01, max: 10000 },
    { key: "removed", label: "Tape test: lattice area removed by the tape", unit: "%", toSI: 0.01, siUnit: "", default: 0, min: 0, max: 100 },
    { key: "substrateThickness", label: "Bend test: substrate thickness", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0.2, min: 0.001, max: 100 },
    { key: "bendRadius", label: "Bend test: bend radius at the substrate mid-plane", unit: "mm", toSI: 1e-3, siUnit: "m", default: 20, min: 0.01, max: 10000 },
    { key: "filmModulus", label: "Bend test: film Young's modulus", unit: "GPa", toSI: 1e9, siUnit: "Pa", default: 70, min: 0.1, max: 1500 },
    { key: "filmPoisson", label: "Bend test: film Poisson's ratio", unit: "", toSI: 1, siUnit: "", default: 0.2, min: 0, max: 0.49 },
    { key: "filmThickness", label: "Bend test: film thickness", unit: "nm", toSI: 1e-9, siUnit: "m", default: 100, min: 1, max: 1000000 },
    { key: "residualStress", label: "Bend test: residual film stress (tensile > 0)", unit: "MPa", toSI: 1e6, siUnit: "Pa", default: 0, min: -10000, max: 10000 },
  ],
  outputs: [
    { key: "shearStress", label: "Scratch: interfacial shear stress τ", unit: "MPa", toSI: 1e6, siUnit: "Pa" },
    { key: "contactRadius", label: "Scratch: contact radius a", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "peelEnergy", label: "Peel: interfacial fracture energy G", unit: "J/m²", toSI: 1, siUnit: "J/m²" },
    { key: "peelStretchShare", label: "Peel: share of G from stretching the peel arm", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "tapeClass", label: "Tape: ASTM D3359 B class (5 = 5B … 0 = 0B)", unit: "", toSI: 1, siUnit: "" },
    { key: "bendStrain", label: "Bend: film strain on the convex side", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "bendStress", label: "Bend: film stress along the bend", unit: "MPa", toSI: 1e6, siUnit: "Pa" },
    { key: "channelG", label: "Bend: G of a channel crack", unit: "J/m²", toSI: 1, siUnit: "J/m²" },
    { key: "delaminationG", label: "Bend: G of interface delamination", unit: "J/m²", toSI: 1, siUnit: "J/m²" },
  ],
  validate({ method, substrateThickness, bendRadius }) {
    if (method === "bend" && !(substrateThickness < 2 * bendRadius)) return "The bend radius must exceed half the substrate thickness.";
    return undefined;
  },
  compute({
    method, criticalLoad, tipRadius, hardness, peelForce, peelAngle, armModulus, armThickness, removed,
    substrateThickness, bendRadius, filmModulus, filmPoisson, filmThickness, residualStress,
  }) {
    const values = {
      shearStress: NaN, contactRadius: NaN, peelEnergy: NaN, peelStretchShare: NaN, tapeClass: NaN,
      bendStrain: NaN, bendStress: NaN, channelG: NaN, delaminationG: NaN,
    };
    const warnings = ["Only the outputs of the chosen method are filled; the others are null."];
    if (method === "scratch") {
      const s = benjaminWeaver(criticalLoad, tipRadius, hardness);
      values.shearStress = s.shearStress;
      values.contactRadius = s.contactRadius;
      if (!Number.isFinite(s.shearStress)) {
        warnings.push("The contact radius would reach the tip radius (L ≥ πR²H): the stylus is buried, no result.");
      }
    } else if (method === "peel") {
      values.peelEnergy = kendallPeelEnergy(peelForce, peelAngle, armModulus, armThickness);
      values.peelStretchShare = kendallStretchShare(peelForce, peelAngle, armModulus, armThickness);
    } else if (method === "tape") {
      const cls = tapeClass(Number((removed * 100).toPrecision(12))) /* undo the % → fraction rounding */;
      values.tapeClass = cls === undefined ? NaN : Number(cls[0]);
    } else {
      const b = bendTest(substrateThickness, bendRadius, filmModulus, filmPoisson, filmThickness, residualStress);
      values.bendStrain = b.strain;
      values.bendStress = b.stress;
      values.channelG = b.channelG;
      values.delaminationG = b.delaminationG;
      if (b.stress < 0) warnings.push("The film is in net compression, so it fails by buckling, which isn't modelled: no crack or delamination G.");
    }
    return { values, warnings };
  },
  checks: [
    {
      // L = 0.1 N, R = 200 µm, H = 6 GPa: a = √(0.1/(π · 6e9)) = 2.3032943 µm; τ = H a/√(R² − a²) = 69.103413 MPa.
      source: BENJAMIN,
      basis: "computed",
      inputs: { method: "scratch", criticalLoad: 0.1, tipRadius: 200, hardness: 6 },
      expect: { shearStress: 69.10341260859798, contactRadius: 2.3032943298089035 },
      tolerance: 1e-8,
    },
    {
      // F/b = 100 N/m, θ = 90°, E = 3 GPa, h = 50 µm: G = 100 · 1 + 100²/(2 · 3e9 · 5e-5) = 100 + 0.0333333 = 100.033333 J/m²;
      // the stretching share is 0.0333333/100.033333 = 0.0333222 %.
      source: KENDALL,
      basis: "computed",
      inputs: { method: "peel", peelForce: 100, peelAngle: 90, armModulus: 3, armThickness: 50 },
      expect: { peelEnergy: 100.03333333333332, peelStretchShare: 0.03332222592469178 },
      tolerance: 1e-8,
    },
    {
      // h_s = 0.2 mm, R = 20 mm: ε = 0.005 (0.5 %); Ē_f = 70e9/0.96 = 72.916667 GPa; σ = Ē_f ε = 364.583333 MPa;
      // G = σ² h/Ē_f = 0.18229167 J/m²: channel crack 1.976 × 0.18229167 = 0.360208 J/m², delamination ½ × 0.18229167 = 0.0911458 J/m².
      source: HUTCHINSON,
      basis: "computed",
      inputs: { method: "bend", substrateThickness: 0.2, bendRadius: 20, filmModulus: 70, filmPoisson: 0.2, filmThickness: 100, residualStress: 0 },
      expect: { bendStrain: 0.5, bendStress: 364.5833333333334, channelG: 0.36020833333333335, delaminationG: 0.09114583333333334 },
      tolerance: 1e-8,
    },
  ],
});
