import { microchannelPlateSummary } from "../../physics/detectors/microchannel-plate";
import { defineSchema } from "../types";

const WIZA = "Wiza J. L. (1979). Microchannel plate detectors. Nucl. Instrum. Methods 162, 587–601, doi:10.1016/0029-554X(79)90734-1, " +
  "§2.2 and eq. (1)–(4): Schagen's channel gain G = δ^n with n = 4V₀α²/V wall strikes and δ = A·V/(2α√V₀) per strike for a channel of " +
  "length-to-diameter ratio α = L/d; optimum α = A·V/(2√(e·V₀)) with peak gain exp(A²V/(2e)); space-charge saturated gain ≈ 10⁸ × d/(1 mm); " +
  "stack gain G^N; hexagonal pitch p = d·√(π/(2√3·OAR)); detection efficiency QE × open-area ratio.";

export default defineSchema({
  href: "/detectors/microchannel-plate",
  inputs: [
    { key: "numPlates", label: "Number of plates", unit: "", toSI: 1, siUnit: "", default: 2, min: 1, max: 3 },
    { key: "channelDiameter", label: "Channel diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10, min: 2, max: 100 },
    { key: "channelLength", label: "Channel length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0.5, min: 0.05, max: 5 },
    { key: "openAreaRatio", label: "Open-area ratio", unit: "", toSI: 1, siUnit: "", default: 0.6, min: 0.05, max: 0.9 },
    { key: "appliedVoltage", label: "Voltage per plate", unit: "V", toSI: 1, siUnit: "V", default: 1000, min: 200, max: 2000 },
    { key: "yieldConstant", label: "Yield constant A (δ = A·√V_c)", unit: "V^-1/2", toSI: 1, siUnit: "V^-1/2", default: 0.2, min: 0.05, max: 1 },
    { key: "emissionEnergy", label: "Secondary emission energy V₀", unit: "eV", toSI: 1, siUnit: "eV", default: 1, min: 0.1, max: 10 },
    { key: "qe", label: "Photocathode QE", unit: "", toSI: 1, siUnit: "", default: 0.25, min: 0, max: 1 },
  ],
  outputs: [
    { key: "ldRatio", label: "L/d ratio α", unit: "", toSI: 1, siUnit: "" },
    { key: "wallStrikes", label: "Wall strikes n", unit: "", toSI: 1, siUnit: "" },
    { key: "yieldPerStrike", label: "Yield per strike δ", unit: "", toSI: 1, siUnit: "" },
    { key: "plateGain", label: "Single-plate gain", unit: "", toSI: 1, siUnit: "" },
    { key: "stackGain", label: "Stack gain (unsaturated)", unit: "", toSI: 1, siUnit: "" },
    { key: "spaceChargeLimit", label: "Space-charge limit (one channel)", unit: "", toSI: 1, siUnit: "" },
    { key: "optimumLd", label: "Optimum L/d at this voltage", unit: "", toSI: 1, siUnit: "" },
    { key: "peakPlateGain", label: "Peak single-plate gain", unit: "", toSI: 1, siUnit: "" },
    { key: "channelPitch", label: "Channel pitch (hexagonal)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "detectionEfficiency", label: "Detection efficiency (QE × open area)", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ numPlates, channelDiameter, channelLength, openAreaRatio, appliedVoltage, yieldConstant, emissionEnergy, qe }) {
    const r = microchannelPlateSummary({
      plates: numPlates, diameter: channelDiameter, length: channelLength, openAreaRatio, voltage: appliedVoltage, yieldConstant,
      emissionEnergy, qe,
    });
    const warnings: string[] = [];
    if (r.outOfRange) warnings.push("Outside the gain model's range: fewer than 2 wall strikes, a yield per strike above 4, or a single-plate gain below 1.");
    if (r.saturated) warnings.push("The unsaturated stack gain is above the one-channel space-charge limit: the last plate begins to saturate and the real gain is lower.");
    const reasons: Record<string, string> = {};
    if (!Number.isFinite(r.stackGain)) reasons.stackGain = "The stack gain is not finite: the single-plate gain is undefined or the product of the plates overflows.";
    if (!Number.isFinite(r.plateGain)) reasons.plateGain = "The single-plate gain is undefined for these inputs.";
    if (!Number.isFinite(r.pitch)) reasons.channelPitch = "The open-area ratio exceeds the hexagonal packing limit π/(2√3) ≈ 0.907.";
    return {
      values: {
        ldRatio: r.ld, wallStrikes: r.strikes, yieldPerStrike: r.yieldPerStrike, plateGain: r.plateGain, stackGain: r.stackGain,
        spaceChargeLimit: r.limit, optimumLd: r.optimumLd, peakPlateGain: r.peakPlateGain, channelPitch: r.pitch,
        detectionEfficiency: r.detection,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // One plate, 10 µm channels, L = 0.5 mm: α = 500/10 = 50; V = 1000 V, A = 0.2, V₀ = 1 eV, OAR 0.6, QE 0.25.
      // n = 4·1·50²/1000 = 10; δ = 0.2·1000/(2·50·√1) = 2; G = 2^10 = 1024; limit = 1e8·(10e-6/1e-3) = 1e6.
      // α_opt = 0.2·1000/(2√e) = 60.653066; G_max = exp(0.04·1000/(2e)) = 1568.0512; pitch = 10·√(π/(2√3·0.6)) = 12.294305 µm; η = 0.25·0.6 = 15 %.
      source: WIZA,
      basis: "computed",
      inputs: { numPlates: 1 },
      expect: {
        ldRatio: 50, wallStrikes: 10, yieldPerStrike: 2, plateGain: 1024, stackGain: 1024, spaceChargeLimit: 1e6,
        optimumLd: 60.65306597126334, peakPlateGain: 1568.051152943365, channelPitch: 12.294305471213825, detectionEfficiency: 15,
      },
      tolerance: 1e-8,
    },
    {
      // Two plates, d = 25 µm, L = 1.25 mm (α = 50), V = 800 V, A = 0.2, V₀ = 1 eV.
      // n = 4·2500/800 = 12.5; δ = 0.2·800/100 = 1.6; G = 1.6^12.5 = 356.04081; stack = G² = 126765.06; limit = 1e8·0.025 = 2.5e6.
      // α_opt = 0.2·800/(2√e) = 48.522453; G_max = exp(0.04·800/(2e)) = 359.98813; pitch = 25·√(π/(2√3·0.6)) = 30.735764 µm.
      source: WIZA,
      basis: "computed",
      inputs: { numPlates: 2, channelDiameter: 25, channelLength: 1.25, appliedVoltage: 800 },
      expect: {
        ldRatio: 50, wallStrikes: 12.5, yieldPerStrike: 1.6, plateGain: 356.0408122994092, stackGain: 126765.06002282313,
        spaceChargeLimit: 2500000, optimumLd: 48.52245277701067, peakPlateGain: 359.98813002114616, channelPitch: 30.735763678034562,
        detectionEfficiency: 15,
      },
      tolerance: 1e-8,
    },
  ],
});
