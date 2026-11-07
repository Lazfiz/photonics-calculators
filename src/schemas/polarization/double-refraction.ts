import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS } from "../../physics/materials/uniaxial-data";
import { beamSeparation, maxWalkoff, plateRetardance, plateWaves, resolveCrystalIndices } from "../../physics/polarization/uniaxial";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const BORN_WOLF = "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, ch. 15 'Optics of crystals' " +
  "(1/n² = cos²θ/nₒ² + sin²θ/nₑ²; tan θ_S = (nₒ/nₑ)² tan θ; maximum walk-off tan ρ = (nₒ² − nₑ²)/(2 nₒ nₑ)). " +
  "https://doi.org/10.1017/CBO9781139644181";

export default defineSchema({
  href: "/polarization/double-refraction",
  choices: [
    {
      key: "crystal",
      label: "Crystal",
      options: [
        ...CRYSTAL_IDS.map((id) => ({ value: id, label: UNIAXIAL_CRYSTALS[id].name })),
        { value: "custom", label: "Custom (no dispersion)" },
      ],
      default: "calcite",
    },
  ],
  inputs: [
    { key: "nO", label: "Ordinary index nₒ (custom crystal only)", unit: "", toSI: 1, siUnit: "", default: 1.658, min: 1, max: 5 },
    { key: "nE", label: "Extraordinary index nₑ (custom crystal only)", unit: "", toSI: 1, siUnit: "", default: 1.486, min: 1, max: 5 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 589, min: 200, max: 7000 },
    { key: "thickness", label: "Plate thickness", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.001, max: 100 },
    { key: "axisAngle", label: "Optic axis angle from the plate normal", unit: "°", toSI: DEG, siUnit: "rad", default: 45, min: 0, max: 90 },
    { key: "angleOfIncidence", label: "Angle of incidence in air", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: 0, max: 85 },
  ],
  outputs: [
    { key: "nOrdinary", label: "Ordinary index nₒ", unit: "", toSI: 1, siUnit: "" },
    { key: "nExtraordinary", label: "Extraordinary index nₑ", unit: "", toSI: 1, siUnit: "" },
    { key: "nWave", label: "Index of the e wave n(θ)", unit: "", toSI: 1, siUnit: "" },
    { key: "waveAxisAngle", label: "e wave normal from the optic axis", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "walkoff", label: "Walk-off ρ (e ray minus e wave normal, in the plate)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "maxWalkoff", label: "Largest walk-off of the crystal (magnitude)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "maxWalkoffTheta", label: "Wave-normal angle from the axis at the largest walk-off", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "oRay", label: "o ray angle in the plate", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "eWaveNormal", label: "e wave normal angle in the plate", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "eRay", label: "e ray angle in the plate", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "separation", label: "Beam separation after the plate", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "retardance", label: "Retardance of e relative to o (negative: e leads)", unit: "waves", toSI: 1, siUnit: "waves" },
  ],
  compute({ crystal, nO: customNo, nE: customNe, wavelength, thickness, axisAngle, angleOfIncidence }) {
    const { no, ne } = resolveCrystalIndices(crystal, wavelength, customNo, customNe);
    const w = plateWaves(no, ne, { nIncident: 1, incidence: angleOfIncidence, axisPolar: axisAngle, axisAzimuth: 0 });
    const rayE = Math.atan2(w.e.ray[0], w.e.ray[2]);
    const peak = maxWalkoff(no, ne);
    const warnings: string[] = [];
    if (!Number.isFinite(no)) warnings.push("The wavelength is outside this crystal's Sellmeier data range: no indices.");
    else if (!Number.isFinite(w.e.kz) || !Number.isFinite(w.o.kz)) warnings.push("A wave is evanescent at this angle of incidence: no transmitted beam.");
    return {
      values: {
        nOrdinary: no,
        nExtraordinary: ne,
        nWave: w.e.index,
        waveAxisAngle: w.e.axisAngle,
        walkoff: rayE - w.e.waveAngle,
        maxWalkoff: Math.abs(peak.rho),
        maxWalkoffTheta: peak.theta,
        oRay: w.o.waveAngle,
        eWaveNormal: w.e.waveAngle,
        eRay: rayE,
        separation: beamSeparation(w, thickness, angleOfIncidence),
        retardance: plateRetardance(w, thickness, wavelength) / (2 * Math.PI),
      },
      warnings,
    };
  },
  checks: [
    {
      // Custom nₒ = 1.658, nₑ = 1.486 (calcite at 589 nm), normal incidence. Largest walk-off: tan ρ = (1.658² − 1.486²)/(2·1.658·1.486)
      // = 0.540768/4.927576 = 0.109741 → 6.262761° at θ = atan(nₑ/nₒ) = 41.868620°.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { crystal: "custom", nO: 1.658, nE: 1.486, angleOfIncidence: 0 },
      expect: { maxWalkoff: 6.262760911, maxWalkoffTheta: 41.86861954 },
      tolerance: 1e-8,
    },
    {
      // Same crystal, axis 45° from the normal, normal incidence, d = 10 mm: the e wave normal stays along z, θ = 45°.
      // tan θ_S = (1.658/1.486)² tan 45° = 1.244890 → ρ = θ_S − θ = 6.225680°. Lateral offset of the beams = d tan ρ = 10 · 0.109088 mm = 1.090883 mm.
      // n(45°) = (0.5/1.658² + 0.5/1.486²)^−½ = 1.564955, Γ/2π = d (n(θ) − nₒ)/λ = 0.01 · (1.564955 − 1.658)/589e-9 = −1579.71 waves.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { crystal: "custom", nO: 1.658, nE: 1.486, thickness: 10, axisAngle: 45, angleOfIncidence: 0 },
      expect: { nWave: 1.5649550401, separation: 1.0908826828, retardance: -1579.7106937 },
      tolerance: 1e-8,
    },
  ],
});
