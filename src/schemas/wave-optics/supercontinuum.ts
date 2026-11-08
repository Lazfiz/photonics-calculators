import {
  dispersionLength, dispersiveWaveShift, dispersiveWaveShiftNonlinear, dispersiveWaveWavelength, fissionLength, fundamentalSolitonPower,
  sechPeakPower, sechT0, solitonContent, solitonOrder,
} from "../../physics/wave-optics/soliton";
import { defineSchema } from "../types";

// Large N: noise-seeded modulation instability competes with fission (Sylvestre et al., JOSA B 38, F90 (2021)); as on the page.
const MI_ORDER = 16;

export default defineSchema({
  href: "/wave-optics/supercontinuum",
  inputs: [
    { key: "wavelength", label: "Pump wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 835, min: 200, max: 5000 },
    { key: "pulseEnergy", label: "Pulse energy", unit: "nJ", toSI: 1e-9, siUnit: "J", default: 0.5673, min: 0, max: 1e6 },
    { key: "pulseDuration", label: "Pulse FWHM, sech²", unit: "fs", toSI: 1e-15, siUnit: "s", default: 50, min: 1, max: 1e5 },
    { key: "fiberLength", label: "Fibre length", unit: "cm", toSI: 1e-2, siUnit: "m", default: 15, min: 0, max: 1e7 },
    { key: "gamma", label: "Nonlinear coefficient γ", unit: "1/(W·km)", toSI: 1e-3, siUnit: "1/(W·m)", default: 110, min: 0.01, max: 1e5 },
    { key: "beta2", label: "β₂ at the pump", unit: "ps²/km", toSI: 1e-27, siUnit: "s²/m", default: -11.83, min: -1000, max: 1000 },
    { key: "beta3", label: "β₃ at the pump", unit: "ps³/km", toSI: 1e-39, siUnit: "s³/m", default: 0.081038, min: -100, max: 100 },
  ],
  outputs: [
    { key: "peakPower", label: "Peak power P₀ = E/(2T₀)", unit: "W", toSI: 1, siUnit: "W" },
    { key: "solitonOrder", label: "Soliton number N", unit: "", toSI: 1, siUnit: "" },
    { key: "fundamentalPower", label: "Fundamental soliton power P₁", unit: "W", toSI: 1, siUnit: "W" },
    { key: "dispersionLength", label: "Dispersion length L_D", unit: "m", toSI: 1, siUnit: "m" },
    { key: "fissionLength", label: "Fission length L_fiss ≈ L_D/N (anomalous dispersion)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "firstSolitonPower", label: "Peak power of the first ejected soliton, (2N − 1)²P₁", unit: "W", toSI: 1, siUnit: "W" },
    { key: "dispersiveWavelength", label: "Dispersive-wave wavelength (first ejected soliton)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "dispersiveWavelengthInputPower", label: "Dispersive-wave wavelength with the input peak power P₀", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "dispersiveWavelengthLeadingOrder", label: "Dispersive-wave wavelength, leading order Ω = −3β₂/β₃", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute({ wavelength, pulseEnergy, pulseDuration, fiberLength, gamma, beta2, beta3 }) {
    const t0 = sechT0(pulseDuration);
    const peak = sechPeakPower(pulseEnergy, t0);
    const LD = dispersionLength(t0, beta2);
    const P1 = fundamentalSolitonPower(beta2, gamma, t0);
    const N = solitonOrder(peak, beta2, gamma, t0);
    const Lfiss = fissionLength(t0, beta2, N);
    const anomalous = beta2 < 0;
    const content = solitonContent(N);
    const Ps = content.count > 0 ? content.amplitude ** 2 * P1 : NaN;
    const shift = dispersiveWaveShiftNonlinear(beta2, beta3, gamma, Ps);
    const shiftP0 = dispersiveWaveShiftNonlinear(beta2, beta3, gamma, peak);
    const lambdaDW = dispersiveWaveWavelength(wavelength, beta2, shift);
    const warnings: string[] = [];
    if (!anomalous) warnings.push("Normal dispersion (β₂ ≥ 0): no soliton fission; SPM and optical wave breaking broaden the spectrum, so the fission length and dispersive wave have no value.");
    else if (N < 1) warnings.push("N < 1: dispersion dominates, little broadening.");
    else if (fiberLength < Lfiss) warnings.push(`The fibre ends before the fission point (L/L_fiss = ${(fiberLength / Lfiss).toPrecision(3)}): mainly SPM broadening and compression.`);
    else if (N > MI_ORDER) warnings.push(`N > ${MI_ORDER}: noise-seeded modulation instability breaks the pulse up before clean fission, so the continuum is broad but loses shot-to-shot coherence.`);
    if (anomalous && !Number.isFinite(lambdaDW)) {
      warnings.push(beta3 === 0 ? "β₃ = 0: no phase-matched dispersive wave." : N < 0.5 ? "N < 1/2: no soliton forms, so no dispersive wave." : "The phase-matched Ω lies beyond zero frequency.");
    }
    return {
      values: {
        peakPower: peak,
        solitonOrder: N,
        fundamentalPower: P1,
        dispersionLength: LD,
        fissionLength: anomalous ? Lfiss : NaN,
        firstSolitonPower: Ps,
        dispersiveWavelength: lambdaDW,
        dispersiveWavelengthInputPower: dispersiveWaveWavelength(wavelength, beta2, shiftP0),
        dispersiveWavelengthLeadingOrder: dispersiveWaveWavelength(wavelength, beta2, dispersiveWaveShift(beta2, beta3)),
      },
      warnings,
    };
  },
  checks: [
    {
      // T0 = 50 fs/1.76275 = 28.3648 fs, P0 = E/(2 T0) = 10.0001 kW, L_D = T0^2/|b2| = 6.80104 cm, P1 = |b2|/(g T0^2) = 133.669 W,
      // N = sqrt(P0/P1) = 8.64939, L_fiss = L_D/N = 0.786303 cm.
      source: "Dudley J. M., Genty G., Coen S. (2006). Supercontinuum generation in photonic crystal fiber. Rev. Mod. Phys. 78, 1135–1184, doi:10.1103/RevModPhys.78.1135 (N² = γP₀T₀²/|β₂|, L_fiss ≈ L_D/N); Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed., §5.2.",
      basis: "computed",
      inputs: {},
      expect: {
        peakPower: 10000.064718323734,
        solitonOrder: 8.649387470520205,
        fundamentalPower: 133.66943273841574,
        dispersionLength: 0.06801038131656875,
        fissionLength: 0.007863028630451489,
      },
      tolerance: 1e-8,
    },
    {
      // Omega = -3 b2/b3 gives lambda = 2 pi c/(w0 + Omega) = 699.251 nm; with the first ejected soliton Ps = (2N - 1)^2 P1 = 35.509 kW,
      // b2 Omega^2/2 + b3 Omega^3/6 = g Ps/2 (bisection) gives 633.349 nm; with P0 instead of Ps, 667.673 nm.
      source: "Akhmediev N., Karlsson M. (1995). Cherenkov radiation emitted by solitons in optical fibers. Phys. Rev. A 51, 2602–2607, doi:10.1103/PhysRevA.51.2602 (phase matching β₂Ω²/2 + β₃Ω³/6 = γP_s/2); Dudley, Genty, Coen (2006) as above.",
      basis: "computed",
      inputs: {},
      expect: {
        firstSolitonPower: 35509.29343915657,
        dispersiveWavelength: 633.3489266655503,
        dispersiveWavelengthInputPower: 667.6727163432492,
        dispersiveWavelengthLeadingOrder: 699.251092542798,
      },
      tolerance: 1e-8,
    },
  ],
});
