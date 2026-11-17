// R1 batch 3: RC/bandwidth, capacitance, gain-bandwidth, dark current, QE, Si absorption, MTF.
import * as rc from "../../../../src/physics/detectors/photodiode-rc";
import * as tia from "../../../../src/physics/detectors/tia";
import * as dc from "../../../../src/physics/detectors/dark-current";
import * as qe from "../../../../src/physics/detectors/photodiode-qe";
import * as mtf from "../../../../src/physics/detectors/sensor-mtf";
import { siliconAbsorption } from "../../../../src/physics/materials/silicon-absorption";
import { VARSHNI, varshniBandGap, ingaasBandGap } from "../../../../src/physics/materials/bandgap";
const q = 1.602176634e-19, kB = 1.380649e-23, kBeV = kB / q;
const cmp = (name: string, mine: number, code: number) =>
  console.log(`${name.padEnd(44)} mine=${mine.toPrecision(6).padStart(12)} code=${String(Number(code.toPrecision(6))).padStart(12)} ratio=${(code / mine).toFixed(5)}`);
// bandwidth page: 1 kΩ, 10 pF, B 1 MHz
const fc = 1 / (2 * Math.PI * 1e3 * 10e-12);
cmp("bandwidth f_RC 1k 10pF", fc, rc.rcBandwidth(1e3, 10e-12));
let I = 0; const n = 200000, df = 1e6 / n; for (let f = df / 2; f < 1e6; f += df) I += df / (1 + (f / fc) ** 2);
cmp("bandwidth Johnson V2 0..1MHz single pole", 4 * kB * 300 * 1e3 * I, rc.rcFilteredNoise(4 * kB * 300 * 1e3, fc, 1e6));
cmp("bandwidth B->inf -> kT/C", kB * 300 / 10e-12, rc.rcFilteredNoise(4 * kB * 300 * 1e3, fc, 1e30));
// capacitance: C0 10 pF, Vbi .6, VR 5, abrupt; R 50+10
const Cj = 10 / Math.sqrt(1 + 5 / 0.6);
cmp("capacitance abrupt pF", Cj, rc.junctionCapacitance(10, 5, 0.6, 0.5));
cmp("capacitance graded pF", 10 / Math.cbrt(1 + 5 / 0.6), rc.junctionCapacitance(10, 5, 0.6, 1 / 3));
cmp("capacitance f_RC 60 ohm", 1 / (2 * Math.PI * 60 * Cj * 1e-12), rc.rcBandwidth(60, Cj * 1e-12));
console.log("probe junctionCap VR=-0.6", rc.junctionCapacitance(10, -0.6, 0.6, 0.5), "VR=-1", rc.junctionCapacitance(10, -1, 0.6, 0.5));
cmp("transit 0.443 v/W (8.4e4, 10um)", 0.44294647 * 8.4e4 / 10e-6, rc.transitBandwidth(8.4e4, 10e-6));
cmp("depletion width eps/C' (10 nF/cm2?)", 11.9 * 8.8541878188e-12 / (10e-9 / 1e-4), rc.depletionWidth(10e-9 / 1e-4, 11.9));
// gain-bandwidth: A0 1000, GBW 1 MHz, beta .01
console.log("gain-bandwidth singlePoleClosedLoop", JSON.stringify(tia.singlePoleClosedLoop(1000, 1e6, 0.01)), " mine gain", 1000 / 11, "f3dB", 11 * 1e3);
cmp("gain-bandwidth |A_CL| at 11 kHz", (1000 / 11) / Math.SQRT2, tia.closedLoopMagnitude(1000, 1e6, 0.01, 11e3));
// dark-current doubling law & crossover
cmp("dark-current doubling ratio -80 vs 25 (Td 6)", 2 ** (-105 / 6), dc.doublingLawRatio(-80, 25, 6));
cmp("dark-current crossover T (read 5, D .1)", 25 + 6 * Math.log2(25 / 0.1), dc.darkReadCrossoverTemperature(5, 0.1, 25, 6));
const Tl = 298.15, Eg = 1.12;
cmp("local doubling T gen, fixed Eg 1.12", Math.LN2 / (1.5 / Tl + Eg / (2 * kBeV * Tl * Tl)), dc.localDoublingTemperature(Tl, Eg, "generation"));
cmp("local doubling T diff, fixed Eg 1.12", Math.LN2 / (3 / Tl + Eg / (kBeV * Tl * Tl)), dc.localDoublingTemperature(Tl, Eg, "diffusion"));
const V = VARSHNI.si; const egV = (T: number) => V.Eg0_eV - V.alpha_eV_per_K * T * T / (T + V.beta_K);
cmp("varshni Si 300K", egV(300), varshniBandGap(300, V));
const lnni = (T: number) => 1.5 * Math.log(T) - egV(T) / (2 * kBeV * T);
const dl = (lnni(Tl + 1e-3) - lnni(Tl - 1e-3)) / 2e-3;
cmp("local doubling T gen, Varshni Si", Math.LN2 / dl, dc.localDoublingTemperature(Tl, V, "generation"));
const r = (253.15 / Tl) ** 1.5 * Math.exp(-(egV(253.15) / 253.15 - egV(Tl) / Tl) / (2 * kBeV));
cmp("darkCurrentRatio gen -20C/25C Varshni", r, dc.darkCurrentRatio(253.15, Tl, egV(253.15), "generation", egV(Tl)));
cmp("darkCurrentRatio diff -20C/25C Varshni", r * r, dc.darkCurrentRatio(253.15, Tl, egV(253.15), "diffusion", egV(Tl)));
cmp("Si n_i 300K (Altermatt 9.65e9 cm-3 = 9.65e15 m-3)", 9.65e15, dc.siliconIntrinsicDensity(300));
cmp("Si n_i 300K (Sproul-Green 1.00e10 cm-3 @300K)", 1.0e16, dc.siliconIntrinsicDensity(300));
console.log("ingaas Eg(x=.53,295K)", ingaasBandGap(0.53, 295), " (expected ~0.74-0.75 eV)");
// QE (Gärtner)
for (const nm of [400, 550, 850, 1000]) console.log(`Si alpha(${nm} nm) = ${(siliconAbsorption(nm * 1e-9) / 100).toPrecision(4)} /cm`, "Green 2008: 400 9.52e4, 550 6.39e3? , 850 535, 1000 64");
const a850 = siliconAbsorption(850e-9);
cmp("QE Gärtner 850 W20 L100 R.05", 0.95 * (1 - Math.exp(-a850 * 20e-6) / (1 + a850 * 100e-6)), qe.photodiodeQe({ alpha: a850, reflectance: 0.05, depletionWidth: 20e-6, diffusionLength: 100e-6 }));
cmp("normal reflectance n=3.6", (2.6 / 4.6) ** 2, qe.normalReflectance(3.6));
// MTF
const p = 5.4e-6, fN = 1 / (2 * p), w = p * Math.sqrt(0.95);
cmp("MTF pixel aperture @Nyquist w=p*sqrt(FF)", Math.sin(Math.PI * fN * w) / (Math.PI * fN * w), mtf.pixelApertureMtf(fN, w));
cmp("MTF exp spread L=1.5um @Nyq", 1 / (1 + (2 * Math.PI * fN * 1.5e-6) ** 2), mtf.exponentialSpreadMtf(fN, 1.5e-6));
cmp("MTF gaussian sigma 2um @Nyq", Math.exp(-2 * Math.PI ** 2 * (2e-6) ** 2 * fN ** 2), mtf.gaussianBlurMtf(fN, 2e-6));
cmp("MTF crosstalk kernel 3% @Nyq (1-2c+2c cos)", 1 - 2 * 0.03 + 2 * 0.03 * Math.cos(2 * Math.PI * fN * p), mtf.crosstalkKernelMtf(fN, p, 0.03));
