import { TPA_MEDIA, tpaEvaluate, tpaTransmission, type TpaMediumId } from "../../physics/materials/two-photon";
import { defineSchema } from "../types";

const IDS = Object.keys(TPA_MEDIA) as TpaMediumId[];

const VAN_STRYLAND = "Van Stryland E. W., Woodall M. A., Vanherzeele H., Soileau M. J. (1985). Energy band-gap dependence of two-photon " +
  "absorption. Opt. Lett. 10, 490, doi:10.1364/OL.10.000490; β ∝ F₂(2ħω/E_g) with F₂(x) = (x − 1)^(3/2)/x⁵ and the plane-wave " +
  "slab solution of dI/dz = −βI²: T = 1/(1 + βI₀L), α₂ = βI₀.";

export default defineSchema({
  href: "/materials/two-photon-absorption",
  choices: [
    {
      key: "material",
      label: "Medium",
      options: [...IDS.map((id) => ({ value: id, label: TPA_MEDIA[id].name })), { value: "custom", label: "Custom" }],
      default: "gaas",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 200, max: 20000 },
    { key: "intensity", label: "Peak intensity I₀", unit: "GW/cm²", toSI: 1e13, siUnit: "W/m²", default: 1, min: 0, max: 1e4 },
    { key: "thickness", label: "Thickness L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 1e-3, max: 1e3 },
    { key: "beta", label: "Measured β (custom medium)", unit: "cm/GW", toSI: 1e-11, siUnit: "m/W", default: 23, min: 0, max: 1e5 },
    { key: "lambdaRef", label: "Wavelength of the measured β (custom medium)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 200, max: 20000 },
    { key: "bandGap", label: "Direct band gap E_g (custom medium)", unit: "eV", toSI: 1, siUnit: "eV", default: 1.42, min: 0.05, max: 15 },
  ],
  outputs: [
    { key: "beta", label: "β at this wavelength", unit: "cm/GW", toSI: 1e-11, siUnit: "m/W" },
    { key: "alpha2", label: "Induced absorption α₂ = βI₀", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "transmission", label: "Transmission T = 1/(1 + βI₀L)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "loss", label: "2PA loss", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ material, wavelength, intensity, thickness, beta: betaRef, lambdaRef, bandGap }) {
    const medium = material === "custom" ? null : TPA_MEDIA[material as TpaMediumId];
    const { beta, regime, refRegime } = tpaEvaluate(medium, { betaRef, lambdaRef, bandGap_eV: bandGap }, wavelength);
    const T = tpaTransmission(beta, intensity, thickness);
    const warnings: string[] = [];
    if (refRegime !== "two-photon") warnings.push("The measurement wavelength lies outside the 2PA window, so β cannot be scaled.");
    else if (regime === "transparent") warnings.push("2ħω < E_g: no degenerate two-photon absorption.");
    else if (regime === "linear") warnings.push("ħω ≥ E_g: one-photon (linear) absorption dominates; the 2PA model does not apply.");
    else if (regime === "outside-fit") {
      warnings.push("Below 850 nm, outside Bristow et al.'s measurements; 2PA across silicon's 3.4 eV direct gap adds below ≈ 730 nm.");
    }
    if (regime === "two-photon" && !Number.isFinite(beta)) {
      warnings.push("No β estimate at this wavelength (too close to the fitted 2PA edge, or outside the scaling's validity).");
    }
    return {
      values: { beta, alpha2: beta * intensity, transmission: T, loss: -10 * Math.log10(T) },
      warnings,
    };
  },
  checks: [
    {
      // Custom medium, β = 23 cm/GW measured at the evaluation wavelength (1060 nm), I₀ = 1 GW/cm², L = 1 mm:
      // βI₀L = 23 · 1 · 0.1 = 2.3, T = 1/3.3 = 30.30303 %, α₂ = 23 cm⁻¹, loss = 10 log10(3.3) = 5.185139 dB.
      source: VAN_STRYLAND,
      basis: "computed",
      inputs: { material: "custom", wavelength: 1060, lambdaRef: 1060, beta: 23, bandGap: 1.42, intensity: 1, thickness: 1 },
      expect: { beta: 23, alpha2: 23, transmission: 30.303030303030305, loss: 5.185139398778874 },
      tolerance: 1e-8,
    },
    {
      // Same medium moved to 900 nm by the F₂ ratio, E_g = 1.42 eV, hc = 1239.8419843 eV·nm:
      // x = 2hc/(λE_g): 1.6474116 at 1060 nm, 1.9402848 at 900 nm; F₂ = 0.04292992 and 0.03315597;
      // β = 23 · 0.03315597/0.04292992 = 17.763537 cm/GW; βI₀L = 1.7763537, T = 36.018466 %, loss 4.434748 dB.
      source: VAN_STRYLAND,
      basis: "computed",
      inputs: { material: "custom", wavelength: 900, lambdaRef: 1060, beta: 23, bandGap: 1.42, intensity: 1, thickness: 1 },
      expect: { beta: 17.763536937883867, alpha2: 17.763536937883867, transmission: 36.018465595263585, loss: 4.434747922856127 },
      tolerance: 1e-8,
    },
  ],
});
