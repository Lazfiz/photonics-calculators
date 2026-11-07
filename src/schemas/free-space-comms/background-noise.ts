import {
  BACKGROUND_SCENES, backgroundPower, photonEnergy, sceneRadiance, sceneSolidAngle, type BackgroundScene,
} from "../../physics/free-space-comms/background-radiance";
import { defineSchema } from "../types";

const GIGGENBACH = "Giggenbach D. (2022). Free-space optical data receivers with avalanche detectors for satellite " +
  "downlinks regarding background light. Sensors 22(18), 6773, Table 1 and eq. 22 (P_bg = L_λ A Ω Δλ T_f η_opt).";

export default defineSchema({
  href: "/free-space-comms/background-noise",
  choices: [
    {
      key: "scene",
      label: "Background in the field of view",
      options: BACKGROUND_SCENES.map((s) => ({ value: s.id, label: s.label })),
      default: "horizon",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 850, max: 1550 },
    { key: "rxFOV", label: "Full field of view", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1, min: 0.001, max: 1000 },
    { key: "rxBandwidth", label: "Filter passband Δλ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1, min: 0.001, max: 100 },
    { key: "rxArea", label: "Aperture area", unit: "cm²", toSI: 1e-4, siUnit: "m²", default: 78.5, min: 0.001, max: 100000 },
    { key: "filterT", label: "Filter in-band transmission", unit: "", toSI: 1, siUnit: "", default: 0.9, min: 0, max: 1 },
    { key: "opticsEff", label: "Other optics efficiency η_opt", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0, max: 1 },
    { key: "qe", label: "Detector quantum efficiency", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0, max: 1 },
    { key: "bitRate", label: "Bit rate", unit: "Gb/s", toSI: 1e9, siUnit: "bit/s", default: 1, min: 1e-6, max: 1000 },
  ],
  outputs: [
    { key: "radiance", label: "Spectral radiance L_λ", unit: "W m⁻² sr⁻¹ nm⁻¹", toSI: 1e9, siUnit: "W m⁻² sr⁻¹ m⁻¹" },
    { key: "solidAngle", label: "Solid angle used Ω", unit: "sr", toSI: 1, siUnit: "sr" },
    { key: "power", label: "Background power at the detector", unit: "W", toSI: 1, siUnit: "W" },
    { key: "powerDbm", label: "Background power at the detector", unit: "dBm", toSI: 1, siUnit: "dBm" },
    { key: "photonRate", label: "Photon rate at the detector", unit: "s⁻¹", toSI: 1, siUnit: "s⁻¹" },
    { key: "electronRate", label: "Photoelectron rate", unit: "s⁻¹", toSI: 1, siUnit: "s⁻¹" },
    { key: "photoelectronsPerBit", label: "Background photoelectrons per bit", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ scene, wavelength, rxFOV, rxBandwidth, rxArea, filterT, opticsEff, qe, bitRate }) {
    const s = scene as BackgroundScene;
    const radiance = sceneRadiance(s, wavelength);
    const { power, solidAngle } = backgroundPower({
      radiance, area: rxArea, fovHalfAngle: rxFOV / 2, sourceSolidAngle: sceneSolidAngle(s), bandwidth: rxBandwidth,
      filterTransmission: filterT, opticalEfficiency: opticsEff,
    });
    const photonRate = power / photonEnergy(wavelength);
    const electronRate = qe * photonRate;
    const warnings: string[] = [];
    if (!(power > 0)) warnings.push("The collected background power is zero, so it has no dBm value.");
    return {
      values: {
        radiance, solidAngle, power, powerDbm: power > 0 ? 10 * Math.log10(power * 1e3) : NaN, photonRate, electronRate,
        photoelectronsPerBit: electronRate / bitRate,
      },
      warnings,
    };
  },
  checks: [
    {
      // Table 1, "blue sky horizon" at 850 nm: 30 × 10⁻³ W/(m² nm sr) (checked against the paper, PMC9503493).
      source: GIGGENBACH,
      basis: "printed",
      inputs: { scene: "horizon", wavelength: 850 },
      expect: { radiance: 0.03 },
      tolerance: 1e-3,
    },
    {
      // P = L A Ω Δλ T_f η, Ω = π sin²(0.5 mrad) = 7.853981e-7 sr: 25 mW m⁻² sr⁻¹ nm⁻¹ × 7.85e-3 m² × Ω × 1 nm × 0.9 × 0.8
      // = 1.109768e-10 W (−69.5477 dBm); E_γ = hc/1550 nm gives 8.659383e8 photons/s, 0.8× that is 6.927507e8 e⁻/s.
      source: GIGGENBACH,
      basis: "computed",
      inputs: {},
      expect: { power: 1.1097675124e-10, powerDbm: -69.54767993, photonRate: 8.659383481e8, electronRate: 6.927506785e8, photoelectronsPerBit: 0.6927506785 },
      tolerance: 1e-7,
    },
    {
      // Zenith at 1064 nm (2.3 mW m⁻² sr⁻¹ nm⁻¹), 2 mrad FOV, 100 cm², Δλ 0.5 nm, T_f 0.8, η_opt 0.5, η 0.7, 0.1 Gb/s:
      // Ω = π sin²(1 mrad) = 3.141592e-6 sr, P = 1.445132e-11 W, 7.740561e7 photons/s, 5.418393e7 e⁻/s.
      source: GIGGENBACH,
      basis: "computed",
      inputs: { scene: "zenith", wavelength: 1064, rxFOV: 2, rxBandwidth: 0.5, rxArea: 100, filterT: 0.8, opticsEff: 0.5, qe: 0.7, bitRate: 0.1 },
      expect: { power: 1.4451321389e-11, photonRate: 7.740561316e7, photoelectronsPerBit: 0.5418392921 },
      tolerance: 1e-7,
    },
  ],
});
