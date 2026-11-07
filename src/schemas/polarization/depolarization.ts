import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS, crystalIndices, crystalRange, type CrystalId } from "../../physics/materials/uniaxial-data";
import { applyMueller, muellerDepolarizer } from "../../physics/polarization/mueller";
import { plateBandModel, type SpectrumShape } from "../../physics/polarization/spectral-depolarization";
import { type Stokes, degreeOfPolarization, isPhysicalStokes, polarizedIntensity } from "../../physics/polarization/stokes";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
/** The page's d range: from −1/3 (the physical limit, rounded inward to a slider step) to 1. */
const D_MIN = -0.333;
// The widest wavelength range any crystal holds, as the page's inputs round it (per crystal in `validate`).
const lambdaLo_nm = Math.min(...CRYSTAL_IDS.map((id) => Math.ceil(crystalRange(id)[0] * 1.001e9)));
const lambdaHi_nm = Math.max(...CRYSTAL_IDS.map((id) => Math.floor(crystalRange(id)[1] * 0.999e9)));

const CLOUDE = "Cloude S. R. (1986). Group theory and polarisation algebra. Optik 75, 26–36 (the Mueller matrix diag(1, d, d, d) " +
  "is physical for −1/3 ≤ d ≤ 1); DOP_out = |d| · DOP_in. Goldstein D. H. (2011), Polarized Light, 3rd ed., CRC Press, " +
  "https://doi.org/10.1201/b10436 (Stokes vectors and Mueller matrices).";

export default defineSchema({
  href: "/polarization/depolarization",
  choices: [
    {
      key: "mode",
      label: "Mode",
      options: [
        { value: "depolarizer", label: "Depolarizer" },
        { value: "retarder", label: "Broadband light through a retarder" },
      ],
      default: "depolarizer",
    },
    {
      key: "crystal",
      label: "Crystal (retarder mode)",
      options: CRYSTAL_IDS.map((id) => ({ value: id, label: UNIAXIAL_CRYSTALS[id].name })),
      default: "quartz",
    },
    {
      key: "shape",
      label: "Spectrum shape (retarder mode)",
      options: [{ value: "flat", label: "Flat in wavenumber" }, { value: "gaussian", label: "Gaussian (FWHM)" }],
      default: "flat",
    },
  ],
  inputs: [
    { key: "d", label: "Depolarizer d (DOP scales by |d|)", unit: "", toSI: 1, siUnit: "", default: 0.5, min: D_MIN, max: 1 },
    { key: "thickness", label: "Plate thickness", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0.01, max: 200 },
    { key: "wavelength", label: "Centre wavelength λ₀ (within the crystal's range)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: lambdaLo_nm, max: lambdaHi_nm },
    { key: "bandwidth", label: "Bandwidth Δλ, full width (≤ λ₀/2)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 10, min: 0.001, max: 2000 },
    { key: "axis", label: "Fast-axis azimuth", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: -180, max: 180 },
    { key: "s0", label: "S₀", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.001, max: 10 },
    { key: "s1", label: "S₁", unit: "", toSI: 1, siUnit: "", default: 0, min: -10, max: 10 },
    { key: "s2", label: "S₂", unit: "", toSI: 1, siUnit: "", default: 1, min: -10, max: 10 },
    { key: "s3", label: "S₃", unit: "", toSI: 1, siUnit: "", default: 0, min: -10, max: 10 },
  ],
  outputs: [
    { key: "out0", label: "Output S₀", unit: "", toSI: 1, siUnit: "" },
    { key: "out1", label: "Output S₁", unit: "", toSI: 1, siUnit: "" },
    { key: "out2", label: "Output S₂", unit: "", toSI: 1, siUnit: "" },
    { key: "out3", label: "Output S₃", unit: "", toSI: 1, siUnit: "" },
    { key: "dopIn", label: "Input degree of polarization", unit: "", toSI: 1, siUnit: "" },
    { key: "dopOut", label: "Output degree of polarization", unit: "", toSI: 1, siUnit: "" },
    { key: "phaseRetardance", label: "Phase retardance R (retarder mode)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "groupRetardance", label: "Group retardance R_g (retarder mode)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "visibility", label: "Fringe visibility |V| (retarder mode)", unit: "", toSI: 1, siUnit: "" },
    { key: "halfThickness", label: "Thickness for V = 0.5 (retarder mode)", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  validate({ crystal, wavelength, bandwidth, s0, s1, s2, s3 }) {
    const S: Stokes = [s0, s1, s2, s3];
    if (!isPhysicalStokes(S)) {
      return `Not a physical Stokes vector: √(S₁² + S₂² + S₃²) = ${polarizedIntensity(S).toFixed(4)} exceeds S₀ = ${s0.toFixed(4)}.`;
    }
    const [lo, hi] = crystalRange(crystal as CrystalId);
    const loNm = Math.ceil(lo * 1.001e9), hiNm = Math.floor(hi * 0.999e9);
    if (wavelength * 1e9 < loNm - 1e-6 || wavelength * 1e9 > hiNm + 1e-6) {
      return `The wavelength must lie within ${loNm}–${hiNm} nm for ${UNIAXIAL_CRYSTALS[crystal as CrystalId].name}.`;
    }
    if (bandwidth > 0.5 * wavelength) return "The bandwidth must not exceed half the centre wavelength.";
    return undefined;
  },
  compute({ mode, d, crystal, thickness, wavelength, bandwidth, shape, axis, s0, s1, s2, s3 }) {
    const Sin: Stokes = [s0, s1, s2, s3];
    const retarder = mode === "retarder";
    const warnings: string[] = [];
    const id = crystal as CrystalId;
    const dn = (lam: number) => { const n = crystalIndices(id, lam); return Math.abs(n.ne - n.no); };
    const plate = plateBandModel(thickness, dn, wavelength, bandwidth, shape as SpectrumShape, axis);
    const Sout = applyMueller(retarder ? plate.M : muellerDepolarizer(d), Sin);
    if (!retarder) warnings.push("The retarder outputs need mode = retarder.");
    else if (!Number.isFinite(plate.halfThickness)) warnings.push("No thickness for V = 0.5: the plate has no group birefringence.");
    const spectral = (v: number) => (retarder ? v : NaN);
    return {
      values: {
        out0: Sout[0], out1: Sout[1], out2: Sout[2], out3: Sout[3],
        dopIn: degreeOfPolarization(Sin),
        dopOut: degreeOfPolarization(Sout),
        phaseRetardance: spectral(plate.phase),
        groupRetardance: spectral(plate.group),
        visibility: spectral(Math.abs(plate.visibility)),
        halfThickness: spectral(plate.halfThickness),
      },
      warnings,
    };
  },
  checks: [
    {
      // d = 0.5 on (1, 0, 1, 0): M = diag(1, d, d, d) gives (1, 0, 0.5, 0), so DOP 1 → 0.5 = |d| · DOP_in.
      source: CLOUDE,
      basis: "computed",
      inputs: { mode: "depolarizer", d: 0.5, s0: 1, s1: 0, s2: 1, s3: 0 },
      expect: { out2: 0.5, dopIn: 1, dopOut: 0.5 },
      tolerance: 1e-8,
    },
    {
      // The physical limit d = −1/3 on (1, 0, 0, 1): output (1, 0, 0, −1/3), DOP 1/3.
      source: CLOUDE,
      basis: "computed",
      inputs: { mode: "depolarizer", d: -0.333, s0: 1, s1: 0, s2: 0, s3: 1 },
      expect: { out3: -0.333, dopOut: 0.333 },
      tolerance: 1e-8,
    },
  ],
});
