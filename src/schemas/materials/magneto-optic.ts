import {
  MAGNETO_OPTIC, faradayRotation, fieldForRotation, lengthForRotation, verdetConstant, type MagnetoOpticId,
} from "../../physics/materials/faraday";
import { defineSchema } from "../types";

const IDS = ["tgg", "tsag", "cef3", "silica", "yig"] as const satisfies readonly MagnetoOpticId[];
const DEG = Math.PI / 180;

const VOJNA = "Vojna D., Slezák O., Lucianetti A., Mocek T. (2019). Verdet constant of magneto-active materials developed for " +
  "high-power Faraday devices. Appl. Sci. 9, 3160, eq. (1) θ = V·B·L, eq. (13) |V| = F λ₀²/(λ² − λ₀²) + G, Tables 1–3.";
const TRAN = "Tran D.-B.-A., Edwards E., Tew D. P., Peverall R., Ritchie G. A. D. (2024). Continuous-wave cavity ringdown for " +
  "high-sensitivity polarimetry and magnetometry measurements. J. Chem. Phys. 160, 054201, eq. (2) V = α/(λ² − λ₀²) + β.";

export default defineSchema({
  href: "/materials/magneto-optic",
  choices: [
    {
      key: "material",
      label: "Material",
      options: IDS.map((id) => ({ value: id, label: MAGNETO_OPTIC[id].name })),
      default: "tgg",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 633, min: 250, max: 2000 },
    { key: "fieldStrength", label: "Magnetic field B (ignored for YIG, which is saturated)", unit: "T", toSI: 1, siUnit: "T", default: 0.5, min: 0.001, max: 20 },
    { key: "length", label: "Length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 20, min: 0.1, max: 200 },
  ],
  outputs: [
    { key: "verdet", label: "Verdet constant V (YIG: saturated rotation per length, rad/m)", unit: "rad/(T·m)", toSI: 1, siUnit: "rad/(T·m)" },
    { key: "rotation", label: "Faraday rotation θ = V·B·L", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "field45", label: "Field for 45° at this length", unit: "T", toSI: 1, siUnit: "T" },
    { key: "length45", label: "Length for 45° at this field", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ material, wavelength, fieldStrength, length }) {
    const id = material as MagnetoOpticId;
    const yig = MAGNETO_OPTIC[id].kind === "ferrimagnetic";
    const V = verdetConstant(id, wavelength);
    const warnings: string[] = [];
    if (!Number.isFinite(V)) warnings.push("The wavelength is outside this material's fit range: no Verdet constant.");
    if (yig) warnings.push("YIG is saturated: the rotation does not depend on B, and no field gives 45°.");
    return {
      values: {
        verdet: V,
        rotation: faradayRotation(V, yig ? 1 : fieldStrength, length),
        field45: yig ? NaN : fieldForRotation(V, length, Math.PI / 4),
        length45: lengthForRotation(V, yig ? 1 : fieldStrength, Math.PI / 4),
      },
      warnings,
    };
  },
  checks: [
    {
      // V = −(820.3 · 239.3²/(633² − 239.3²) − 6.2) = −130.5813 rad/(T·m) (Vojna Table 2 prints 130.6, the repo's tests use it).
      // θ = V B L = −130.5813 · 0.5 · 0.02 = −1.30581 rad = −74.8176°; B for 45° at 20 mm = (π/4)/(130.5813 · 0.02) = 0.300731 T;
      // L for 45° at 0.5 T = (π/4)/(130.5813 · 0.5) = 12.0293 mm. Coefficients F, G, λ₀ are the repo's.
      source: VOJNA,
      basis: "computed",
      inputs: { material: "tgg", wavelength: 633, fieldStrength: 0.5, length: 20 },
      expect: { verdet: -130.58132975133313, rotation: -74.8175907795748, field45: 0.30073141577478457, length45: 12.029256630991384 },
      tolerance: 1e-8,
    },
    {
      // V = (8.045e7/(532² − 130.9²) + 8.464) °/(T·m) = 311.0337 °/(T·m) = 5.428561 rad/(T·m); θ at B = 1 T, L = 100 mm = 31.1034°.
      // The paper's fitted 310 ± 3 °/(T·m) at 532 nm could not be fetched (AIP, not in PMC), and α, β, λ₀ are the repo's.
      source: TRAN,
      basis: "computed",
      inputs: { material: "silica", wavelength: 532, fieldStrength: 1, length: 100 },
      expect: { verdet: 5.428561332325734, rotation: 31.103365317017968 },
      tolerance: 1e-8,
    },
    {
      // YIG saturated rotation 304 rad/m at 1550 nm (Vojna Table 3, as transcribed in the repo; not independently fetched):
      // θ = 304 · 0.02 = 6.08 rad = 348.358°; L for 45° = (π/4)/304 = 2.58355 mm.
      source: VOJNA,
      basis: "computed",
      inputs: { material: "yig", wavelength: 1550, length: 20 },
      expect: { verdet: 304, rotation: 348.35833943954054, length45: 2.583546590123185 },
      tolerance: 1e-8,
    },
  ],
});
