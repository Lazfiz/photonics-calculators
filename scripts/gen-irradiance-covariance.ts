/**
 * Prints the table IRRADIANCE_COVARIANCE in src/physics/free-space-comms/turbulence.ts: the normalised irradiance
 * covariance b_I of a plane wave in weak fluctuations (Kolmogorov, zero inner scale, point receivers) at
 * r = ρ√(k/L) = 0, 0.05, …, 6. From B_I(ρ) = 8π²k²L ∫₀¹∫₀^∞ κΦ_n(κ) J₀(κρ)[1 − cos(Lκ²ξ/k)] dκ dξ with the ξ integral
 * done analytically and x = κ√(L/k):  b_I(r) = I(r)/I(0),  I(r) = ∫₀^∞ x^(−8/3) J₀(xr) (1 − sin x²/x²) dx.
 * Run: npx tsx scripts/gen-irradiance-covariance.ts   (about a minute)
 */
import { besselJ } from "../src/physics/math";

export function covarianceIntegral(r: number, X = 80, h = 0.004): number {
  const g = (x: number) => (x < 1e-3 ? x ** 4 / 6 : 1 - Math.sin(x * x) / (x * x));
  let s = 0;
  const n = Math.round(X / h);
  for (let i = 1; i <= n; i++) {
    const x = i * h;
    s += (i === n ? 0.5 : 1) * x ** (-8 / 3) * besselJ(0, x * r) * g(x);
  }
  s *= h;
  // Tail beyond X: g → 1; for r > 0 the oscillating J₀ makes it < 1e-5 of I(0).
  return r === 0 ? s + 0.6 * X ** (-5 / 3) : s;
}

if (process.argv[1]?.includes("gen-irradiance-covariance")) {
  const i0 = covarianceIntegral(0);
  const values: string[] = [];
  for (let k = 0; k <= 120; k++) values.push((covarianceIntegral(k * 0.05) / i0).toFixed(5).replace(/^(-?)0\./, "$1."));
  for (let k = 0; k < values.length; k += 12) console.log("  " + values.slice(k, k + 12).join(", ") + ",");
}
