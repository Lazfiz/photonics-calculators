import { pointingCapture } from "../../physics/free-space-comms/pointing-loss";
import { divergenceHalfAngle } from "../../physics/wave-optics/gaussian-beam";
import { defineSchema } from "../types";

const FARID = "Farid A. A., Hranilovic S. (2007). Outage capacity optimization for free-space optical links with pointing errors. " +
  "J. Lightwave Technol. 25(7), 1702–1710 (Gaussian beam, circular aperture, jitter and static offset); exact forms here: " +
  "Gaussian beam w(z) = w₀√(1 + (z/z_R)²), z_R = πw₀²/λ, η₀ = 1 − exp(−2a²/w²), ⟨η⟩ = 1 − Q₁(b/σ_t, a/σ_t), σ_t² = w²/4 + s².";

const dB = (eta: number) => (eta > 0 ? -10 * Math.log10(eta) : Infinity);

export default defineSchema({
  href: "/free-space-comms/pointing-loss",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 11000 },
    { key: "txBeamWaist", label: "TX beam waist w₀ (1/e² radius)", unit: "cm", toSI: 1e-2, siUnit: "m", default: 2.5, min: 0.1, max: 20 },
    { key: "jitterRMS", label: "Jitter σ per axis", unit: "µrad", toSI: 1e-6, siUnit: "rad", default: 1, min: 0, max: 100 },
    { key: "misalign", label: "Static misalignment", unit: "µrad", toSI: 1e-6, siUnit: "rad", default: 0, min: 0, max: 100 },
    { key: "rxAperture", label: "RX aperture diameter", unit: "cm", toSI: 1e-2, siUnit: "m", default: 10, min: 0.1, max: 100 },
    { key: "range", label: "Link range", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 0.001, max: 100000 },
  ],
  outputs: [
    { key: "beamRadius", label: "Beam radius at the receiver", unit: "cm", toSI: 1e-2, siUnit: "m" },
    { key: "divergence", label: "Far-field divergence λ/(πw₀)", unit: "µrad", toSI: 1e-6, siUnit: "rad" },
    { key: "offset", label: "Static pointing offset at the receiver", unit: "cm", toSI: 1e-2, siUnit: "m" },
    { key: "jitter", label: "Jitter per axis at the receiver", unit: "cm", toSI: 1e-2, siUnit: "m" },
    { key: "alignedCapture", label: "Aligned capture η₀", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "meanCapture", label: "Mean capture ⟨η⟩ with offset and jitter", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "pointingLoss", label: "Pointing loss −10 log₁₀(⟨η⟩/η₀)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "geometricLoss", label: "Geometric loss −10 log₁₀ η₀", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "totalLoss", label: "Geometric + pointing loss −10 log₁₀⟨η⟩", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ wavelength, txBeamWaist, jitterRMS, misalign, rxAperture, range }) {
    const r = pointingCapture(wavelength, txBeamWaist, range, rxAperture, misalign, jitterRMS);
    const pointingLoss = dB(r.meanFraction / r.alignedFraction);
    const geometricLoss = dB(r.alignedFraction);
    const totalLoss = dB(r.meanFraction);
    const warnings: string[] = [];
    if (![pointingLoss, geometricLoss, totalLoss].every(Number.isFinite)) {
      warnings.push("The beam misses the aperture entirely (zero capture): the losses in dB are infinite and go out as null.");
    }
    return {
      values: {
        beamRadius: r.beamRadius,
        divergence: divergenceHalfAngle({ lambda: wavelength, w0: txBeamWaist }),
        offset: r.offset,
        jitter: r.jitter,
        alignedCapture: r.alignedFraction,
        meanCapture: r.meanFraction,
        pointingLoss,
        geometricLoss,
        totalLoss,
      },
      warnings,
    };
  },
  checks: [
    {
      // No offset: ⟨η⟩ = 1 − exp(−2a²/(w² + 4s²)) exactly. 1550 nm, w₀ = 2.5 cm, z = 1 km: z_R = 1266.771 m, w = 3.185088 cm;
      // a = 5 cm, s = 2 µrad · 1 km = 2 mm: η₀ = 0.99276366, ⟨η⟩ = 0.99218816; losses 0.0025183 dB, 0.0315413 dB, 0.0340596 dB.
      source: FARID,
      basis: "computed",
      inputs: { wavelength: 1550, txBeamWaist: 2.5, jitterRMS: 2, misalign: 0, rxAperture: 10, range: 1 },
      expect: {
        beamRadius: 3.1850881148268825, divergence: 19.735212943395023, alignedCapture: 99.27636623120824,
        meanCapture: 99.21881557758937, pointingLoss: 0.0025183414296698244, geometricLoss: 0.031541275066688634,
        totalLoss: 0.03405961649635843,
      },
      tolerance: 1e-6,
    },
    {
      // Long link, with offset: w₀ = 1 cm, 10 km: w = 49.348165 cm, b = 2 µrad · 10 km = 2 cm, s = 5 cm, a = 5 cm;
      // ⟨η⟩ = P(|X| ≤ a), X ~ N((b, 0), σ_t²), σ_t² = w²/4 + s², integrated from the Rice density ∫ r/σ² exp(−(r²+b²)/2σ²) I₀(rb/σ²) dr:
      // 0.019467859 (η₀ = 0.020322502), so 0.18659 dB pointing and 17.10682 dB total.
      source: FARID,
      basis: "computed",
      inputs: { wavelength: 1550, txBeamWaist: 1, jitterRMS: 5, misalign: 2, rxAperture: 10, range: 10 },
      expect: { beamRadius: 49.348165487758144, offset: 2, jitter: 5, meanCapture: 1.946785882524426, pointingLoss: 0.1865898597759823, totalLoss: 17.106818117833548 },
      tolerance: 1e-6,
    },
  ],
});
