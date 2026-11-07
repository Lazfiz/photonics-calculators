import { cutoffWavelength } from "../../physics/detectors/ingaas";
import { SEMICONDUCTOR_GAPS, type SemiconductorId } from "../../physics/materials/bandgap";
import { defineSchema } from "../types";

const IDS = Object.keys(SEMICONDUCTOR_GAPS) as SemiconductorId[];

const VARSHNI_REF = "Varshni Y. P. (1967). Temperature dependence of the energy gap in semiconductors. Physica 34, 149, " +
  "doi:10.1016/0031-8914(67)90062-6: E_g(T) = E_g(0) − αT²/(T + β). Coefficients: Vurgaftman I., Meyer J. R., Ram-Mohan L. R. (2001). " +
  "Band parameters for III–V compound semiconductors and their alloys. J. Appl. Phys. 89, 5815, doi:10.1063/1.1368156 (" +
  "Ga₁₋ₓInₓAs bowing 0.477 eV); Si and Ge from Sze S. M., Physics of Semiconductor Devices, 2nd ed. (Wiley 1981), ch. 1. " +
  "Absorption edge λ = hc/E_g.";

const eg = (id: SemiconductorId) => ({ label: `${SEMICONDUCTOR_GAPS[id].name} band gap E_g`, unit: "eV", toSI: 1, siUnit: "eV" });
const edge = (id: SemiconductorId) => ({ label: `${SEMICONDUCTOR_GAPS[id].name} absorption edge hc/E_g`, unit: "nm", toSI: 1e-9, siUnit: "m" });

export default defineSchema({
  href: "/materials/semiconductor-bandgap",
  inputs: [
    { key: "temperature", label: "Temperature", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 10, max: 700 },
  ],
  outputs: [
    { key: "egGaAs", ...eg("GaAs") }, { key: "edgeGaAs", ...edge("GaAs") },
    { key: "egInP", ...eg("InP") }, { key: "edgeInP", ...edge("InP") },
    { key: "egGaP", ...eg("GaP") }, { key: "edgeGaP", ...edge("GaP") },
    { key: "egSi", ...eg("Si") }, { key: "edgeSi", ...edge("Si") },
    { key: "egGe", ...eg("Ge") }, { key: "edgeGe", ...edge("Ge") },
    { key: "egInAs", ...eg("InAs") }, { key: "edgeInAs", ...edge("InAs") },
    { key: "egGaSb", ...eg("GaSb") }, { key: "edgeGaSb", ...edge("GaSb") },
    { key: "egInSb", ...eg("InSb") }, { key: "edgeInSb", ...edge("InSb") },
    { key: "egGaN", ...eg("GaN") }, { key: "edgeGaN", ...edge("GaN") },
    { key: "egInGaAs", ...eg("InGaAs") }, { key: "edgeInGaAs", ...edge("InGaAs") },
  ],
  compute({ temperature }) {
    const values: Record<string, number> = {};
    for (const id of IDS) {
      const gap = SEMICONDUCTOR_GAPS[id].bandGap(temperature);
      values[`eg${id}`] = gap;
      values[`edge${id}`] = cutoffWavelength(gap);
    }
    const indirect = IDS.filter((id) => !SEMICONDUCTOR_GAPS[id].direct).map((id) => SEMICONDUCTOR_GAPS[id].name);
    return {
      values: values as never,
      warnings: [`${indirect.join(", ")}: indirect gap (GaP: its X gap), so absorption near the edge is weak.`],
    };
  },
  checks: [
    {
      // GaAs at 300 K: 1.519 − 5.405e-4 · 300²/(300 + 204) = 1.4224821 eV; edge hc/E_g = 1239.8419843/1.4224821 = 871.60460 nm.
      // Si: 1.17 − 4.73e-4 · 300²/(300 + 636) = 1.1245192 eV, 1102.5529 nm.
      source: VARSHNI_REF,
      basis: "computed",
      inputs: { temperature: 300 },
      expect: { egGaAs: 1.4224821428571428, edgeGaAs: 871.6046036554833, egSi: 1.1245192307692307, edgeSi: 1102.5529403208916 },
      tolerance: 1e-8,
    },
    {
      // GaAs at 77 K: 1.519 − 5.405e-4 · 77²/(77 + 204) = 1.5075956 eV, 822.39690 nm.
      source: VARSHNI_REF,
      basis: "computed",
      inputs: { temperature: 77 },
      expect: { egGaAs: 1.5075956423487544, edgeGaAs: 822.3969010685081 },
      tolerance: 1e-8,
    },
    {
      // In₀.₅₃Ga₀.₄₇As at 300 K: 0.47 · E_g(GaAs) + 0.53 · E_g(InAs) − 0.53 · 0.47 · 0.477 = 0.7372567 eV, edge 1681.6965 nm.
      source: VARSHNI_REF,
      basis: "computed",
      inputs: { temperature: 300 },
      expect: { egInGaAs: 0.7372566705016357, edgeInGaAs: 1681.6965297694812 },
      tolerance: 1e-8,
    },
  ],
});
