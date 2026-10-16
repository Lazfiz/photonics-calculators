/**
 * Image-sensor MTF terms along one axis, SI units: spatial frequency f in cycles/m, lengths in m, α in 1/m.
 * The total MTF of a linear, shift-invariant chain is the product of its terms (Holst & Lomheim, CMOS/CCD Sensors
 * and Camera Systems, 2nd ed., SPIE 2011, ch. 10 "MTF", doi:10.1117/3.2524677.ch10).
 */

/** sin(x)/x with the limit 1 at x = 0. */
function sinc(x: number): number {
  return Math.abs(x) < 1e-8 ? 1 : Math.sin(x) / x;
}

/** Pixel aperture of width a: |sinc(π f a)|, which is 2/π at the Nyquist frequency 1/(2p) when a = p. */
export function pixelApertureMtf(f: number, width: number): number {
  return Math.abs(sinc(Math.PI * f * width));
}

/** Exponential line spread e^(−|x|/ℓ)/(2ℓ): its Fourier transform is the Lorentzian 1/(1 + (2π f ℓ)²). */
export function exponentialSpreadMtf(f: number, spreadLength: number): number {
  return 1 / (1 + (2 * Math.PI * f * spreadLength) ** 2);
}

/** Gaussian blur of rms width σ: exp(−2π² σ² f²). */
export function gaussianBlurMtf(f: number, sigma: number): number {
  return Math.exp(-2 * Math.PI ** 2 * sigma ** 2 * f ** 2);
}

/**
 * Nearest-neighbour crosstalk kernel [X/2, 1 − X, X/2] (X = fraction sent to the two neighbours together):
 * 1 − X + X cos(2π f p), so 1 − 2X at the Nyquist frequency (the Fourier transform of the three taps).
 */
export function crosstalkKernelMtf(f: number, pitch: number, crosstalk: number): number {
  return 1 - crosstalk + crosstalk * Math.cos(2 * Math.PI * f * pitch);
}

/**
 * Collected fraction of the absorbed light for a sinusoidal pattern, front illumination, in the field-free diffusion
 * model of D. H. Seib, IEEE Trans. Electron Devices 21, 210 (1974), doi:10.1109/T-ED.1974.17898, with a semi-infinite
 * field-free region. Light absorbed in the depletion layer (depth W) is collected where it lands; below it the
 * carriers obey D n'' = n/τ + D (2π f)² n − g with n = 0 at the depletion edge and n → 0 deep down. The flux into the
 * edge gives η(f) = 1 − e^(−αW)/(1 + α L_f), with 1/L_f² = 1/L₀² + (2π f)² and L₀ the minority-carrier diffusion length.
 * Reflection and surface recombination are left out.
 */
export function seibCollection(f: number, alpha: number, depletion: number, diffusionLength: number): number {
  if (!(alpha > 0) || !(depletion >= 0) || !(diffusionLength > 0) || !(f >= 0)) return NaN;
  const lf = diffusionLength / Math.sqrt(1 + (2 * Math.PI * f * diffusionLength) ** 2);
  return 1 - Math.exp(-alpha * depletion) / (1 + alpha * lf);
}

/** Seib diffusion MTF η(f)/η(0). It falls to the floor (1 − e^(−αW))/η(0) at high f: depletion-layer charge does not spread. */
export function seibDiffusionMtf(f: number, alpha: number, depletion: number, diffusionLength: number): number {
  return seibCollection(f, alpha, depletion, diffusionLength) / seibCollection(0, alpha, depletion, diffusionLength);
}

/** High-frequency limit of the Seib MTF. */
export function seibDiffusionFloor(alpha: number, depletion: number, diffusionLength: number): number {
  return -Math.expm1(-alpha * depletion) / seibCollection(0, alpha, depletion, diffusionLength);
}

/** Integration limit in u = f·p; the spread part of the integrand falls as 1/u³ or faster, so the tail is < 1e-5. */
const U_MAX = 100;

/** 8-point Gauss–Legendre nodes and weights on [−1, 1] (Abramowitz & Stegun Table 25.4). */
const GL_X = [0.1834346424956498, 0.525532409916329, 0.7966664774136267, 0.9602898564975363];
const GL_W = [0.362683783378362, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];

/** Cell edges in u: doubling from 1e-6 to 1 (H may be a narrow peak at u = 0), then unit cells to U_MAX. */
const EDGES: number[] = [0];
for (let u = 2 ** -20; u < 1; u *= 2) EDGES.push(u);
for (let k = 1; k <= U_MAX; k++) EDGES.push(k);

/**
 * Charge shares [C₀, C₁, C₂] of the lit column and its first and second neighbours on one side, when one column of
 * pixels (pitch p, 100 % fill) is lit uniformly and the charge spreads with the line-spread MTF H(f) (H(0) = 1):
 * Cₙ = 2∫₀^∞ H(u/p) sinc²(π u) cos(2π n u) du. The floor H(∞) is a delta in the line spread and only adds to C₀.
 * Quadrature: 8-point Gauss–Legendre on each cell of EDGES; it matches the exponential-spread closed form to 1e-8.
 */
export function columnShares(mtf: (f: number) => number, pitch: number, floor = 0): [number, number, number] {
  if (!(pitch > 0)) return [NaN, NaN, NaN];
  let s0 = 0, s1 = 0, s2 = 0;
  for (let i = 0; i + 1 < EDGES.length; i++) {
    const mid = (EDGES[i] + EDGES[i + 1]) / 2;
    const half = (EDGES[i + 1] - EDGES[i]) / 2;
    for (let j = 0; j < 8; j++) {
      const u = mid + (j < 4 ? -GL_X[j] : GL_X[j - 4]) * half;
      const w = GL_W[j % 4] * half * (mtf(u / pitch) - floor) * sinc(Math.PI * u) ** 2;
      const c1 = Math.cos(2 * Math.PI * u);
      s0 += w;
      s1 += w * c1;
      s2 += w * (2 * c1 * c1 - 1);
    }
  }
  return [2 * s0 + floor, 2 * s1, 2 * s2];
}

/**
 * Fraction of the lit column's charge that ends up in its two neighbours once the diffusion shares [C₀, C₁, C₂] are
 * followed by the kernel [X/2, 1 − X, X/2]: 2·(C₁(1 − X) + (C₀ + C₂)·X/2), the n = ±1 terms of the convolution.
 */
export function neighbourFraction(shares: readonly [number, number, number], crosstalk: number): number {
  const [c0, c1, c2] = shares;
  return 2 * (c1 * (1 - crosstalk) + ((c0 + c2) * crosstalk) / 2);
}
