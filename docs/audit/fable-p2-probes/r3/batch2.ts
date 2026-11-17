// R3 batch2: nonlinear-crystals, damage-threshold, semiconductor-bandgap, two-photon-absorption, nonlinear-index
import * as NL from "../../../../src/physics/materials/nonlinear-crystals";
import * as LD from "../../../../src/physics/materials/laser-damage";
import * as BG from "../../../../src/physics/materials/bandgap";
import * as TP from "../../../../src/physics/materials/two-photon";
import * as KI from "../../../../src/physics/materials/kerr-index";
const p = (s: string, mine: number, mod: number) =>
  console.log(`${s.padEnd(36)} mine=${mine.toPrecision(5)} mod=${mod.toPrecision(5)} ratio=${(mod / mine).toFixed(4)}`);
const deg = Math.PI / 180;
p("BBO type-I theta deg (22.8)", 22.8, NL.BBO_THETA / deg);
const bbo = NL.SHG_CRYSTALS.bbo;
p("BBO deff pm/V (~2.0)", 2.0, bbo.deff * 1e12);
p("BBO walkoff mrad (~56)", 56, bbo.walkOff * 1e3);
p("LBO walkoff mrad (~7.3)", 7.3, NL.SHG_CRYSTALS.lbo.walkOff * 1e3);
p("KTP deff (~3.6)", 3.6, NL.SHG_CRYSTALS.ktp.deff * 1e12);
p("KTP walkoff mrad (~4.5)", 4.5, NL.SHG_CRYSTALS.ktp.walkOff * 1e3);
p("BiBO theta (168.9->11.1 from Z)", 11.1, NL.BIBO_THETA / deg);
// my own BK: K = 16 pi^2 d^2 L h /(eps0 c n n lambda^3), h(0, xi) no walkoff, plane-wave check via small xi: h -> xi
const eps0 = 8.8541878128e-12, c = 299792458;
for (const id of ["ppln", "bbo"] as const) {
  const m = NL.SHG_CRYSTALS[id];
  const L = 0.01, w0 = 30e-6, lam = 1064e-9;
  const b = 2 * Math.PI * m.nOmega * w0 * w0 / lam, xi = L / b;
  // h(0,xi) no walkoff = (1/4xi)|int_{-xi}^{xi} dt/(1+it)|^2 = (1/4xi)(2 atan xi)^2 = atan^2(xi)/xi
  const h = Math.atan(xi) ** 2 / xi;
  const K = 16 * Math.PI ** 2 * m.deff ** 2 * L * h / (eps0 * c * m.nOmega * m.n2Omega * lam ** 3);
  const r = NL.focusedShg({ lambda: lam, length: L, deff: m.deff, nOmega: m.nOmega, n2Omega: m.n2Omega, w0, walkOff: id === "ppln" ? 0 : 0 });
  p(`${id} K (no walkoff) 1/W`, K, r.K);
  // plane-wave check: eta = 8 pi^2 d^2 L^2 I /(eps0 c n^3 lam^2), with I = P/(pi w^2) for xi<<1 ... (Gaussian: P2 = 8pi^2 d^2 L^2 P^2/(eps0 c n^2 n2 lam^2 pi w0^2))
  const wBig = 300e-6; const KPW = 8 * Math.PI ** 2 * m.deff ** 2 * L * L / (eps0 * c * m.nOmega * m.n2Omega * lam ** 2 * Math.PI * wBig ** 2);
  p(`${id} K near-field Gaussian w=300um`, KPW, NL.focusedShg({ lambda: lam, length: L, deff: m.deff, nOmega: m.nOmega, n2Omega: m.n2Omega, w0: wBig }).K);
}
const bw = NL.focusedShg({ lambda: 1064e-9, length: 0.01, deff: bbo.deff, nOmega: bbo.nOmega, n2Omega: bbo.n2Omega, w0: 30e-6, walkOff: bbo.walkOff });
console.log("BBO default with walkoff: K", bw.K.toExponential(3), "h", bw.h.toFixed(4), "B", bw.B.toFixed(2), "xi", bw.xi.toFixed(3));
// damage
p("LIDT 10J/cm2@10ns ->5ns (7.071)", 7.0711, LD.scaleDamageThreshold(10, 10e-9, 5e-9));
p("Fpeak 0.1J w2.5mm J/cm2 (1.0186)", 1.0186, LD.gaussianPeakFluence(0.1, 2.5e-3) / 1e4);
// bandgap
const g = (T: number, k: keyof typeof BG.VARSHNI) => BG.varshniBandGap(T, BG.VARSHNI[k]);
p("Si Eg 300K (1.1245)", 1.12452, g(300, "si"));
p("GaAs Eg 300K (1.4225)", 1.42248, g(300, "gaas"));
p("Ge Eg 300K (0.6643)", 0.7437 - 4.774e-4 * 9e4 / 535, g(300, "ge"));
p("InGaAs 0.53 300K (0.737)", 0.7373, BG.ingaasBandGap(0.53, 300));
p("GaN Eg 300K (3.438)", 3.507 - 9.09e-4 * 9e4 / 1130, g(300, "gan"));
console.log("Varshni T=-5:", g(-5, "si"), " T=0:", g(0, "si"), " ingaas x=1.5:", BG.ingaasBandGap(1.5, 300));
// 2PA
p("GaAs beta 1064 cm/GW (23 meas)", 23, TP.mediumBeta(TP.TPA_MEDIA.gaas, 1064e-9) / 1e-11);
p("GaAs eq1 predicted 1064 (VS85 ~ 26?)", 26, TP.scalingBeta(1064e-9, 3.43, 1.42, 25.7) / 1e-11);
p("GaAs scaled to 1300", (23 * TP.tpaF2(2 * 1239.84 / 1300 / 1.42)) / TP.tpaF2(2 * 1239.84 / 1064 / 1.42), TP.mediumBeta(TP.TPA_MEDIA.gaas, 1300e-9) / 1e-11);
p("Si indirect beta 1550 (0.5-0.9)", 0.8, TP.indirectBeta(1550e-9) / 1e-11);
p("Si indirect beta 1220 (meas 2.1?)", 2.1, TP.indirectBeta(1220e-9) / 1e-11);
p("Si mediumBeta 1550", 0.8, TP.mediumBeta(TP.TPA_MEDIA.silicon, 1550e-9) / 1e-11);
p("T slab beta=1e-11,I=1e13,L=1mm", 1 / (1 + 1e-11 * 1e13 * 1e-3), TP.tpaTransmission(1e-11, 1e13, 1e-3));
// Kerr
p("n2 esu->SI BaF2 7.5e-14 esu n1.47 (2.14e-20)", 40 * Math.PI * 7.5e-14 / (c * 1.47), KI.n2FromEsu(7.5e-14, 1.47));
for (const k of Object.keys(KI.KERR_MEDIA)) { const m: any = (KI.KERR_MEDIA as any)[k]; console.log("kerr", k, m.n2.toExponential(3), m.n0.toFixed(4), m.lambda * 1e9); }
p("sapphire n2 800nm (Major ~2.8e-20?)", 2.8e-20, KI.sapphireN2(800e-9));
p("pi-phase I FS 2.4e-20,1cm,800nm", 800e-9 / (2 * 2.4e-20 * 0.01), KI.piPhaseIntensity(800e-9, 2.4e-20, 0.01));
