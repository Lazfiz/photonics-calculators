import { thinDiskLaser } from "../../physics/wave-optics/quasi-three-level";
import { defineSchema } from "../types";

const SOURCE =
  "Fan T. Y., Byer R. L. (1987). Modeling and CW operation of a quasi-three-level 946 nm Nd:YAG laser. IEEE J. Quantum Electron. " +
  "23, 605–612, doi:10.1109/JQE.1987.1073371 (reabsorption threshold); Taira T., Tulloch W. M., Byer R. L. (1997). Modeling of " +
  "quasi-three-level lasers and operation of cw Yb:YAG lasers. Appl. Opt. 36, 1867–1874, doi:10.1364/AO.36.001867 (m d N(βσ_e − (1 − β)σ_a) = δ, " +
  "P_th = h c N d β A/(λ_p τ η_abs), η_abs = 1 − e^(−M α_p d), slope η_abs (λ_p/λ) T/δ); Giesen A. et al. (1994). Scalable concept for " +
  "diode-pumped high-power solid-state lasers. Appl. Phys. B 58, 365–372, doi:10.1007/BF01081875 (thin-disk geometry, ΔT = η_h I_abs d/(2κ))";

export default defineSchema({
  href: "/wave-optics/thin-disk-laser",
  inputs: [
    { key: "diskThickness", label: "Disk thickness d", unit: "µm", toSI: 1e-6, siUnit: "m", default: 200, min: 10, max: 5000 },
    { key: "diskDiameter", label: "Disk diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.1, max: 1000 },
    { key: "pumpSpotDiameter", label: "Pump spot diameter (top hat)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 3, min: 0.01, max: 1000 },
    { key: "Yb_concentration", label: "Yb doping (at.% of the Y sites)", unit: "at.%", toSI: 0.01, siUnit: "", default: 10, min: 0.01, max: 100 },
    { key: "numPasses", label: "Pump passes through the disk M (rounded to an integer)", unit: "", toSI: 1, siUnit: "", default: 16, min: 1, max: 100 },
    { key: "laserPasses", label: "Laser passes per round trip m (rounded to an integer)", unit: "", toSI: 1, siUnit: "", default: 2, min: 1, max: 100 },
    { key: "pump", label: "Incident pump power", unit: "W", toSI: 1, siUnit: "W", default: 200, min: 0, max: 1e6 },
    { key: "R_oc", label: "Output coupler reflectance", unit: "", toSI: 1, siUnit: "", default: 0.97, min: 0.01, max: 0.9999 },
    { key: "loss", label: "Other loss per round trip", unit: "%", toSI: 0.01, siUnit: "", default: 1, min: 0, max: 50 },
    { key: "wavelength", label: "Laser wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1030, min: 300, max: 5000 },
    { key: "pumpWavelength", label: "Pump wavelength λ_p", unit: "nm", toSI: 1e-9, siUnit: "m", default: 940, min: 200, max: 5000 },
    { key: "sigmaE", label: "Emission cross-section σ_e at λ", unit: "1e-20 cm²", toSI: 1e-24, siUnit: "m²", default: 2.4, min: 1e-4, max: 1e4 },
    { key: "sigmaA", label: "Absorption cross-section σ_a at λ", unit: "1e-20 cm²", toSI: 1e-24, siUnit: "m²", default: 0.16, min: 0, max: 1e4 },
    { key: "sigmaAP", label: "Absorption cross-section σ_ap at λ_p", unit: "1e-20 cm²", toSI: 1e-24, siUnit: "m²", default: 0.76, min: 1e-4, max: 1e4 },
    { key: "sigmaEP", label: "Emission cross-section σ_ep at λ_p", unit: "1e-20 cm²", toSI: 1e-24, siUnit: "m²", default: 0.22, min: 0, max: 1e4 },
    { key: "tau", label: "Upper-level lifetime τ", unit: "ms", toSI: 1e-3, siUnit: "s", default: 0.951, min: 1e-4, max: 1e4 },
    { key: "heatFraction", label: "Heat fraction of the absorbed pump", unit: "", toSI: 1, siUnit: "", default: 0.087, min: 0, max: 1 },
    { key: "kappa", label: "Thermal conductivity κ", unit: "W/(m K)", toSI: 1, siUnit: "W/(m K)", default: 6.3, min: 0.1, max: 2000 },
  ],
  outputs: [
    { key: "thresholdInversion", label: "Threshold inversion β_th", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "transparencyInversion", label: "Transparency inversion σ_a/(σ_a + σ_e)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "bleachInversion", label: "Pump bleaching inversion σ_ap/(σ_ap + σ_ep)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "pumpAbsorbed", label: "Pump absorbed at the threshold inversion", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "roundTripLoss", label: "Round-trip loss δ", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "thresholdPump", label: "Threshold pump power (incident)", unit: "W", toSI: 1, siUnit: "W" },
    { key: "outputPower", label: "Output power", unit: "W", toSI: 1, siUnit: "W" },
    { key: "slopeEfficiency", label: "Slope efficiency", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "ionDensity", label: "Yb ion density", unit: "1e20 cm⁻³", toSI: 1e26, siUnit: "1/m³" },
    { key: "absorbedIntensity", label: "Absorbed pump intensity", unit: "kW/cm²", toSI: 1e7, siUnit: "W/m²" },
    { key: "temperatureRise", label: "Temperature rise through the disk η_h I_abs d/(2κ)", unit: "K", toSI: 1, siUnit: "K" },
  ],
  compute(p) {
    const op = thinDiskLaser({
      thickness: p.diskThickness, spotDiameter: p.pumpSpotDiameter, doping: p.Yb_concentration, pumpPasses: p.numPasses,
      laserPasses: p.laserPasses, pump: p.pump, R_oc: p.R_oc, otherLoss: p.loss, lambda: p.wavelength, lambdaP: p.pumpWavelength,
      sigmaE: p.sigmaE, sigmaA: p.sigmaA, sigmaAP: p.sigmaAP, sigmaEP: p.sigmaEP, tau: p.tau, heatFraction: p.heatFraction, kappa: p.kappa,
    });
    const warnings: string[] = [];
    if (!Number.isFinite(op.pTh)) {
      warnings.push(
        `Threshold needs an inversion above ${(op.betaBleach * 100).toPrecision(4)} %, where the pump is no longer absorbed: the laser cannot reach threshold. Lower the loss, add laser passes or use a thicker or more heavily doped disk.`,
      );
    }
    if (p.pumpSpotDiameter > p.diskDiameter) warnings.push("The pump spot is larger than the disk.");
    return {
      values: {
        thresholdInversion: op.beta,
        transparencyInversion: op.betaTr,
        bleachInversion: op.betaBleach,
        pumpAbsorbed: op.etaAbs,
        roundTripLoss: op.delta,
        thresholdPump: op.pTh,
        outputPower: op.pOut,
        slopeEfficiency: op.slope,
        ionDensity: op.N,
        absorbedIntensity: op.absorbedIntensity,
        temperatureRise: op.dT,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults. N = 0.1 · 1.38e28 m⁻³ = 13.8e20 cm⁻³; δ = −ln 0.97 − ln 0.99 = 0.0405095; β_th = (δ/(m d N) + σ_a)/(σ_e + σ_a) = 9.116674 %,
      // β_tr = σ_a/(σ_a + σ_e) = 0.16/2.56 = 6.25 %, β_bleach = σ_ap/(σ_ap + σ_ep) = 0.76/0.98 = 77.55102 %;
      // α_p = N(σ_ap − β(σ_ap + σ_ep)), η_abs = 1 − e^(−M α_p d) = 94.826494 % (M = 16, d = 200 µm);
      // A = π(1.5 mm)², P_th = h c N d β A/(λ_p τ η_abs) = 41.678931 W; slope = η_abs (λ_p/λ)(−ln R_oc)/δ = 65.070115 %;
      // P_out = slope (200 W − P_th) = 103.019702 W; I_abs = η_abs P/A = 2.683041 kW/cm²; ΔT = η_h I_abs d/(2κ) = 37.051518 K.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        thresholdInversion: 9.116673979436287, transparencyInversion: 6.25, bleachInversion: 77.55102040816327,
        pumpAbsorbed: 94.82649368626456, roundTripLoss: 4.050954333821003, thresholdPump: 41.67893054037192,
        outputPower: 103.01970168354104, slopeEfficiency: 65.07011482120585, ionDensity: 13.8,
        absorbedIntensity: 2.683040925554028, temperatureRise: 37.05151754336515,
      },
      tolerance: 1e-8,
    },
  ],
});
