import { TORR, q } from "../../physics/constants";
import { SPUTTER_TARGETS, sputterYield, sputteringDeposition, type SputterTargetId } from "../../physics/thin-film/sputtering";
import { defineSchema } from "../types";

const IDS = Object.keys(SPUTTER_TARGETS) as SputterTargetId[];

const OHRING = "Ohring M. (2002). Materials Science of Thin Films, 2nd ed., Academic Press, ch. 3 (cosine-source deposition: " +
  "flux Φ/(π(a² + d²)) on axis from a disk) and ch. 5 (sputtering); ion current I/(1 + γ) with I = P/V, sputtered atoms (I_i/e) Y; " +
  "yields at 500 eV Ar⁺ after Laegreid N., Wehner G. K. (1961), J. Appl. Phys. 32, 365, doi:10.1063/1.1736012.";

export default defineSchema({
  href: "/thin-film/sputtering-deposition",
  choices: [
    {
      key: "target",
      label: "Target (elemental)",
      options: IDS.map((k) => ({ value: k, label: SPUTTER_TARGETS[k].name })),
      default: "Al",
    },
  ],
  inputs: [
    { key: "power", label: "Discharge power", unit: "W", toSI: 1, siUnit: "W", default: 300, min: 0, max: 100000 },
    { key: "voltage", label: "Discharge voltage", unit: "V", toSI: 1, siUnit: "V", default: 500, min: 1, max: 5000 },
    { key: "gamma", label: "Secondary-electron yield γ", unit: "", toSI: 1, siUnit: "", default: 0.07, min: 0, max: 1 },
    { key: "yield", label: "Sputter yield (0 = 500 eV table value)", unit: "atoms/ion", toSI: 1, siUnit: "atoms/ion", default: 0, min: 0, max: 20 },
    { key: "targetRadius", label: "Erosion-zone radius of the target", unit: "cm", toSI: 1e-2, siUnit: "m", default: 2, min: 0, max: 50 },
    { key: "distance", label: "Target–substrate distance", unit: "cm", toSI: 1e-2, siUnit: "m", default: 10, min: 0.1, max: 100 },
    { key: "pressure", label: "Argon pressure", unit: "mTorr", toSI: 1e-3 * TORR, siUnit: "Pa", default: 3, min: 0.01, max: 1000 },
    { key: "substrateTemp", label: "Substrate temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 200, min: -273.15, max: 2000 },
  ],
  outputs: [
    { key: "rate", label: "On-axis deposition rate (collisionless)", unit: "nm/s", toSI: 1e-9, siUnit: "m/s" },
    { key: "ionCurrent", label: "Ion current to the target", unit: "A", toSI: 1, siUnit: "A" },
    { key: "atomRate", label: "Sputtered atoms", unit: "s⁻¹", toSI: 1, siUnit: "s⁻¹" },
    { key: "thermalised", label: "Thermalised before the substrate", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "thermalisationEnergy", label: "Ejection energy E* thermalised at the substrate distance", unit: "eV", toSI: q, siUnit: "J" },
    { key: "thermalisationDistance", label: "Thermalisation distance D at the peak energy", unit: "cm", toSI: 1e-2, siUnit: "m" },
    { key: "homologous", label: "Homologous temperature T_s/T_m", unit: "", toSI: 1, siUnit: "" },
  ],
  compute(i) {
    const t = SPUTTER_TARGETS[i.target as SputterTargetId];
    const Y = sputterYield(t, i.yield);
    const r = sputteringDeposition(t, {
      power: i.power, voltage: i.voltage, gamma: i.gamma, Y, targetRadius: i.targetRadius, distance: i.distance,
      pressure: i.pressure, substrateTemp: i.substrateTemp + 273.15,
    });
    const warnings: string[] = [];
    if (i.yield === 0 && Math.abs(i.voltage - 500) > 100) {
      warnings.push(`The table yield is for 500 eV; at ${i.voltage} V enter a measured yield for this voltage.`);
    }
    if (!Number.isFinite(r.thermalised)) warnings.push("No thermalisation result for these inputs.");
    return {
      values: {
        rate: r.rate, ionCurrent: r.Ii, atomRate: r.Phi, thermalised: r.thermalised, thermalisationEnergy: r.Es * q,
        thermalisationDistance: r.th.distance, homologous: r.Ts / t.Tm,
      },
      warnings,
    };
  },
  checks: [
    {
      // Al, defaults: I_i = P/(V(1 + γ)) = 300/(500 · 1.07) = 0.560748 A; Φ = (I_i/e) Y = 0.560748/1.602176634e-19 · 1.05 = 3.67491e18 s⁻¹.
      source: OHRING,
      basis: "computed",
      inputs: {},
      expect: { ionCurrent: 0.5607476635514018, atomRate: 3674907212065683000 },
      tolerance: 1e-8,
    },
    {
      // F = Φ/(π(a² + d²)) = 3.67491e18/(π (0.02² + 0.1²)) = 1.12477e20 m⁻² s⁻¹; rate = F M/(ρ N_A) = 1.12477e20 · 0.026982/(2700 · 6.02214076e23)
      // = 1.86648e-9 m/s = 1.86648 nm/s. T_s/T_m = 473.15/933.47 = 0.506872.
      source: OHRING,
      basis: "computed",
      inputs: {},
      expect: { rate: 1.8664769777587042, homologous: 0.5068722079981145 },
      tolerance: 1e-8,
    },
  ],
});
