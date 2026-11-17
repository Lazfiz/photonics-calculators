// R1 batch 1: diffraction PSF, resolution, MTF basics, light-sheet, TIRF, sectioning, multiphoton
import * as P from "../../../../src/physics/imaging/diffraction-psf";
import * as M from "../../../../src/physics/imaging/diffraction-mtf";
import * as S from "../../../../src/physics/imaging/super-resolution";
import * as O from "../../../../src/physics/imaging/optical-sectioning-thickness";
import * as MP from "../../../../src/physics/imaging/multiphoton-focus";
import * as LS from "../../../../src/physics/imaging/light-sheet";
import * as T from "../../../../src/physics/imaging/tirf";
import * as W from "../../../../src/physics/imaging/wavefront";

const row = (slug: string, q: string, mine: number, mod: number) =>
  console.log(`${slug.padEnd(14)} ${q.padEnd(28)} mine=${mine.toPrecision(6).padStart(12)} mod=${(+mod).toPrecision(6).padStart(12)} r=${(mod / mine).toFixed(4)}${Math.abs(mod / mine - 1) > 0.005 ? "  <<<" : ""}`);

// Bessel J0, J1 by series/integral
function J(n: number, x: number) { let s = 0; const N = 2000; for (let i = 0; i < N; i++) { const t = (i + 0.5) * Math.PI / N; s += Math.cos(n * t - x * Math.sin(t)); } return s / N; }
function bisect(f: (x: number) => number, a: number, b: number) { for (let i = 0; i < 100; i++) { const m = (a + b) / 2; if (f(a) * f(m) <= 0) b = m; else a = m; } return (a + b) / 2; }
const airy = (v: number) => (v === 0 ? 1 : (2 * J(1, v) / v) ** 2);
const sinc = (x: number) => (x === 0 ? 1 : Math.sin(x) / x);

for (const [lam, NA, n] of [[550e-9, 0.95, 1], [500e-9, 1.4, 1.518], [633e-9, 0.1, 1]]) {
  const vh = bisect((v) => airy(v) - 0.5, 0.5, 3);
  row("airy-disk", `r0 NA${NA}`, 3.8317059702 / (2 * Math.PI) * lam / NA, P.airyFirstZeroRadius(lam, NA));
  row("airy-disk", `FWHM NA${NA}`, 2 * vh / (2 * Math.PI) * lam / NA, P.airyFwhm(lam, NA));
  row("resolution", `Rayleigh NA${NA}`, 0.6098 * lam / NA, S.rayleighDistance(lam, NA));
  row("resolution", `abbe(λ/2NA?) NA${NA}`, lam / (2 * NA), S.abbeLateralFwhm(lam, NA));
  // axial: paraxial sinc^2(u/4) first zero u=4π -> z = 2 n λ/NA^2; exact λ/(n(1-cosα))
  const ca = Math.sqrt(1 - (NA / n) ** 2);
  row("psf-calc", `axZero exact NA${NA}`, lam / (n * (1 - ca)), P.axialFirstZero(lam, n, NA));
  row("psf-calc", `axZero parax NA${NA}`, 2 * n * lam / NA ** 2, O.widefieldAxialFirstZero(lam, n, NA));
  row("resolution", `axFWHM 0.886/(n(1-c))`, 0.8859 * lam / (n * (1 - ca)), O.axialPsfFwhm(lam, n, NA));
  row("resolution", `axFWHM parax 1.772`, 1.7718 * lam * n / NA ** 2, O.axialPsfFwhm(lam, n, NA));
  row("dof", `λn/NA²`, lam * n / NA ** 2, O.widefieldDepthOfField(lam, n, NA));
  row("mtf", `cutoff 2NA/λ (/m)`, 2 * NA / lam, M.cutoffFrequency(NA, lam));
  // Zipfel
  const wxy = NA <= 0.7 ? 0.32 * lam / (Math.SQRT2 * NA) : 0.325 * lam / (Math.SQRT2 * NA ** 0.91);
  const wz = 0.532 * lam / Math.SQRT2 / (n - Math.sqrt(n * n - NA * NA));
  row("two-photon", `ωxy Zipfel`, wxy, MP.zipfelLateralRadius(lam, NA));
  row("two-photon", `ωz Zipfel`, wz, MP.zipfelAxialRadius(lam, n, NA));
  row("two-photon", `axFWHM ωz√ln2`, wz * Math.sqrt(Math.LN2), O.twoPhotonAxialFwhm(lam, n, NA));
  const mf2 = MP.multiphotonFwhm(lam, n, NA, 2) as unknown as { lateral: number; axial: number };
  console.log("  multiphotonFwhm(2) =", JSON.stringify(mf2), " mine lat", (wxy * Math.sqrt(Math.LN2)).toExponential(4));
  const mf3 = MP.multiphotonFwhm(lam, n, NA, 3) as unknown as { lateral: number; axial: number };
  console.log("  multiphotonFwhm(3) =", JSON.stringify(mf3), " mine lat", (wxy * Math.sqrt(2 * Math.LN2 / 3)).toExponential(4), "ax", (wz * Math.sqrt(2 * Math.LN2 / 3)).toExponential(4));
}
// MTF
for (const nu of [0.1, 0.5, 0.9]) row("mtf", `MTF(${nu})`, (2 / Math.PI) * (Math.acos(nu) - nu * Math.sqrt(1 - nu * nu)), M.diffractionMtf(nu));
// defocused OTF, numerical pupil overlap with W020 (waves) at nu (normalised to 2NA/λ): shift pupils by ±nu (radius 1)
function otfNum(nu: number, w: number) {
  const N = 600; let re = 0, im = 0; const s = nu; // pupil radius 1, shift 2*nu between centres => ±nu
  const h = 2 / N;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = -1 + (i + 0.5) * h, y = -1 + (j + 0.5) * h;
    const r1 = (x + s) ** 2 + y * y, r2 = (x - s) ** 2 + y * y;
    if (r1 <= 1 && r2 <= 1) { const ph = 2 * Math.PI * w * (r1 - r2); re += Math.cos(ph); im += Math.sin(ph); }
  }
  return Math.hypot(re, im) * h * h / Math.PI;
}
for (const [nu, w] of [[0.5, 0], [0.5, 2.578 / (2 * Math.PI)], [0.2, 0.5], [0.5, 1]]) row("mtf", `OTF(${nu},W=${w.toFixed(3)}λ)`, otfNum(nu, w), M.defocusedOtf(nu, w));
// Strehl
for (const s of [0.05, 0.1, 0.2]) row("strehl", `Maréchal exp σ=${s}λ`, Math.exp(-((2 * Math.PI * s) ** 2)), W.marechalStrehl(s * 550e-9, 550e-9));
for (const s of [0.05, 0.2, 0.4]) row("strehl", `defocus exact σ=${s}`, sinc(Math.PI * 2 * Math.sqrt(3) * s) ** 2, W.defocusStrehlExact(s));
const pv: Record<string, number> = { defocus: 2 * Math.sqrt(3), astigmatism: 2 * Math.sqrt(6), coma: 2 * Math.sqrt(8), spherical: 1.5 * Math.sqrt(5), trefoil: 2 * Math.sqrt(8) };
for (const [k, v] of Object.entries(W.PV_RMS_RATIO)) row("strehl", `PV/RMS ${k}`, pv[k] ?? NaN, v);
// light sheet
for (const [lam, NA, n] of [[488e-9, 0.05, 1.33], [488e-9, 0.3, 1.33]]) {
  const w0 = lam / (Math.PI * NA);
  row("light-sheet", `w0 λ/(πNA) NA${NA}`, w0, LS.gaussianSheetWaist(lam, NA));
  row("light-sheet", `zR πw0²n/λ`, Math.PI * w0 * w0 * n / lam, LS.gaussianSheetRayleighRange(lam, NA, n));
  row("light-sheet", `FWHM 1.1774w0`, w0 * Math.sqrt(2 * Math.LN2), LS.gaussianSheetFwhm(lam, NA));
  row("light-sheet", `θ asin(NA/n)`, Math.asin(NA / n), LS.gaussianSheetDivergence(NA, n));
}
// TIRF
{
  const lam = 488e-9, n1 = 1.518, n2 = 1.33, th = 70 * Math.PI / 180;
  row("tirf", "θc", Math.asin(n2 / n1), T.tirfCriticalAngle(n1, n2));
  row("tirf", "θmax NA1.49", Math.asin(1.49 / n1), T.tirfMaxAngle(1.49, n1));
  row("tirf", "d", lam / (4 * Math.PI * Math.sqrt(n1 ** 2 * Math.sin(th) ** 2 - n2 ** 2)), T.tirfPenetrationDepth(lam, n1, n2, th));
  const m = n2 / n1, c2 = Math.cos(th) ** 2, s2 = Math.sin(th) ** 2;
  const Is = 4 * c2 / (1 - m * m), Ip = 4 * c2 * (2 * s2 - m * m) / (m ** 4 * c2 + s2 - m * m);
  const r = T.tirfInterfaceIntensity(n1, n2, th);
  row("tirf", "I0 s", Is, r.s); row("tirf", "I0 p", Ip, r.p);
  console.log("tirf below crit d=", T.tirfPenetrationDepth(lam, n1, n2, 50 * Math.PI / 180), " NA>n1 θmax=", T.tirfMaxAngle(1.6, n1));
}
console.log("guards: airyFwhm NA0", P.airyFwhm(5e-7, 0), " axialFirstZero NA>n", P.axialFirstZero(5e-7, 1, 1.2), " axFWHM NA>n", O.axialPsfFwhm(5e-7, 1, 1.2), " zipfelAx NA>n", MP.zipfelAxialRadius(5e-7, 1.33, 1.4));
console.log("naFromFNumber(2)", P.naFromFNumber(2), "mine 1/(2N)=0.25 / sin(atan(1/4))=", Math.sin(Math.atan(0.25)), " thinLensNa(2)", P.thinLensNa(2), " fNumberFromNa(0.25)", P.fNumberFromNa(0.25));
row("airy-disk", "EE(3.8317)", 1 - J(0, 3.8317) ** 2 - J(1, 3.8317) ** 2, P.encircledEnergyAiry(3.8317));
