import { luminousWeightedMean } from "../../physics/cie-photometry";
import { normalIncidenceReflectance } from "../../physics/polarization/fresnel";
import { dropletTirFraction, tirOnsetAngle, waterFilmResponse, waterSurfaceTension, wetting } from "../../physics/thin-film/anti-fog";
import { stackResponse } from "../../physics/thin-film/transfer-matrix";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const pure = { unit: "", toSI: 1, siUnit: "" } as const;
const percent = { unit: "%", toSI: 0.01, siUnit: "" } as const;
const mNm = { unit: "mN/m", toSI: 1e-3, siUnit: "N/m" } as const;

export default defineSchema({
  href: "/thin-film/anti-fog",
  inputs: [
    { key: "nCoat", label: "Coating index", ...pure, default: 1.33, min: 1, max: 4 },
    { key: "nSub", label: "Substrate index", ...pure, default: 1.52, min: 1, max: 4 },
    { key: "thickness", label: "Coating thickness", unit: "nm", toSI: 1e-9, siUnit: "m", default: 120, min: 0, max: 10000 },
    { key: "contactAngle", label: "Water contact angle on the coating", unit: "°", toSI: DEG, siUnit: "rad", default: 15, min: 0, max: 180 },
    { key: "waterTemp", label: "Water temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 20, min: -25, max: 100 },
  ],
  outputs: [
    { key: "tauDry", label: "Luminous transmittance into the substrate, dry coating (D65 × V(λ))", ...percent },
    { key: "tauWet", label: "Luminous transmittance under a water film", ...percent },
    { key: "tauUncoated", label: "Luminous transmittance of the uncoated dry substrate", ...percent },
    { key: "tirFraction", label: "Droplet footprint area returning light by total internal reflection", ...percent },
    { key: "tirOnsetAngle", label: "Contact angle where droplet TIR starts", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "surfaceTension", label: "Surface tension of water γ", ...mNm },
    { key: "adhesionTension", label: "Adhesion tension γ cos θ", ...mNm },
    { key: "workOfAdhesion", label: "Work of adhesion γ(1 + cos θ)", ...mNm },
  ],
  compute({ nCoat, nSub, thickness, contactAngle, waterTemp }) {
    const coating = [{ n: nCoat, thickness }];
    const dry = (lam: number) => stackResponse({ incident: 1, layers: coating, substrate: { n: nSub } }, lam).T;
    const wet = (lam: number) => waterFilmResponse(coating, nSub, lam).T;
    const gamma = waterSurfaceTension(waterTemp + 273.15);
    const w = wetting(gamma, contactAngle);
    return {
      values: {
        tauDry: luminousWeightedMean(dry),
        tauWet: luminousWeightedMean(wet),
        tauUncoated: 1 - normalIncidenceReflectance(1, nSub),
        tirFraction: dropletTirFraction(contactAngle),
        tirOnsetAngle: tirOnsetAngle(),
        surfaceTension: gamma,
        adhesionTension: w.adhesionTension,
        workOfAdhesion: w.workOfAdhesion,
      },
      warnings: contactAngle > Math.PI / 2 + 1e-12 ? ["Contact angle above 90°: the droplet TIR fraction is not modelled."] : [],
    };
  },
  checks: [
    {
      // Zero thickness: the dry stack is the bare substrate, T = 1 − ((1.52 − 1)/(1.52 + 1))² = 0.9574200050 at every
      // wavelength, so the D65 × V weighted mean equals it. Under water (n_w = 1.333): R₁ = ((n_w − 1)/(n_w + 1))²,
      // R₂ = ((n_w − 1.52)/(n_w + 1.52))², T = (1 − R₁)(1 − R₂)/(1 − R₁R₂) = 0.9755035684.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., CRC Press, ch. 2 (thick incoherent layers); Fresnel reflectance at normal incidence.",
      basis: "computed",
      inputs: { thickness: 0, nSub: 1.52, nCoat: 1.33 },
      expect: { tauDry: 95.7420005039, tauUncoated: 95.7420005039, tauWet: 97.5503568403 },
      tolerance: 1e-8,
    },
    {
      // Hemispherical drop (θ = 90°): f = 1 − (1/n_w)² = 1 − 1/1.333² = 0.4372186445; onset asin(1/1.333) = 48.6°.
      source: "Geometric optics of a spherical-cap droplet, total internal reflection at sin α = 1/n_w (Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, §1.5).",
      basis: "computed",
      inputs: { contactAngle: 90 },
      expect: { tirFraction: 43.7218644496 },
      tolerance: 1e-8,
    },
    {
      // Young–Dupré at θ = 60°, 20 °C: γ = B τ^μ (1 − bτ) with τ = 1 − 293.15/647.096 = 0.5470, B = 235.8 mN/m,
      // b = 0.625, μ = 1.256 gives 72.73614 mN/m; γ cos 60° = 36.36807, γ(1 + cos 60°) = 109.10421.
      source: "IAPWS R1-76(2014) Release on the Surface Tension of Ordinary Water Substance (Vargaftik N. B., Volkov B. N., Voljak L. D. (1983). J. Phys. Chem. Ref. Data 12, 817, doi:10.1063/1.555688); Young–Dupré equation.",
      basis: "computed",
      inputs: { contactAngle: 60, waterTemp: 20 },
      expect: { surfaceTension: 72.7361404216, adhesionTension: 36.3680702108, workOfAdhesion: 109.1042106324 },
      tolerance: 1e-8,
    },
  ],
});
