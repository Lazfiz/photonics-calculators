/**
 * Optical constants of intrinsic crystalline silicon at 300 K, 250–1450 nm in 10 nm steps. SI units (m, 1/m).
 *
 * M. A. Green, "Self-consistent optical parameters of intrinsic silicon at 300 K including temperature coefficients",
 * Sol. Energy Mater. Sol. Cells 92, 1305 (2008), doi:10.1016/j.solmat.2008.06.009, Table 1; transcribed by the
 * refractiveindex.info database (CC0), file data/main/Si/nk/Green-2008.yml. k is band-to-band absorption only (no
 * free-carrier term) and α = 4π·k/λ. Between nodes n is linear in λ and ln k is linear in λ, since α falls by ten
 * decades from 250 to 1450 nm. Outside the table the functions return NaN.
 */

const LAMBDA_START_NM = 250;
const STEP_NM = 10;

const N = [
  1.665, 1.757, 2.068, 2.959, 4.356, 4.976, 5.121, 5.112, 5.195, 5.301, 5.494, 6.026,
  6.891, 6.616, 6.039, 5.613, 5.33, 5.119, 4.949, 4.812, 4.691, 4.587, 4.497, 4.419,
  4.35, 4.294, 4.241, 4.193, 4.151, 4.112, 4.077, 4.045, 4.015, 3.988, 3.963, 3.94,
  3.918, 3.898, 3.879, 3.861, 3.844, 3.828, 3.813, 3.798, 3.784, 3.772, 3.759, 3.748,
  3.737, 3.727, 3.717, 3.708, 3.699, 3.691, 3.683, 3.675, 3.668, 3.661, 3.654, 3.647,
  3.641, 3.635, 3.63, 3.624, 3.619, 3.614, 3.609, 3.604, 3.6, 3.595, 3.591, 3.587,
  3.583, 3.579, 3.575, 3.572, 3.568, 3.565, 3.562, 3.559, 3.556, 3.553, 3.55, 3.547,
  3.545, 3.542, 3.54, 3.537, 3.535, 3.532, 3.53, 3.528, 3.526, 3.524, 3.522, 3.52,
  3.518, 3.517, 3.515, 3.513, 3.511, 3.509, 3.508, 3.506, 3.505, 3.503, 3.502, 3.5,
  3.499, 3.497, 3.496, 3.495, 3.494, 3.492, 3.491, 3.49, 3.489, 3.488, 3.487, 3.486,
  3.485,
];

const K = [
  3.665, 4.084, 4.68, 5.287, 5.286, 4.234, 3.598, 3.303, 3.1, 2.977,
  2.938, 2.966, 2.171, 0.946, 0.445, 0.296, 0.227, 0.176, 0.138, 0.107,
  0.086302, 0.071381, 0.062086, 0.055004, 0.049131, 0.044165, 0.039367, 0.036415, 0.033108, 0.030295,
  0.027968, 0.025758, 0.024131, 0.022524, 0.021081, 0.019934, 0.018446, 0.017367, 0.016444, 0.015432,
  0.014431, 0.013498, 0.012743, 0.011905, 0.011201, 0.010528, 0.010057, 0.0096257, 0.0089461, 0.008362,
  0.0078185, 0.007197, 0.0067402, 0.0063933, 0.005834, 0.0054113, 0.0049955, 0.0046134, 0.0042734, 0.0039439,
  0.003612, 0.0032781, 0.0029839, 0.0026821, 0.0024293, 0.0021701, 0.0019625, 0.0017571, 0.0015467, 0.0013689,
  0.0011793, 0.0010237, 0.00087225, 0.00074866, 0.00062238, 0.0005093, 0.00041071, 0.00032386, 0.00024753, 0.00018704,
  0.0001362, 9.3631e-5, 6.8118e-5, 5.3285e-5, 4.0768e-5, 3.0637e-5, 2.3849e-5, 1.7825e-5, 1.3488e-5, 9.0718e-6,
  6.223e-6, 3.877e-6, 2.0483e-6, 6.1036e-7, 3.4091e-7, 2.1008e-7, 1.2518e-7, 7.9609e-8, 4.6004e-8, 2.3682e-8,
  9.9472e-9, 3.6096e-9, 2.0213e-9, 1.2223e-9, 7.2885e-10, 4.6553e-10, 2.8147e-10, 1.6807e-10, 8.467e-11, 3.7322e-11,
  1.8263e-11, 1.0281e-11, 6.5413e-12, 4.173e-12, 2.5441e-12, 1.5597e-12, 9.5374e-13, 5.65e-13, 2.8449e-13, 2.0626e-13,
  1.3846e-13,
];

/** Table range in m. */
export const SILICON_LAMBDA_MIN = LAMBDA_START_NM * 1e-9;
export const SILICON_LAMBDA_MAX = (LAMBDA_START_NM + STEP_NM * (N.length - 1)) * 1e-9;

/** Complex index n + ik of silicon at 300 K at wavelength λ (m); NaN outside 250–1450 nm. */
export function siliconIndex(lambda: number): { n: number; k: number } {
  const x = (lambda * 1e9 - LAMBDA_START_NM) / STEP_NM;
  if (!(x >= -1e-9 && x <= N.length - 1 + 1e-9)) return { n: NaN, k: NaN };
  const i = Math.min(Math.max(Math.floor(x), 0), N.length - 2);
  const f = Math.min(Math.max(x - i, 0), 1);
  return {
    n: N[i] + f * (N[i + 1] - N[i]),
    k: Math.exp(Math.log(K[i]) + f * (Math.log(K[i + 1]) - Math.log(K[i]))),
  };
}

/** Absorption coefficient α = 4π·k/λ of silicon at 300 K, 1/m. */
export function siliconAbsorption(lambda: number): number {
  return (4 * Math.PI * siliconIndex(lambda).k) / lambda;
}
