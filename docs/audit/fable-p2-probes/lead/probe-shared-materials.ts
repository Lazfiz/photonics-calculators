// Lead probe: blackbody, CIE tables, ASTM G173, Sellmeier — independent numerics vs modules.
import * as bb from "../../../../src/physics/blackbody";
import * as ph from "../../../../src/physics/cie-photometry";
import * as col from "../../../../src/physics/cie-colour";
import * as g from "../../../../src/physics/astm-g173";
import * as se from "../../../../src/physics/materials/sellmeier";
import { MATERIALS, SCHOTT_GLASSES } from "../../../../src/physics/materials/sellmeier-data";
import * as mtf from "../../../../src/physics/imaging/diffraction-mtf";
const row = (s: string, mine: number, mod: number) =>
  console.log(s.padEnd(56), mine.toPrecision(7).padStart(13), mod.toPrecision(7).padStart(13), (mod / mine).toFixed(5));
const c = 299792458, h = 6.62607015e-34, kB = 1.380649e-23;

{
  const T = 5772, sigma = (2 * Math.PI ** 5 * kB ** 4) / (15 * h ** 3 * c * c);
  const M = (l: number) => (2 * Math.PI * h * c * c) / (l ** 5 * Math.expm1((h * c) / (l * kB * T)));
  let tot = 0, vis = 0, peakL = 0, peak = 0;
  const N = 400000, lo = Math.log(20e-9), hi = Math.log(1e-3);
  for (let k = 0; k < N; k++) {
    const l = Math.exp(lo + ((k + 0.5) * (hi - lo)) / N);
    const w = M(l) * l * ((hi - lo) / N);
    tot += w;
    if (l > 380e-9 && l < 780e-9) vis += w;
    if (M(l) > peak) { peak = M(l); peakL = l; }
  }
  row("sigma T^4 5772 K, own integration vs module", tot, bb.totalExitance(T));
  row("sigma T^4 from CODATA sigma", sigma * T ** 4, bb.totalExitance(T));
  row("fraction 380-780 nm", vis / tot, bb.blackbodyBandFraction(380e-9, 780e-9, T));
  row("M_lambda(500 nm)", M(500e-9), bb.planckExitance(500e-9, T));
  row("Wien peak (m) vs 2.897771955e-3/T", 2.897771955e-3 / T, peakL);
  row("F(0 -> Wien peak) [0.25005]", 0.25005, bb.blackbodyFractionBelow(2.897771955e-3 / 300, 300));
  const c2 = (h * c) / kB;
  console.log("  branch continuity at x=1:", bb.blackbodyFractionBelow(c2 / (300 * 0.9999999), 300), bb.blackbodyFractionBelow(c2 / (300 * 1.0000001), 300));
  console.log("  F at x=0.01 (long-wave branch):", bb.blackbodyFractionBelow(c2 / (300 * 0.01), 300), " expected 1-(15/pi^4)(x^3/3 - x^4/8) =", 1 - (15 / Math.PI ** 4) * (1e-6 / 3 - 1e-8 / 8));
  let lum = 0;
  ph.CIE_WAVELENGTHS_NM.forEach((nm, i) => (lum += M(nm * 1e-9) * ph.CIE_V_PHOTOPIC[i] * 5e-9));
  console.log("  efficacy of a 5772 K blackbody with the module V table:", ((683 * lum) / tot).toFixed(2), "lm/W (expect ~93)");
  const mean = bb.planckWeightedMean((l) => (l < 10e-6 ? 1 : 0), 300, 1e-6, 100e-6, 400);
  console.log("  planckWeightedMean step at 10 um, 300 K:", mean.toFixed(5), " exact band ratio:", (bb.blackbodyBandFraction(1e-6, 10e-6, 300) / bb.blackbodyBandFraction(1e-6, 100e-6, 300)).toFixed(5));
}
console.log("Sum V * 5 nm =", (ph.CIE_V_PHOTOPIC.reduce((s, v) => s + v, 0) * 5).toFixed(3), "nm (CIE integral 106.857)");
{
  const ones = new Array(81).fill(1);
  const xyz = col.xyzFromSamples(ones);
  const [x, y] = col.chromaticity(xyz);
  console.log("D65 chromaticity:", x.toFixed(4), y.toFixed(4), "(CIE 0.3127, 0.3290)  white sRGB:", col.srgbFromXyz(xyz).map((v) => v.toFixed(3)).join(","));
  const xe = col.chromaticity(col.xyzFromSamples(ones, col.colourWeights(ones)));
  console.log("E chromaticity:", xe[0].toFixed(4), xe[1].toFixed(4), "(0.3333, 0.3333)");
  console.log("sRGB encode 0.5 linear [0.7354]:", col.srgbEncode(0.5).toFixed(4), " 0.002 [0.02584]:", col.srgbEncode(0.002).toFixed(5));
}
{
  const W = g.G173_WAVELENGTHS_NM, S = g.G173_GLOBAL_TILT;
  let I = 0;
  for (let i = 1; i < W.length; i++) I += 0.5 * (S[i] + S[i - 1]) * (W[i] - W[i - 1]);
  const at = (nm: number) => S[W.indexOf(nm)];
  console.log("G173 global tilt: points", W.length, S.length, "integral", I.toFixed(2), " E(500)", at(500), " E(550)", at(550), " E(1000)", at(1000), "(NREL 1.5451, 1.5399, 0.74839)");
  let j = 0;
  for (let i = 1; i < W.length && W[i] <= 1107; i++) j += 0.5 * (S[i] * W[i] + S[i - 1] * W[i - 1]) * (W[i] - W[i - 1]);
  console.log("  Jsc(280-1107 nm) =", ((j * 1e-9 * 1.602176634e-19) / (h * c) / 10).toFixed(2), "mA/cm2 (literature ~43.8)");
  console.log("  solarWeightedMean(1) =", g.solarWeightedMean(() => 1), " fraction below 780 nm:", g.solarWeightedMean((l) => (l < 780e-9 ? 1 : 0)).toFixed(4));
}
{
  const fs = MATERIALS.fusedSilica.model;
  const my = (um: number) => Math.sqrt(1 + (0.6961663 * um * um) / (um * um - 0.0684043 ** 2) + (0.4079426 * um * um) / (um * um - 0.1162414 ** 2) + (0.8974794 * um * um) / (um * um - 9.896161 ** 2));
  row("fused silica n(587.56 nm) [1.45846]", my(0.5875618), se.refractiveIndex(fs, 587.5618e-9));
  row("fused silica n(1550 nm) [1.44402]", my(1.55), se.refractiveIndex(fs, 1550e-9));
  const d2 = (l: number) => { const e = 1e-3; return (my(l + e) - 2 * my(l) + my(l - e)) / (e * e); }; // per um^2
  // beta2 [s^2/m] = lambda^3 n''/(2 pi c^2); with lambda in um and n'' in um^-2: lambda^3 n'' has unit um = 1e-6 m
  row("GVD 800 nm, fs^2/mm [36.16]", ((0.8 ** 3 * d2(0.8) * 1e-6) / (2 * Math.PI * c * c)) * 1e27, se.gvd(fs, 800e-9) * 1e27);
  // D [s/m^2] = -(lambda/c) n''; lambda n'' in um^-1 = 1e6 m^-1
  row("D 1550 nm, ps/(nm km) [~ +21.9]", (-(1.55 * d2(1.55) * 1e6) / c) * 1e6, se.dispersionParameter(fs, 1550e-9) * 1e6);
  console.log("  ZDW fused silica, um [1.2727]:", se.zeroDispersionWavelengths(fs).map((z) => (z * 1e6).toFixed(4)).join(","), " n_g(1550) [1.4626]:", se.groupIndex(fs, 1550e-9).toFixed(5));
  let bad = 0;
  for (const [id, gl] of Object.entries(SCHOTT_GLASSES)) {
    const nd = se.refractiveIndex(gl.model, se.LAMBDA_D), vd = se.abbeNumber(gl.model);
    if (Math.abs(nd - gl.nd) > 2e-5 || Math.abs(vd - gl.vd) > 0.02) { bad++; console.log("  MISMATCH", id, nd, gl.nd, vd, gl.vd); }
  }
  console.log("  SCHOTT glasses with n_d or V_d off the catalogue value:", bad, "of", Object.keys(SCHOTT_GLASSES).length);
  const bk = SCHOTT_GLASSES["N-BK7"];
  console.log("  N-BK7 n(1064) [1.50663]:", se.refractiveIndex(bk.model, 1064e-9).toFixed(5), " abs dn/dT 20C 546 nm [SCHOTT sheet 1.6e-6 at +20/+40]:", se.schottDnDt(bk.model, bk.thermal, 546.074e-9, 30).toExponential(3), " 1060 nm [1.1e-6]:", se.schottDnDt(bk.model, bk.thermal, 1060e-9, 30).toExponential(3));
  for (const [id, m] of Object.entries(MATERIALS)) {
    const [lo, hi] = m.model.range;
    const f = (x: number) => se.refractiveIndex(m.model, x).toFixed(4);
    console.log(`  ${id.padEnd(12)} ${(lo * 1e6).toFixed(3)}-${(hi * 1e6).toFixed(2)} um  n(lo) ${f(lo)} n(mid) ${f(Math.sqrt(lo * hi))} n(hi) ${f(hi)} | n(1.2 hi) ${f(hi * 1.2)} inRange ${se.inRange(m.model, hi * 1.2)}`);
  }
}
// axial FWHM of a pupil uniform in rho (the Airy pupil) vs the psf page's 0.886 lambda/(n - sqrt(n^2 - NA^2))
for (const s of [0.3, 0.8, 0.95, 1.4 / 1.518]) {
  const cc = Math.sqrt(1 - s * s);
  let a = 0.01, b = 0.8 / (1 - cc);
  for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (mtf.highNaDefocusStrehl(m, s) > 0.5) a = m; else b = m; }
  console.log(`axial FWHM, pupil uniform in rho, NA/n=${s.toFixed(3)}: ${(2 * a * (1 - cc)).toFixed(4)} lambda/(n-sqrt(n^2-NA^2))   (uniform in cos theta: 0.8859)`);
}
