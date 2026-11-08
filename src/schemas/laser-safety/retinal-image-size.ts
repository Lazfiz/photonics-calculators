import { ALPHA_MIN, correctionCE } from "../../physics/laser-safety/eye-exposure-limits";
import { gaussianApparentSource, MAX_ACCOMMODATION } from "../../physics/laser-safety/retinal-image";
import { defineSchema } from "../types";
import { ICNIRP_2013 } from "./common";

const SOURCE = `${ICNIRP_2013}. Table 2 (α_min, α_max) and Table 5 (C_E); eye model of the physics module header ` +
  "(17 mm air-equivalent reduced eye, Sliney & Wolbarsht, Safety with Lasers and Other Optical Sources, Plenum 1980; " +
  "embedded Gaussian beam, Siegman, Proc. SPIE 1224, 2, 1990). https://doi.org/10.1097/HP.0b013e3182983fd4";

export default defineSchema({
  href: "/laser-safety/retinal-image-size",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 808, min: 400, max: 1400 },
    { key: "beamDiam", label: "Beam diameter at the waist, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0.4, min: 0.001, max: 1e4 },
    { key: "beamDivergence", label: "Divergence, 1/e² full angle", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 200, min: 0, max: 1e3 },
    { key: "viewingDistance", label: "Distance from the waist to the eye", unit: "cm", toSI: 1e-2, siUnit: "m", default: 10, min: 0, max: 1e7 },
  ],
  outputs: [
    { key: "alpha", label: "Apparent source subtense α", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "retinalDiameter", label: "Retinal image diameter, 1/e²", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "beamAtEye", label: "Beam at the eye, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "curvature", label: "Wavefront curvature at the eye", unit: "1/m", toSI: 1, siUnit: "1/m" },
    { key: "accommodation", label: "Accommodation used", unit: "D", toSI: 1, siUnit: "1/m" },
    { key: "defocus", label: "Curvature left out of focus", unit: "D", toSI: 1, siUnit: "1/m" },
    { key: "beamQualityM2", label: "Beam quality M² used", unit: "", toSI: 1, siUnit: "" },
    { key: "ce", label: "C_E for exposures of 0.25 s or more", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ wavelength, beamDiam, beamDivergence, viewingDistance }) {
    const s = gaussianApparentSource(wavelength, beamDiam, beamDivergence, viewingDistance);
    const warnings: string[] = [];
    if (s.alpha <= ALPHA_MIN) warnings.push("Point source (α ≤ α_min = 1.5 mrad): the limits apply without C_E.");
    if (s.defocus > 0) warnings.push(`${MAX_ACCOMMODATION} D of accommodation is not enough: the waist is nearer than 100 mm.`);
    return {
      values: {
        alpha: s.alpha,
        retinalDiameter: s.retinalDiameter,
        beamAtEye: s.dCornea,
        curvature: s.curvature,
        accommodation: s.accommodation,
        defocus: s.defocus,
        beamQualityM2: s.M2,
        ce: correctionCE(s.alpha, 10),
      },
      warnings,
    };
  },
  checks: [
    {
      // At the waist of a beam below the diffraction limit (M² = 1; 4λ/(πd₀) = 0.637 mrad > 0.5 mrad), w = d₀/2 = 1 mm,
      // 1/R = 0, no defocus. Retinal 1/e² radius = λf/(πw) (w ≥ D/4 so the pupil does not diffract more) →
      // diameter 4λf/(πd₀) = 4·1e-6·0.017/(π·2e-3) = 10.82254 µm; α = √2·λ/(πw) = 0.450158 mrad (< α_min, so C_E = 1).
      source: SOURCE,
      basis: "computed",
      inputs: { wavelength: 1000, beamDiam: 2, beamDivergence: 0.5, viewingDistance: 0 },
      expect: { alpha: 0.4501581581, retinalDiameter: 10.82253613, beamAtEye: 2, beamQualityM2: 1, ce: 1 },
      tolerance: 1e-8,
    },
    {
      // Page defaults: z_R = d₀/θ = 2 mm, M² = θπd₀/(4λ) = 77.7622; at r = 10 cm w = 0.2 mm·√(1+50²) = 10.0020 mm
      // (d = 20.00400 mm); 1/R = r/(r²+z_R²) = 9.99600 m⁻¹ < 10 D, so no defocus; s = (λf/π)(M²/w) = 3.3993e-5 m radius
      // → 67.9864 µm diameter; α = √2·s/f = 2.82786 mrad; C_E = α/α_min = 1.88524.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        alpha: 2.827861609, retinalDiameter: 67.98640408, beamAtEye: 20.0039996, curvature: 9.996001599,
        accommodation: 9.996001599, beamQualityM2: 77.76219440, ce: 1.885241073,
      },
      tolerance: 1e-8,
    },
  ],
});
