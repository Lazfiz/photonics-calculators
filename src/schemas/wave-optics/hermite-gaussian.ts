import { beamRadius, rayleighRange } from "../../physics/wave-optics/gaussian-beam";
import {
  hgSecondMomentRadius, lgSecondMomentRadius, modeGouyPhase, peakIntensityPerWatt,
} from "../../physics/wave-optics/higher-order-modes";
import { defineSchema } from "../types";

const MAX_INDEX = 10;

const SOURCE =
  "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567, doi:10.1364/AO.5.001550 (HG modes, Gouy phase " +
  "(m + n + 1) arctan(z/z_R)); Carter W. H. (1980). Appl. Opt. 19, 1027, doi:10.1364/AO.19.001027 (second-moment width W = w√(2m + 1)); " +
  "Phillips R. L., Andrews L. C. (1983). Appl. Opt. 22, 643, doi:10.1364/AO.22.000643 (LG second-moment radius w√(2p + |l| + 1))";

export default defineSchema({
  href: "/wave-optics/hermite-gaussian",
  inputs: [
    { key: "wavelength", label: "Wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 11000 },
    { key: "waist", label: "Waist radius w₀ of the TEM₀₀ beam", unit: "µm", toSI: 1e-6, siUnit: "m", default: 50, min: 1, max: 1e5 },
    { key: "z", label: "Distance from the waist z", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: -1e5, max: 1e5 },
    { key: "power", label: "Power in the mode", unit: "mW", toSI: 1e-3, siUnit: "W", default: 1, min: 1e-6, max: 1e9 },
    { key: "m", label: "Mode index m along x (family hg)", unit: "", toSI: 1, siUnit: "", default: 2, min: 0, max: MAX_INDEX },
    { key: "n", label: "Mode index n along y (family hg)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0, max: MAX_INDEX },
    { key: "p", label: "Radial index p (family lg)", unit: "", toSI: 1, siUnit: "", default: 0, min: 0, max: MAX_INDEX },
    { key: "l", label: "Azimuthal index l (family lg)", unit: "", toSI: 1, siUnit: "", default: 1, min: -MAX_INDEX, max: MAX_INDEX },
  ],
  choices: [
    {
      key: "family",
      label: "Mode family",
      options: [
        { value: "hg", label: "Hermite-Gaussian TEMmn (rectangular)" },
        { value: "lg", label: "Laguerre-Gaussian LGpl (circular, OAM)" },
      ],
      default: "hg",
    },
  ],
  outputs: [
    { key: "order", label: "Mode order N (m + n, or 2p + |l|)", unit: "", toSI: 1, siUnit: "" },
    { key: "rayleighRange", label: "Rayleigh range z_R", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "beamRadius", label: "TEM₀₀ radius w(z) at the plane", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "secondMomentRadiusX", label: "Second-moment radius W along x", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "secondMomentRadiusY", label: "Second-moment radius W along y", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "m2x", label: "Beam quality M² along x", unit: "", toSI: 1, siUnit: "" },
    { key: "m2y", label: "Beam quality M² along y", unit: "", toSI: 1, siUnit: "" },
    { key: "gouyPhase", label: "Gouy phase (N + 1) arctan(z/z_R)", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "peakIntensity", label: "Peak intensity at z", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
  ],
  validate({ m, n, p, l }) {
    if (![m, n, p, l].every(Number.isInteger)) return "The mode indices m, n, p and l must be whole numbers.";
    return undefined;
  },
  compute({ family, wavelength, waist, z, power, m, n, p, l }) {
    const lg = family === "lg";
    const beam = { lambda: wavelength, w0: waist };
    const zR = rayleighRange(beam);
    const w = beamRadius(beam, z);
    const order = lg ? 2 * p + Math.abs(l) : m + n;
    const Wx = lg ? lgSecondMomentRadius(p, l, w) : hgSecondMomentRadius(m, w);
    const Wy = lg ? Wx : hgSecondMomentRadius(n, w);
    const M2x = lg ? order + 1 : 2 * m + 1;
    const M2y = lg ? M2x : 2 * n + 1;
    const ext = 1.2 * Math.max(Wx, Wy) + 0.8 * w; // the page's plotting extent, just past the outermost lobe
    return {
      values: {
        order,
        rayleighRange: zR,
        beamRadius: w,
        secondMomentRadiusX: Wx,
        secondMomentRadiusY: Wy,
        m2x: M2x,
        m2y: M2y,
        gouyPhase: modeGouyPhase(order, z, zR),
        peakIntensity: peakIntensityPerWatt(lg ? "lg" : "hg", m, n, p, l, w, ext) * power,
      },
      warnings: [],
    };
  },
  checks: [
    {
      // HG₂₁ at the defaults: z_R = π w₀²/λ = π (50 µm)²/1.55 µm = 5.0670849251 mm, w(z) = w₀√(1 + (z/z_R)²) = 70.2441558922 µm (z = 5 mm),
      // W_x = w√(2m + 1) = w√5 = 157.0707076 µm, W_y = w√3 = 121.6664469 µm, M²_x = 5, M²_y = 3,
      // Gouy phase (m + n + 1) arctan(z/z_R) = 4 arctan(0.98684) = 3.1149378940 rad.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        order: 3, rayleighRange: 5.067084925144828, beamRadius: 70.24415589219623, secondMomentRadiusX: 157.07070759704317,
        secondMomentRadiusY: 121.66644694007259, m2x: 5, m2y: 3, gouyPhase: 3.1149378939737593,
      },
      tolerance: 1e-8,
    },
    {
      // LG₁^−2 at 1064 nm, w₀ = 100 µm, z = −20 mm: z_R = 29.5262467443 mm, w = 120.7816719071 µm, N = 2p + |l| = 4,
      // W = w√(2p + |l| + 1) = w√5 = 270.0760288 µm, M² = N + 1 = 5, Gouy (N + 1) arctan(z/z_R) = 5 arctan(−0.677338) = −2.9768577309 rad.
      source: SOURCE,
      basis: "computed",
      inputs: { family: "lg", wavelength: 1064, waist: 100, z: -20, p: 1, l: -2 },
      expect: {
        order: 4, rayleighRange: 29.526246744264967, beamRadius: 120.781671907083, secondMomentRadiusX: 270.07602882031426,
        m2x: 5, m2y: 5, gouyPhase: -2.9768577309232818,
      },
      tolerance: 1e-8,
    },
    {
      // TEM₀₀ (m = n = 0), 2 mW at the defaults: peak intensity 2P/(π w²) = 2 · 2e-3/(π (70.2441559e-6)²) = 25.804159788 W/cm²
      // (the scan includes the axis point, where the profile peaks); Gouy arctan(z/z_R) = 0.7787344735 rad.
      source: SOURCE,
      basis: "computed",
      inputs: { m: 0, n: 0, power: 2 },
      expect: { peakIntensity: 25.804159788083627, gouyPhase: 0.7787344734934398 },
      tolerance: 1e-8,
    },
  ],
});
