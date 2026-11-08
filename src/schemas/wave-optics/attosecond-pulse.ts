import { c, h, q } from "../../physics/constants";
import {
  IONIZATION_ENERGY_EV, barrierSuppressionIntensity, fourierLimitDuration, hhgCutoff, highestOddHarmonic,
  lorentzDriftParameter, ponderomotiveEnergy, type HhgGas,
} from "../../physics/wave-optics/high-harmonic";
import { defineSchema } from "../types";

const GAS_NAMES: Record<HhgGas, string> = {
  xenon: "Xenon", krypton: "Krypton", hydrogen: "Hydrogen (atomic)", argon: "Argon", neon: "Neon", helium: "Helium",
};

const HHG = "Corkum P. B. (1993). Plasma perspective on strong field multiphoton ionization. Phys. Rev. Lett. 71(13), 1994–1997, " +
  "doi:10.1103/PhysRevLett.71.1994, and Krause J. L., Schafer K. J., Kulander K. C. (1992). High-order harmonic generation from atoms " +
  "and ions in the high intensity regime. Phys. Rev. Lett. 68(24), 3535, doi:10.1103/PhysRevLett.68.3535: cutoff E_c = I_p + 3.17 U_p, " +
  "U_p = e²I/(2ε₀ c m ω²). Ionization energies: NIST Atomic Spectra Database (as listed in the physics module).";

export default defineSchema({
  href: "/wave-optics/attosecond-pulse",
  inputs: [
    { key: "wavelength", label: "Driver wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 800, min: 200, max: 10000 },
    { key: "duration", label: "Driver duration, FWHM", unit: "fs", toSI: 1e-15, siUnit: "s", default: 5, min: 1, max: 1000 },
    { key: "intensity", label: "Peak intensity", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²", default: 2e14, min: 1e12, max: 1e16 },
    { key: "filterEdge", label: "Low edge of the selected band", unit: "eV", toSI: q, siUnit: "J", default: 20, min: 0, max: 1e4 },
  ],
  choices: [
    {
      key: "gas",
      label: "Gas",
      options: (Object.keys(IONIZATION_ENERGY_EV) as HhgGas[]).map((g) => ({ value: g, label: `${GAS_NAMES[g]}, I_p = ${IONIZATION_ENERGY_EV[g]} eV` })),
      default: "argon",
    },
  ],
  outputs: [
    { key: "ponderomotive", label: "Ponderomotive energy U_p", unit: "eV", toSI: q, siUnit: "J" },
    { key: "cutoff", label: "Cutoff photon energy I_p + 3.17 U_p", unit: "eV", toSI: q, siUnit: "J" },
    { key: "highestHarmonic", label: "Last odd harmonic order", unit: "", toSI: 1, siUnit: "" },
    { key: "keldysh", label: "Keldysh parameter γ", unit: "", toSI: 1, siUnit: "" },
    { key: "barrierSuppression", label: "Barrier-suppression intensity", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
    { key: "lorentzDrift", label: "Lorentz-drift parameter Γ", unit: "", toSI: 1, siUnit: "" },
    { key: "fourierLimit", label: "Fourier-limited pulse of the selected band", unit: "as", toSI: 1e-18, siUnit: "s" },
    { key: "driverCycles", label: "Driver cycles in the FWHM", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ wavelength, duration, intensity, filterEdge, gas }) {
    const g: HhgGas = gas in IONIZATION_ENERGY_EV ? (gas as HhgGas) : "argon";
    const ip = IONIZATION_ENERGY_EV[g] * q;
    const up = ponderomotiveEnergy(intensity, wavelength);
    const cutoff = hhgCutoff(ip, up);
    const photon = (h * c) / wavelength;
    const keldysh = up > 0 ? Math.sqrt(ip / (2 * up)) : NaN;
    const ibs = barrierSuppressionIntensity(ip);
    const drift = lorentzDriftParameter(ip, intensity, wavelength);
    const band = cutoff - filterEdge;
    const warnings: string[] = [];
    if (intensity > ibs) warnings.push("Above the barrier-suppression intensity: ionization saturates the medium; long drivers cap the cutoff near I_BS, few-cycle drivers reach somewhat beyond it.");
    if (keldysh > 1) warnings.push("Keldysh γ > 1: multiphoton regime, where the three-step cutoff law I_p + 3.17 U_p is only indicative.");
    if (drift > 1) warnings.push("Lorentz drift Γ > 1 (Klaiber et al. 2008): the magnetic force pushes the returning electron past the ion by more than its wave-packet spread, so recombination and the harmonic yield fall.");
    if (!(band > 0)) warnings.push("The band edge is at or above the cutoff: no Fourier-limited pulse.");
    return {
      values: {
        ponderomotive: up,
        cutoff,
        highestHarmonic: highestOddHarmonic(cutoff, photon),
        keldysh,
        barrierSuppression: ibs,
        lorentzDrift: drift,
        fourierLimit: band > 0 ? fourierLimitDuration(band) : NaN,
        driverCycles: duration / (wavelength / c),
      },
      warnings,
    };
  },
  checks: [
    {
      // Argon (I_p = 15.7596 eV), 800 nm, 2e14 W/cm², band edge 20 eV. U_p = e²I/(2ε₀ c m ω²) ≈ 11.96 eV (the familiar
      // 9.33e-14 I[W/cm²] λ²[µm] eV = 11.94 eV); cutoff = 15.7596 + 3.17 × U_p; Keldysh γ = √(I_p/2U_p).
      source: HHG,
      basis: "computed",
      inputs: {},
      expect: {
        ponderomotive: 11.951730614597126, cutoff: 53.64658604827289, highestHarmonic: 33, keldysh: 0.8119741427917201,
        barrierSuppression: 246772418239284.28, lorentzDrift: 0.00014645608854236525, fourierLimit: 54.238817753075914, driverCycles: 1.8737028625,
      },
      tolerance: 1e-8,
    },
    {
      // Helium (I_p = 24.5874 eV) at 800 nm, 5e14 W/cm², band edge 30 eV.
      source: HHG,
      basis: "computed",
      inputs: { gas: "helium", intensity: 5e14, filterEdge: 30 },
      expect: { ponderomotive: 29.879326536492812, cutoff: 119.30486512068221, highestHarmonic: 75 },
      tolerance: 1e-8,
    },
  ],
});
