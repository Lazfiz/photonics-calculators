// Lead probe 1: numeric core (complex sqrt, FFT, RNG) and invariant scans (TMM, Mueller, ABCD).
// Run: npx tsx docs/audit/fable-p3-probes/lead/probe-core.ts
import * as C from "../../../../src/physics/complex";
import { dft, fftRadix2 } from "../../../../src/physics/fft";
import { createRng, gaussian } from "../../../../src/physics/random";
import { stackResponse, type Stack } from "../../../../src/physics/thin-film/transfer-matrix";
import { fresnel } from "../../../../src/physics/polarization/fresnel";
import * as J from "../../../../src/physics/polarization/jones";
import * as M from "../../../../src/physics/polarization/mueller";
import * as A from "../../../../src/physics/wave-optics/abcd";
import { twoMirrorMode, gParameter, oneWayGouyPhase } from "../../../../src/physics/wave-optics/two-mirror-resonator";

const rng = createRng(12345);
const U = (a: number, b: number) => a + (b - a) * rng();
let worst: Record<string, number> = {};
const track = (k: string, v: number) => { worst[k] = Math.max(worst[k] ?? 0, Number.isFinite(v) ? v : Infinity); };

// ---- 1. complex sqrt: branch and accuracy
for (let i = 0; i < 20000; i++) {
  const z = { re: U(-5, 5) * 10 ** U(-8, 8), im: U(-5, 5) * 10 ** U(-8, 8) };
  const s = C.sqrt(z);
  const back = C.mul(s, s);
  track("csqrt |s^2-z|/|z|", C.abs(C.sub(back, z)) / C.abs(z));
  if (s.re < 0) track("csqrt Re<0", 1);
  if (z.im !== 0 && Math.sign(s.im) !== Math.sign(z.im)) track("csqrt sign(Im) mismatch", 1);
}
console.log("csqrt(-4+0i) =", C.sqrt({ re: -4, im: 0 }), " csqrt(-4-0i) =", C.sqrt({ re: -4, im: -0 }), " csqrt(-4-1e-300i) =", C.sqrt({ re: -4, im: -1e-300 }));
console.log("csqrt(1e-320) =", C.sqrt({ re: 1e-320, im: 0 }), " csqrt(-1e308,1e308) =", C.sqrt({ re: -1e308, im: 1e308 }));
console.log("div by 0 =", C.div({ re: 1, im: 0 }, { re: 0, im: 0 }), " div huge =", C.div({ re: 1e200, im: 1e200 }, { re: 1e200, im: 1e200 }));

// ---- 2. FFT: naive DFT comparison, round trip, Parseval, for power-of-two and other lengths
for (const N of [1, 2, 3, 5, 8, 12, 17, 64, 100, 127, 256, 1000, 1024]) {
  const re = Array.from({ length: N }, () => gaussian(rng));
  const im = Array.from({ length: N }, () => gaussian(rng));
  const F = dft(re, im);
  let e = 0, norm = 0;
  if (N <= 256) for (let k = 0; k < N; k++) {
    let sr = 0, si = 0;
    for (let n = 0; n < N; n++) {
      const a = (-2 * Math.PI * k * n) / N;
      sr += re[n] * Math.cos(a) - im[n] * Math.sin(a);
      si += re[n] * Math.sin(a) + im[n] * Math.cos(a);
    }
    e = Math.max(e, Math.hypot(F.re[k] - sr, F.im[k] - si));
    norm = Math.max(norm, Math.hypot(sr, si));
  }
  const back = dft(F.re, F.im, true);
  let rt = 0;
  for (let n = 0; n < N; n++) rt = Math.max(rt, Math.hypot(back.re[n] - re[n], back.im[n] - im[n]));
  const pt = re.reduce((s, x, i) => s + x * x + im[i] * im[i], 0);
  const pf = F.re.reduce((s, x, i) => s + x * x + F.im[i] * F.im[i], 0) / N;
  track("fft vs naive (rel)", N <= 256 && norm > 0 ? e / norm : 0);
  track("fft round trip", rt);
  track("fft Parseval rel", Math.abs(pf / pt - 1));
}
{ // delta at n=1 must give e^{-2πik/N} (forward sign)
  const re = [0, 1, 0, 0, 0, 0, 0, 0], im = new Array(8).fill(0);
  fftRadix2(re, im);
  console.log("FFT delta[1], bin 1 =", re[1].toFixed(6), im[1].toFixed(6), "(expect 0.707107 -0.707107)");
}

// ---- 3. RNG: mean/variance of gaussian, uniform range
{
  const g = createRng(1);
  let s = 0, s2 = 0, mx = 0, mn = 1;
  const n = 200000;
  for (let i = 0; i < n; i++) { const x = gaussian(g); s += x; s2 += x * x; }
  for (let i = 0; i < n; i++) { const u = g(); mx = Math.max(mx, u); mn = Math.min(mn, u); }
  console.log(`rng gaussian mean ${(s / n).toFixed(4)} var ${(s2 / n).toFixed(4)}; uniform min ${mn.toExponential(2)} max<1 ${mx < 1}`);
  const a = createRng(42), b = createRng(42 + 2 ** 32);
  console.log("seed wraps mod 2^32:", a() === b(), " first of seed 0:", createRng(0)());
}

// ---- 4. TMM: independent implementation (Born & Wolf / Macleod with e^{-iwt}, N = n + ik), naive complex
type Cx = C.Complex;
function myStack(st: Stack, wl: number, th: number, pol: "s" | "p") {
  const beta = st.incident * Math.sin(th);
  const cosN = (n: number, k: number): Cx => {
    const N2 = C.mul({ re: n, im: k }, { re: n, im: k });
    let q = C.sqrt({ re: N2.re - beta * beta, im: N2.im });
    if (q.im < 0) q = C.scale(q, -1);
    return q; // N cos θ
  };
  const eta = (n: number, k: number): Cx => {
    const q = cosN(n, k);
    return pol === "s" ? q : C.div(C.mul({ re: n, im: k }, { re: n, im: k }), q);
  };
  let m: Cx[][] = [[C.complex(1), C.complex(0)], [C.complex(0), C.complex(1)]];
  for (const L of st.layers) {
    const q = cosN(L.n, L.k ?? 0);
    const d = C.scale(q, (2 * Math.PI * L.thickness) / wl);
    const e1 = C.exp(C.mul({ re: 0, im: 1 }, d)), e2 = C.exp(C.mul({ re: 0, im: -1 }, d));
    const cos = C.scale(C.add(e1, e2), 0.5);
    const sin = C.div(C.sub(e1, e2), { re: 0, im: 2 });
    const et = eta(L.n, L.k ?? 0);
    const l: Cx[][] = [[cos, C.mul({ re: 0, im: -1 }, C.div(sin, et))], [C.mul({ re: 0, im: -1 }, C.mul(et, sin)), cos]];
    m = [
      [C.add(C.mul(m[0][0], l[0][0]), C.mul(m[0][1], l[1][0])), C.add(C.mul(m[0][0], l[0][1]), C.mul(m[0][1], l[1][1]))],
      [C.add(C.mul(m[1][0], l[0][0]), C.mul(m[1][1], l[1][0])), C.add(C.mul(m[1][0], l[0][1]), C.mul(m[1][1], l[1][1]))],
    ];
  }
  const es = eta(st.substrate.n, st.substrate.k ?? 0);
  const e0 = pol === "s" ? st.incident * Math.cos(th) : st.incident / Math.cos(th);
  const B = C.add(m[0][0], C.mul(m[0][1], es)), Cc = C.add(m[1][0], C.mul(m[1][1], es));
  const den = C.add(C.scale(B, e0), Cc);
  const r = C.div(C.sub(C.scale(B, e0), Cc), den);
  const T = (4 * e0 * es.re) / C.abs2(den);
  return { R: C.abs2(r), T, r };
}
let nTir = 0;
for (let i = 0; i < 20000; i++) {
  const lossy = i % 2 === 1;
  const nl = Math.floor(U(0, 9));
  const st: Stack = {
    incident: U(1, 2.5),
    layers: Array.from({ length: nl }, () => ({ n: U(1, 4), k: lossy && rng() < 0.5 ? 10 ** U(-4, 0.7) : 0, thickness: U(0, 600e-9) })),
    substrate: { n: U(1, 4), k: lossy && rng() < 0.5 ? 10 ** U(-4, 0.7) : 0 },
  };
  const wl = U(300e-9, 2000e-9), th = U(0, 89.5) * Math.PI / 180;
  for (const pol of ["s", "p"] as const) {
    const a = stackResponse(st, wl, th, pol);
    const b = myStack(st, wl, th, pol);
    track(lossy ? "TMM lossy |R+T+A-1|" : "TMM lossless |R+T-1|", Math.abs(a.R + a.T + (lossy ? a.A : 0) - 1));
    if (!lossy) track("TMM lossless |A|", Math.abs(a.A));
    if (lossy && a.A < -1e-12) track("TMM lossy A<0", -a.A);
    track("TMM vs own R", Math.abs(a.R - b.R));
    track("TMM vs own T", Math.abs(a.T - b.T));
    if (!lossy && st.incident * Math.sin(th) > st.substrate.n) { nTir++; track("TMM TIR |R-1|", Math.abs(a.R - 1)); track("TMM TIR T", Math.abs(a.T)); }
  }
}
console.log("TIR cases scanned:", nTir);
// bare interface vs polarization/fresnel.ts (other convention), incl. absorbing substrate and TIR edge
for (let i = 0; i < 5000; i++) {
  const n1 = U(1, 2.5), n2 = U(0.2, 4), k2 = rng() < 0.5 ? 0 : 10 ** U(-3, 1), th = U(0, 89.9) * Math.PI / 180;
  const f = fresnel(n1, n2, th, k2);
  const s = stackResponse({ incident: n1, layers: [], substrate: { n: n2, k: k2 } }, 500e-9, th, "s");
  const p = stackResponse({ incident: n1, layers: [], substrate: { n: n2, k: k2 } }, 500e-9, th, "p");
  track("fresnel.ts vs TMM Rs", Math.abs(f.Rs - s.R)); track("fresnel.ts vs TMM Rp", Math.abs(f.Rp - p.R));
  track("fresnel.ts vs TMM Ts", Math.abs(f.Ts - s.T)); track("fresnel.ts vs TMM Tp", Math.abs(f.Tp - p.T));
  track("fresnel.ts |Rs+Ts-1|", Math.abs(f.Rs + f.Ts - 1)); track("fresnel.ts |Rp+Tp-1|", Math.abs(f.Rp + f.Tp - 1));
}
{ // around the critical angle, glass -> air; frustrated TIR vs closed form; thick absorber; layer at critical angle
  const n1 = 1.5, thc = Math.asin(1 / 1.5);
  for (const d of [-1e-6, -1e-12, 0, 1e-12, 1e-6]) {
    const f = fresnel(n1, 1, thc + d), s = stackResponse({ incident: n1, layers: [], substrate: { n: 1 } }, 5e-7, thc + d, "p");
    console.log(`θc${d >= 0 ? "+" : ""}${d}: fresnel Rs ${f.Rs.toFixed(6)} Rp ${f.Rp.toFixed(6)} tir ${f.tir} Tp ${f.Tp.toExponential(2)} | TMM Rp ${s.R.toFixed(6)} T ${s.T.toExponential(2)}`);
  }
  // FTIR: glass | air gap d | glass at 45°, s: T = 1/(1 + ((q1²+κ²)²/(4 q1² κ²)) sinh²(κ k0 d))
  const th = Math.PI / 4, wl = 633e-9, d = 200e-9;
  const q1 = n1 * Math.cos(th), kap = Math.sqrt((n1 * Math.sin(th)) ** 2 - 1);
  const Texp = 1 / (1 + ((q1 * q1 + kap * kap) ** 2 / (4 * q1 * q1 * kap * kap)) * Math.sinh((2 * Math.PI * d * kap) / wl) ** 2);
  const ft = stackResponse({ incident: n1, layers: [{ n: 1, thickness: d }], substrate: { n: n1 } }, wl, th, "s");
  console.log(`FTIR s 45° 200 nm gap: TMM T ${ft.T.toFixed(8)} closed form ${Texp.toFixed(8)} R+T ${(ft.R + ft.T).toFixed(12)}`);
  const thick = stackResponse({ incident: 1, layers: [{ n: 0.05, k: 4, thickness: 1e-3 }], substrate: { n: 1.5 } }, 5e-7, 0.3, "p");
  console.log("1 mm silver-like layer:", thick.R.toFixed(6), thick.T, thick.A.toFixed(6));
  const crit = stackResponse({ incident: 1.5, layers: [{ n: 1.5 * Math.sin(0.9), thickness: 300e-9 }], substrate: { n: 1.5 } }, 5e-7, 0.9, "p");
  console.log("layer exactly at its critical angle: R", crit.R.toFixed(6), "T", crit.T.toFixed(6), "sum", (crit.R + crit.T).toFixed(12));
}

// ---- 5. Mueller: Jones-derived = closed forms; products satisfy the Cloude test (coherency matrix PSD)
function cloudeMinEig(Mm: number[][]): number {
  // H = 1/4 Σ m_ij (σ_i ⊗ σ_j*), Hermitian 4×4; min eigenvalue by Jacobi on the real 8×8 embedding.
  const s: Cx[][][] = [
    [[C.complex(1), C.complex(0)], [C.complex(0), C.complex(1)]],
    [[C.complex(1), C.complex(0)], [C.complex(0), C.complex(-1)]],
    [[C.complex(0), C.complex(1)], [C.complex(1), C.complex(0)]],
    [[C.complex(0), C.complex(0, -1)], [C.complex(0, 1), C.complex(0)]],
  ];
  const H: Cx[][] = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => C.complex(0)));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++)
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) for (let d = 0; d < 2; d++)
      H[2 * a + c][2 * b + d] = C.add(H[2 * a + c][2 * b + d], C.scale(C.mul(s[i][a][b], C.conj(s[j][c][d])), Mm[i][j] / 4));
  const n = 8, R = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => {
    const h = H[i % 4][j % 4];
    return i < 4 === j < 4 ? h.re : i < 4 ? -h.im : h.im;
  }));
  for (let sweep = 0; sweep < 60; sweep++) for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
    if (Math.abs(R[p][q]) < 1e-18) continue;
    const t = 0.5 * Math.atan2(2 * R[p][q], R[q][q] - R[p][p]), c = Math.cos(t), sn = Math.sin(t);
    for (let k = 0; k < n; k++) { const x = R[k][p], y = R[k][q]; R[k][p] = c * x - sn * y; R[k][q] = sn * x + c * y; }
    for (let k = 0; k < n; k++) { const x = R[p][k], y = R[q][k]; R[p][k] = c * x - sn * y; R[q][k] = sn * x + c * y; }
  }
  return Math.min(...R.map((r, i) => r[i]));
}
const maxDiff = (X: number[][], Y: number[][]) => Math.max(...X.flatMap((r, i) => r.map((x, j) => Math.abs(x - Y[i][j]))));
for (let i = 0; i < 400; i++) {
  const th = U(-Math.PI, Math.PI), g = U(-7, 7);
  track("Mueller polarizer vs Jones", maxDiff(M.muellerPolarizer(th), M.muellerFromJones(J.linearPolarizer(th))));
  track("Mueller retarder vs Jones", maxDiff(M.muellerRetarder(g, th), M.muellerFromJones(J.linearRetarder(g, th))));
  track("Mueller rotator vs Jones", maxDiff(M.muellerRotator(th), M.muellerFromJones(J.rotator(th))));
  track("Mueller circ pol vs Jones", maxDiff(M.muellerCircularPolarizer("right"), M.muellerFromJones(J.circularPolarizer("right"))));
  const chain = [M.muellerPolarizer(U(0, 3)), M.muellerRetarder(U(0, 7), U(0, 3)), M.muellerDepolarizer(U(-1 / 3, 1)), M.muellerRotator(U(0, 3)), M.muellerRetarder(U(0, 7), U(0, 3))]
    .sort(() => rng() - 0.5).slice(0, 1 + Math.floor(U(0, 5)));
  const prod = M.chainMueller(chain);
  track("Mueller chain: -min Cloude eig", Math.max(0, -cloudeMinEig(prod)));
  const S = M.applyMueller(prod, [1, U(-0.5, 0.5), U(-0.5, 0.5), U(-0.5, 0.5)]);
  track("Mueller chain: DOP excess", Math.max(0, Math.hypot(S[1], S[2], S[3]) - S[0]));
}
console.log("Cloude min eig: depolarizer d=-1/3:", cloudeMinEig(M.muellerDepolarizer(-1 / 3)).toExponential(2), " d=-0.34 (hand-built):", cloudeMinEig([[1, 0, 0, 0], [0, -0.34, 0, 0], [0, 0, -0.34, 0], [0, 0, 0, -0.34]]).toExponential(2), " module d=-0.34 →", M.muellerDepolarizer(-0.34)[1][1]);
console.log("QWP fast H on +45°: Jones S =", J.stokesFromJones(J.apply(J.linearRetarder(Math.PI / 2, 0), J.linearState(Math.PI / 4))).map((x) => +x.toFixed(6)), " Mueller S =", M.applyMueller(M.muellerRetarder(Math.PI / 2, 0), [1, 0, 1, 0]).map((x) => +x.toFixed(6)));
console.log("Stokes of RCP:", J.stokesFromJones(J.RCP), " elliptical(20°,15°):", J.stokesFromJones(J.ellipticalState(20 * Math.PI / 180, 15 * Math.PI / 180)).map((x) => +x.toFixed(6)), "expect", [1, Math.cos(Math.PI / 6) * Math.cos(40 * Math.PI / 180), Math.cos(Math.PI / 6) * Math.sin(40 * Math.PI / 180), 0.5].map((x) => +x.toFixed(6)));

// ---- 6. ABCD: determinant, resonator eigenmode vs closed-form two-mirror mode
for (let i = 0; i < 3000; i++) {
  const els: A.AbcdElement[] = Array.from({ length: 1 + Math.floor(U(0, 12)) }, () => {
    const t = Math.floor(U(0, 5));
    return t === 0 ? { kind: "space", d: U(0, 2) } : t === 1 ? { kind: "lens", f: U(-1, 1) || 0.1 } : t === 2 ? { kind: "flat-mirror" }
      : t === 3 ? { kind: "curved-mirror", R: U(-2, 2) || 0.3 } : { kind: "interface", n1: U(1, 3), n2: U(1, 3) };
  });
  const Ms = A.systemMatrix(els);
  track("ABCD |det/expected-1|", Math.abs(A.determinant(Ms) / A.expectedDeterminant(els) - 1));
}
let nStable = 0;
for (let i = 0; i < 5000; i++) {
  const L = U(0.01, 2), R1 = (rng() < 0.2 ? -1 : 1) * U(0.05, 5), R2 = (rng() < 0.2 ? -1 : 1) * U(0.05, 5), lam = 1064e-9;
  const g1 = gParameter(L, R1), g2 = gParameter(L, R2);
  // round trip starting just after mirror 1 (travelling to mirror 2): space L, mirror 2, space L, mirror 1
  const rt = A.systemMatrix([{ kind: "space", d: L }, { kind: "curved-mirror", R: R2 }, { kind: "space", d: L }, { kind: "curved-mirror", R: R1 }]);
  track("round trip |det-1|", Math.abs(A.determinant(rt) - 1));
  const e = A.periodicEigenmode(rt, lam), t = twoMirrorMode(lam, L, g1, g2);
  const stableG = g1 * g2 > 1e-6 && g1 * g2 < 1 - 1e-6;
  if (stableG) {
    nStable++;
    track("half-trace vs 2g1g2-1", Math.abs(e.m - (2 * g1 * g2 - 1)));
    track("eigenmode w1 rel", Math.abs(e.w / t.w1 - 1));
    track("eigenmode w0 rel", Math.abs(e.w0 / t.w0 - 1));
    track("eigenmode waist pos rel L", Math.abs(-e.z - t.z1) / L); // q at mirror 1 heading to mirror 2: waist lies z1 ahead → Re q = −z1
    if (!(e.zR > 0)) track("stable but q not complex", 1);
  } else if (g1 * g2 < -1e-6 || g1 * g2 > 1 + 1e-6) {
    if (Number.isFinite(e.w) || Number.isFinite(t.w0)) track("unstable but finite mode", 1);
  }
}
console.log("stable cavities scanned:", nStable);
console.log(Object.entries(worst).map(([k, v]) => `${k.padEnd(40)} ${v.toExponential(2)}`).join("\n"));
