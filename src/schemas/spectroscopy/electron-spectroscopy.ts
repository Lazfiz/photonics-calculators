import { eV } from "../../physics/constants";
import {
  imfpTpp2m, kineticEnergy, plasmonEnergy, samplingDepth, TPP2M_MATERIALS, type Tpp2mMaterial,
} from "../../physics/spectroscopy/photoemission";
import { defineSchema } from "../types";

const TPP = "Tanuma S., Powell C. J., Penn D. R. (1994). Calculations of electron inelastic mean free paths. V. Data for 14 " +
  "organic compounds over the 50–2000 eV range. Surf. Interface Anal. 21, 165–176, doi:10.1002/sia.740210302 (TPP-2M, " +
  "eqs. as given in the NIST SRD 71 user's guide); E_k = hν − E_B − φ_sp (Hüfner, Photoelectron Spectroscopy, 3rd ed., " +
  "Springer 2003, ch. 1); signal from beyond z ∝ exp(−z/(λ cos θ)), so 95 % from within 3λ cos θ.";

const nm = 1e-9;
const DEG = Math.PI / 180;

export default defineSchema({
  href: "/spectroscopy/electron-spectroscopy",
  choices: [
    {
      key: "material", label: "Material (TPP-2M)", default: "c",
      options: [
        ...Object.entries(TPP2M_MATERIALS).map(([value, m]) => ({ value, label: m.label })),
        { value: "custom", label: "Custom material (density, valence electrons, molar mass, band gap)" },
      ],
    },
  ],
  inputs: [
    { key: "photonEnergy", label: "Photon energy hν", unit: "eV", toSI: eV, siUnit: "J", default: 1486.6, min: 5, max: 20000 },
    { key: "bindingEnergy", label: "Binding energy E_B vs the Fermi level", unit: "eV", toSI: eV, siUnit: "J", default: 284.5, min: 0, max: 20000 },
    { key: "workFunction", label: "Spectrometer work function φ_sp", unit: "eV", toSI: eV, siUnit: "J", default: 4.5, min: 1, max: 7 },
    { key: "angle", label: "Emission angle θ from the normal", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: 0, max: 85 },
    { key: "density", label: "Density ρ (custom material only)", unit: "g/cm³", toSI: 1, siUnit: "g/cm³", default: 2.2, min: 0.1, max: 25 },
    { key: "valenceElectrons", label: "Valence electrons N_v per atom or molecule (custom only)", unit: "", toSI: 1, siUnit: "", default: 4, min: 0.1, max: 500 },
    { key: "molarMass", label: "Atomic or molecular weight M (custom only)", unit: "g/mol", toSI: 1, siUnit: "g/mol", default: 12.011, min: 1, max: 5000 },
    { key: "bandGap", label: "Band gap E_g (custom only)", unit: "eV", toSI: 1, siUnit: "eV", default: 0, min: 0, max: 15 },
  ],
  outputs: [
    { key: "kineticEnergy", label: "Kinetic energy E_k = hν − E_B − φ_sp", unit: "eV", toSI: eV, siUnit: "J" },
    { key: "imfp", label: "Inelastic mean free path λ (TPP-2M at hν − E_B)", unit: "nm", toSI: nm, siUnit: "m" },
    { key: "depth95", label: "95 % sampling depth 3λ cos θ", unit: "nm", toSI: nm, siUnit: "m" },
    { key: "top1nm", label: "Signal from the top 1 nm", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "plasmonEnergy", label: "Free-electron plasmon energy E_p", unit: "eV", toSI: eV, siUnit: "J" },
  ],
  compute(i) {
    const hv = i.photonEnergy / eV, Eb = i.bindingEnergy / eV, phi = i.workFunction / eV;
    const custom = !Object.hasOwn(TPP2M_MATERIALS, i.material);
    const mat: Tpp2mMaterial = custom
      ? { rho: i.density, Nv: i.valenceElectrons, M: i.molarMass, Eg: i.bandGap }
      : TPP2M_MATERIALS[i.material];
    const ek = kineticEnergy(hv, Eb, phi);
    const emitted = ek > 0;
    const lambda = emitted ? imfpTpp2m(hv - Eb, mat) : NaN; // TPP-2M energy is referred to the Fermi level
    const depth95 = samplingDepth(lambda, i.angle);
    const top1nm = -Math.expm1(-nm / (lambda * Math.cos(i.angle)));
    const warnings: string[] = [];
    if (!emitted) warnings.push(`Not emitted: E_B is above hν − φ_sp = ${(hv - phi).toPrecision(5)} eV; use a harder source.`);
    else if (hv - Eb < 50) warnings.push("Below 50 eV above the Fermi level TPP-2M does not apply: no mean free path.");
    else if (hv - Eb > 2000) warnings.push("Above the 50–2000 eV fit range of TPP-2M: the mean free path is extrapolated.");
    return {
      values: { kineticEnergy: ek * eV, imfp: lambda, depth95, top1nm, plasmonEnergy: plasmonEnergy(mat) * eV },
      warnings,
    };
  },
  checks: [
    {
      // Graphite (ρ 2.2, N_v 4, M 12.011), Al Kα, C 1s: E = 1486.6 − 284.5 = 1202.1 eV; E_k = 1202.1 − 4.5 = 1197.6 eV.
      // U = 4·2.2/12.011 = 0.7326617, E_p² = 829.4 U = 607.6696, E_p = 24.65155 eV; β = −0.1 + 0.944/√E_p² + 0.069·2.2^0.1
      // = 0.01295524; γ = 0.191/√2.2 = 0.1287722; C = 1.97 − 0.91U = 1.303278; D = 53.4 − 20.8U = 38.160636;
      // λ = E/{E_p²[β ln(γE) − C/E + D/E²]} = 30.782576 Å = 3.0782576 nm; 95 % depth = −λ ln 0.05 = 3.0782576 · 2.9957323 = 9.2216357 nm;
      // top 1 nm: 100 (1 − e^(−1/3.0782576)) = 27.737083 %.
      source: TPP,
      basis: "computed",
      inputs: {},
      expect: { kineticEnergy: 1197.6, imfp: 3.0782576366550883, plasmonEnergy: 24.651550511801833, depth95: 9.221635748441683, top1nm: 27.7370833810906 },
      tolerance: 1e-8,
    },
    {
      // Same material at θ = 60°: cos θ = 0.5, so the depth is 9.2216357 · 0.5 = 4.6108179 nm
      // and the top-1-nm share is 100 (1 − e^(−1/(3.0782576 · 0.5))) = 47.780709 %.
      source: TPP,
      basis: "computed",
      inputs: { angle: 60 },
      expect: { depth95: 4.610817874220841, top1nm: 47.780708817285465 },
      tolerance: 1e-8,
    },
  ],
});
