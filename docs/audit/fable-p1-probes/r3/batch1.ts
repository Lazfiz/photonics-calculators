// R3 batch 1: turbulence pages, QKD, BER, BPSK/QPSK, channel capacity.
import { Qf, Phi, h2, ggCdf, poissonCdf, row, C, H, erfc } from "./lib";
import * as T from "../../../../src/physics/free-space-comms/turbulence";
import * as K from "../../../../src/physics/free-space-comms/qkd";
import * as B from "../../../../src/physics/free-space-comms/ber";
import * as P from "../../../../src/physics/free-space-comms/bpsk-qpsk";
import * as CC from "../../../../src/physics/free-space-comms/channel-capacity";

const kk = (lam: number) => 2 * Math.PI / lam;
const rytov = (cn2: number, lam: number, L: number) => 1.23 * cn2 * kk(lam) ** (7 / 6) * L ** (11 / 6);
const r0p = (cn2: number, lam: number, L: number) => (0.423 * kk(lam) ** 2 * cn2 * L) ** (-3 / 5);
function sigI2(s: number, lam: number, L: number, D: number) {
  const d2 = kk(lam) * D * D / (4 * L), s125 = s ** 1.2;
  const x = 0.49 * s / (1 + 0.65 * d2 + 1.11 * s125) ** (7 / 6);
  const y = 0.51 * s * (1 + 0.69 * s125) ** (-5 / 6) / (1 + 0.9 * d2 + 0.62 * d2 * s125);
  return { sI2: Math.exp(x + y) - 1, alpha: 1 / (Math.exp(x) - 1), beta: 1 / (Math.exp(y) - 1), d2 };
}
const lnFade = (F: number, sI2: number) => { const s2 = Math.log(1 + sI2), s = Math.sqrt(s2); return Phi((Math.log(F) + s2 / 2) / s); };

console.log("=== scintillation (default + strong)");
for (const [cn2, L, D] of [[1.7e-14, 1000, 0.1], [1.7e-13, 5000, 0.1], [1.7e-14, 1000, 0]] as const) {
  const lam = 1550e-9, s = rytov(cn2, lam, L), m = sigI2(s, lam, L, D);
  const sc = T.rytovVariance(cn2, lam, L);
  row(`sigR2 cn2=${cn2} L=${L}`, s, sc);
  row(`sigI2 D=${D}`, m.sI2, T.scintillationIndex(sc, lam, L, D));
  row(`r0 plane`, r0p(cn2, lam, L), T.friedParameter(cn2, lam, L));
  row(`fresnel sqrt(L/k)`, Math.sqrt(L / kk(lam)), T.fresnelZone(lam, L));
  row(`lognormal fade -10dB`, lnFade(0.1, m.sI2), T.lognormalFadeProbability(0.1, m.sI2));
  const gg = T.gammaGammaParameters(sc, m.d2);
  row(`GG alpha`, m.alpha, gg.alpha); row(`GG beta`, m.beta, gg.beta);
  row(`GG cdf -10dB`, ggCdf(0.1, m.alpha, m.beta), T.gammaGammaCdf(0.1, gg.alpha, gg.beta));
}

console.log("=== aperture-averaging defaults D=10cm cn2=1e-15 L=1km; and D=1cm, L=10km");
for (const [D, L] of [[0.1, 1000], [0.01, 10000], [0.5, 1000]] as const) {
  const lam = 1550e-9, d2 = kk(lam) * D * D / (4 * L);
  row(`d2 D=${D} L=${L}`, d2, T.apertureParameter(lam, L, D));
  row(`A plane weak (1+1.06d2)^-7/6`, (1 + 1.06 * d2) ** (-7 / 6), T.weakApertureFactor(d2, "plane"));
  row(`A sph weak (1+0.33d2)^-7/6`, (1 + 0.33 * d2) ** (-7 / 6), T.weakApertureFactor(d2, "spherical"));
  row(`A hard Churnside 1/(1+1.07 d2^7/6)`, 1 / (1 + 1.07 * d2 ** (7 / 6)), T.hardApertureFactor(d2));
  const s = rytov(1e-15, lam, L);
  row(`andrews plane = sI2(D)/sI2(0) weak`, sigI2(s, lam, L, D).sI2 / sigI2(s, lam, L, 0).sI2, T.andrewsApertureFactor(d2, "plane"));
  row(`spherical rytov 0.5 Cn2 k^7/6 L^11/6`, 0.5 * 1e-15 * kk(lam) ** (7 / 6) * L ** (11 / 6), T.sphericalRytovVariance(1e-15, lam, L));
}

console.log("=== beam-wander defaults cn2=1e-14 L=1km W0=2cm");
for (const [cn2, L, W0] of [[1e-14, 1000, 0.02], [1e-13, 10000, 0.05]] as const) {
  const v = 2.42 * cn2 * L ** 3 * W0 ** (-1 / 3);
  row(`<rc2> 2.42 Cn2 L^3 W0^-1/3`, v, T.beamWanderVariance(cn2, L, W0));
  const lam = 1550e-9, W = W0 * Math.sqrt(1 + (L * lam / (Math.PI * W0 * W0)) ** 2);
  // average on-axis loss from wander: <I(0)>/I0 = 1/(1+2<rc2>/W^2) (Gaussian wander, Gaussian beam) -> dB
  console.log(`  W=${W.toFixed(4)} m; beamWanderLossDb=${T.beamWanderLossDb(v, W).toFixed(4)} dB; ` +
    `10log(1+2v/W2)=${(10 * Math.log10(1 + 2 * v / W / W)).toFixed(4)}; 4.343*2v/W2=${(4.343 * 2 * v / W / W).toFixed(4)}`);
}

console.log("=== adaptive-optics defaults cn2=1e-14 1550 1km D=10cm 127 act, 500 Hz, 10 m/s");
for (const [cn2, L, D, N, bw, v] of [[1e-14, 1000, 0.1, 127, 500, 10], [1e-13, 5000, 0.3, 127, 100, 20]] as const) {
  const lam = 1550e-9, r0 = r0p(cn2, lam, L);
  row(`r0`, r0, T.friedParameter(cn2, lam, L));
  row(`theta0 (2.91k2 Cn2 3/8 L^8/3)^-3/5`, (2.91 * kk(lam) ** 2 * cn2 * 0.375 * L ** (8 / 3)) ** (-3 / 5), T.isoplanaticAngle(cn2, lam, L));
  row(`fG 0.427 v/r0`, 0.427 * v / r0, T.greenwoodFrequency(v, r0));
  row(`sig2 open 1.03(D/r0)^5/3`, 1.03 * (D / r0) ** (5 / 3), T.uncorrectedPhaseVariance(D, r0));
  const fG = 0.427 * v / r0;
  row(`servo (fG/f3dB)^5/3`, (fG / bw) ** (5 / 3), T.servoLagVariance(fG, bw));
  const pitch = D / (2 * Math.sqrt(N / Math.PI)) ; // N actuators on circle: pitch = D*sqrt(pi/(4N))
  row(`pitch D*sqrt(pi/4N)`, D * Math.sqrt(Math.PI / (4 * N)), T.actuatorPitch(D, N));
  const sFit = 0.28 * (D * Math.sqrt(Math.PI / (4 * N)) / r0) ** (5 / 3);
  row(`fit 0.28 (d/r0)^5/3`, sFit, T.dmFittingVariance(D * Math.sqrt(Math.PI / (4 * N)), r0));
  const sOpen = 1.03 * (D / r0) ** (5 / 3);
  console.log(`  aoResidual(code)=${T.aoResidualVariance(sFit, (fG / bw) ** (5 / 3), sOpen).toPrecision(5)} sum=${(sFit + (fG / bw) ** (5 / 3)).toPrecision(5)}`);
  const sAO = sFit + (fG / bw) ** (5 / 3);
  const andrews = (s2: number) => Math.exp(-s2) + (1 - Math.exp(-s2)) / (1 + (D / r0) ** (5 / 3));
  console.log(`  Strehl code(open)=${T.strehlRatio(sOpen, D, r0).toPrecision(5)} exp=${Math.exp(-sOpen).toPrecision(5)} (1+(D/r0)^5/3)^-6/5=${((1 + (D / r0) ** (5 / 3)) ** (-6 / 5)).toPrecision(5)} AndrewsMix=${andrews(sOpen).toPrecision(5)}`);
  console.log(`  Strehl code(AO)=${T.strehlRatio(sAO, D, r0).toPrecision(5)} exp(-s)=${Math.exp(-sAO).toPrecision(5)} mix=${andrews(sAO).toPrecision(5)}`);
  row(`Noll J=${N} 0.2944 J^-0.866 (D/r0)^5/3`, 0.2944 * N ** (-Math.sqrt(3) / 2) * (D / r0) ** (5 / 3), T.fittingErrorVariance(N, D, r0));
}

console.log("=== QKD defaults (GYS) 50 km and 140 km, 160 km");
for (const Lkm of [0, 50, 140, 160]) {
  const mu = 0.48, Y0 = 1.7e-6, ed = 0.033, f = 1.22;
  const eta = 0.045 * 10 ** (-0.21 * Lkm / 10);
  const Qmu = Y0 + 1 - Math.exp(-eta * mu);
  const Emu = (0.5 * Y0 + ed * (1 - Math.exp(-eta * mu))) / Qmu;
  const Y1 = Y0 + eta, e1 = (0.5 * Y0 + ed * eta) / Y1, Q1 = Y1 * mu * Math.exp(-mu);
  const R = 0.5 * (-Qmu * f * h2(Emu) + Q1 * (1 - h2(e1)));
  const k = K.decoyBb84({ mu, eta, y0: Y0, eDetector: ed, fEc: f });
  row(`L=${Lkm} gain Q_mu`, Qmu, k.gain); row(`  E_mu`, Emu, k.qber); row(`  e1`, e1, k.e1);
  row(`  key/pulse (q=1/2)`, R, k.keyPerPulse);
}
row("PLOB eta=0.1", -Math.log2(1 - 0.1), K.plobBound(0.1));

console.log("=== BER photon counting OOK (n=100/bit, nb=100/slot) and nb=0, n=10 ; DPSK");
function ookBer(n: number, nb: number) {
  // signal pulse 2n in 'on' slot, nb noise in both; threshold k decides 1 if X >= k; equiprobable bits
  let best = 1, kb = 0;
  for (let k = 0; k <= 2 * n + nb + 20 * Math.sqrt(2 * n + nb + 1) + 50; k++) {
    const pe = 0.5 * (1 - poissonCdf(k - 1, nb)) + 0.5 * poissonCdf(k - 1, 2 * n + nb);
    if (pe < best) { best = pe; kb = k; }
  }
  return { ber: best, k: kb };
}
for (const [n, nb] of [[100, 100], [10, 0], [20, 1], [5, 0.1]] as const) {
  const m = ookBer(n, nb), c = B.ookPhotonCountingBer(n, nb);
  row(`OOK n=${n} nb=${nb} (thr mine ${m.k}, code ${c.threshold})`, m.ber, c.ber);
}
for (const n of [5, 10, 20]) row(`DPSK n=${n} nb=0 0.5e^-n`, 0.5 * Math.exp(-n), B.dpskPhotonCountingBer(n, 0));
console.log(`  DPSK n=100 nb=100 code=${B.dpskPhotonCountingBer(100, 100).toExponential(3)}; n=10 nb=1 code=${B.dpskPhotonCountingBer(10, 1).toExponential(3)}`);
console.log(`  required OOK 1e-9 nb=0 code=${B.requiredPhotonsPerBit("OOK", 1e-9, 0)} (expect ln(1/(2e-9))/2=${(Math.log(1 / 2e-9) / 2).toFixed(3)} with 2n photons in pulse)`);

console.log("=== BPSK/QPSK Eb/N0 10 dB, coherent");
const g = 10;
row("BPSK Q(sqrt(2g))", Qf(Math.sqrt(2 * g)), P.bpskBer(g));
const p = Qf(Math.sqrt(2 * g));
row("QPSK SER 2p-p^2", 2 * p - p * p, P.qpskSer(g));
row("req Eb/N0 1e-9 dB", 10 * Math.log10(((5.997807) ** 2) / 2), P.requiredEbN0dB(1e-9));
const lam = 1550e-9, hv = H * C / lam;
row("N0 heterodyne hv/eta", hv, P.shotNoiseN0(lam, 1, "heterodyne"));
row("N0 homodyne hv/(2eta)", hv / 2, P.shotNoiseN0(lam, 1, "homodyne"));

console.log("=== channel capacity B=1GHz SNR=20dB; BER vs Es/N0 (SNR=10 dB)");
row("Shannon", 1e9 * Math.log2(101), CC.shannonCapacity(1e9, 100));
const es = 10;
row("BPSK Q(sqrt(2Es))", Qf(Math.sqrt(2 * es)), CC.bitErrorRate("BPSK", es));
row("QPSK Q(sqrt(Es))", Qf(Math.sqrt(es)), CC.bitErrorRate("QPSK", es));
const x = Math.sqrt(es / 5);
row("16QAM (3Q(x)+2Q(3x)-Q(5x))/4", (3 * Qf(x) + 2 * Qf(3 * x) - Qf(5 * x)) / 4, CC.bitErrorRate("16QAM", es));
// 8PSK exact Gray via phase pdf
function phasePdf(th: number, gm: number) {
  const ct = Math.cos(th);
  return Math.exp(-gm) / (2 * Math.PI) * (1 + Math.sqrt(4 * Math.PI * gm) * ct * Math.exp(gm * ct * ct) * Qf(-Math.sqrt(2 * gm) * ct));
}
function psk8(gm: number) {
  const dist = [0, 1, 2, 1, 2, 3, 2, 1]; let pb = 0;
  for (let k = 1; k < 8; k++) {
    const a = (2 * k - 1) * Math.PI / 8, b = (2 * k + 1) * Math.PI / 8; const n = 2000; let s = 0;
    for (let i = 0; i < n; i++) s += phasePdf(a + (i + 0.5) * (b - a) / n, gm) * (b - a) / n;
    pb += dist[k] * s;
  }
  return pb / 3;
}
row("8PSK Gray exact", psk8(es * 2), CC.bitErrorRate("8PSK", es * 2));
console.log(`  OOK code BER at Es/N0=10: ${CC.bitErrorRate("OOK", es).toExponential(3)}; Q(sqrt(Es/2))=${Qf(Math.sqrt(es / 2)).toExponential(3)} Q(sqrt(Es))=${Qf(Math.sqrt(es)).toExponential(3)}`);
row("h2(0.11)", h2(0.11), CC.binaryEntropy(0.11));
row("Shannon Eb/N0 at eta=2: (2^2-1)/2", 1.5, CC.shannonEbN0(2));
console.log("erfc check", erfc(1).toPrecision(10), "(0.1572992071)");
