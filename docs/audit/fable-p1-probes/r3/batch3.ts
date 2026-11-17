// R3 batch 3: security, receiver noise / APD F, solar radiance, diversity (code's normalisation), QKD cutoff,
// coherent Rx power, capacity required SNR, atmospheric loss regimes, spherical r0, beam-wander strong flag.
import { Qf, Phi, row, H, C, QE } from "./lib";
import * as T from "../../../../src/physics/free-space-comms/turbulence";
import * as K from "../../../../src/physics/free-space-comms/qkd";
import * as P from "../../../../src/physics/free-space-comms/bpsk-qpsk";
import * as CC from "../../../../src/physics/free-space-comms/channel-capacity";
import * as BR from "../../../../src/physics/free-space-comms/background-radiance";
import * as AT from "../../../../src/physics/free-space-comms/atmospheric-attenuation";
import * as SEC from "../../../../src/physics/free-space-comms/physical-layer-security";
import { excessNoiseFactor } from "../../../../src/physics/detectors/apd";

console.log("=== security defaults: 10 dBm, w0=2.5mm, 1 km, Bob 10 cm, Eve 1000 m offset 0.3 m 10 cm, NEP 20 pW/rtHz, 1 GHz");
{
  const lam = 1550e-9, w0 = 2.5e-3, zR = Math.PI * w0 * w0 / lam, W = w0 * Math.sqrt(1 + (1000 / zR) ** 2);
  const Pt = 0.01, a = 0.05;
  const bob = Pt * (1 - Math.exp(-2 * a * a / W / W));
  // Eve: integrate Gaussian intensity over offset disc (polar grid)
  let eve = 0; const n = 400;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const r = (i + 0.5) * a / n, th = (j + 0.5) * 2 * Math.PI / n;
    const x = 0.3 + r * Math.cos(th), y = r * Math.sin(th);
    eve += 2 * Pt / (Math.PI * W * W) * Math.exp(-2 * (x * x + y * y) / W / W) * r * (a / n) * (2 * Math.PI / n);
  }
  const nb = 20e-12 * Math.sqrt(1e9), sb = (bob / nb) ** 2, se = (eve / nb) ** 2;
  const res = SEC.linkSecurity({ power: Pt, lambda: lam, waist: w0, range: 1000, bobAperture: 0.1, eveDistance: 1000, eveOffset: 0.3, eveAperture: 0.1, nep: 20e-12, bandwidth: 1e9 } as never);
  row("Bob power", bob, res.bobPower); row("Eve power", eve, res.evePower);
  row("secrecy b/s", 1e9 * (Math.log2(1 + sb) - Math.log2(1 + se)), res.secrecy);
}

console.log("=== APD excess noise McIntyre F = kM + (1-k)(2-1/M)");
for (const [M, k] of [[10, 0.5], [50, 0.02], [1, 0.3]] as const) row(`F M=${M} k=${k}`, k * M + (1 - k) * (2 - 1 / M), excessNoiseFactor(M, k));
{
  const R = 0.8 * QE / (H * C / 1550e-9);
  row("responsivity qe .8 1550 A/W", R, BR.responsivity(0.8, 1550e-9));
  const n = BR.receiverNoise({ signalCurrent: 1e-6, backgroundCurrent: 1e-7, darkCurrent: 1e-9, bandwidth: 1e9, amplifierNoise: 10e-12, gain: 1, ionisationRatio: 0 });
  const v = 2 * QE * (1e-6 + 1e-7 + 1e-9) * 1e9 + (10e-12) ** 2 * 1e9;
  row("PIN SNR", 1e-12 / v, n.snr);
}

console.log("=== solar disc: BB 5772 K spectral irradiance at 1 AU vs ASTM E-490 (approx 0.27 @1550, 0.96 @850, W m-2 nm-1)");
for (const lam of [850e-9, 1550e-9]) {
  const x = H * C / (lam * 1.380649e-23 * 5772);
  const M = 2 * Math.PI * H * C * C / lam ** 5 / Math.expm1(x); // W m^-3
  const E = M * (6.957e8 / 1.495978707e11) ** 2 * 1e-9;
  row(`E_sun lam=${lam * 1e9} (BB)`, E, BR.solarDiscRadiance(lam) * BR.SUN_SOLID_ANGLE * 1e-9);
}

console.log("=== diversity with code's normalisation (EGC sum/sqrtN, MRC sqrt(sum I^2)), N=2, rho=0, sigI2=0.3; and rho=0.5");
for (const rho of [0, 0.5]) {
  const s2 = 0.3, sl2 = Math.log(1 + s2), sl = Math.sqrt(sl2);
  let seed = 987654321; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return (seed + 0.5) / 2147483648; };
  const N = 4e6; const ts = [0.6, 0.4]; const cE = [0, 0], cM = [0, 0], cS = [0, 0];
  for (let i = 0; i < N; i++) {
    const z0 = Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd());
    const z1 = Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd());
    const z2 = Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd());
    const g1 = Math.sqrt(rho) * z0 + Math.sqrt(1 - rho) * z1, g2 = Math.sqrt(rho) * z0 + Math.sqrt(1 - rho) * z2;
    const a = Math.exp(sl * g1 - sl2 / 2), b = Math.exp(sl * g2 - sl2 / 2);
    ts.forEach((t, j) => { if ((a + b) / Math.SQRT2 < t) cE[j]++; if (Math.hypot(a, b) < t) cM[j]++; if (Math.max(a, b) < t) cS[j]++; });
  }
  ts.forEach((t, j) => {
    row(`rho=${rho} t=${t} EGC (MC)`, cE[j] / N, T.diversityOutage(t, 2, s2, rho, "egc"));
    row(`rho=${rho} t=${t} MRC (MC)`, cM[j] / N, T.diversityOutage(t, 2, s2, rho, "mrc"));
    row(`rho=${rho} t=${t} SC (MC)`, cS[j] / N, T.diversityOutage(t, 2, s2, rho, "sc"));
  });
  void Phi;
}

console.log("=== QKD cutoff (fixed mu=0.48) ; optimal mu at 50 km");
{
  const sys = { mu: 0.48, y0: 1.7e-6, eDetector: 0.033, fEc: 1.22 };
  let lo = 0, hi = 300;
  const R = (dB: number) => { const eta = 0.045 * 10 ** (-dB / 10); const Q = 1.7e-6 + 1 - Math.exp(-eta * 0.48); const E = (0.85e-6 + 0.033 * (1 - Math.exp(-eta * 0.48))) / Q; const Y1 = 1.7e-6 + eta, e1 = (0.85e-6 + 0.033 * eta) / Y1; const h = (p: number) => -p * Math.log2(p) - (1 - p) * Math.log2(1 - p); return 0.5 * (-Q * 1.22 * h(E) + Y1 * 0.48 * Math.exp(-0.48) * (1 - h(e1))); };
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (R(m) > 0) lo = m; else hi = m; }
  row("max channel loss dB", lo, K.maxChannelLossDb(sys, 0.045, 300));
  let best = 0, mb = 0; const eta = 0.045 * 10 ** (-10.5 / 10);
  for (let mu = 0.05; mu < 1.2; mu += 1e-4) { const k = K.decoyBb84({ ...sys, mu, eta }).keyPerPulse; if (k > best) { best = k; mb = mu; } }
  row("optimal mu 50 km", mb, K.optimalMu({ y0: 1.7e-6, eDetector: 0.033, fEc: 1.22, eta }));
  console.log(`  QBER edge: decoyBb84 eta=0 -> ${JSON.stringify(K.decoyBb84({ ...sys, eta: 0 }))}`);
  console.log(`  mu=0 -> ${JSON.stringify(K.decoyBb84({ ...sys, mu: 0, eta: 0.01 }))}`);
}

console.log("=== coherent rx power; capacity required SNR");
row("P_req BPSK 10 dB 1Gb/s het (W)", 10 * H * C / 1550e-9 * 1e9, P.requiredRxPower(10, 1e9, 1550e-9, 1, "heterodyne"));
for (const [m, target] of [["BPSK", 3.8e-3], ["QPSK", 3.8e-3], ["16QAM", 1e-9]] as const) {
  let lo = -10, hi = 40; for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (CC.bitErrorRate(m, 10 ** (mid / 10)) > target) lo = mid; else hi = mid; }
  // independent: BPSK Q(sqrt(2x)), QPSK Q(sqrt(x))
  const mine = m === "BPSK" ? 10 * Math.log10(2.6699 ** 2 / 2) : m === "QPSK" ? 10 * Math.log10(2.6699 ** 2) : hi;
  row(`req SNR ${m} ${target}`, mine, CC.requiredSnrDb(m, target));
}
console.log(`  check Qinv(3.8e-3)=2.6699: Q(2.6699)=${Qf(2.6699).toExponential(4)}`);
console.log(`  OOK BER convention: code BER(Es/N0=x)=Q(sqrt(x)) (coherent OOK, Es average)`);

console.log("=== atmospheric loss regimes (dB/km), 1550 nm");
for (const V of [0.05, 1, 23, 300]) console.log(`  V=${V} km total ${(AT.totalExtinction(1550e-9, V * 1e3) * 1e3 * 10 / Math.LN10).toFixed(4)} dB/km; Koschmieder 3.912/V*4.343*(1550/550)^-q`);

console.log("=== Fried spherical (0.423*3/8)");
row("r0 sph", (0.423 * 0.375 * (2 * Math.PI / 1550e-9) ** 2 * 1e-14 * 1000) ** (-3 / 5), T.sphericalFriedParameter(1e-14, 1550e-9, 1000));
