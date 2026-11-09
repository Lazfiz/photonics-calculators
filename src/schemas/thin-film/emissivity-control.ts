import { controlCoating, controlSubstrate, emissivityControl } from "../../physics/thin-film/low-emissivity";
import { defineSchema } from "../types";

const NM = 1e-9;
const UM = 1e-6;

/** Kirchhoff emittance ε = 1 − R (normal incidence) of an opaque substrate with a metal film and a dielectric overcoat, Planck-weighted over a band. */
export default defineSchema({
  href: "/thin-film/emissivity-control",
  choices: [
    {
      key: "sub",
      label: "Opaque substrate",
      options: [
        { value: "dielectric", label: "Index n + iκ (glass, oxide, paint…)" },
        { value: "Ag", label: "Silver (Yang 2015)" },
        { value: "Al", label: "Aluminium (Rakić LD)" },
        { value: "Cr", label: "Chromium (Rakić LD)" },
      ],
      default: "dielectric",
    },
    {
      key: "film",
      label: "Metal film on it",
      options: [
        { value: "Ag", label: "Silver" },
        { value: "Al", label: "Aluminium" },
        { value: "Cr", label: "Chromium" },
        { value: "none", label: "None" },
      ],
      default: "Ag",
    },
  ],
  inputs: [
    { key: "nSub", label: "Substrate n (thermal IR; used for the n + iκ substrate)", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 0.01, max: 10 },
    { key: "kSub", label: "Substrate κ (thermal IR; used for the n + iκ substrate)", unit: "", toSI: 1, siUnit: "", default: 0, min: 0, max: 100 },
    { key: "filmThick", label: "Metal film thickness", unit: "nm", toSI: NM, siUnit: "m", default: 10, min: 0, max: 1000 },
    { key: "nCoat", label: "Overcoat n (on top)", unit: "", toSI: 1, siUnit: "", default: 2, min: 1, max: 5 },
    { key: "coatThick", label: "Overcoat thickness", unit: "nm", toSI: NM, siUnit: "m", default: 40, min: 0, max: 10000 },
    { key: "temp", label: "Surface temperature", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 50, max: 3000 },
    { key: "bandLo", label: "Band from", unit: "µm", toSI: UM, siUnit: "m", default: 2.5, min: 0.3, max: 1000 },
    { key: "bandHi", label: "Band to", unit: "µm", toSI: UM, siUnit: "m", default: 50, min: 0.3, max: 1000 },
  ],
  outputs: [
    { key: "eps", label: "Normal emittance εn, coated", unit: "", toSI: 1, siUnit: "" },
    { key: "epsBare", label: "Normal emittance εn, bare substrate", unit: "", toSI: 1, siUnit: "" },
    { key: "emitted", label: "Emitted in the band, coated (εn · F · σT⁴)", unit: "W/m²", toSI: 1, siUnit: "W/m²" },
    { key: "emittedBare", label: "Emitted in the band, bare", unit: "W/m²", toSI: 1, siUnit: "W/m²" },
    { key: "bandFraction", label: "Blackbody power in the band, share of σT⁴", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "blackbody", label: "Blackbody exitance σT⁴", unit: "W/m²", toSI: 1, siUnit: "W/m²" },
  ],
  validate({ bandLo, bandHi }) {
    return bandHi > bandLo ? undefined : "Band to must be above band from.";
  },
  compute({ sub, film, nSub, kSub, filmThick, nCoat, coatThick, temp, bandLo, bandHi }) {
    const r = emissivityControl(controlCoating(film, filmThick, nCoat, coatThick), controlSubstrate(sub, nSub, kSub), temp, bandLo, bandHi);
    const warnings = [
      "The substrate is taken as opaque (ε = 1 − R): a substrate that is transparent in the thermal IR (Si or Ge at 10 µm) emits less than this.",
    ];
    return {
      values: { eps: r.eps, epsBare: r.epsBare, emitted: r.emitted, emittedBare: r.emittedBare, bandFraction: r.fraction, blackbody: r.blackbody },
      warnings,
    };
  },
  checks: [
    {
      // No film and no overcoat on a lossless n = 1.5 substrate: 1 − R is the same at every wavelength, so the Planck
      // weighting drops out. ε = 1 − ((n − 1)/(n + 1))² = 1 − 0.04 = 0.96; σT⁴ = 5.670374419e-8 × 300⁴ = 459.3003 W/m².
      source: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, §1.5 (Fresnel reflectance at normal incidence); Kirchhoff's law ε = A = 1 − R for an opaque surface.",
      basis: "computed",
      inputs: { nSub: 1.5, filmThick: 0, coatThick: 0 },
      expect: { eps: 0.96, epsBare: 0.96, blackbody: 459.30030 },
      tolerance: 1e-6,
    },
  ],
});
