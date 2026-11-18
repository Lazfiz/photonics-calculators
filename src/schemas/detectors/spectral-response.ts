import { REFERENCE_WAVELENGTH_NM, spectralResponseSummary } from "../../physics/detectors/spectral-response";
import { defineSchema } from "../types";

const REFS =
  "Gärtner W. W. (1959). Depletion-layer photoeffects in semiconductors. Phys. Rev. 116, 84–87, doi:10.1103/PhysRev.116.84: η = (1 − R)·[1 − e^(−αW)/(1 + αL)]; " +
  "α = 4π·k/λ from Green M. A. (2008). Self-consistent optical parameters of intrinsic silicon at 300 K including temperature coefficients. " +
  "Sol. Energy Mater. Sol. Cells 92, 1305–1310, doi:10.1016/j.solmat.2008.06.009, Table 1 (ln k interpolated linearly between the 10 nm nodes); " +
  "ℛ = η·q·λ/(h·c) (Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley, doi:10.1002/0470068329, ch. 13).";

const GRID = "250–1450 nm grid in 5 nm steps";
const noShort = `The short-wavelength half-response edge lies outside the ${GRID} (the response is already below half its peak at 250 nm), so it cannot be located.`;
const noLong = `The long-wavelength half-response edge lies outside the ${GRID} (the response is still above half its peak at 1450 nm), so it cannot be located.`;

export default defineSchema({
  href: "/detectors/spectral-response",
  inputs: [
    { key: "thickness", label: "Depletion width W", unit: "µm", toSI: 1e-6, siUnit: "m", default: 20, min: 0.5, max: 500 },
    { key: "diffusionLength", label: "Substrate diffusion length L (0 = none)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 100, min: 0, max: 1000 },
    { key: "reflectance", label: "Surface reflectance R", unit: "", toSI: 1, siUnit: "", default: 0.05, min: 0, max: 0.5 },
    { key: "measuredResponsivity", label: "Datasheet responsivity", unit: "A/W", toSI: 1, siUnit: "A/W", default: 0.6, min: 0, max: 10 },
    { key: "measuredWavelength", label: "Wavelength of the datasheet value", unit: "nm", toSI: 1e-9, siUnit: "m", default: 900, min: 200, max: 2000 },
  ],
  outputs: [
    { key: "peakResponsivity", label: `Peak responsivity (${GRID})`, unit: "A/W", toSI: 1, siUnit: "A/W" },
    { key: "peakWavelength", label: "Wavelength of the peak responsivity", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "peakQe", label: "QE at the peak responsivity", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "halfShort", label: "Short-wavelength half-response edge", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "halfLong", label: "Long-wavelength half-response edge", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "responsivity650", label: `Responsivity at ${REFERENCE_WAVELENGTH_NM} nm`, unit: "A/W", toSI: 1, siUnit: "A/W" },
    { key: "qe650", label: `QE at ${REFERENCE_WAVELENGTH_NM} nm`, unit: "%", toSI: 0.01, siUnit: "" },
    { key: "impliedQe", label: "Quantum efficiency implied by the datasheet responsivity", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ thickness, diffusionLength, reflectance, measuredResponsivity, measuredWavelength }) {
    const r = spectralResponseSummary({
      W: thickness, L: diffusionLength, reflectance, measuredResponsivity, measuredWavelength,
    });
    const warnings: string[] = [];
    const reasons: Record<string, string> = {};
    if (!Number.isFinite(r.halfShortNm)) reasons.halfShort = noShort;
    if (!Number.isFinite(r.halfLongNm)) reasons.halfLong = noLong;
    if (r.impliedQe > 1) {
      warnings.push("The datasheet responsivity implies a quantum efficiency above 100%: impossible without internal gain (APD, PMT).");
    }
    return {
      values: {
        peakResponsivity: r.peakResponsivity,
        peakWavelength: r.peakWavelengthNm * 1e-9,
        peakQe: r.peakQe,
        halfShort: r.halfShortNm * 1e-9,
        halfLong: r.halfLongNm * 1e-9,
        responsivity650: r.responsivity650,
        qe650: r.qe650,
        impliedQe: r.impliedQe,
      },
      reasons,
      warnings: warnings.length ? warnings : undefined,
    };
  },
  checks: [
    {
      // Defaults W = 20 µm, L = 100 µm, R = 0.05, datasheet 0.6 A/W at 900 nm. k from Green's nodes (ln k linear in between), α = 4π·k/λ,
      // η = 0.95·(1 − e^(−αW)/(1 + αL)), ℛ = η·q·λ/(h·c) on the 5 nm grid 250–1450 nm: peak ℛ = 0.6159853044 A/W at 850 nm;
      // half level ℛ_peak/2 crossed (linear interpolation of ℛ) at 401.96023 nm and 1010.74844 nm; ℛ(650) = 0.4979823127 A/W (η = 0.9498759673);
      // implied η = 0.6·h·c/(q·900e-9) = 0.8265613229.
      source: REFS,
      basis: "computed",
      inputs: {},
      expect: {
        peakResponsivity: 0.6159853044045609, peakWavelength: 850, halfShort: 401.9602327012123, halfLong: 1010.7484350682743,
        responsivity650: 0.4979823126864359, qe650: 94.98759672667546, impliedQe: 82.65613228880018,
      },
      tolerance: 1e-8,
    },
    {
      // Slab absorber W = 5 µm, L = 0, R = 0.1, datasheet 0.45 A/W at 800 nm: η = 0.9·(1 − e^(−αW)); same grid scan: peak ℛ = 0.3848202284 A/W at 570 nm,
      // half-response edges 265.06460 nm and 807.07932 nm, ℛ(650) = 0.3548939552 A/W (η = 0.6769421933), implied η = 0.45·h·c/(q·800e-9) = 0.6974111161.
      source: REFS,
      basis: "computed",
      inputs: { thickness: 5, diffusionLength: 0, reflectance: 0.1, measuredResponsivity: 0.45, measuredWavelength: 800 },
      expect: {
        peakResponsivity: 0.3848202283947166, peakWavelength: 570, halfShort: 265.06459754666656, halfLong: 807.0793206983499,
        responsivity650: 0.3548939552015292, qe650: 67.69421932992259, impliedQe: 69.74111161867515,
      },
      tolerance: 1e-8,
    },
  ],
});
