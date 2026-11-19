import { CONFOCAL_MAX_PINHOLE_AU, SPINNING_DISK_MAX_PITCH_AU } from "../../physics/imaging/confocal";
import { SPINNING_DISK_BANDING_LIMIT, SPINNING_DISK_WILHELM_MIN_AU, spinningDiskSummary } from "../../physics/imaging/spinning-disk";
import { defineSchema } from "../types";

const WILHELM = "Wilhelm S., Gröbler B., Gluch M., Heinz H. (2003). Confocal Laser Scanning Microscopy: Principles. " +
  "Carl Zeiss (Airy unit 1.22 λ/NA, pinhole size in Airy units, geometric optical-section formula for pinholes of at least 1 AU).";
const BORN_WOLF = "Born M., Wolf E. (2019). Principles of Optics, 7th ed., Cambridge University Press, https://doi.org/10.1017/9781108769914, §8.5.2 (Airy pattern " +
  "and its encircled energy 1 − J₀²(v) − J₁²(v)); first zero of J₁ j₁,₁ = 3.8317 from Abramowitz M., Stegun I. A. (1964), " +
  "Handbook of Mathematical Functions, Table 9.5.";
const TANAAMI = "Tanaami T., Otsuki S., Tomosada N., Kosugi Y., Shimizu M., Ishida H. (2002). High-speed 1-frame/ms scanning confocal microscope with a " +
  "microlens and Nipkow disks. Appl. Opt. 41, 4704–4708, https://doi.org/10.1364/AO.41.004704 (frame rate = rev/s × scans per revolution; the open area π d²/(4 s²) of a square lattice is geometry).";

const NO_TABLE = `pinhole larger than ${CONFOCAL_MAX_PINHOLE_AU} AU: outside the tabulated 0–${CONFOCAL_MAX_PINHOLE_AU} AU confocal model`;
const NO_WILHELM = `Wilhelm's geometric formula holds only for pinholes of ${SPINNING_DISK_WILHELM_MIN_AU} Airy unit or more.`;
const TOO_BIG = "the pinhole diameter exceeds the pitch: the holes would overlap, so the open area, the crosstalk floor and the disk section are not defined";
const WIDE = `pitch above ${SPINNING_DISK_MAX_PITCH_AU} AU: only the crosstalk floor is computed, not the disk section FWHM`;
const FLOOR_HIGH = "the crosstalk floor is half the in-focus signal or more, so the response has no half width";

export default defineSchema({
  href: "/imaging/spinning-disk",
  inputs: [
    { key: "na", label: "NA", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0.1, max: 1.7 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 488, min: 300, max: 2000 },
    { key: "n", label: "Refractive index (n)", unit: "", toSI: 1, siUnit: "", default: 1.33, min: 1, max: 1.8 },
    { key: "magnification", label: "Magnification to the disk", unit: "", toSI: 1, siUnit: "", default: 60, min: 10, max: 150 },
    { key: "pinholeDiam", label: "Pinhole diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 50, min: 5, max: 200 },
    { key: "pinholePitch", label: "Pinhole pitch", unit: "µm", toSI: 1e-6, siUnit: "m", default: 250, min: 20, max: 1000 },
    { key: "diskRPM", label: "Disk speed", unit: "RPM", toSI: 1 / 60, siUnit: "Hz", default: 5000, min: 0, max: 15000 },
    { key: "scansPerRev", label: "Field scans per revolution", unit: "", toSI: 1, siUnit: "", default: 12, min: 1, max: 36 },
    { key: "cameraExposure", label: "Camera exposure", unit: "ms", toSI: 1e-3, siUnit: "s", default: 100, min: 0.01, max: 10000 },
  ],
  outputs: [
    { key: "airyObject", label: "Airy unit at the sample, 1.22 λ/NA", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "pinholeAU", label: "Pinhole size", unit: "AU", toSI: 1, siUnit: "" },
    { key: "pitchAU", label: "Pinhole pitch", unit: "AU", toSI: 1, siUnit: "" },
    { key: "throughput", label: "Pinhole throughput (in focus)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "lateral", label: "Lateral FWHM", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "section", label: "Optical section FWHM", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "wilhelm", label: "Wilhelm geometric section FWHM (≥ 1 AU)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "diskSection", label: "Optical section FWHM, disk with crosstalk", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "floor", label: "Crosstalk floor (plane far out of focus)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "frameRate", label: "Frame rate (full-field scans)", unit: "fps", toSI: 1, siUnit: "1/s" },
    { key: "fill", label: "Open area of the disk", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "illuminated", label: "Illuminated time per point", unit: "ms", toSI: 1e-3, siUnit: "s" },
    { key: "scansPerExposure", label: "Scans per exposure", unit: "", toSI: 1, siUnit: "" },
  ],
  validate({ na, n }) {
    if (!(na < n)) return `NA ${na} is not possible in a medium of n = ${n}: NA = n sin α must stay below n.`;
    return undefined;
  },
  compute({ na, wavelength, n, magnification, pinholeDiam, pinholePitch, diskRPM, scansPerRev, cameraExposure }) {
    const s = spinningDiskSummary({
      lambda: wavelength, NA: na, n, magnification, pinholeDiameter: pinholeDiam, pitch: pinholePitch,
      revPerSecond: diskRPM, scansPerRevolution: scansPerRev, exposure: cameraExposure,
    });
    const warnings: string[] = [];
    if (s.banding) {
      warnings.push(
        s.scansPerExposure === 0
          ? `No full-field scan completes during the exposure: expect stripes (banding) deeper than ${SPINNING_DISK_BANDING_LIMIT * 100} %.`
          : `The exposure is not a whole number of scans (${s.scansPerExposure.toFixed(2)}): expect stripes (banding) deeper than ${SPINNING_DISK_BANDING_LIMIT * 100} %.`,
      );
    }
    if (s.pinholeTooBig) warnings.push(`The pinhole diameter exceeds the pitch: ${TOO_BIG}.`);
    const reasons: Record<string, string> = {};
    if (!(s.pinholeAU <= CONFOCAL_MAX_PINHOLE_AU)) {
      reasons.lateral = NO_TABLE;
      reasons.section = NO_TABLE;
    }
    if (!(s.pinholeAU >= SPINNING_DISK_WILHELM_MIN_AU)) reasons.wilhelm = NO_WILHELM;
    if (s.pinholeTooBig) {
      for (const k of ["diskSection", "floor", "fill", "illuminated"]) reasons[k] = TOO_BIG;
    } else if (s.widePitch) {
      reasons.diskSection = WIDE;
    } else if (!Number.isFinite(s.diskSection)) {
      reasons.diskSection = FLOOR_HIGH;
    }
    return {
      values: {
        airyObject: s.airyObject,
        pinholeAU: s.pinholeAU,
        pitchAU: s.pitchAU,
        throughput: s.throughput,
        lateral: s.lateral,
        section: s.section,
        wilhelm: s.wilhelm,
        diskSection: s.diskSection,
        floor: s.floor,
        frameRate: s.frameRate,
        fill: s.fill,
        illuminated: s.illuminated,
        scansPerExposure: s.scansPerExposure,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // 488 nm, NA 0.8, M 60, d 50 µm, pitch 250 µm: 1 AU = 1.22 · 488/0.8 = 744.2 nm; d/M = 0.833333 µm → 1.119770670966586 AU;
      // pitch 250/60 = 4.166667 µm → 5.59885335483293 AU. Frame rate 5000/60 · 12 = 1000 fps; 100 ms → 100 scans exactly.
      // Open area π·50²/(4·250²) = π/100 = 3.141592653589794 %; lit time 0.0314159 · 100 ms = 3.1415926535897936 ms.
      source: WILHELM + " " + TANAAMI,
      basis: "computed",
      inputs: {},
      expect: {
        airyObject: 744.2, pinholeAU: 1.119770670966586, pitchAU: 5.59885335483293, frameRate: 1000,
        fill: 3.141592653589794, illuminated: 3.1415926535897936, scansPerExposure: 100,
      },
      tolerance: 1e-8,
    },
    {
      // v = j₁,₁ · 1.119770670966586; 1 − J₀²(v) − J₁²(v) = 0.8399959040187801 (J₀, J₁ from power series, independent script).
      source: BORN_WOLF,
      basis: "computed",
      inputs: {},
      expect: { throughput: 83.99959040187801 },
      tolerance: 1e-8,
    },
    {
      // n 1.33, NA 0.8: Δ = n − √(n² − NA²); hypot(0.88589 λ/Δ, √2 n PH/NA) with PH = 1.119770670966586 · 744.2 nm = 833.3333333 nm → FWHM 2539.8010294 nm
      // (0.88589 = 2·1.391557/π in place of Wilhelm's printed 0.88).
      source: WILHELM,
      basis: "computed",
      inputs: {},
      expect: { wilhelm: 2539.8010294006313 },
      tolerance: 1e-8,
    },
  ],
});
