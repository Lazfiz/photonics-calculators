import { accumulatedDispersion, residualSlope } from "../../physics/fiber-optics/dispersion-comp";
import { defineSchema } from "../types";

const SOURCE = "Hand calculation from D_acc = D·L and S_res = S·L + S_c·L_c (linear dispersion model; Agrawal G. P., " +
  "Fiber-Optic Communication Systems, Wiley, dispersion management), as in src/physics/fiber-optics/dispersion-comp.ts and tests/fiber-dispersion-comp.test.ts.";

export default defineSchema({
  href: "/fiber-optics/dispersion-map",
  inputs: [
    { key: "lengthSMF", label: "SMF length", unit: "km", toSI: 1e3, siUnit: "m", default: 80, min: 0, max: 500 },
    { key: "dispSMF", label: "SMF dispersion D", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²", default: 17, min: -30, max: 30 },
    { key: "slopeSMF", label: "SMF dispersion slope S", unit: "ps/(nm²·km)", toSI: 1e3, siUnit: "s/m³", default: 0.056, min: -1, max: 1 },
    { key: "lengthDCF", label: "DCF length", unit: "km", toSI: 1e3, siUnit: "m", default: 15, min: 0, max: 100 },
    { key: "dcfDispersion", label: "DCF dispersion D", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²", default: -100, min: -1000, max: 1000 },
    { key: "dcfSlope", label: "DCF dispersion slope S", unit: "ps/(nm²·km)", toSI: 1e3, siUnit: "s/m³", default: -0.2, min: -20, max: 20 },
    { key: "wavelength", label: "Reference wavelength (where D, S are given)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 1530, max: 1629 },
  ],
  outputs: [
    { key: "netDispersion", label: "Net accumulated dispersion at the reference wavelength", unit: "ps/nm", toSI: 1e-3, siUnit: "s/m" },
    { key: "totalDispSMF", label: "SMF accumulated dispersion", unit: "ps/nm", toSI: 1e-3, siUnit: "s/m" },
    { key: "totalDispDCF", label: "DCF accumulated dispersion", unit: "ps/nm", toSI: 1e-3, siUnit: "s/m" },
    { key: "residualSlope", label: "Residual dispersion slope", unit: "ps/nm²", toSI: 1e6, siUnit: "s/m²" },
  ],
  // The reference wavelength only places the marker on the page's chart; the net dispersion there is D·L summed.
  compute({ lengthSMF, dispSMF, slopeSMF, lengthDCF, dcfDispersion, dcfSlope }) {
    const smf = { D: dispSMF, S: slopeSMF };
    const dcf = { D: dcfDispersion, S: dcfSlope };
    const totalDispSMF = accumulatedDispersion(smf, lengthSMF);
    const totalDispDCF = accumulatedDispersion(dcf, lengthDCF);
    const warnings: string[] = [];
    if (dcfDispersion * dispSMF > 0) warnings.push("The DCF dispersion has the same sign as the span's, so the DCF adds dispersion instead of compensating it.");
    return {
      values: {
        netDispersion: totalDispSMF + totalDispDCF,
        totalDispSMF,
        totalDispDCF,
        residualSlope: residualSlope(smf, lengthSMF, dcf, lengthDCF),
      },
      warnings,
    };
  },
  checks: [
    {
      // 80 km of G.652 (D = 17, S = 0.058) with the 13.6 km of DCF that nulls D at λ₀: S_res = 0.058·80 − 0.2·13.6 = 1.92 ps/nm².
      source: SOURCE,
      basis: "computed",
      inputs: { lengthSMF: 80, dispSMF: 17, slopeSMF: 0.058, lengthDCF: 13.6, dcfDispersion: -100, dcfSlope: -0.2 },
      expect: { residualSlope: 1.92, totalDispSMF: 1360, totalDispDCF: -1360 },
      tolerance: 1e-9,
    },
  ],
});
