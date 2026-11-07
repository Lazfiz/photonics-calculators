import { gaussianGeometricCapture, toDb, topHatGeometricLoss } from "../../physics/free-space-comms/link-budget";
import { defineSchema } from "../types";

const SHEIKH = "Sheikh Muhammad S., Köhldorfer P., Leitgeb E. (2005). Channel modeling for terrestrial free space optical " +
  "links. Proc. ICTON 2005, Tu.B3.5, eq. (1): geometric loss 20 log₁₀((d_t + θR)/d_r) for a receiver smaller than the beam.";
const SIEGMAN = "Siegman A. E. (1986). Lasers. University Science Books, ch. 17 (Gaussian beams): w²(z) = w₀² + (θz)², " +
  "θ = λ/(πw₀), and the power through a circular aperture of radius a, 1 − exp(−2a²/w²).";

export default defineSchema({
  href: "/free-space-comms/geometric-loss",
  inputs: [
    { key: "txBeamDivergence", label: "TX beam divergence, full angle, 1/e²", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1, min: 0.001, max: 100 },
    { key: "range", label: "Range", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 0.001, max: 100 },
    { key: "txAperture", label: "TX exit aperture", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0.1, max: 1000 },
    { key: "rxAperture", label: "RX aperture", unit: "cm", toSI: 1e-2, siUnit: "m", default: 10, min: 0.1, max: 500 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
  ],
  outputs: [
    { key: "topHatLoss", label: "Top-hat geometric loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "beamDiameter", label: "Top-hat beam diameter d_t + θR", unit: "m", toSI: 1, siUnit: "m" },
    { key: "topHatCaptured", label: "Share of power caught, top-hat", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "gaussianLoss", label: "Gaussian geometric loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "gaussianRadius", label: "Gaussian 1/e² radius w(R) at the receiver", unit: "m", toSI: 1, siUnit: "m" },
    { key: "gaussianCaptured", label: "Share of power caught, Gaussian", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "waist", label: "Gaussian waist w₀ = max(d_t/2, λ/(πθ/2))", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "difference", label: "Top-hat minus Gaussian loss", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ txBeamDivergence: theta, range: R, txAperture: dTx, rxAperture: dRx, wavelength: lambda }) {
    const gauss = gaussianGeometricCapture(dTx, theta, R, dRx, lambda);
    const topHat = topHatGeometricLoss(dTx, theta, R, dRx);
    const gaussLoss = -toDb(gauss.fraction);
    const warnings: string[] = [];
    if (gauss.diffractionLimited) {
      warnings.push("The divergence is below the diffraction limit of the TX exit aperture: the Gaussian model uses a waist w₀ = λ/(πθ/2), wider than d_t/2, which the aperture would clip.");
    }
    if (!Number.isFinite(gaussLoss)) warnings.push("The Gaussian share caught underflows to zero: the Gaussian loss is null.");
    return {
      values: {
        topHatLoss: topHat,
        beamDiameter: dTx + theta * R,
        topHatCaptured: 10 ** (-topHat / 10),
        gaussianLoss: gaussLoss,
        gaussianRadius: gauss.beamRadius,
        gaussianCaptured: gauss.fraction,
        waist: gauss.waist,
        difference: topHat - gaussLoss,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: d_t + θR = 5 mm + 1 mrad · 1 km = 1.005 m; 20 log₁₀(1.005/0.1) = 20.04332 dB, caught (0.1/1.005)² = 0.99007 %.
      // Gaussian: λ/(π·0.5 mrad) = 0.98676 mm < 2.5 mm so w₀ = 2.5 mm; w = √(2.5e-3² + 0.5²) = 0.5000062 m;
      // 1 − exp(−2·0.05²/w²) = 1.980084 %, 17.03316 dB; difference 3.01016 dB.
      source: SHEIKH,
      basis: "computed",
      inputs: {},
      expect: { topHatLoss: 20.04332123513015, beamDiameter: 1.005, topHatCaptured: 0.9900745031063592, gaussianLoss: 17.033164599551363, gaussianRadius: 0.500006249960938, gaussianCaptured: 1.980083660603771, waist: 2.5, difference: 3.010156635578788 },
      tolerance: 1e-8,
    },
    {
      // θ = 0.1 mrad is below the diffraction limit of a 5 mm aperture: w₀ = 1.55e-6/(π·5e-5) = 9.867606 mm > 2.5 mm.
      // R = 10 km: w = √(9.867606e-3² + 0.5²) = 0.5000974 m; 1 − exp(−2·0.05²/w²) = 1.979369 %, 17.03473 dB; top-hat 20.04332 dB.
      source: SIEGMAN,
      basis: "computed",
      inputs: { txBeamDivergence: 0.1, range: 10 },
      expect: { waist: 9.867606471697512, gaussianRadius: 0.500097360178476, gaussianCaptured: 1.9793694307442822, gaussianLoss: 17.03473141235603, topHatLoss: 20.04332123513015 },
      tolerance: 1e-8,
    },
    {
      // 850 nm, θ = 2 mrad, R = 5 km, d_t = 20 mm, d_r = 5 cm: top-hat beam 10.02 m, 20 log₁₀(10.02/0.05) = 46.03795 dB;
      // Gaussian w₀ = 10 mm (TEM₀₀ 0.27 mm), w = √(0.01² + 5²) = 5.00001 m, 1 − exp(−2·0.025²/w²) = 4.99986e-3 %, 43.01043 dB.
      source: SHEIKH,
      basis: "computed",
      inputs: { txBeamDivergence: 2, range: 5, txAperture: 20, rxAperture: 5, wavelength: 850 },
      expect: { topHatLoss: 46.03795434390416, gaussianLoss: 43.01042590111865, gaussianRadius: 5.00000999999, difference: 3.02752844278551 },
      tolerance: 1e-8,
    },
  ],
});
