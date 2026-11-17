// R2 batch 4: near-infrared Hb table, absorption-depth tables, photoemission, stray light, pump-probe, lifetime
import { hbExtinction, dpfFrontalHead, mbllHaemoglobin } from "../../../../src/physics/spectroscopy/near-infrared";
import { absorptionSummary } from "../../../../src/physics/spectroscopy/absorption-depth";
import { imfpTpp2m, TPP2M_MATERIALS, samplingDepth } from "../../../../src/physics/spectroscopy/photoemission";
import { measuredAbsorbance, maxStrayRatio } from "../../../../src/physics/spectroscopy/stray-light";
import { excitationFraction, intermediatePeakTime } from "../../../../src/physics/spectroscopy/pump-probe";
import { gaussianPulseBandwidth, intensityWeightedLifetime } from "../../../../src/physics/spectroscopy/fluorescence-lifetime";
import { N_A, h, c } from "../../../../src/physics/constants";

const p = (s: string, mine: number, mod: number) => console.log(`${s.padEnd(46)} mine=${mine.toPrecision(6)} mod=${mod.toPrecision(6)} ratio=${(mod / mine).toFixed(5)}`);
// Prahl (Hb) decadic molar extinction, cm-1/M -> module SI (m2/mol): 1 cm-1/M = 0.1 m2/mol
for (const [nm, o, r] of [[760, 586, 1548.52], [850, 1058, 691.32], [800, 816, 761.72]]) {
  const e = hbExtinction(nm * 1e-9); p(`Hb eps HbO2 ${nm} (cm-1/M) Prahl`, o, e.hbo2 * 10); p(`Hb eps HbR ${nm} (cm-1/M) Prahl`, r, e.hbr * 10);
}
p("DPF age 30, 800 nm (S&W 2013)", 223.3 + 0.05624 * 30 ** 0.8493 - 5.723e-7 * 800 ** 3 + 0.001245 * 800 ** 2 - 0.9025 * 800, dpfFrontalHead(30, 800e-9));
// MBLL round trip: dC = 1 uM HbO2, 0 HbR, d = 3 cm, DPF 6 -> dOD
{
  const e1 = hbExtinction(760e-9), e2 = hbExtinction(850e-9); const C = 1e-3; // mol/m3 = 1 uM
  const r = mbllHaemoglobin(760e-9, 850e-9, e1.hbo2 * C * 0.03 * 6, e2.hbo2 * C * 0.03 * 6, 0.03, 6, 6);
  p("MBLL round trip HbO2 (uM)", 1, r.hbo2 * 1e3); console.log("  HbR", r.hbr);
}
// absorption-depth: Si 800 nm (Green 2008: 1.27e3? cm-1 ~ 850: 5.35e2), water 1450 (~31 cm-1), 980 (~0.5 cm-1)
for (const [m, nm] of [["silicon", 800], ["silicon", 1000], ["silicon", 500], ["water", 1450], ["water", 980], ["water", 2950]] as const) {
  const s = absorptionSummary(m, nm * 1e-9, 0, 1e-6); console.log(`  alpha ${m} ${nm} nm = ${(s.alpha / 100).toPrecision(4)} cm-1, delta = ${(s.delta * 1e6).toPrecision(4)} um, d90/delta = ${(s.d90 / s.delta).toFixed(4)} (ln10 2.3026)`);
}
// TPP-2M: Au at 1000 eV, NIST SRD71 ~ 15.4 A? Si 1000 eV ~ 30 A ; Al ~ 30 A
for (const k of ["au", "si", "al", "c"]) console.log(`  IMFP ${k} 1000 eV = ${(imfpTpp2m(1000, TPP2M_MATERIALS[k]) * 1e10).toFixed(2)} A`);
p("sampling depth 95% lambda=2nm theta=0", 3 * 2, samplingDepth(2e-9, 0) * 1e9);
// stray light: A=3, s=1e-3 -> A_m = -log10(1e-3*(1-1e-3)+1e-3)
p("stray A=3 s=1e-3", -Math.log10(1e-3 * 0.999 + 1e-3), measuredAbsorbance(3, 1e-3));
p("max stray A=2 tol 0.01", 0.01 * (10 ** 0.01 - 1) / (1 - 0.01), maxStrayRatio(2, 0.01));
// pump-probe: F=1 mJ/cm2=10 J/m2, 400 nm, eps 1e4 L/mol/cm=1e3 m2/mol, Ap=0.3
{
  const J = 10 * 400e-9 / (h * c); const sig = Math.LN10 * 1e3 / N_A; const x = 0.3 * Math.LN10;
  p("pump excitation fraction", J * sig * (1 - Math.exp(-x)) / x, excitationFraction(10, 400e-9, 1e3, 0.3));
  p("intermediate peak tau1=1 tau2=10", Math.log(10) / (1 - 0.1), intermediatePeakTime(1, 10));
}
p("Gaussian TBP 100 fs (THz)", 0.441271 / 100e-15 / 1e12, gaussianPulseBandwidth(100e-15, 800e-9).hz / 1e12);
p("int-weighted tau (0.5,1ns)(0.5,4ns)", (0.5 * 1 + 0.5 * 16) / (0.5 + 2), intensityWeightedLifetime([{ amplitude: 0.5, lifetime: 1 }, { amplitude: 0.5, lifetime: 4 }]));
