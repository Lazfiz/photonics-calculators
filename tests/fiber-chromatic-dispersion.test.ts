import test from "node:test";
import assert from "node:assert/strict";

import {
  FIBER_PRESETS, FWHM_TO_RMS, G652_LAMBDA0, G652_RDS, G652_S0, SELLMEIER_FIBERS, beta2FromD, beta3FromDS,
  channelAt, dFromBeta2, dispersionLength, dispersionLimitedLength, gaussianBandwidth, gaussianPulseRmsWidth,
  optimumOutputRmsWidth,
  gaussianRmsFromBandwidth, groupDelay, linearDispersion, linearZeroDispersionWavelength, loopFsr,
  presetDispersion, sellmeierDispersion, sellmeierSlope, sigmaOmegaFromLambda, transformLimitedBitRate,
} from "../src/physics/fiber-optics/chromatic-dispersion";
import { rmsBroadening } from "../src/physics/fiber-optics/dispersion-comp";
import { c } from "../src/physics/constants";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const nm = 1e-9;
const km = 1e3;
const ps = 1e-12;
const PS_NM_KM = 1e-6; // ps/(nm·km) → s/m²
const PS_NM2_KM = 1e3; // ps/(nm²·km) → s/m³
const PS2_KM = 1e-27; // ps²/km → s²/m

test("G.652 Sellmeier form: 17.46 ps/(nm·km) and 0.0582 ps/(nm²·km) at 1550 nm; zero and S₀ at λ₀", () => {
  // ITU-T G.652: D(λ) = (S₀/4)(λ − λ₀⁴/λ³), λ₀ = 1310 nm, S₀ = 0.092. Hand: 1310⁴/1550³ = 790.837 nm,
  // 0.023 · (1550 − 790.837) = 17.4607; slope 0.023 · (1 + 3 · (1310/1550)⁴) = 0.058206.
  assertRel(sellmeierDispersion(1550 * nm, G652_LAMBDA0, G652_S0) / PS_NM_KM, 17.4607, 1e-5, "D(1550)");
  assertRel(sellmeierSlope(1550 * nm, G652_LAMBDA0, G652_S0) / PS_NM2_KM, 0.058206, 1e-4, "S(1550)");
  assert.ok(Math.abs(sellmeierDispersion(G652_LAMBDA0, G652_LAMBDA0, G652_S0)) < 1e-12, "D(λ₀) = 0");
  assertRel(sellmeierSlope(G652_LAMBDA0, G652_LAMBDA0, G652_S0), G652_S0, 1e-14, "S(λ₀) = S₀");
  assert.ok(Number.isNaN(sellmeierDispersion(0, G652_LAMBDA0, G652_S0)), "λ = 0 is outside the domain");
});

test("Sellmeier slope is the derivative of D (central difference)", () => {
  const h = 0.01 * nm;
  for (const lam of [850, 1310, 1550]) {
    const L = lam * nm;
    const dD = (sellmeierDispersion(L + h, G652_LAMBDA0, G652_S0) - sellmeierDispersion(L - h, G652_LAMBDA0, G652_S0)) / (2 * h);
    assertRel(sellmeierSlope(L, G652_LAMBDA0, G652_S0), dD, 1e-7, `S(${lam})`);
  }
});

test("β₂ = −λ²D/(2πc): 17 ps/(nm·km) at 1550 nm is −21.683 ps²/km, and D round-trips", () => {
  // Hand: (1550e-9)² · 17e-6 / (2π · 299792458) = 2.16826e-26 s²/m (Agrawal quotes β₂ ≈ −20 ps²/km near 1550 nm).
  const b2 = beta2FromD(17 * PS_NM_KM, 1550 * nm);
  assertRel(b2 / PS2_KM, -21.6826, 1e-5, "β₂");
  assertRel(dFromBeta2(b2, 1550 * nm), 17 * PS_NM_KM, 1e-14, "D");
});

test("β₃ from (D, S) equals dβ₂/dω of the Sellmeier curve (central difference)", () => {
  // Independent route: β₂(ω) = −λ²D(λ)/(2πc) with λ = 2πc/ω, differentiated numerically in ω.
  const beta2AtOmega = (w: number) => {
    const lam = (2 * Math.PI * c) / w;
    return beta2FromD(sellmeierDispersion(lam, G652_LAMBDA0, G652_S0), lam);
  };
  for (const lam of [1310, 1550]) {
    const L = lam * nm;
    const w = (2 * Math.PI * c) / L;
    const h = w * 1e-5;
    const numeric = (beta2AtOmega(w + h) - beta2AtOmega(w - h)) / (2 * h);
    const D = sellmeierDispersion(L, G652_LAMBDA0, G652_S0);
    const S = sellmeierSlope(L, G652_LAMBDA0, G652_S0);
    assertRel(beta3FromDS(D, S, L), numeric, 1e-6, `β₃(${lam})`);
  }
});

test("pulse broadening: transform-limited Gaussian follows √(1 + (L/L_D)²) (Agrawal NFO eq. 3.2.10)", () => {
  const T0 = 20 * ps;
  const sigma0 = T0 / Math.SQRT2;
  const beta2 = -21.68 * PS2_KM;
  const LD = dispersionLength(T0, beta2);
  assertRel(LD, (400 / 21.68) * km, 1e-12, "L_D");
  const sigma = gaussianPulseRmsWidth({ sigma0, beta2, beta3: 0, L: 2 * LD, sigmaOmega: 0 });
  assertRel(sigma, sigma0 * Math.sqrt(5), 1e-12, "σ(2 L_D)");
});

test("pulse broadening: coherent β₂ + β₃ result matches spectral-moment integration", () => {
  // Independent check: field spectrum |Â(ω)| = exp(−σ₀²ω²) (intensity rms σ₀ in time), spectral phase
  // φ(ω) = β₂Lω²/2 + β₃Lω³/6. Time moments from the spectrum: ⟨t⟩ = ∫|Â|²φ′/∫|Â|²,
  // ⟨t²⟩ = ∫(|Â|′² + |Â|²φ′²)/∫|Â|²; trapezoid rule over ±12/σ₀.
  const sigma0 = 5 * ps;
  const L = 1 * km;
  const beta2 = -20 * PS2_KM * 30; // large enough that both terms matter
  const beta3 = 0.1e-39 * 5000;
  const N = 40000;
  const wMax = 12 / sigma0;
  const dw = (2 * wMax) / N;
  let m0 = 0, m1 = 0, m2 = 0;
  for (let i = 0; i <= N; i++) {
    const w = -wMax + i * dw;
    const a = Math.exp(-(sigma0 ** 2) * w ** 2);
    const da = -2 * sigma0 ** 2 * w * a;
    const phi1 = beta2 * L * w + (beta3 * L * w ** 2) / 2;
    const wt = i === 0 || i === N ? 0.5 : 1;
    m0 += wt * a * a;
    m1 += wt * a * a * phi1;
    m2 += wt * (da * da + a * a * phi1 * phi1);
  }
  const numeric = Math.sqrt(m2 / m0 - (m1 / m0) ** 2);
  assertRel(gaussianPulseRmsWidth({ sigma0, beta2, beta3, L, sigmaOmega: 0 }), numeric, 1e-9, "σ");
});

test("pulse broadening: broad source (V_ω ≫ 1) tends to σ₀ ⊕ rmsBroadening (Agrawal §2.4.3)", () => {
  const lam = 1550 * nm;
  const D = 17 * PS_NM_KM, S = 0.058 * PS_NM2_KM, L = 50 * km, sigmaLambda = 1 * nm, sigma0 = 50 * ps;
  const sigmaOmega = sigmaOmegaFromLambda(sigmaLambda, lam);
  assert.ok(2 * sigmaOmega * sigma0 > 50, "V_ω ≫ 1");
  const general = gaussianPulseRmsWidth({ sigma0, beta2: beta2FromD(D, lam), beta3: beta3FromDS(D, S, lam), L, sigmaOmega });
  const broad = Math.hypot(sigma0, rmsBroadening(D * L, S * L, sigmaLambda));
  assertRel(general, broad, 2e-3, "σ");
  assert.ok(Number.isNaN(gaussianPulseRmsWidth({ sigma0: 0, beta2: 0, beta3: 0, L, sigmaOmega: 0 })), "σ₀ = 0");
});

test("pulse broadening: partially coherent source with β₂ and β₃ matches a spectral mixture", () => {
  // Independent model: the source is an incoherent mixture of coherent Gaussian pulses whose carriers are offset by Ω,
  // with power weights exp(−Ω²/(2σ_ω²)). Each component's time moments come from its spectrum (as above, envelope
  // exp(−σ₀²(ω−Ω)²), phase φ(ω) = β₂Lω²/2 + β₃Lω³/6); the mixture variance is ⟨t²⟩ − ⟨t⟩² over all of them.
  // This exercises the ½(1 + V²)²(β₃L/4σ₀³)² term, which the broad- and narrow-source limits leave unconstrained.
  const sigma0 = 2 * ps, V = 2, sigmaOmega = V / (2 * sigma0);
  const beta2 = -6 * PS2_KM, beta3 = 20 * 1e-39, L = 1 * km;
  const NO = 160, NW = 4000;
  const oMax = 7 * sigmaOmega, dO = (2 * oMax) / NO;
  const wSpan = 10 / sigma0, dw = (2 * wSpan) / NW;
  let W = 0, T1 = 0, T2 = 0;
  for (let j = 0; j <= NO; j++) {
    const O = -oMax + j * dO;
    const wo = (j === 0 || j === NO ? 0.5 : 1) * Math.exp(-(O ** 2) / (2 * sigmaOmega ** 2));
    let m0 = 0, m1 = 0, m2 = 0;
    for (let i = 0; i <= NW; i++) {
      const w = O - wSpan + i * dw;
      const a = Math.exp(-(sigma0 ** 2) * (w - O) ** 2);
      const da = -2 * sigma0 ** 2 * (w - O) * a;
      const phi1 = beta2 * L * w + (beta3 * L * w ** 2) / 2;
      const wt = i === 0 || i === NW ? 0.5 : 1;
      m0 += wt * a * a;
      m1 += wt * a * a * phi1;
      m2 += wt * (da * da + a * a * phi1 * phi1);
    }
    W += wo;
    T1 += (wo * m1) / m0;
    T2 += (wo * m2) / m0;
  }
  const numeric = Math.sqrt(T2 / W - (T1 / W) ** 2);
  const formula = gaussianPulseRmsWidth({ sigma0, beta2, beta3, L, sigmaOmega });
  // Hand: 4 ps² · (1 + 5 · 0.75² + ½ · 25 · 0.625²) = 34.781 ps² → 5.89756 ps.
  assertRel(formula, 5.89756 * ps, 1e-5, "formula");
  assertRel(formula, numeric, 1e-6, "mixture");
});

test("pulse broadening: chirp with β₂C < 0 compresses (Agrawal NFO eq. 3.2.17)", () => {
  // σ₀ = 10 ps, β₂L = 100 ps², C = −2: (1 + Cβ₂L/2σ₀²)² + (β₂L/2σ₀²)² = 0 + 0.25 → σ/σ₀ = 0.5.
  const sigma0 = 10 * ps;
  assertRel(gaussianPulseRmsWidth({ sigma0, beta2: 100 * PS2_KM, beta3: 0, L: km, sigmaOmega: 0, chirp: -2 }), 5 * ps, 1e-12, "σ");
});

test("optimum input width: σ² = σ_D² + |β₂|L, and B(|β₃|L)^⅓ = 0.324 at λ₀ (Agrawal §2.4.3)", () => {
  // SMF at 1550 nm, 10 km, σ_λ = 0.0425 nm: closed form for β₃ = 0, σ_D = σ_ω|β₂|L.
  const lam = 1550 * nm, L = 10 * km;
  const D = sellmeierDispersion(lam, G652_LAMBDA0, G652_S0);
  const b2 = beta2FromD(D, lam), so = sigmaOmegaFromLambda(0.0425 * nm, lam);
  const closed = Math.sqrt((so * b2 * L) ** 2 + Math.abs(b2) * L);
  assertRel(optimumOutputRmsWidth(b2, 0, L, so), closed, 1e-9, "σ_opt");
  assertRel(1 / (4 * closed), 15.0e9, 2e-3, "B ≈ 15.0 Gb/s");
  // Coherent, β₂ = 0: σ² = 1.5(|β₃|L/4)^⅔, so B(|β₃|L)^⅓ = ¼ · 4^⅓/√1.5 = 0.32402.
  const b3L = 0.1 * 1e-39 * 50 * km;
  const sigma = optimumOutputRmsWidth(0, 0.1 * 1e-39, 50 * km, 0);
  assertRel(sigma, Math.sqrt(1.5) * (b3L / 4) ** (1 / 3), 1e-9, "σ at λ₀");
  assertRel((1 / (4 * sigma)) * b3L ** (1 / 3), 0.32402, 1e-4, "0.324");
  assert.equal(optimumOutputRmsWidth(0, 0, L, so), 0, "no dispersion");
  // Transform-limited closed form B√(|β₂|L) ≤ ¼: 21.68 ps²/km · 80 km → √1734.4 ps² = 41.646 ps → 6.0029 Gb/s.
  assertRel(transformLimitedBitRate(-21.68 * PS2_KM, 80 * km), 6.00291e9, 1e-5, "B_max");
});

test("dispersion-limited length solves 16B²(σ_ω²β₂²L² + |β₂|L) = 1 (β₃ = 0)", () => {
  const lam = 1550 * nm, B = 10e9;
  const ch = { ...channelAt({ D: 17.4607 * PS_NM_KM, S: 0 }, lam, 0.0425 * nm), beta3: 0 };
  const a = (ch.sigmaOmega * ch.beta2) ** 2, b = Math.abs(ch.beta2), cc = -1 / (16 * B * B);
  const L = (-b + Math.sqrt(b * b - 4 * a * cc)) / (2 * a);
  assertRel(dispersionLimitedLength(ch, B), L, 1e-8, "L_max");
  assertRel(L, 19.08 * km, 2e-3, "≈ 19.08 km");
  assert.equal(dispersionLimitedLength(channelAt({ D: 0, S: 0 }, lam, 0.1 * nm), B), Infinity, "no dispersion");
  // Modal spread only: OM3 2000 MHz·km → 266.83 m (see the next test).
  const om3 = channelAt({ D: 0, S: 0 }, lam, 0, gaussianRmsFromBandwidth(SELLMEIER_FIBERS.OM3.modalBandwidthLength));
  assertRel(dispersionLimitedLength(om3, B), 266.83, 1e-4, "OM3");
});

test("Gaussian impulse response: f₃dB = 0.1874/σ; OM3 reach at 10 Gb/s with 4Bσ ≤ 1", () => {
  // H(f) = exp(−2π²f²σ²) = ½ ⇒ f = √(ln 2 / 2)/(πσ) = 0.187390/σ.
  assertRel(gaussianBandwidth(1), 0.187390, 1e-5, "f·σ");
  assertRel(gaussianRmsFromBandwidth(gaussianBandwidth(3e-11)), 3e-11, 1e-14, "round trip");
  // 2000 MHz·km: σ per km = 0.187390/2 GHz = 93.695 ps; L = 1/(4 · 10 GHz · 93.695 ps) = 0.26683 km.
  const sigmaPerM = gaussianRmsFromBandwidth(SELLMEIER_FIBERS.OM3.modalBandwidthLength) ;
  assertRel(1 / (4 * 10e9 * sigmaPerM), 266.83, 1e-4, "OM3 reach");
  assertRel(FWHM_TO_RMS, 1 / 2.35482, 1e-5, "FWHM → rms");
});

test("presets: G.655+ zero at 1460 nm, DCF slope matched to G.652, preset curves", () => {
  assertRel(linearZeroDispersionWavelength(FIBER_PRESETS.NZDSF_PLUS), 1460 * nm, 1e-12, "λ₀ NZ-DSF+");
  assert.ok(Number.isNaN(linearZeroDispersionWavelength({ D: 1, S: 0 })), "S = 0");
  // RDS of G.652 at 1550: 0.058206/17.4607 = 3.3335e-3 /nm → DCF slope −80 · RDS = −0.26668 ps/(nm²·km).
  assertRel(G652_RDS * nm, 3.3336e-3, 1e-4, "RDS");
  assertRel(FIBER_PRESETS.DCF.S / PS_NM2_KM, -0.26668, 1e-4, "S_DCF");
  assertRel(presetDispersion("DCF", 1550 * nm) / PS_NM_KM, -80, 1e-12, "DCF(1550)");
  assertRel(presetDispersion("G652", 1550 * nm) / PS_NM_KM, 17.4607, 1e-5, "G.652(1550)");
  assertRel(linearDispersion(FIBER_PRESETS.DSF, 1560 * nm) / PS_NM_KM, 0.85, 1e-9, "DSF(1560)");
});

test("delay line: 100 m at n_g 1.468 is 489.67 ns with a 2.0422 MHz loop FSR", () => {
  // Hand: 1.468 · 100 / 299792458 = 4.89672e-7 s; FSR = 1/τ.
  assertRel(groupDelay(100, 1.468), 489.672e-9, 1e-5, "τ");
  assertRel(loopFsr(100, 1.468), 2.04218e6, 1e-5, "FSR");
});
