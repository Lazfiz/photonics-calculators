import { alphaFromDbPerKm } from "../../physics/fiber-optics/fiber-nonlinear";
import { fwmSummary } from "../../physics/wave-optics/four-wave-mixing";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/wave-optics/four-wave-mixing",
  inputs: [
    { key: "wavelengthPump", label: "Pump wavelength λ_p", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
    { key: "wavelengthSignal", label: "Signal wavelength λ_s", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1560, min: 200, max: 20000 },
    { key: "pumpPower", label: "Pump power P_p", unit: "mW", toSI: 1e-3, siUnit: "W", default: 1000, min: 0, max: 1e7 },
    { key: "seedPower", label: "Signal seed power P_s", unit: "mW", toSI: 1e-3, siUnit: "W", default: 0.01, min: 0, max: 1e6 },
    { key: "n2", label: "Nonlinear index n₂", unit: "×10⁻²⁰ m²/W", toSI: 1e-20, siUnit: "m²/W", default: 2.6, min: 0, max: 1e4 },
    { key: "coreArea", label: "Effective area A_eff", unit: "µm²", toSI: 1e-12, siUnit: "m²", default: 11, min: 0.1, max: 1e5 },
    { key: "fiberLength", label: "Fiber length L", unit: "m", toSI: 1, siUnit: "m", default: 500, min: 0.001, max: 1e5 },
    { key: "beta2", label: "β₂ at the pump", unit: "ps²/km", toSI: 1e-27, siUnit: "s²/m", default: -0.1, min: -1e4, max: 1e4 },
    { key: "beta4", label: "β₄ at the pump", unit: "ps⁴/km", toSI: 1e-51, siUnit: "s⁴/m", default: 0, min: -1e3, max: 1e3 },
    { key: "fiberLoss", label: "Fiber loss α", unit: "dB/km", toSI: 1, siUnit: "dB/km", default: 0, min: 0, max: 1e4 },
  ],
  outputs: [
    { key: "signalGain", label: "Signal gain G_s (power ratio, net of fiber loss)", unit: "", toSI: 1, siUnit: "" },
    { key: "idlerWavelength", label: "Idler wavelength λ_i", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "idlerPower", label: "Idler power P_i", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "nonlinearCoefficient", label: "Nonlinear coefficient γ", unit: "1/(W·km)", toSI: 1e-3, siUnit: "1/(W·m)" },
    { key: "linearMismatch", label: "Linear phase mismatch Δβ", unit: "1/km", toSI: 1e-3, siUnit: "1/m" },
    { key: "kappa", label: "Phase mismatch κ = Δβ + 2γP_p", unit: "1/km", toSI: 1e-3, siUnit: "1/m" },
    { key: "gainCoefficient", label: "Parametric gain coefficient g", unit: "1/km", toSI: 1e-3, siUnit: "1/m" },
    { key: "peakGain", label: "Peak gain where κ = 0 (power ratio)", unit: "", toSI: 1, siUnit: "" },
    { key: "peakWavelengthShift", label: "Wavelength shift of the gain peak from the pump", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "pumpConverted", label: "Share of the pump taken by signal and idler", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute(i) {
    const r = fwmSummary({
      lambdaPump: i.wavelengthPump,
      lambdaSignal: i.wavelengthSignal,
      pumpPower: i.pumpPower,
      seedPower: i.seedPower,
      n2: i.n2,
      area: i.coreArea,
      length: i.fiberLength,
      beta2: i.beta2,
      beta4: i.beta4,
      alpha: alphaFromDbPerKm(i.fiberLoss),
    });
    const valid = Number.isFinite(r.lambdaIdler);
    const lossy = i.fiberLoss > 0;
    const warnings: string[] = [];
    if (!valid) warnings.push("The signal frequency is above twice the pump frequency (λ_s < λ_p/2), so there is no idler: 1/λ_i = 2/λ_p − 1/λ_s.");
    if (valid && lossy && !Number.isFinite(r.gain)) warnings.push("The fiber loss αL is in the thousands of nepers: nothing reaches the output.");
    if (valid && r.converted > 0.1 * i.pumpPower) {
      warnings.push(`Signal and idler take more than 10 % of the pump (${((100 * r.converted) / i.pumpPower).toPrecision(3)} %): the pump is depleted and the undepleted-pump gain overstates the output.`);
    }
    if (!Number.isFinite(r.peakDetuning) && i.pumpPower > 0) {
      warnings.push("No detuning phase-matches (κ = 0 needs β₂ < 0 or β₄ < 0, i.e. anomalous dispersion): the gain band collapses to the pump and the idler grows only quadratically.");
    }
    if (valid && !Number.isFinite(r.gainCoefficient) && !lossy) warnings.push("Outside the gain band: the gain coefficient g is undefined and G oscillates with L.");
    return {
      values: {
        signalGain: r.gain,
        idlerWavelength: r.lambdaIdler,
        idlerPower: r.idlerPower,
        nonlinearCoefficient: r.gamma,
        linearMismatch: r.deltaBeta,
        kappa: r.kappa,
        gainCoefficient: r.gainCoefficient,
        peakGain: r.peakGain,
        peakWavelengthShift: r.peakShift,
        pumpConverted: i.pumpPower > 0 ? r.converted / i.pumpPower : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // γ = 2π n₂/(λ_p A_eff) = 9.5814 /(W·km); γP_pL = 4.7907, peak gain cosh²(γP_pL) where κ = 0.
      source: "Hansryd J., Andrekson P. A., Westlund M., Li J., Hedekvist P.-O. (2002). Fiber-based optical parametric amplifiers and their applications. IEEE J. Sel. Top. Quantum Electron. 8, 506–520 (peak gain cosh²(γPL)); Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed., ch. 10.",
      basis: "computed",
      inputs: {},
      expect: { nonlinearCoefficient: 9.581396949364764, peakGain: 3623.6626840000613 },
      tolerance: 1e-8,
    },
    {
      // Ω = 2πc(1/λ_s − 1/λ_p), Δβ = β₂Ω² = −6.0686 /km, κ = Δβ + 2γP = 13.0942 /km, g = √((γP)² − (κ/2)²) = 6.9956 /km,
      // G = 1 + [(γP/g) sinh(gL)]² = 512.103, 1/λ_i = 2/λ_p − 1/λ_s = 1540.127 nm, P_i = (λ_s/λ_i)(G − 1)P_s = 10 µW · 517.7 = 5.177 mW.
      source: "Hansryd J., Andrekson P. A., Westlund M., Li J., Hedekvist P.-O. (2002). Fiber-based optical parametric amplifiers and their applications. IEEE J. Sel. Top. Quantum Electron. 8, 506–520 (G_s = 1 + [(γP/g) sinh(gL)]²); Stolen R. H., Bjorkholm J. E. (1982). Parametric amplification and frequency conversion in optical fibers. IEEE J. Quantum Electron. 18, 1062–1072.",
      basis: "computed",
      inputs: {},
      expect: {
        linearMismatch: -6.06860051376647,
        kappa: 13.094193384963058,
        gainCoefficient: 6.9956195151390155,
        signalGain: 512.1029340421073,
        idlerWavelength: 1540.127388535032,
        idlerPower: 5.1769781061039265,
      },
      tolerance: 1e-8,
    },
  ],
});
