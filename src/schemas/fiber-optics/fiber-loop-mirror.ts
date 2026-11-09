import { COMB_MAX_PERIOD, loopMirrorSummary } from "../../physics/fiber-optics/sagnac";
import { defineSchema } from "../types";

const MORTIMORE = "Mortimore D. B. (1988). Fiber loop reflectors. J. Lightwave Technol. 6, 1217–1224, doi:10.1109/50.4119 " +
  "(R = 4k(1 − k), T = (1 − 2k)²); Fang X., Claus R. O. (1995). Polarization-independent all-fiber wavelength-division multiplexer " +
  "based on a Sagnac interferometer. Opt. Lett. 20, 2146–2148, doi:10.1364/OL.20.002146 (birefringent loop, T = (1 − 2k)² + " +
  "4k(1 − k) sin²(Δφ/2), Δφ = 2πBL/λ, comb period λ²/(BL))";

export default defineSchema({
  href: "/fiber-optics/fiber-loop-mirror",
  inputs: [
    { key: "couplingRatio", label: "Coupler power coupling k", unit: "%", toSI: 0.01, siUnit: "", default: 50, min: 0, max: 100 },
    { key: "loss", label: "Total loss: coupler excess + loop", unit: "dB", toSI: 1, siUnit: "dB", default: 0, min: 0, max: 30 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2000 },
    { key: "fiberLength", label: "PM section length (0 = none)", unit: "m", toSI: 1, siUnit: "m", default: 1, min: 0, max: 100 },
    { key: "birefringence", label: "PM birefringence B (0 = isotropic loop)", unit: "", toSI: 1, siUnit: "", default: 4e-4, min: 0, max: 0.01 },
  ],
  outputs: [
    { key: "reflectance", label: "Reflectance (isotropic loop)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "transmittance", label: "Transmission (isotropic loop)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "combPeriod", label: "Comb period λ²/(B·L)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "combExtinction", label: "Comb extinction", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "combTmax", label: "Comb maximum transmission", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "combTmin", label: "Comb minimum transmission", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ couplingRatio, loss, wavelength, fiberLength, birefringence }) {
    const r = loopMirrorSummary(couplingRatio, loss, birefringence, fiberLength, wavelength);
    const warnings: string[] = [];
    if (!Number.isFinite(r.period)) {
      warnings.push("The PM section has zero length or zero birefringence: the loop is isotropic and there is no comb.");
    } else if (r.period > COMB_MAX_PERIOD) {
      warnings.push(`The comb period exceeds ${COMB_MAX_PERIOD * 1e9} nm, so the transmission is nearly flat across the band at this wavelength.`);
    }
    if (Number.isFinite(r.period) && !Number.isFinite(r.extinction)) {
      warnings.push("k = 1/2: the comb minimum is zero, so its extinction is infinite.");
    }
    return {
      values: {
        reflectance: r.R, transmittance: r.T, combPeriod: r.period, combExtinction: r.extinction,
        combTmax: r.tMax, combTmin: r.tMin,
      },
      warnings,
    };
  },
  checks: [
    {
      // k = 0.3, loss 3 dB: τ = 10^(−0.3) = 0.5011872; R = 4k(1 − k)τ = 4 · 0.3 · 0.7 · τ = 0.84τ = 0.4209973;
      // T(Δφ = 0) = (1 − 2k)² τ = 0.16τ = 0.0801900; T(Δφ = π) = τ[(1 − 2k)² + 4k(1 − k)] = τ; extinction = 10 log₁₀(1/0.16) = 7.958800 dB.
      // Comb: λ²/(BL) = (1550e-9)²/(4e-4 · 1) = 2.4025e-12/4e-4 = 6.00625e-9 m.
      source: MORTIMORE,
      basis: "computed",
      inputs: { couplingRatio: 30, loss: 3 },
      expect: {
        reflectance: 42.09972762469087,
        transmittance: 8.018995738036358,
        combTmax: 50.11872336272722,
        combTmin: 8.018995738036358,
        combExtinction: 7.958800173440751,
        combPeriod: 6.00625,
      },
      tolerance: 1e-8,
    },
    {
      // Defaults, k = 1/2, no loss: R = 4 · ½ · ½ = 1 (100 %), T(Δφ = π) = 1 (100 %); comb period 6.00625 nm as above.
      source: MORTIMORE,
      basis: "computed",
      inputs: {},
      expect: { reflectance: 100, combPeriod: 6.00625, combTmax: 100 },
      tolerance: 1e-8,
    },
  ],
});
