import { slabLaser } from "../../physics/wave-optics/slab-laser";
import { defineSchema } from "../types";

const SOURCE =
  "Eggleston J. M., Kane T. J., Kuhn K., Unternahrer J., Byer R. L. (1984). The slab geometry laser, Part I: Theory. IEEE J. Quantum " +
  "Electron. 20, 289–301, doi:10.1109/JQE.1984.1072386 (zigzag geometry, temperature profile ΔT = Q(t²/4 − y²)/(2κ), thermal lens); " +
  "Koechner W. (2006). Solid-State Laser Engineering, 6th ed., ch. 2–3, Springer, doi:10.1007/0-387-29338-8 (four-level threshold " +
  "P_th = δ h c A/(2η_p σ τ λ_p), I_sat = h c/(λ σ τ)); Rigrod W. W. (1965). J. Appl. Phys. 36, 2487–2490, doi:10.1063/1.1714517 (output)";

export default defineSchema({
  href: "/wave-optics/slab-laser",
  inputs: [
    { key: "slabWidth", label: "Slab width W", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.1, max: 1000 },
    { key: "slabHeight", label: "Slab thickness t (cooled faces)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 2, min: 0.05, max: 100 },
    { key: "slabLength", label: "Slab length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 50, min: 1, max: 2000 },
    { key: "bounces", label: "Thickness crossings N (rounded to an integer)", unit: "", toSI: 1, siUnit: "", default: 8, min: 1, max: 1000 },
    { key: "n_crystal", label: "Crystal index n", unit: "", toSI: 1, siUnit: "", default: 1.82, min: 1.01, max: 4 },
    { key: "wavelength", label: "Laser wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 300, max: 5000 },
    { key: "pumpWavelength", label: "Pump wavelength λ_p", unit: "nm", toSI: 1e-9, siUnit: "m", default: 808, min: 200, max: 5000 },
    { key: "pump", label: "Absorbed pump power", unit: "W", toSI: 1, siUnit: "W", default: 200, min: 0, max: 1e6 },
    { key: "etaP", label: "Pump efficiency η_p (absorbed → upper level)", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0.01, max: 1 },
    { key: "R_oc", label: "Output coupler reflectance (HR = 1)", unit: "", toSI: 1, siUnit: "", default: 0.9, min: 0.01, max: 0.9999 },
    { key: "alpha_scatter", label: "Scatter loss", unit: "1/cm", toSI: 100, siUnit: "1/m", default: 0.002, min: 0, max: 10 },
    { key: "sigma", label: "Emission cross-section σ", unit: "1e-19 cm²", toSI: 1e-23, siUnit: "m²", default: 2.8, min: 1e-4, max: 1e4 },
    { key: "tau", label: "Upper-level lifetime τ", unit: "µs", toSI: 1e-6, siUnit: "s", default: 230, min: 1e-3, max: 1e6 },
    { key: "heatFraction", label: "Heat fraction of the absorbed pump", unit: "", toSI: 1, siUnit: "", default: 0.32, min: 0, max: 1 },
    { key: "kappa", label: "Thermal conductivity κ", unit: "W/(m K)", toSI: 1, siUnit: "W/(m K)", default: 14, min: 0.1, max: 2000 },
    { key: "dndT", label: "dn/dT", unit: "1e-6/K", toSI: 1e-6, siUnit: "1/K", default: 7.3, min: -100, max: 100 },
  ],
  outputs: [
    { key: "zigzagAngle", label: "Zigzag angle θ to the slab axis", unit: "°", toSI: Math.PI / 180, siUnit: "rad" },
    { key: "pathLength", label: "Zigzag path L/cos θ", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "aperture", label: "Aperture W t cos θ", unit: "mm²", toSI: 1e-6, siUnit: "m²" },
    { key: "roundTripLoss", label: "Round-trip loss δ", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "thresholdPump", label: "Threshold (absorbed pump)", unit: "W", toSI: 1, siUnit: "W" },
    { key: "saturationPower", label: "Saturation power P_sat = I_sat A", unit: "W", toSI: 1, siUnit: "W" },
    { key: "outputPower", label: "Output power (no result without total internal reflection)", unit: "W", toSI: 1, siUnit: "W" },
    { key: "slopeEfficiency", label: "Slope efficiency", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "heatDensity", label: "Heat density Q", unit: "W/cm³", toSI: 1e6, siUnit: "W/m³" },
    { key: "centreRise", label: "Centre temperature rise Q t²/(8κ)", unit: "K", toSI: 1, siUnit: "K" },
    { key: "thermalLens", label: "Straight-through thermal lens f = κ/((dn/dT) Q L)", unit: "m", toSI: 1, siUnit: "m" },
  ],
  compute(p) {
    const op = slabLaser({
      width: p.slabWidth, thickness: p.slabHeight, length: p.slabLength, crossings: p.bounces, n: p.n_crystal,
      lambda: p.wavelength, lambdaP: p.pumpWavelength, pump: p.pump, etaP: p.etaP, R_oc: p.R_oc, scatter: p.alpha_scatter,
      sigma: p.sigma, tau: p.tau, heatFraction: p.heatFraction, kappa: p.kappa, dndT: p.dndT,
    });
    const warnings: string[] = [];
    if (!op.tir) {
      warnings.push("The face incidence angle is below the critical angle: the beam leaks out of the faces instead of totally reflecting. Use fewer bounces or a longer slab; no output power is given.");
    }
    return {
      values: {
        zigzagAngle: op.theta,
        pathLength: op.pathLength,
        aperture: op.area,
        roundTripLoss: op.delta,
        thresholdPump: op.pTh,
        saturationPower: op.pSat,
        outputPower: op.tir ? op.pOut : NaN,
        slopeEfficiency: op.slope,
        heatDensity: op.Q,
        centreRise: op.dTCentre,
        thermalLens: op.lens,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults. θ = atan(N t/L) = atan(0.32) = 17.744672°; L_z = L/cos θ = 50 mm · √(1 + 0.32²) = 52.497619 mm; A = W t cos θ = 19.048483 mm²;
      // internal = α_s L_z = 0.2 1/m · 0.0524976 m = 0.0104995, δ = −ln 0.9 + 2 · 0.0104995 = 0.1263596;
      // P_th = δ h c A/(2 η_p σ τ λ_p) = 57.428574 W; I_sat = h c/(λ σ τ), P_sat = I_sat A = 552.21682 W;
      // g₀l = η_p σ τ P λ_p/(h c A) = 0.2200291, R₁′ = e^(−2 · internal) = 0.9792199;
      // Rigrod P = P_sat (1 − R₂)√R₁′ (g₀l + ln√(R₁′R₂))/((√R₁′ + √R₂)(1 − √(R₁′R₂))); slope = η_p (λ_p/λ) K, K = Rigrod slope;
      // Q = 0.32 · 200 W/(1e-6 m³) = 64 W/cm³, ΔT = Q t²/(8κ) = 2.285714 K, f = κ/((dn/dT) Q L) = 0.5993151 m.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        zigzagAngle: 17.744671625056935, pathLength: 52.49761899362675, aperture: 19.048482943986485,
        roundTripLoss: 12.635956325527697, thresholdPump: 57.42857381378083, saturationPower: 552.21681964598,
        outputPower: 72.22607802019368, slopeEfficiency: 50.65957460918982, heatDensity: 64, centreRise: 2.2857142857142856,
        thermalLens: 0.5993150684931507,
      },
      tolerance: 1e-8,
    },
  ],
});
