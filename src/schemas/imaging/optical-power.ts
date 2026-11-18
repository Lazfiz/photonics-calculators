import { opticalPowerSummary } from "../../physics/imaging/optical-power";
import { defineSchema } from "../types";

const GREIVENKAMP = "Greivenkamp J. E. (2004). Field Guide to Geometrical Optics. SPIE Press, " +
  "Two-lens systems (φ = φ₁ + φ₂ − (t/n)φ₁φ₂). https://doi.org/10.1117/3.547461";
const ATCHISON = "Atchison D. A., Smith G. (2000). Optics of the Human Eye. Butterworth-Heinemann: \"Paraxial schematic eyes\" " +
  "pp. 39–47, https://doi.org/10.1016/b978-0-7506-3775-6.50009-2 (Gullstrand's exact eye) and \"Refractive anomalies\" " +
  "pp. 57–66, https://doi.org/10.1016/b978-0-7506-3775-6.50011-0 (ocular refraction K, spectacle correction K/(1 + dK)).";

const NO_SPECTACLE = "The far point lies at or inside the vertex distance (1 + d·K ≤ 0), so no spectacle lens corrects it.";
const NO_LENS = "The focal length must not be 0 (below 0.1 mm).";

export default defineSchema({
  href: "/imaging/optical-power",
  inputs: [
    { key: "focalLengthMm", label: "Focal length in air f (negative for a diverging lens)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 100, min: -10000, max: 10000 },
    { key: "corneaPower", label: "Cornea power φ₁", unit: "D", toSI: 1, siUnit: "m⁻¹", default: 43.05, min: 30, max: 60 },
    { key: "lensPower", label: "Crystalline lens power φ₂ (0 without a lens)", unit: "D", toSI: 1, siUnit: "m⁻¹", default: 19.11, min: 0, max: 35 },
    { key: "separationMm", label: "Cornea-to-lens spacing t", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5.73, min: 0, max: 10 },
    { key: "n", label: "Index of the aqueous and vitreous n", unit: "", toSI: 1, siUnit: "", default: 1.336, min: 1.3, max: 1.4 },
    { key: "axialLengthMm", label: "Axial length, cornea to retina", unit: "mm", toSI: 1e-3, siUnit: "m", default: 24, min: 15, max: 35 },
    { key: "vertexMm", label: "Spectacle vertex distance", unit: "mm", toSI: 1e-3, siUnit: "m", default: 12, min: 0, max: 20 },
  ],
  outputs: [
    { key: "power", label: "Optical power P = 1/f", unit: "D", toSI: 1, siUnit: "m⁻¹" },
    { key: "eyePower", label: "Eye power φ = φ₁ + φ₂ − (t/n)φ₁φ₂", unit: "D", toSI: 1, siUnit: "m⁻¹" },
    { key: "focalLengthAir", label: "Eye focal length in air 1/φ", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "focalLengthEye", label: "Eye focal length in the eye n/φ", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "emmetropicLength", label: "Emmetropic axial length (rear focal point from the cornea)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "refraction", label: "Refraction at the cornea K (contact-lens correction)", unit: "D", toSI: 1, siUnit: "m⁻¹" },
    { key: "spectacle", label: "Spectacle correction at the vertex distance", unit: "D", toSI: 1, siUnit: "m⁻¹" },
    { key: "refractionPerMm", label: "Change of K per mm of axial length", unit: "D/mm", toSI: 1e3, siUnit: "m⁻²" },
  ],
  compute({ focalLengthMm, corneaPower, lensPower, separationMm, n, axialLengthMm, vertexMm }) {
    const s = opticalPowerSummary(focalLengthMm, corneaPower, lensPower, separationMm, n, axialLengthMm, vertexMm);
    const warnings: string[] = [];
    const reasons: Partial<Record<"power" | "spectacle", string>> = {};
    if (!Number.isFinite(s.lensPower)) reasons.power = NO_LENS;
    if (!Number.isFinite(s.spectacle)) reasons.spectacle = NO_SPECTACLE;
    for (const r of [reasons.power, reasons.spectacle]) {
      if (r) warnings.push(r);
    }
    return {
      values: {
        power: s.lensPower,
        eyePower: s.eyePower,
        focalLengthAir: s.focalAir,
        focalLengthEye: s.focalEye,
        emmetropicLength: s.emmetropicLength,
        refraction: s.refraction,
        spectacle: s.spectacle,
        refractionPerMm: s.dKdL,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // P = 1/f = 1/0.1 m = 10 D.
      source: GREIVENKAMP,
      basis: "computed",
      inputs: { focalLengthMm: 100 },
      expect: { power: 10 },
      tolerance: 1e-8,
    },
    {
      // Gullstrand's exact eye at the defaults: φ = 43.05 + 19.11 − (0.00573/1.336)(43.05)(19.11) = 58.631565932 D;
      // 1/φ = 17.055659082 mm; n/φ = 22.786360534 mm; rear focus t + n(1 − (t/n)φ₁)/φ = 24.309130246 mm;
      // K (traced back from the retina at L = 24 mm) = 0.805454348 D; spectacle K/(1 + 0.012 K) = 0.797743793 D;
      // dK/dL = −n/[(L − t)²(1 + (t/n)V₂)²] with L − t = 18.27 mm, V₂ = 1.336/0.01827 − 19.11 = 54.01534209 D,
      // 1 + (0.00573/1.336)(54.01534209) = 1.23166760, squared 1.51700; −1.336/(3.3379290e-4 × 1.51700) = −2638.41 D/m = −2.63841 D/mm.
      source: ATCHISON,
      basis: "computed",
      inputs: {},
      expect: {
        eyePower: 58.63156593188622, focalLengthAir: 17.05565908237425, focalLengthEye: 22.786360534052,
        emmetropicLength: 24.30913024641871, refraction: 0.8054543475070446, spectacle: 0.7977437930315167, refractionPerMm: -2.6384102835124406,
      },
      tolerance: 1e-8,
    },
    {
      // Myopic eye, L = 26 mm, other inputs at the defaults: V₃ = 1.336/(0.026 − 0.00573) = 65.91021214 D;
      // V₂ = 65.91021214 − 19.11 = 46.80021214 D; V₁ = V₂/(1 + (0.00573/1.336)V₂) = 46.80021214/1.20072247 = 38.97671063 D;
      // K = 38.97671063 − 43.05 = −4.07328937 D; spectacle K/(1 + 0.012 K) = −4.07328937/0.95112 = −4.28262165 D.
      source: ATCHISON,
      basis: "computed",
      inputs: { axialLengthMm: 26 },
      expect: { refraction: -4.073289366827041, spectacle: -4.282621653759881 },
      tolerance: 1e-8,
    },
  ],
});
