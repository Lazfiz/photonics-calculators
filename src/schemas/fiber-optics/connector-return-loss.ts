import { angledFaceReflectance, returnLossDb } from "../../physics/fiber-optics/gaussian-coupling";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const FRESNEL = "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, §1.5: Fresnel reflectances " +
  "R_s, R_p; flat face R = ((n₁ − n₂)/(n₁ + n₂))². Angled face: the beam reflected at 2α couples back with Marcuse D. (1989). " +
  "Reflection loss of laser mode from tilted end mirror. J. Lightwave Technol. 7(2), 336–339, doi:10.1109/50.17776, " +
  "η = exp(−(2π n₁ w α/λ)²).";

export default defineSchema({
  href: "/fiber-optics/connector-return-loss",
  inputs: [
    { key: "n1", label: "Fibre phase index", unit: "", toSI: 1, siUnit: "", default: 1.447, min: 1, max: 2 },
    { key: "n2", label: "External index", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 2 },
    { key: "angle", label: "End-face polish angle", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: 0, max: 20 },
    { key: "mfd", label: "Mode field diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10.4, min: 1, max: 50 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2000 },
  ],
  outputs: [
    { key: "returnLoss", label: "Return loss of this face", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "flatReturnLoss", label: "Flat-face Fresnel return loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "reflectance", label: "Reflectance into the mode", unit: "", toSI: 1, siUnit: "" },
    { key: "reflectedPower", label: "Reflected power", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ n1, n2, angle, mfd, wavelength }) {
    const R = angledFaceReflectance(n1, n2, angle, mfd / 2, wavelength);
    const Rflat = angledFaceReflectance(n1, n2, 0, mfd / 2, wavelength);
    const warnings: string[] = [];
    if (n1 === n2) warnings.push("No index step: nothing is reflected, so the return loss is infinite.");
    return {
      values: { returnLoss: returnLossDb(R), flatReturnLoss: returnLossDb(Rflat), reflectance: R, reflectedPower: R },
      warnings,
    };
  },
  checks: [
    {
      // Flat glass-air face, n1 = 1.447, n2 = 1: R = (0.447/2.447)^2 = 0.0333693, RL = -10 log10 R = 14.76653 dB.
      source: FRESNEL,
      basis: "computed",
      inputs: { n1: 1.447, n2: 1, angle: 0 },
      expect: { returnLoss: 14.766528924397054, reflectance: 0.0333693008577929 },
      tolerance: 1e-8,
    },
    {
      // 8 deg APC, w = 5.2 um, 1550 nm. sin(theta_t) = 1.447 sin 8 deg = 0.201386, R_s = 0.0353235, R_p = 0.0314670, mean 0.0333952;
      // tilt term: (2 pi 1.447 5.2e-6 0.139626/1.55e-6)^2 = 4.2588^2 = 18.1375, exp(-18.1375) = 1.3275e-8;
      // R = 4.43319e-10, RL = 93.5328 dB.
      source: FRESNEL,
      basis: "computed",
      inputs: { n1: 1.447, n2: 1, angle: 8, mfd: 10.4, wavelength: 1550 },
      expect: { returnLoss: 93.53284015134697, reflectance: 4.4331863246295713e-10 },
      tolerance: 1e-8,
    },
  ],
});
