// R2 batch 1: shared modules blackbody / cie-photometry / cie-colour / astm-g173
import { planckExitance, totalExitance, blackbodyBandFraction, blackbodyFractionBelow, planckWeightedMean } from "../../../../src/physics/blackbody";
import { c1_radiation, c2_radiation, b_Wien, sigma_SB, h, c, k_B } from "../../../../src/physics/constants";
import { CIE_V_PHOTOPIC, CIE_WAVELENGTHS_NM, CIE_D65, luminousWeightedMean } from "../../../../src/physics/cie-photometry";
import { colourWeights, xyzFromSamples, chromaticity, linearSrgb, CIE_X_BAR, CIE_Z_BAR } from "../../../../src/physics/cie-colour";
import { G173_WAVELENGTHS_NM, G173_GLOBAL_TILT, solarWeightedMean } from "../../../../src/physics/astm-g173";

const p = (s: string, mine: number, mod: number) => console.log(`${s.padEnd(44)} mine=${mine.toPrecision(7)} mod=${mod.toPrecision(7)} ratio=${(mod / mine).toFixed(5)}`);

// constants
p("c2 (m K) vs CODATA 1.438776877e-2", 1.438776877e-2, c2_radiation);
p("c1 (W m2) vs 3.741771852e-16", 3.741771852e-16, c1_radiation);
p("sigma vs 5.670374419e-8", 5.670374419e-8, sigma_SB);
p("b_Wien vs 2.897771955e-3", 2.897771955e-3, b_Wien);

// independent Planck
const Ml = (l: number, T: number) => (2 * Math.PI * h * c * c) / l ** 5 / (Math.exp((h * c) / (l * k_B * T)) - 1);
for (const T of [300, 2856, 5778]) {
  p(`M_lambda(1um,${T})`, Ml(1e-6, T), planckExitance(1e-6, T));
  // numeric integral of module planck over log grid
  let s = 0; const N = 20000, a = Math.log(1e-8), b = Math.log(1e-2);
  for (let i = 0; i <= N; i++) { const l = Math.exp(a + (b - a) * i / N); s += planckExitance(l, T) * l * (i === 0 || i === N ? 0.5 : 1); }
  s *= (b - a) / N;
  p(`int M_lambda dl (${T})`, sigma_SB * T ** 4, s);
  // numeric peak
  let best = 0, lb = 0; for (let i = 0; i < 200000; i++) { const l = b_Wien / T * (0.5 + i / 200000); const v = planckExitance(l, T); if (v > best) { best = v; lb = l; } }
  p(`peak lambda (${T})`, lb, b_Wien / T);
  // band fraction 380-780 numerically
  let bf = 0; const M = 4000; for (let i = 0; i <= M; i++) { const l = 380e-9 + 400e-9 * i / M; bf += planckExitance(l, T) * (i === 0 || i === M ? 0.5 : 1); } bf *= 400e-9 / M / (sigma_SB * T ** 4);
  p(`band frac 380-780 (${T})`, bf, blackbodyBandFraction(380e-9, 780e-9, T));
}
p("F(0->lambda T=2898um K) ~0.25005", 0.250054, blackbodyFractionBelow(2898e-6 / 1000, 1000));
p("F(lambdaT=1448 um K) x~9.936 crossover", 0.010, blackbodyFractionBelow(1.448e-6, 1000));
// fraction continuity at x=1 (lambdaT = c2)
p("F continuity x=1-e vs 1+e", blackbodyFractionBelow(c2_radiation / 1000 * (1 + 1e-9), 1000), blackbodyFractionBelow(c2_radiation / 1000 * (1 - 1e-9), 1000));
console.log("planckWeightedMean f=lambda over 0.1-100um T=5778 (mean wavelength ~ ?)", planckWeightedMean((l) => l, 5778, 1e-7, 1e-4));

// photometry spot values
const V = (nm: number) => CIE_V_PHOTOPIC[CIE_WAVELENGTHS_NM.indexOf(nm)];
console.log("V(450,510,555,610,650)", [450, 510, 555, 610, 650].map(V).join(", "));
for (const T of [2856, 5772, 6500]) {
  let num = 0; for (let i = 0; i < 81; i++) num += 683 * CIE_V_PHOTOPIC[i] * planckExitance(CIE_WAVELENGTHS_NM[i] * 1e-9, T) * 5e-9;
  console.log(`BB efficacy ${T} K (683*sum V M / sigmaT4) = ${(num / (sigma_SB * T ** 4)).toFixed(2)} lm/W`);
}
p("luminousWeightedMean(1)", 1, luminousWeightedMean(() => 1));
// D65 white chromaticity, E, A
p("D65 x", 0.31272, chromaticity(xyzFromSamples(Array(81).fill(1)))[0]);
p("D65 y", 0.32903, chromaticity(xyzFromSamples(Array(81).fill(1)))[1]);
const wE = colourWeights(Array(81).fill(100));
p("E x", 1 / 3, chromaticity(xyzFromSamples(Array(81).fill(1), wE))[0]);
p("E y", 1 / 3, chromaticity(xyzFromSamples(Array(81).fill(1), wE))[1]);
const wA = colourWeights(CIE_WAVELENGTHS_NM.map((nm) => planckExitance(nm * 1e-9, 2856)));
p("A (2856K) x", 0.44757, chromaticity(xyzFromSamples(Array(81).fill(1), wA))[0]);
p("A (2856K) y", 0.40745, chromaticity(xyzFromSamples(Array(81).fill(1), wA))[1]);
console.log("D65 white linear sRGB", linearSrgb(xyzFromSamples(Array(81).fill(1))).map((v) => v.toFixed(4)).join(", "));
console.log("xbar(600)=", CIE_X_BAR[44], " zbar(450)=", CIE_Z_BAR[14], " xbar(445)", CIE_X_BAR[13]);

// G173
let tot = 0; for (let i = 1; i < G173_WAVELENGTHS_NM.length; i++) tot += (G173_WAVELENGTHS_NM[i] - G173_WAVELENGTHS_NM[i - 1]) * (G173_GLOBAL_TILT[i] + G173_GLOBAL_TILT[i - 1]) / 2;
console.log("G173 points", G173_WAVELENGTHS_NM.length, G173_GLOBAL_TILT.length, "integral", tot.toFixed(2));
const g = (nm: number) => G173_GLOBAL_TILT[G173_WAVELENGTHS_NM.indexOf(nm)];
console.log("G173 at 500,550,1000,1500 nm", g(500), g(550), g(1000), g(1500));
// Jsc limit Si 1.12 eV -> lambda_g = 1107 nm
const lg = 1239.84198 / 1.12; let J = 0;
for (let i = 1; i < G173_WAVELENGTHS_NM.length; i++) { const w0 = G173_WAVELENGTHS_NM[i - 1], w1 = G173_WAVELENGTHS_NM[i]; if (w1 > lg) break; const f = (w: number, e: number) => e * w * 1e-9 / (h * c) * 1.602176634e-19; J += (w1 - w0) * (f(w0, G173_GLOBAL_TILT[i - 1]) + f(w1, G173_GLOBAL_TILT[i])) / 2; }
console.log("Jsc limit Si (mA/cm2) ~43.8:", (J / 10).toFixed(2));
p("solarWeightedMean(1)", 1, solarWeightedMean(() => 1));
