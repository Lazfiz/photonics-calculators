// R1 batch 5: detectivity, saturation DR with ADC, cooling-benefit, dark-noise-temperature, Si/InGaAs dark, cosmic MPV,
// plus boundary probes.
import * as nz from "../../../../src/physics/detectors/noise";
import * as cam from "../../../../src/physics/detectors/camera-snr";
import * as dc from "../../../../src/physics/detectors/dark-current";
import * as sn from "../../../../src/physics/detectors/sensor-noise";
import * as cr from "../../../../src/physics/detectors/cosmic-rays";
import * as dt from "../../../../src/physics/detectors/dead-time";
import * as spad from "../../../../src/physics/detectors/spad";
import * as apd from "../../../../src/physics/detectors/apd";
import * as em from "../../../../src/physics/detectors/electron-multiplier";
import * as ing from "../../../../src/physics/detectors/ingaas";
import { VARSHNI, varshniBandGap, ingaasBandGap } from "../../../../src/physics/materials/bandgap";
const q = 1.602176634e-19, kB = 1.380649e-23, kBeV = kB / q;
const cmp = (name: string, mine: number, code: number) =>
  console.log(`${name.padEnd(44)} mine=${mine.toPrecision(6).padStart(12)} code=${String(Number(code.toPrecision(6))).padStart(12)} ratio=${(code / mine).toFixed(5)}`);
// detectivity defaults
const R = 0.7 * 850 / 1239.841984;
cmp("detectivity detector D* (J 1e-7, R0A 1e7)", R / Math.sqrt(2 * q * 1e-7 + 4 * kB * 293 / 1e7), nz.detectorDetectivity({ responsivity: R, darkCurrentDensity: 1e-7, r0a: 1e7, temperature: 293, gain: 1, excessNoiseFactor: 1 }));
cmp("detectivity detector D* M=10 F=3", 10 * R / Math.sqrt(2 * q * 1e-7 * 100 * 3 + 4 * kB * 293 / 1e7), nz.detectorDetectivity({ responsivity: R, darkCurrentDensity: 1e-7, r0a: 1e7, temperature: 293, gain: 10, excessNoiseFactor: 3 }));
const iN = Math.hypot(Math.sqrt(2 * q * 1e-9 * 1e6), Math.sqrt(4 * kB * 293 * 1e6 / 50));
cmp("detectivity system D*", Math.sqrt(0.01 * 1e6) / (iN / R), nz.specificDetectivity(0.01, 1e6, nz.noiseEquivalentPower(iN, R, 1)));
cmp("NEP with gain M=10", iN / (R * 10), nz.noiseEquivalentPower(iN, R, 10));
// saturation DR with ADC noise
const qn = 20000 / 4096 / Math.sqrt(12);
cmp("saturation DR incl ADC", 20 * Math.log10(20000 / Math.hypot(5, qn)), cam.dynamicRangeDb(20000, Math.hypot(5, qn)));
console.log("dynamicRangeDb(FW, floor, darkCharge=100)", cam.dynamicRangeDb(50000, 5, 100), " mine (FW-dark)/sqrt(floor^2+dark)", 20 * Math.log10((50000 - 100) / Math.sqrt(25 + 100)), " or FW/sqrt", 20 * Math.log10(50000 / Math.sqrt(125)));
// cooling-benefit: Si generation (Varshni), InGaAs diffusion (Vurgaftman x=.53), -40 C vs 25 C
const V = VARSHNI.si, Tc = 233.15, Tr = 298.15;
const egS = (T: number) => varshniBandGap(T, V);
const rSi = (Tc / Tr) ** 1.5 * Math.exp(-(egS(Tc) / Tc - egS(Tr) / Tr) / (2 * kBeV));
cmp("cooling Si reduction 25->-40", 1 / rSi, 1 / dc.darkCurrentRatio(Tc, Tr, egS(Tc), "generation", egS(Tr)));
const egI = (T: number) => ingaasBandGap(0.53, T);
const rIn = ((Tc / Tr) ** 1.5 * Math.exp(-(egI(Tc) / Tc - egI(Tr) / Tr) / (2 * kBeV))) ** 2;
cmp("cooling InGaAs reduction 25->-40 (diff)", 1 / rIn, 1 / dc.darkCurrentRatio(Tc, Tr, egI(Tc), "diffusion", egI(Tr)));
console.log("InGaAs Eg 233/298 K", egI(233.15).toFixed(4), egI(298.15).toFixed(4), " Si", egS(233.15).toFixed(4), egS(298.15).toFixed(4));
// dark-noise-temperature default
cmp("dark-noise shot 0.5 nA 1 Hz", Math.sqrt(2 * q * 0.5e-9), nz.shotNoiseCurrent(0.5e-9, 1));
// Si/InGaAs intrinsic & generation
cmp("Si gen current 293K W10um A1mm2 tau 1ms", q * dc.siliconIntrinsicDensity(293) * 10e-6 * 1e-6 / 1e-3, dc.generationCurrent(dc.siliconIntrinsicDensity(293), 10e-6, 1e-6, 1e-3));
console.log("Si n_i(293) m^-3", dc.siliconIntrinsicDensity(293).toExponential(4), " InGaAs n_i(.53,300) m^-3", ing.ingaasIntrinsicDensity(0.53, 300).toExponential(4), " (lit. ~5.4e11 cm^-3 = 5.4e17 m^-3)");
cmp("InGaAs cutoff (Eg .739) um", 1.239841984 / ingaasBandGap(0.53, 295), ing.cutoffWavelength(ingaasBandGap(0.53, 295)) * 1e6);
console.log("InGaAs alpha(1550) /cm", (ing.ingaasAbsorption(1550e-9, ingaasBandGap(0.53, 300)) / 100).toPrecision(4), " (lit. ~0.7-0.8e4 /cm)", " alpha(1310)", (ing.ingaasAbsorption(1310e-9, ingaasBandGap(0.53, 300)) / 100).toPrecision(4), "(lit ~1.16e4)");
console.log("InGaAs PIN QE 1550 (3um, R 2%, InP window, 300K)", ing.ingaasPinQe(1550e-9, { x: 0.53, T: 300, thickness: 3e-6, reflectance: 0.02, inpWindow: true } as never), " mine (1-.02)(1-exp(-a d))", 0.98 * (1 - Math.exp(-ing.ingaasAbsorption(1550e-9, ingaasBandGap(0.53, 300)) * 3e-6)));
cmp("InP window edge 300K nm (Eg 1.344)", 1239.841984 / 1.344, ing.inpWindowEdge(300) * 1e9);
// cosmic MPV at 300 um, normal incidence (PDG: ~84 keV in plateau)
cmp("cosmic MPV 300um eV", 84e3, cr.mostProbableLoss(300e-6));
cmp("cosmic K_BETHE", 0.307075, cr.K_BETHE);
// boundary probes
console.log("probe shotPrnuCrossover(0)", sn.shotPrnuCrossover(0), " shotReadCrossover(0)", sn.shotReadCrossover(0));
console.log("probe dynamicRangeDb(5e4,0)", cam.dynamicRangeDb(5e4, 0), " emCrossover F2=1", cam.emCrossoverSignal({ gain: 1, excessNoiseFactorSq: 1, emRead: 50, conventionalRead: 6 }));
console.log("probe paralyzable trueRateAtLoss(0.5,25ns)", dt.trueRateAtLoss(0.5, 25e-9, "paralyzable" as never), " nonpar loss->1", dt.trueRateAtLoss(0.999, 25e-9, "nonparalyzable" as never));
console.log("probe countingSnr gate 1e-9", spad.countingSnr({ signalRate: 1e3, darkRate: 1, afterpulseProb: 0, deadTime: 2e-8, gateTime: 1e-9 }));
console.log("probe optimumGain thermal=0 (T=0)", apd.optimumGain({ photocurrent: 1e-9, darkCurrent: 0, k: 0.02, bandwidth: 1e8, loadResistance: 1e3, temperature: 0 }), " k=0 T=300", apd.optimumGain({ photocurrent: 1e-9, darkCurrent: 0, k: 0, bandwidth: 1e8, loadResistance: 1e3, temperature: 300 }));
console.log("probe channelGain V0 > base (yield<1)", em.channelGain(200, 80, 0.2, 1), " strikes", em.channelStrikes(200, 80, 1), " yield/strike", em.channelYieldPerStrike(200, 80, 0.2, 1));
console.log("probe dynodeExcessNoise delta<1", em.dynodeExcessNoise(em.uniformDynodes(0.5, 10)), " gain", em.dynodeGain(em.uniformDynodes(0.5, 10)));
console.log("probe emExcessNoiseFactorSq G<1", cam.emExcessNoiseFactorSq(0.5, 604), " G=1e4 N=10", cam.emExcessNoiseFactorSq(1e4, 10));
