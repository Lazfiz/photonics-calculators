/**
 * Confocal fluorescence microscope: pinhole size in Airy units, pinhole throughput, and the lateral, axial and
 * optical-section FWHM as functions of the pinhole diameter. SI units in and out. Model tier: textbook approximation.
 *
 * Scalar paraxial theory with equal excitation and emission wavelengths (no Stokes shift), uniformly filled pupil,
 * T. Wilson, C. J. R. Sheppard, Theory and Practice of Scanning Optical Microscopy (Academic Press, 1984);
 * T. Wilson, J. Microsc. 244, 113 (2011), doi:10.1111/j.1365-2818.2011.03549.x.
 * - Optical coordinates: v = 2π NA r/λ and u = 4π (n − √(n² − NA²)) z/λ, which is 2π NA² z/(nλ) at low NA. The
 *   high-NA axial scale is the one R. Wilhelm et al. use (Confocal Laser Scanning Microscopy: Principles, Carl Zeiss
 *   2003); it makes the widefield axial FWHM 0.886 λ/(n − √(n² − NA²)) (diffraction-psf module).
 * - Defocused amplitude PSF (Born & Wolf, Principles of Optics, §8.8):
 *     h(u, v) = 2 ∫₀¹ J₀(vρ) exp(−i u ρ²/2) ρ dρ,  |h(0, v)|² = [2J₁(v)/v]²,  |h(u, 0)|² = sinc²(u/4).
 * - A pinhole of P Airy units (object-side diameter P · 1.22 λ/NA) has the optical radius p = j₁,₁ · P.
 * - Lateral response to an in-focus point:  I(v) = |h(0, v)|² · ∫_pinhole |h(0, v − w)|² d²w.
 *   Axial response to an on-axis point:      I(u) = |h(u, 0)|² · ∫_pinhole |h(u, w)|² d²w.
 *   Optical section, thin uniform fluorescent plane:  S(u) = ∫ d²r |h(u, r)|² ∫_pinhole |h(u, r − w)|² d²w.
 *   The pinhole integral of a radial f centred at distance r from the pinhole centre is ∫₀^(p+r) f(ρ) θ(ρ) ρ dρ, θ the
 *   arc of the circle of radius ρ that lies inside the pinhole.
 * - Limits (tests): lateral 0.3693 λ/NA at P → 0 (Airy squared; Wilhelm's 0.37) and 0.5145 λ/NA at P → ∞ (Airy;
 *   Wilhelm's 0.51); axial 0.638 at P → 0 (sinc⁴; Wilhelm's 0.64) and 0.886 at P → ∞ (sinc²), in λ/(n − √(n² − NA²)).
 *   The section has no limit at P → ∞: a widefield microscope does not section.
 * The section integral takes about a second, so the pages interpolate CONFOCAL_FWHM_TABLE, which
 * `scripts/gen-confocal-table.ts` computes with confocalFwhmCoefficients; the tests recompute rows of it.
 * Wilhelm's geometric formula (optical-sectioning-thickness module) lies 40 % above this section at 1 AU, 25 % at 2 AU
 * (low NA), and up to about 140 % as the NA nears the immersion index.
 */
import { besselJ, firstCrossing } from "../math";
import { airyIntensity, BESSEL_J1_FIRST_ZERO, encircledEnergyAiry } from "./diffraction-psf";
import { airyUnit } from "./optical-sectioning-thickness";

/** Largest pinhole of the table, Airy units. */
export const CONFOCAL_MAX_PINHOLE_AU = 5;

export type ConfocalFwhmCoefficients = {
  /** Lateral FWHM / (λ/NA). */
  lateral: number;
  /** Axial FWHM of a point / (λ/(n − √(n² − NA²))). */
  axial: number;
  /** Optical-section FWHM of a thin plane / (λ/(n − √(n² − NA²))). */
  section: number;
};

/** Arc (rad) of the circle of radius ρ, centred at distance r from the pinhole centre, inside a pinhole of radius p. */
function arcInside(rho: number, r: number, p: number): number {
  if (rho + r <= p) return 2 * Math.PI;
  if (rho >= p + r || r >= p + rho) return 0;
  const c = (rho * rho + r * r - p * p) / (2 * rho * r);
  return 2 * Math.acos(Math.min(1, Math.max(-1, c)));
}

/** Radial grids: v midpoints on [0, V_MAX] for the defocused PSF, ρ midpoints on [0, 1] for the pupil integral. */
const V_MAX = 80;
const NV = 800;
const NRHO = 400;
const DV = V_MAX / NV;
const vGrid = Array.from({ length: NV }, (_, i) => (i + 0.5) * DV);
const rhoGrid = Array.from({ length: NRHO }, (_, j) => (j + 0.5) / NRHO);
let j0Table: Float64Array[] | null = null;

/** |h(u, v)|² on vGrid (midpoint rule in ρ). J₀(vρ) is tabulated on first use (≈ 1 s). */
function defocusedPsfRow(u: number): Float64Array {
  j0Table ??= vGrid.map((v) => Float64Array.from(rhoGrid, (rho) => besselJ(0, v * rho)));
  const wr = rhoGrid.map((rho) => (2 * rho * Math.cos((u * rho * rho) / 2)) / NRHO);
  const wi = rhoGrid.map((rho) => (-2 * rho * Math.sin((u * rho * rho) / 2)) / NRHO);
  return Float64Array.from(j0Table, (row) => {
    let re = 0;
    let im = 0;
    for (let j = 0; j < NRHO; j++) {
      re += row[j] * wr[j];
      im += row[j] * wi[j];
    }
    return re * re + im * im;
  });
}

/** In-focus lateral response I(v), not normalised; midpoint rule with 800 points on [0, p + v]. */
function lateralResponse(v: number, p: number): number {
  if (p === 0) return airyIntensity(v) ** 2;
  const n = 800;
  const h = (p + v) / n;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const rho = (i + 0.5) * h;
    s += airyIntensity(rho) * arcInside(rho, v, p) * rho;
  }
  return airyIntensity(v) * s * h;
}

/**
 * FWHM coefficients of a confocal microscope with a pinhole of `pinholeAU` Airy units, computed from the scalar
 * paraxial PSF (≈ 1 s; the pages use CONFOCAL_FWHM_TABLE). Half-maximum points by firstCrossing (sampled + bisection).
 * Grid: v ≤ 80 in steps of 0.1, 400 pupil points; within 0.05 % of a grid twice as fine (and of v ≤ 120) up to 5 AU.
 */
export function confocalFwhmCoefficients(pinholeAU: number): ConfocalFwhmCoefficients {
  const nan = { lateral: NaN, axial: NaN, section: NaN };
  if (!(pinholeAU >= 0 && pinholeAU <= CONFOCAL_MAX_PINHOLE_AU)) return nan;
  const p = BESSEL_J1_FIRST_ZERO * pinholeAU;

  const lat0 = lateralResponse(0, p);
  const vHalf = firstCrossing((v) => lateralResponse(v, p) / lat0, 0, 4, 0.5, 40);

  // Arc weights θ(ρ_b; v_a, p) ρ_b Δv for the pinhole integral centred at each v_a; row 0 doubles as the on-axis one.
  const arcs = p === 0 ? null : vGrid.map((r) => Float64Array.from(vGrid, (rho) => arcInside(rho, r, p) * rho * DV));
  const detected = (I: Float64Array, a: number) => {
    if (!arcs) return I[a]; // point pinhole: the detection PSF itself
    let d = 0;
    for (let b = 0; b < NV; b++) d += I[b] * arcs[a][b];
    return d;
  };
  const onAxis = (u: number) => {
    const I = defocusedPsfRow(u);
    if (!arcs) return I[0] * I[0];
    let d = 0;
    for (let b = 0; b < NV; b++) if (vGrid[b] - DV / 2 < p) d += I[b] * 2 * Math.PI * vGrid[b] * Math.min(DV, p - vGrid[b] + DV / 2);
    return I[0] * d;
  };
  const plane = (u: number) => {
    const I = defocusedPsfRow(u);
    let s = 0;
    for (let a = 0; a < NV; a++) s += I[a] * detected(I, a) * vGrid[a] * DV;
    return s;
  };
  const ax0 = onAxis(0);
  const uHalfAxial = firstCrossing((u) => onAxis(u) / ax0, 0, 16, 0.5, 32);
  const s0 = plane(0);
  const uHalfSection = firstCrossing((u) => plane(u) / s0, 0, 40, 0.5, 40);
  // FWHM = 2 × half-width; z = u λ/(4π (n − √(n² − NA²))) and r = v λ/(2π NA).
  return { lateral: vHalf / Math.PI, axial: uHalfAxial / (2 * Math.PI), section: uHalfSection / (2 * Math.PI) };
}

/**
 * [pinhole (AU), lateral, axial, section] at 0, 0.1, …, 5 AU, from confocalFwhmCoefficients
 * (`npx tsx scripts/gen-confocal-table.ts`).
 */
export const CONFOCAL_FWHM_TABLE: readonly (readonly [number, number, number, number])[] = [
  [0.0, 0.36933, 0.63784, 0.67693],
  [0.1, 0.37053, 0.63784, 0.67790],
  [0.2, 0.37418, 0.63792, 0.68138],
  [0.3, 0.38053, 0.63829, 0.68743],
  [0.4, 0.38988, 0.63929, 0.69650],
  [0.5, 0.40266, 0.64154, 0.70933],
  [0.6, 0.41913, 0.64588, 0.72664],
  [0.7, 0.43914, 0.65354, 0.75140],
  [0.8, 0.46147, 0.66581, 0.78385],
  [0.9, 0.48361, 0.68379, 0.82557],
  [1.0, 0.50205, 0.70754, 0.87742],
  [1.1, 0.51385, 0.73520, 0.93874],
  [1.2, 0.51808, 0.76301, 1.00645],
  [1.3, 0.51639, 0.78698, 1.07687],
  [1.4, 0.51213, 0.80502, 1.14652],
  [1.5, 0.50858, 0.81734, 1.21384],
  [1.6, 0.50753, 0.82559, 1.27917],
  [1.7, 0.50903, 0.83171, 1.34385],
  [1.8, 0.51195, 0.83727, 1.40900],
  [1.9, 0.51472, 0.84310, 1.47565],
  [2.0, 0.51616, 0.84922, 1.54349],
  [2.1, 0.51591, 0.85516, 1.61166],
  [2.2, 0.51452, 0.86030, 1.67938],
  [2.3, 0.51295, 0.86426, 1.74634],
  [2.4, 0.51208, 0.86704, 1.81247],
  [2.5, 0.51228, 0.86892, 1.87863],
  [2.6, 0.51330, 0.87035, 1.94526],
  [2.7, 0.51454, 0.87169, 2.01238],
  [2.8, 0.51535, 0.87312, 2.07984],
  [2.9, 0.51541, 0.87464, 2.14733],
  [3.0, 0.51480, 0.87611, 2.21439],
  [3.1, 0.51395, 0.87737, 2.28134],
  [3.2, 0.51335, 0.87833, 2.34838],
  [3.3, 0.51329, 0.87899, 2.41558],
  [3.4, 0.51375, 0.87947, 2.48300],
  [3.5, 0.51444, 0.87988, 2.55059],
  [3.6, 0.51498, 0.88031, 2.61805],
  [3.7, 0.51511, 0.88079, 2.68562],
  [3.8, 0.51482, 0.88130, 2.75332],
  [3.9, 0.51431, 0.88177, 2.82115],
  [4.0, 0.51387, 0.88216, 2.88910],
  [4.1, 0.51375, 0.88245, 2.95716],
  [4.2, 0.51397, 0.88265, 3.02502],
  [4.3, 0.51439, 0.88281, 3.09304],
  [4.4, 0.51478, 0.88297, 3.16116],
  [4.5, 0.51493, 0.88316, 3.22939],
  [4.6, 0.51479, 0.88338, 3.29778],
  [4.7, 0.51446, 0.88359, 3.36630],
  [4.8, 0.51414, 0.88377, 3.43464],
  [4.9, 0.51400, 0.88391, 3.50309],
  [5.0, 0.51410, 0.88402, 3.57154],
];

/** Linear interpolation of one table column at `pinholeAU` (0–5 AU), NaN outside. */
function tableCoefficient(pinholeAU: number, column: 1 | 2 | 3): number {
  const t = CONFOCAL_FWHM_TABLE;
  if (!(pinholeAU >= 0 && pinholeAU <= CONFOCAL_MAX_PINHOLE_AU) || t.length < 2) return NaN;
  const step = t[1][0] - t[0][0];
  const i = Math.min(Math.floor(pinholeAU / step), t.length - 2);
  const f = (pinholeAU - t[i][0]) / step;
  return t[i][column] + f * (t[i + 1][column] - t[i][column]);
}

const positive = (x: number) => Number.isFinite(x) && x > 0;
const validMedium = (lambda: number, n: number, NA: number) =>
  positive(lambda) && positive(NA) && Number.isFinite(n) && n >= 1 && NA < n;

/** n − √(n² − NA²), written as NA²/(n + √(n² − NA²)) to avoid cancellation at low NA. */
function axialDenominator(n: number, NA: number): number {
  return (NA * NA) / (n + Math.sqrt(n * n - NA * NA));
}

/** Pinhole size in Airy units: (pinhole diameter / total magnification) / (1.22 λ/NA). */
export function pinholeAiryUnits(pinholeDiameter: number, magnification: number, lambda: number, NA: number): number {
  if (!(Number.isFinite(pinholeDiameter) && pinholeDiameter >= 0 && positive(magnification))) return NaN;
  return pinholeDiameter / magnification / airyUnit(lambda, NA);
}

/** Fraction of an in-focus point's light that passes the pinhole: the Airy encircled energy at v = j₁,₁ · P. */
export function pinholeThroughput(pinholeAU: number): number {
  return Number.isFinite(pinholeAU) && pinholeAU >= 0 ? encircledEnergyAiry(BESSEL_J1_FIRST_ZERO * pinholeAU) : NaN;
}

/** Confocal lateral FWHM for a pinhole of 0–5 AU, m. */
export function confocalLateralFwhm(lambda: number, NA: number, pinholeAU: number): number {
  return positive(lambda) && positive(NA) ? (tableCoefficient(pinholeAU, 1) * lambda) / NA : NaN;
}

/** Confocal axial FWHM of a point object for a pinhole of 0–5 AU, m. */
export function confocalAxialFwhm(lambda: number, n: number, NA: number, pinholeAU: number): number {
  return validMedium(lambda, n, NA) ? (tableCoefficient(pinholeAU, 2) * lambda) / axialDenominator(n, NA) : NaN;
}

/** Confocal optical-section FWHM (thin fluorescent plane) for a pinhole of 0–5 AU, m. */
export function confocalOpticalSectionFwhm(lambda: number, n: number, NA: number, pinholeAU: number): number {
  return validMedium(lambda, n, NA) ? (tableCoefficient(pinholeAU, 3) * lambda) / axialDenominator(n, NA) : NaN;
}

/**
 * Spinning-disk frame rate: disk revolutions per second times the full-field scans per revolution
 * (12 on Yokogawa CSU disks: 5000 rpm gives 1000 frames/s, Tanaami et al., Appl. Opt. 41, 4704 (2002)), s⁻¹.
 */
export function spinningDiskFrameRate(rpm: number, scansPerRevolution: number): number {
  return Number.isFinite(rpm) && rpm >= 0 && positive(scansPerRevolution) ? (rpm / 60) * scansPerRevolution : NaN;
}

/**
 * Fraction of the disk area that is open, π d²/(4 s²) for pinholes of diameter d on a square lattice of pitch s.
 * Each sample point is illuminated for this fraction of the exposure. NaN unless 0 < d ≤ s.
 */
export function pinholeFillFactor(diameter: number, pitch: number): number {
  return positive(diameter) && positive(pitch) && diameter <= pitch ? (Math.PI * diameter * diameter) / (4 * pitch * pitch) : NaN;
}
