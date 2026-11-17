// R3 batch 2: aperture-averaging integrals, diversity, point-ahead, optical antenna, fog, snow, acquisition, security.
import { Phi, row, lgamma } from "./lib";
import * as T from "../../../../src/physics/free-space-comms/turbulence";
import * as PA from "../../../../src/physics/free-space-comms/point-ahead";
import * as LB from "../../../../src/physics/free-space-comms/link-budget";
import * as AT from "../../../../src/physics/free-space-comms/atmospheric-attenuation";
import * as PR from "../../../../src/physics/free-space-comms/precipitation";
import * as AQ from "../../../../src/physics/free-space-comms/acquisition";

// Bessel J0, J1 via Bessel's integral (midpoint, 400 pts) for |x| < 60, asymptotic beyond.
function Jn(n: number, x: number) {
  if (x > 60) { const w = x - n * Math.PI / 2 - Math.PI / 4; return Math.sqrt(2 / (Math.PI * x)) * Math.cos(w); }
  const N = 400; let s = 0;
  for (let i = 0; i < N; i++) { const t = (i + 0.5) * Math.PI / N; s += Math.cos(n * t - x * Math.sin(t)); }
  return s / N;
}
const w = (t: number) => { const v = t * t; return t ** (-8 / 3) * (v < 1e-3 ? v * v / 6 : 1 - Math.sin(v) / v); };
// Integrate ∫0^tmax f dt with log-spaced then linear steps (simple trapezoid in u = ln t below 1).
function integ(f: (t: number) => number, tmax = 400, dt = 0.002) {
  let s = 0; const nlog = 4000, umin = Math.log(1e-6), umax = 0;
  for (let i = 0; i < nlog; i++) { const u = umin + (i + 0.5) * (umax - umin) / nlog, t = Math.exp(u); s += f(t) * t * (umax - umin) / nlog; }
  for (let t = 1 + dt / 2; t < tmax; t += dt) s += f(t) * dt;
  return s;
}
const I0 = integ(w);
console.log(`I0 numeric=${I0.toFixed(6)} (code const 0.471492; tail beyond 400 ~ ${(3 / 5 * 400 ** (-5 / 3)).toExponential(1)})`);
console.log("=== weak aperture factor, exact integral (plane Gaussian, plane hard)");
for (const d2 of [0.01, 1, 10.1342, 100]) {
  const gauss = integ((t) => w(t) * Math.exp(-d2 * t * t / 4)) / I0;
  row(`A gauss plane d2=${d2}`, gauss, T.weakApertureFactor(d2, "plane"));
  const d = Math.sqrt(d2);
  const hard = integ((t) => { const x = d * t; const a = x < 1e-8 ? 1 : (2 * Jn(1, x) / x) ** 2; return w(t) * a; }, 120, 0.004) / I0;
  row(`A hard plane d2=${d2}`, hard, T.hardApertureFactor(d2));
}
// spherical Gaussian: ∫dξ ∫ t^-8/3 exp(-d2 ξ² t²/4)(1-cos(t² ξ(1-ξ))) dt
function sph(d2: number) {
  let s = 0; const nx = 200;
  for (let j = 0; j < nx; j++) {
    const xi = (j + 0.5) / nx, b = xi * (1 - xi);
    s += integ((t) => { const v = t * t * b; return t ** (-8 / 3) * (v < 1e-3 ? v * v / 2 : 1 - Math.cos(v)) * Math.exp(-d2 * xi * xi * t * t / 4); }, 200, 0.01) / nx;
  }
  return s;
}
const s0 = sph(0);
for (const d2 of [1, 10.1342]) row(`A gauss sph d2=${d2}`, sph(d2) / s0, T.weakApertureFactor(d2, "spherical"));

console.log("=== irradiance correlation b_I(rho sqrt(k/L)) plane weak");
for (const r of [0.5, 1, 2]) {
  const b = integ((t) => w(t) * Jn(0, r * t), 120, 0.004) / I0;
  const lam = 1550e-9, L = 1000, k = 2 * Math.PI / lam;
  row(`b_I r=${r}`, b, T.irradianceCorrelation(r / Math.sqrt(k / L), lam, L));
}

console.log("=== diversity: n=1 vs lognormal, SC uncorrelated = P^n, EGC uncorrelated by MC");
{
  const s2 = 0.3, sl2 = Math.log(1 + s2), sl = Math.sqrt(sl2);
  const P1 = (t: number) => Phi((Math.log(t) + sl2 / 2) / sl);
  for (const t of [0.3, 0.1]) {
    row(`n=1 t=${t}`, P1(t), T.diversityOutage(t, 1, s2, 0, "sc"));
    row(`SC n=3 rho=0 t=${t}`, P1(t) ** 3, T.diversityOutage(t, 3, s2, 0, "sc"));
    // MC EGC (mean of I) and MRC (sqrt mean I^2) uncorrelated, n=2
    let cE = 0, cM = 0; const N = 2e6; let seed = 12345;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return (seed + 0.5) / 2147483648; };
    for (let i = 0; i < N; i++) {
      const z1 = Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd());
      const z2 = Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd());
      const a = Math.exp(sl * z1 - sl2 / 2), b = Math.exp(sl * z2 - sl2 / 2);
      if ((a + b) / 2 < t) cE++; if (Math.sqrt((a * a + b * b) / 2) < t) cM++;
    }
    console.log(`  t=${t} MC EGC mean=${(cE / N).toExponential(3)} code egc=${T.diversityOutage(t, 2, s2, 0, "egc").toExponential(3)} | MC MRC rms=${(cM / N).toExponential(3)} code mrc=${T.diversityOutage(t, 2, s2, 0, "mrc").toExponential(3)}`);
  }
}

console.log("=== point-ahead");
row("2v/c v=7 km/s (urad)", 2 * 7000 / 299792458 * 1e6, PA.pointAheadAngle(7000) * 1e6);
row("Airy 1.22 lam/D (urad)", 1.22 * 1550e-9 / 0.1 * 1e6, PA.airyHalfAngle(1550e-9, 0.1) * 1e6);
row("GEO radius m", 42164170, PA.R_GEO);
console.log(`  zenithPassVelocity(500 km, 0 deg) code=${PA.zenithPassVelocity(500e3, 0).toFixed(1)} ; sqrt(GM/r)=${Math.sqrt(3.986004418e14 / 6878137).toFixed(1)}, minus ground rot 465.1*cos? `);

console.log("=== optical antenna");
const g = (a: number, gm: number) => 2 / (a * a) * (Math.exp(-a * a) - Math.exp(-gm * gm * a * a)) ** 2;
row("KD g(1,0.15)", g(1, 0.15), LB.kleinDegnanEfficiency(1, 0.15));
let best = 0, ab = 0; for (let a = 0.5; a < 2.5; a += 1e-5) { const v = g(a, 0); if (v > best) { best = v; ab = a; } }
row("optimum alpha gamma=0", ab, LB.optimumTruncation(0).alpha); row("optimum g gamma=0", best, LB.optimumTruncation(0).efficiency);
best = 0; ab = 0; for (let a = 0.5; a < 2.5; a += 1e-5) { const v = g(a, 0.3); if (v > best) { best = v; ab = a; } }
row("optimum alpha gamma=0.3", ab, LB.optimumTruncation(0.3).alpha);
row("directivity D=10cm (pi D/lam)^2", (Math.PI * 0.1 / 1550e-9) ** 2, LB.apertureGain(0.1, 1550e-9));
console.log(`  Fraunhofer 2D^2/lam 5cm = ${(2 * 0.0025 / 1550e-9).toFixed(0)} m vs code ${LB.fraunhoferDistance(0.05, 1550e-9).toFixed(0)}`);

console.log("=== fog / aerosol (per km)");
for (const V of [0.2, 0.5, 0.8, 3, 10, 60]) {
  const q = V > 50 ? 1.6 : V > 6 ? 1.3 : V > 1 ? 0.16 * V + 0.34 : V > 0.5 ? V - 0.5 : 0;
  const bk = 3.912 / V * (1550 / 550) ** (-q);
  row(`Kim V=${V} km beta_aer/km`, bk, AT.aerosolExtinction(1550e-9, V * 1e3, "kim") * 1e3);
  const qk = V > 50 ? 1.6 : V > 6 ? 1.3 : 0.585 * V ** (1 / 3);
  row(`Kruse V=${V} km`, 3.912 / V * (1550 / 550) ** (-qk), AT.aerosolExtinction(1550e-9, V * 1e3, "kruse") * 1e3);
}
for (const [lam, V] of [[1.55, 0.5], [0.85, 0.2]] as const) {
  row(`AlNab adv lam=${lam} V=${V}`, (0.11478 * lam + 3.8367) / V, AT.alNaboulsiFogExtinction(lam * 1e-6, V * 1e3, "advection") * 1e3);
  row(`AlNab rad lam=${lam} V=${V}`, (0.18126 * lam * lam + 0.13709 * lam + 3.7502) / V, AT.alNaboulsiFogExtinction(lam * 1e-6, V * 1e3, "radiation") * 1e3);
}
// Rayleigh at 550 nm sea level ~ 0.0116 /km (Bucholtz 1995: 1.16e-2 km^-1 at 550 nm)
row("Rayleigh 550nm /km (Bucholtz ~0.0116)", 0.0116, AT.rayleighExtinction(550e-9) * 1e3);
row("Rayleigh 1550nm /km (x (550/1550)^4.08)", 0.0116 * (550 / 1550) ** 4.08, AT.rayleighExtinction(1550e-9) * 1e3);

console.log("=== snow dB/km");
row("dry 1 mm/h 1550", 5.42e-5 * 1550 + 5.4958776, PR.snowSpecificAttenuation(PR.MM_PER_HOUR, 1550e-9, "dry") * 1e3);
row("wet 5 mm/h 850", (1.023e-4 * 850 + 3.7855466) * 5 ** 0.72, PR.snowSpecificAttenuation(5 * PR.MM_PER_HOUR, 850e-9, "wet") * 1e3);
console.log("=== rain sanity: Carbonneau 25 mm/h =", (1.076 * 25 ** 0.67).toFixed(3), "dB/km; code mu=0 specific", (PR.rainSpecificAttenuation(25 * PR.MM_PER_HOUR, 0) * 1e3).toFixed(3));
for (const R of [0.5, 1, 50, 150]) { const r = PR.rainPathAttenuation(R * PR.MM_PER_HOUR, 5000, 0); console.log(`  R=${R} L=5km A=${r.attenuation.toFixed(3)} dB F=${r.reduction.toFixed(4)} G=${r.gain.toFixed(3)}`); }
{ const r = PR.rainPathAttenuation(25 * PR.MM_PER_HOUR, 20000, 0); console.log(`  L=20km (beyond 5 km) A=${r.attenuation.toFixed(2)} F=${r.reduction.toFixed(3)}`); }

console.log("=== acquisition");
row("stare P fov=1mrad sigma=5/3 mrad", 1 - Math.exp(-((0.5e-3) ** 2) / (2 * (5e-3 / 3) ** 2)), AQ.stareProbability(1e-3, 5e-3 / 3));
row("NEA 3pi/16 lam/D/SNR (SNR=10)", 3 * Math.PI / 16 * 1550e-9 / 0.1 / 10, AQ.quadCellNea(1550e-9, 0.1, 10));
console.log(`  raster 3sig=5mrad fov=1mrad 10deg/s: code ${JSON.stringify(AQ.rasterScan(5e-3, 1e-3, 10 * Math.PI / 180))} expect lines=10 time=${(10 * 0.01 / (10 * Math.PI / 180)).toFixed(4)} s`);
void lgamma;
