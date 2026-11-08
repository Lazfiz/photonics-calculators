import { q } from "../../physics/constants";
import { felPower, freeElectronLaser, type FelInput } from "../../physics/wave-optics/free-electron-laser";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/wave-optics/free-electron-laser",
  inputs: [
    { key: "electronEnergy", label: "Electron kinetic energy", unit: "MeV", toSI: 1e6 * q, siUnit: "J", default: 100, min: 1, max: 1e5 },
    { key: "undulatorPeriod", label: "Undulator period λ_u", unit: "mm", toSI: 1e-3, siUnit: "m", default: 30, min: 1, max: 1000 },
    { key: "undulatorK", label: "Undulator parameter K (peak, planar)", unit: "", toSI: 1, siUnit: "", default: 1.5, min: 0.01, max: 100 },
    { key: "undulatorLength", label: "Undulator length", unit: "m", toSI: 1, siUnit: "m", default: 15, min: 0.01, max: 1000 },
    { key: "beamCurrent", label: "Peak current I", unit: "A", toSI: 1, siUnit: "A", default: 100, min: 0.01, max: 1e6 },
    { key: "beamEmittance", label: "Normalized rms emittance ε_n", unit: "mm mrad", toSI: 1e-6, siUnit: "m rad", default: 5, min: 1e-3, max: 1000 },
    { key: "betaFunction", label: "Average β function", unit: "m", toSI: 1, siUnit: "m", default: 1, min: 0.01, max: 1000 },
    { key: "energySpread", label: "Relative rms energy spread σ_δ", unit: "", toSI: 1, siUnit: "", default: 0.001, min: 0, max: 0.1 },
  ],
  outputs: [
    { key: "wavelength", label: "Resonance wavelength λ₁", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "gamma", label: "Lorentz factor γ", unit: "", toSI: 1, siUnit: "" },
    { key: "jj", label: "Coupling factor [JJ]", unit: "", toSI: 1, siUnit: "" },
    { key: "sigmaX", label: "rms beam size σ_x = √(βε_n/γ)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "rho", label: "Pierce parameter ρ", unit: "", toSI: 1, siUnit: "" },
    { key: "gainLength1D", label: "1D power gain length L_G0", unit: "m", toSI: 1, siUnit: "m" },
    { key: "gainLength", label: "3D power gain length L_G (Xie)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "saturationLength", label: "Saturation length L_G ln(9P_sat/P_n)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "saturationPower", label: "Saturation power P_sat", unit: "MW", toSI: 1e6, siUnit: "W" },
    { key: "beamPower", label: "Electron beam power γmc²I/e", unit: "GW", toSI: 1e9, siUnit: "W" },
    { key: "powerAtEnd", label: "Power at the undulator end", unit: "W", toSI: 1, siUnit: "W" },
    { key: "etaDiffraction", label: "Xie parameter η_d", unit: "", toSI: 1, siUnit: "" },
    { key: "etaEmittance", label: "Xie parameter η_ε", unit: "", toSI: 1, siUnit: "" },
    { key: "etaEnergySpread", label: "Xie parameter η_γ", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ electronEnergy, undulatorPeriod, undulatorK, undulatorLength, beamCurrent, beamEmittance, betaFunction, energySpread }) {
    const input: FelInput = {
      kineticEnergy: electronEnergy,
      lambdaU: undulatorPeriod,
      K: undulatorK,
      current: beamCurrent,
      normEmittance: beamEmittance,
      beta: betaFunction,
      energySpread,
    };
    const r = freeElectronLaser(input);
    const warnings: string[] = [];
    if (energySpread > r.rho) {
      warnings.push(
        `σ_δ = ${energySpread.toPrecision(4)} exceeds ρ = ${r.rho.toPrecision(4)}: the energy spread is wider than the FEL gain bandwidth, so the gain is strongly suppressed (Huang & Kim require σ_δ < ρ) and Xie's fit, made for small η, loses accuracy.`,
      );
    }
    return {
      values: {
        wavelength: r.wavelength,
        gamma: r.gamma,
        jj: r.jj,
        sigmaX: r.sigmaX,
        rho: r.rho,
        gainLength1D: r.gainLength1D,
        gainLength: r.gainLength,
        saturationLength: r.saturationLength,
        saturationPower: r.saturationPower,
        beamPower: r.beamPower,
        powerAtEnd: felPower(undulatorLength, r),
        etaDiffraction: r.etaD,
        etaEmittance: r.etaE,
        etaEnergySpread: r.etaG,
      },
      warnings,
    };
  },
  checks: [
    {
      // γ = 1 + T/(m_ec²) with m_ec² = 0.51099895 MeV; λ₁ = λ_u(1 + K²/2)/(2γ²); ξ = K²/(4 + 2K²), [JJ] = J₀(ξ) − J₁(ξ) (series);
      // σ_x = √(βε_n/γ); ρ = [(1/16)(I/I_A)K²[JJ]²/(γ³σ_x²k_u²)]^(1/3), I_A = 4πε₀m_ec³/e; L_G0 = λ_u/(4π√3 ρ); P_beam = γ m_ec² I/e.
      source: "Huang Z., Kim K.-J. (2007). Review of x-ray free-electron laser theory. Phys. Rev. ST Accel. Beams 10, 034801, doi:10.1103/PhysRevSTAB.10.034801 (resonance condition, Pierce parameter ρ, 1D power gain length L_G0 = λ_u/(4√3 πρ)).",
      basis: "computed",
      inputs: {},
      expect: { gamma: 196.69511809100055, wavelength: 823.8782378473937, jj: 0.8513621762480013, sigmaX: 159.43666874022475, rho: 0.004130530625989271, gainLength1D: 0.3336913252457411, beamPower: 10.051099895069175 },
      tolerance: 1e-8,
    },
  ],
});
