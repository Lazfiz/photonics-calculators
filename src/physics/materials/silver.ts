/**
 * Complex index of silver from 0.27 µm into the far infrared. SI units (wavelength in m).
 * Model tier: exact interpolation of measured data; template-stripped silver is the smoothest, most reflective
 * kind, so evaporated or sputtered films (and thin ones above all) reflect somewhat less.
 *
 * 0.27–24.92 µm: Yang et al. (2015) (./silver-yang-2015.ts), n and κ interpolated linearly in wavelength (as
 * refractiveindex.info does). Beyond 24.92 µm: a Drude continuation ε = 1 − ω_p²/(E(E + iγ)) whose ω_p and γ are
 * set so it equals the last tabulated point. With E the photon energy and z = −1/(ε − 1) there:
 * ω_p² = E²/Re z, γ = ω_p² Im z / E, which gives ħω_p = 8.84 eV and ħγ = 36.7 meV (τ = 18 fs), close to the Drude
 * parameters Yang et al. fit to the whole infrared. Below 0.27 µm: NaN (use ./lorentz-drude.ts there).
 */
import { hc_eV_nm } from "../constants";
import { AG_YANG_2015 } from "./silver-yang-2015";

/** Wavelength range of the table, m. */
export const SILVER_TABLE_RANGE: readonly [number, number] = [AG_YANG_2015[0][0] * 1e-6, AG_YANG_2015[AG_YANG_2015.length - 1][0] * 1e-6];

const energy = (um: number) => hc_eV_nm / (um * 1e3);

/** Drude continuation matched to the last row of the table (see the header); energies in eV. */
export const SILVER_DRUDE_TAIL: { plasma: number; gamma: number } = (() => {
  const [um, n, k] = AG_YANG_2015[AG_YANG_2015.length - 1];
  const E = energy(um);
  // ε − 1 and z = −1/(ε − 1)
  const er = n * n - k * k - 1;
  const ei = 2 * n * k;
  const m2 = er * er + ei * ei;
  const zr = -er / m2;
  const zi = ei / m2;
  const wp2 = (E * E) / zr;
  return { plasma: Math.sqrt(wp2), gamma: (wp2 * zi) / E };
})();

function drudeIndex(um: number): { n: number; k: number } {
  const E = energy(um);
  const { plasma, gamma } = SILVER_DRUDE_TAIL;
  // ε = 1 − ω_p² (E² − iEγ) / (E⁴ + E²γ²)
  const d = E * E * (E * E + gamma * gamma);
  const er = 1 - (plasma * plasma * E * E) / d;
  const ei = (plasma * plasma * E * gamma) / d;
  const m = Math.hypot(er, ei);
  // Principal √ε with κ ≥ 0; er < 0 here, so compute κ first to avoid cancellation.
  const k = Math.sqrt((m - er) / 2);
  return { n: ei / (2 * k), k };
}

/** n + iκ of silver at a vacuum wavelength (m). NaN below 0.27 µm or for invalid λ. */
export function silverIndex(wavelength: number): { n: number; k: number } {
  if (!(wavelength > 0 && Number.isFinite(wavelength))) return { n: NaN, k: NaN };
  const um = wavelength * 1e6;
  const t = AG_YANG_2015;
  const last = t.length - 1;
  if (um < t[0][0]) return { n: NaN, k: NaN };
  if (um >= t[last][0]) return um === t[last][0] ? { n: t[last][1], k: t[last][2] } : drudeIndex(um);
  // Last row with λ ≤ um; the next row then has λ > um (repeated wavelengths are skipped).
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (t[mid][0] <= um) lo = mid;
    else hi = mid;
  }
  const [x0, n0, k0] = t[lo];
  const [x1, n1, k1] = t[hi];
  const f = (um - x0) / (x1 - x0);
  return { n: n0 + f * (n1 - n0), k: k0 + f * (k1 - k0) };
}
