/**
 * Seeded pseudo-random numbers for simulated noise in charts.
 *
 * Pages must render the same output on the server and the client, so they can't call
 * Math.random during render (a hydration mismatch). Create a generator from a fixed seed inside
 * the memo instead: every recompute then draws the same sequence, and changing an input such as
 * a noise amplitude rescales one fixed noise realization instead of redrawing it.
 *
 * Generator: mulberry32 (Tommy Ettinger, 2017, public domain; 32-bit state, period 2³²).
 * Fine for visual noise; not for statistics that need long periods, and not cryptographic.
 * tests/random.test.ts checks it against an independent port of the C reference.
 */

/** Returns uniform deviates in [0, 1). */
export type Rng = () => number;

/** mulberry32 seeded with the low 32 bits of `seed`. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform deviate in [a, b). */
export function uniform(rng: Rng, a: number, b: number): number {
  return a + (b - a) * rng();
}

/**
 * Standard normal deviate (mean 0, variance 1) by the Box–Muller transform
 * (Box & Muller 1958, Ann. Math. Stat. 29, 610; Numerical Recipes 3rd ed. §7.3.4).
 * u = 1 − rng() lies in (0, 1], so log(u) is finite.
 */
export function gaussian(rng: Rng): number {
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
