import { type HologramMethod, SUPERPIXEL_ENUMERATED, dmdHologram, leeFields, superpixelFields } from "../../physics/spatial-light-modulators/dmd-holography";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const GOORDEN = "Goorden S. A., Bertolotti J., Mosk A. P. (2014). Superpixel-based spatial amplitude and phase modulation using a " +
  "digital micromirror device. Opt. Express 22(15), 17999–18009, Secs. 2 and 4: n = 4, λ = 633 nm, f₁ = 300 mm, d = 13.68 µm puts " +
  "the aperture at (−0.87, 3.47) mm; 6561 fields; efficiency 10.3 %. https://doi.org/10.1364/OE.22.017999";
const GUTIERREZ = "Gutiérrez-Cuevas R., Popoff S. M. (2024). Binary amplitude holograms for shaping complex light fields with digital " +
  "micromirror devices. J. Phys. Photonics 6, 045022, Eqs. 15 and 22 (numbering of arXiv:2311.16685v1): diffraction efficiency " +
  "1/π² = 10.1 % for an even period. https://doi.org/10.1088/2515-7647/ad8617";

export default defineSchema({
  href: "/spatial-light-modulators/dmd-holography",
  choices: [
    {
      key: "method",
      label: "Encoding method",
      options: [
        { value: "superpixel", label: "Superpixel (Goorden 2014)" },
        { value: "lee-parallel", label: "Parallel Lee" },
        { value: "lee-orthogonal", label: "Orthogonal Lee" },
      ],
      default: "superpixel",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 633, min: 200, max: 2500 },
    { key: "pitch", label: "Micromirror pitch d", unit: "µm", toSI: 1e-6, siUnit: "m", default: 13.68, min: 1, max: 50 },
    { key: "focal", label: "Focal length f₁ of the first lens", unit: "mm", toSI: 1e-3, siUnit: "m", default: 300, min: 1, max: 5000 },
    { key: "columns", label: "Mirrors across (x)", unit: "", toSI: 1, siUnit: "", default: 1024, min: 64, max: 8192 },
    { key: "rows", label: "Mirrors down (y)", unit: "", toSI: 1, siUnit: "", default: 768, min: 64, max: 8192 },
    { key: "period", label: "Lee carrier period p (whole pixels)", unit: "", toSI: 1, siUnit: "", default: 4, min: 2, max: 64 },
    { key: "superpixel", label: "Superpixel side n (whole pixels)", unit: "", toSI: 1, siUnit: "", default: 4, min: 2, max: 8 },
    { key: "rate", label: "Binary pattern rate of the DMD", unit: "Hz", toSI: 1, siUnit: "Hz", default: 32552, min: 1, max: 100000 },
  ],
  outputs: [
    { key: "efficiency", label: "Most power in the filtered order, flat pixels of 100 % fill (fraction of the incident power)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "phasorEfficiency", label: "The same without the pixel envelope (Goorden's phasor-sum convention)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "envelope", label: "Pixel envelope sinc²(πνx) sinc²(πνy) at the aperture centre", unit: "", toSI: 1, siUnit: "" },
    { key: "phaseStepX", label: "Phase step between neighbouring pixels along x", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "phaseStepY", label: "Phase step between neighbouring pixels along y", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "carrierPeriod", label: "Lee carrier period p d", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "apertureX", label: "Aperture centre from the zero order, along x (−λf₁ν; superpixel signs as Goorden et al. print them)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "apertureY", label: "Aperture centre from the zero order, along y", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "apertureRadius", label: "Largest aperture radius", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "finestPeriod", label: "Finest target period that aperture passes", unit: "px", toSI: 1, siUnit: "" },
    { key: "cells", label: "Cells (p × p) or superpixels (n × n) on the array", unit: "", toSI: 1, siUnit: "" },
    { key: "values", label: "Distinct complex values one cell can encode", unit: "", toSI: 1, siUnit: "" },
    { key: "fourierPeriod", label: "Spacing of the pixel-grid orders λf₁/d", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "spotX", label: "Fourier-plane resolution along x, λf₁/(N d)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "spotY", label: "Fourier-plane resolution along y, λf₁/(N d)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "hologramRate", label: "Holograms per second (one binary pattern each)", unit: "Hz", toSI: 1, siUnit: "Hz" },
  ],
  compute({ method, wavelength, pitch, focal, columns, rows, period, superpixel, rate }) {
    const m: HologramMethod = method === "lee-parallel" || method === "lee-orthogonal" ? method : "superpixel";
    const p = Math.round(period), n = Math.round(superpixel);
    const r = dmdHologram({ method: m, lambda: wavelength, pitch, focal, columns: Math.round(columns), rows: Math.round(rows), period: p, superpixel: n });
    const values = m === "superpixel" ? superpixelFields(n).length : leeFields(p, m).length;
    const warnings: string[] = [];
    const reasons: Partial<Record<"carrierPeriod" | "values", string>> = {};
    if (m === "superpixel") {
      reasons.carrierPeriod = "The superpixel method has no carrier grating: the aperture offset sets the phase steps (2π/n² along x, 2π/n along y).";
      if (n > SUPERPIXEL_ENUMERATED) reasons.values = `Fields are counted by trying every pixel pattern (2^(n²)); that is done only up to n = ${SUPERPIXEL_ENUMERATED}.`;
    }
    return {
      values: {
        efficiency: r.efficiency, phasorEfficiency: r.phasorEfficiency, envelope: r.envelope, phaseStepX: r.phaseStepX, phaseStepY: r.phaseStepY, carrierPeriod: r.carrierPeriod,
        apertureX: r.apertureX, apertureY: r.apertureY, apertureRadius: r.apertureRadius, finestPeriod: r.finestPeriod,
        cells: r.cells, values: values > 0 ? values : NaN, fourierPeriod: r.fourierPeriod, spotX: r.spotX, spotY: r.spotY,
        hologramRate: rate,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Sec. 2: aperture at (−0.87, 3.47) mm and 6561 fields for n = 4; Sec. 4: calculated efficiency 10.3 %.
      source: GOORDEN,
      basis: "printed",
      inputs: {},
      expect: { apertureX: -0.87, apertureY: 3.47, values: 6561, phasorEfficiency: 10.3 },
      tolerance: 0.005,
    },
    {
      // After Eq. 22: an even period gives ηd = 1/π² = 10.1 % (Eq. 15).
      source: GUTIERREZ,
      basis: "printed",
      inputs: { method: "lee-parallel", period: 4 },
      expect: { efficiency: 10.1, phaseStepX: 90 },
      tolerance: 0.005,
    },
    {
      // Odd p = 3: sin²(π/3)/π² = 0.75/π² = 7.599 %; the order at λf₁/(3d) = 633 nm · 300 mm/(3 · 13.68 µm) = 4.6272 mm,
      // the aperture radius half that, 2.3136 mm.
      source: GUTIERREZ,
      basis: "computed",
      inputs: { method: "lee-parallel", period: 3 },
      expect: { efficiency: 7.5991, apertureX: -4.6272, apertureRadius: 2.3136, finestPeriod: 6 },
      tolerance: 1e-4,
    },
    {
      // n = 4 with the flat-pixel envelope at the aperture (ν = 1/16, 1/4 cycles per pixel), derived from Goorden Sec. 4:
      // sinc²(π/16) sinc²(π/4) = 0.987218 × 0.810569 = 0.800206; 10.26334 % × 0.800206 = 8.21279 %.
      source: GOORDEN,
      basis: "computed",
      inputs: {},
      expect: { envelope: 0.800206, efficiency: 8.21279 },
      tolerance: 1e-5,
    },
  ],
});
