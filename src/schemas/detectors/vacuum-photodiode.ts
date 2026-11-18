import { FA_PER_CM2, vacuumPhotodiodeSummary } from "../../physics/detectors/vacuum-photodiode";
import { defineSchema } from "../types";

const REFS =
  "Dushman S. (1923). Electron emission from metals as a function of temperature. Phys. Rev. 21, 623–636, doi:10.1103/PhysRev.21.623: J = A₀·T²·exp(−ψ/k_B·T), A₀ = 4π·m_e·k_B²·q/h³, " +
  "ψ = k_B·T₂₅·ln(A₀·T₂₅²/J₂₅) from the 25 °C dark emission (Burle Industries (1980). Photomultiplier Handbook, Table I); " +
  "Child C. D. (1911). Discharge from hot CaO. Phys. Rev. (Series I) 32, 492–511, doi:10.1103/PhysRevSeriesI.32.492, in the electron form of Langmuir I. (1913). The effect of space charge and residual gases on thermionic currents in high vacuum. Phys. Rev. 2, 450–486, doi:10.1103/PhysRev.2.450: J = (4ε₀/9)·√(2q/m_e)·V^(3/2)/d²; " +
  "Ramo S. (1939). Currents induced by electron motion. Proc. IRE 27, 584–585, doi:10.1109/JRPROC.1939.228757: ramp current of an electron crossing the gap in τ = d·√(2m_e/(qV)), " +
  "−3 dB at 0.5533/τ (|H(x)| = 1/√2 at x = 3.4767, derived for the ramp spectrum 2[(1 + ix)e^(−ix) − 1]/x²); " +
  "ℛ = η·q·λ/(h·c) for λ ≤ h·c/(q·φ); f_RC = 1/(2π·R_L·(ε₀A/d + C_s)); shot noise √(2q·I·B) and Johnson noise √(4k_B·T·B/R_L) in the bandwidth 1/√(1/f_RC² + 1/f_tr²).";
const NO_PHOTOCURRENT =
  "The photocurrent is zero (no incident power, zero quantum efficiency, or a wavelength beyond the photoemission threshold h·c/(q·φ)), so the SNR is −∞ dB.";

export default defineSchema({
  href: "/detectors/vacuum-photodiode",
  inputs: [
    { key: "quantumEff", label: "Quantum efficiency", unit: "", toSI: 1, siUnit: "", default: 0.25, min: 0, max: 1 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 300, min: 100, max: 2000 },
    { key: "incidentPower", label: "Incident power", unit: "W", toSI: 1, siUnit: "W", default: 1e-6, min: 0, max: 1 },
    { key: "workFunction", label: "Photoemission threshold φ", unit: "eV", toSI: 1, siUnit: "eV", default: 2, min: 0.5, max: 6 },
    { key: "anodeVoltage", label: "Anode voltage", unit: "V", toSI: 1, siUnit: "V", default: 100, min: 1, max: 10000 },
    { key: "gap", label: "Cathode–anode gap", unit: "mm", toSI: 1e-3, siUnit: "m", default: 2, min: 0.1, max: 50 },
    { key: "cathodeArea", label: "Cathode area", unit: "mm²", toSI: 1e-6, siUnit: "m²", default: 100, min: 0.1, max: 10000 },
    { key: "loadResistance", label: "Load resistance", unit: "Ω", toSI: 1, siUnit: "Ω", default: 50, min: 1, max: 1000000000 },
    { key: "temperature", label: "Cathode temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 25, min: -200, max: 300 },
    { key: "darkEmission", label: "Dark emission at 25 °C", unit: "fA/cm²", toSI: FA_PER_CM2, siUnit: "A/m²", default: 0.02, min: 1e-6, max: 1000000 },
    { key: "strayCapacitance", label: "Stray capacitance (anode + wiring)", unit: "pF", toSI: 1e-12, siUnit: "F", default: 0, min: 0, max: 1000 },
  ],
  outputs: [
    { key: "responsivity", label: "Responsivity", unit: "mA/W", toSI: 1e-3, siUnit: "A/W" },
    { key: "thresholdWavelength", label: "Threshold wavelength h·c/φ", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "photocurrent", label: "Photocurrent", unit: "A", toSI: 1, siUnit: "A" },
    { key: "darkCurrent", label: "Thermionic dark current", unit: "A", toSI: 1, siUnit: "A" },
    { key: "spaceChargeLimit", label: "Space-charge (Child) limit", unit: "A", toSI: 1, siUnit: "A" },
    { key: "transitTime", label: "Transit time", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "transitBandwidth", label: "Transit-time bandwidth", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "capacitance", label: "Capacitance (gap + stray)", unit: "pF", toSI: 1e-12, siUnit: "F" },
    { key: "rcBandwidth", label: "RC bandwidth", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "bandwidth", label: "Combined bandwidth", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "snr", label: "SNR (photocurrent over shot + Johnson noise)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "loadDrop", label: "DC voltage across the load", unit: "V", toSI: 1, siUnit: "V" },
  ],
  compute({
    quantumEff, wavelength, incidentPower, workFunction, anodeVoltage, gap, cathodeArea, loadResistance, temperature, darkEmission, strayCapacitance,
  }) {
    const r = vacuumPhotodiodeSummary({
      qe: quantumEff, wavelength, power: incidentPower, phi: workFunction, voltage: anodeVoltage, gap, area: cathodeArea,
      load: loadResistance, temperature: temperature + 273.15, darkEmission25: darkEmission, strayCapacitance,
    });
    const warnings: string[] = [];
    const reasons: Record<string, string> = {};
    if (wavelength > r.cutoff) {
      warnings.push("The wavelength is beyond the photoemission threshold h·c/(q·φ): the responsivity and photocurrent are zero.");
    }
    if (r.overChild) warnings.push("Photo plus dark current exceed Child's space-charge limit: the model is not valid there.");
    if (r.loadCollapse) {
      warnings.push("The DC drop I_ph·R_L exceeds 10% of the anode bias: the anode voltage collapses and the results assume the full bias on the gap.");
    }
    if (!(r.photocurrent > 0)) reasons.snr = NO_PHOTOCURRENT;
    return {
      values: {
        responsivity: r.responsivity,
        thresholdWavelength: r.cutoff,
        photocurrent: r.photocurrent,
        darkCurrent: r.darkCurrent,
        spaceChargeLimit: r.childLimit,
        transitTime: r.transitTime,
        transitBandwidth: r.transitBandwidth,
        capacitance: r.capacitance,
        rcBandwidth: r.rcBandwidth,
        bandwidth: r.bandwidth,
        snr: r.snrDb,
        loadDrop: r.loadDrop,
      },
      reasons,
      warnings: warnings.length ? warnings : undefined,
    };
  },
  checks: [
    {
      // Defaults: η = 0.25, 300 nm, 1 µW, φ = 2 eV, 100 V, 2 mm, 100 mm², 50 Ω, 25 °C, 0.02 fA/cm², no stray C. CODATA 2022 m_e, ε₀.
      // hc/(qφ) = 619.9209922 nm; ℛ = 0.25·q·300e-9/(hc) = 60.49157953 mA/W; I_ph = 6.049157953e-8 A; ψ = k_B·T₂₅·ln(A₀T₂₅²/2e-13 A/m²) with J(25 °C) = 2e-13 A/m² → I_dark = 2e-13·1e-4 = 2e-17 A;
      // τ = 2e-3·√(2m_e/(q·100)) = 674.4259847 ps, f_tr = 0.55332713/τ = 0.8204415941 GHz; C = ε₀·1e-4/2e-3 = 0.4427093909 pF, f_RC = 1/(2π·50·C) = 7.190041429 GHz;
      // B = 1/√(1/f_RC² + 1/f_tr²) = 0.8151518552 GHz; Child = (4ε₀/9)√(2q/m_e)·100^1.5/(2e-3)²·1e-4 = 0.05834879846 A;
      // σ_shot = √(2q(I_ph + I_dark)B), σ_J = √(4k_B·298.15·B/50), SNR = 20·log₁₀(I_ph/√(σ_shot² + σ_J²)) = −18.65482317 dB; I_ph·R_L = 3.0245789765e-6 V.
      source: REFS,
      basis: "computed",
      inputs: {},
      expect: {
        responsivity: 60.4915795301191, thresholdWavelength: 619.9209921660013, photocurrent: 6.04915795301191e-8, darkCurrent: 2.000000000000016e-17,
        spaceChargeLimit: 0.058348798461538225, transitTime: 674.4259847488199, transitBandwidth: 0.8204415940558378, capacitance: 0.44270939093999995,
        rcBandwidth: 7.19004142893664, bandwidth: 0.8151518551790503, snr: -18.654823173343996, loadDrop: 3.0245789765059546e-6,
      },
      tolerance: 1e-8,
    },
    {
      // η = 0.15, 450 nm, 10 µW, φ = 2.2 eV, 500 V, 5 mm, 50 mm², 1 kΩ, 60 °C, 3 fA/cm², 2 pF stray: hc/(qφ) = 563.5645383 nm; ℛ = 54.44242158 mA/W; I_ph = 5.444242158e-7 A;
      // I_dark = A₀·T²·exp(−ψq/k_BT)·A at 333.15 K with ψ from J(25 °C) = 3e-11 A/m² = 3.440804084e-13 A; τ = 754.0311739 ps, f_tr = 0.7338252703 GHz;
      // C = ε₀·5e-5/5e-3 + 2 pF = 2.088541878 pF, f_RC = 76.20385530 MHz; B = 75.79626836 MHz; Child = 0.05218875191 A; SNR = 23.71071821 dB; I_ph·R_L = 5.444242158e-4 V.
      source: REFS,
      basis: "computed",
      inputs: {
        quantumEff: 0.15, wavelength: 450, incidentPower: 1e-5, workFunction: 2.2, anodeVoltage: 500, gap: 5, cathodeArea: 50,
        loadResistance: 1000, temperature: 60, darkEmission: 3, strayCapacitance: 2,
      },
      expect: {
        responsivity: 54.442421577107176, thresholdWavelength: 563.5645383327284, photocurrent: 5.444242157710719e-7, darkCurrent: 3.4408040842773483e-13,
        spaceChargeLimit: 0.052188751906173836, transitTime: 754.0311738452989, transitBandwidth: 0.7338252703508563, capacitance: 2.088541878188,
        rcBandwidth: 0.07620385530884194, bandwidth: 0.07579626836000128, snr: 23.71071820734972, loadDrop: 0.0005444242157710719,
      },
      tolerance: 1e-8,
    },
  ],
});
