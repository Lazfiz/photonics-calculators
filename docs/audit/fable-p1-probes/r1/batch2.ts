// R1 batch 2: NEP, shot/thermal/kTC/flicker noise, lock-in, boxcar, PMT, MCP, CPM, photon counting.
import * as nz from "../../../../src/physics/detectors/noise";
import * as li from "../../../../src/physics/detectors/lockin";
import * as bx from "../../../../src/physics/detectors/boxcar";
import * as em from "../../../../src/physics/detectors/electron-multiplier";
import * as dt from "../../../../src/physics/detectors/dead-time";
const q = 1.602176634e-19, h = 6.62607015e-34, c = 299792458, kB = 1.380649e-23;
const cmp = (name: string, mine: number, code: number) =>
  console.log(`${name.padEnd(44)} mine=${mine.toPrecision(6).padStart(12)} code=${String(Number(code.toPrecision(6))).padStart(12)} ratio=${(code / mine).toFixed(5)}`);
// erf (A&S 7.1.26 is too coarse; use series/continued numeric integral)
const erf = (x: number) => { let s = 0; const n = 20000; for (let i = 0; i < n; i++) { const t = (x * (i + 0.5)) / n; s += Math.exp(-t * t); } return (2 / Math.sqrt(Math.PI)) * s * (x / n); };
// nep
const iS = Math.sqrt(2 * q * 10e-9 * 1), iT = Math.sqrt(4 * kB * 300 / 50), nep = Math.hypot(iS, iT) / 0.8;
cmp("nep shot 10nA 1Hz", iS, nz.shotNoiseCurrent(10e-9, 1));
cmp("nep johnson i 50ohm", iT, nz.johnsonNoise(50, 300, 1).i);
cmp("nep NEP", nep, nz.noiseEquivalentPower(Math.hypot(iS, iT), 0.8));
cmp("nep D* 1mm2 (Jones)", Math.sqrt(0.01 * 1) / nep, nz.specificDetectivity(0.01, 1, nep));
cmp("nep D* B=1e6", Math.sqrt(0.01 * 1e6) / (nep * 1e3), nz.specificDetectivity(0.01, 1e6, nep * 1e3));
// shot / thermal / kTC / flicker
cmp("shot 1uA 1MHz", Math.sqrt(2 * q * 1e-6 * 1e6), nz.shotNoiseCurrent(1e-6, 1e6));
const jn = nz.johnsonNoise(1000, 300, 1e6); console.log("johnson obj", JSON.stringify(jn));
cmp("thermal v 1k 300K 1MHz", Math.sqrt(4 * kB * 300 * 1000 * 1e6), (jn as any).v ?? NaN);
const kt = nz.ktcNoise(10e-15, 300); console.log("ktc obj", JSON.stringify(kt));
cmp("kTC electrons 10fF", Math.sqrt(kB * 300 * 10e-15) / q, (kt as any).electrons ?? (kt as any).e ?? NaN);
cmp("flicker psd @1Hz", 3e-10 * 1e-12 / 1, nz.flickerPsd(3e-10, 1e-6, 2, 1));
cmp("flicker rms 1..1e6", Math.sqrt(3e-22 * Math.log(1e6)), nz.flickerRms(3e-10, 1e-6, 2, 1, 1e6));
cmp("flicker/shot corner", 3e-22 / (2 * q * 1e-6), nz.flickerShotCorner(3e-10, 1e-6, 2));
cmp("ktc v 10fF", Math.sqrt(kB * 300 / 10e-15), (kt as any).v ?? NaN);
// lock-in
cmp("lockin ENBW RC1 tau=1", 0.25, li.lowPassEnbw(1, 1, "rc"));
cmp("lockin ENBW RC2", 1 / 8, li.lowPassEnbw(1, 2, "rc"));
cmp("lockin ENBW RC4", 5 / 64, li.lowPassEnbw(1, 4, "rc"));
cmp("lockin ENBW BW2 (fc=1/(2pi tau))", (Math.PI / (2 * Math.SQRT2)) / (2 * Math.PI), li.lowPassEnbw(1, 2, "butterworth"));
const base = { phase_rad: 0, signal_Hz: 1000, reference_Hz: 1000, tau: 1, order: 1, filter: "rc" as const, reference: "sine" as const, inputBandwidth_Hz: 1e5 };
cmp("lockin SNR gain sqrt(Bin/ENBW)", Math.sqrt(1e5 / 0.25), li.lockinSnrGain(base));
console.log("lockin square ref match", JSON.stringify(li.referenceMatch(1000, 1000, 0, 1, 1, "rc", "square")));
console.log("lockin sine f_s=3f_r", JSON.stringify(li.referenceMatch(3000, 1000, 0, 1, 1, "rc", "sine")), " square f_s=3f_r", JSON.stringify(li.referenceMatch(3000, 1000, 0, 1, 1, "rc", "square")));
// boxcar
const sig = 500e-9 / (2 * Math.sqrt(2 * Math.LN2)), W = 100e-9;
cmp("boxcar gate avg (Gaussian)", 1e-3 * sig * Math.sqrt(2 * Math.PI) / W * erf(W / (2 * Math.SQRT2 * sig)), bx.gaussianGateAverage(1e-3, 500e-9, W, 0));
cmp("boxcar gate avg offset=FWHM/2", 1e-3 * sig * Math.sqrt(Math.PI / 2) / W * (erf((250e-9 + 50e-9) / (Math.SQRT2 * sig)) - erf((250e-9 - 50e-9) / (Math.SQRT2 * sig))), bx.gaussianGateAverage(1e-3, 500e-9, W, 250e-9));
cmp("boxcar gate ENBW 1/(2W)", 1 / (2 * W), bx.gateNoiseBandwidth(W));
cmp("boxcar gate noise (Bin>>1/W) e_n/sqrt(2W)", 100e-9 / Math.sqrt(2 * W), bx.gateNoiseRms(100e-9, 100e6, W));
cmp("boxcar gate noise Bin=1e12", 100e-9 / Math.sqrt(2 * W), bx.gateNoiseRms(100e-9, 1e12, W));
let bu = 0, bv = 0; for (let u = 0.01; u < 3; u += 1e-5) { const v = erf(u) / Math.sqrt(u); if (v > bv) { bv = v; bu = u; } }
cmp("boxcar optimal W/FWHM (white noise)", (2 * Math.SQRT2 * bu) / (2 * Math.sqrt(2 * Math.LN2)), bx.optimalGateWidthRatio());
// PMT
const d = em.uniformDynodes(3.5, 10);
cmp("pmt gain 3.5^10", 3.5 ** 10, em.dynodeGain(d));
let Fp = 0; for (let j = 0; j <= 10; j++) Fp += 3.5 ** -j;
cmp("pmt ENF sum 1/delta^j", Fp, em.dynodeExcessNoise(d));
const rs = 1e6 * 0.25, rd = 1e-9 / (q * 3.5 ** 10);
cmp("pmt analog SNR", rs / Math.sqrt(2 * (rs + rd) * Fp * 1e8), em.analogSnr(rs, rd, 1e8, Fp));
// MCP
cmp("mcp gain Eberhardt (1000V,a=50,A=.2,V0=1)", (0.2 * 1000 / (2 * 50)) ** (4 * 2500 / 1000), em.channelGain(1000, 50, 0.2, 1));
cmp("mcp strikes", 10, em.channelStrikes(1000, 50, 1));
cmp("mcp optimum L/d", 0.2 * 1000 / (2 * Math.exp(0.5)), em.optimumLdRatio(1000, 0.2, 1));
cmp("mcp max gain exp(A^2 V/(2e))", Math.exp(0.04 * 1000 / (2 * Math.E)), em.maximumChannelGain(1000, 0.2));
cmp("mcp hex pitch d=10um OAR .6", 10e-6 * Math.sqrt(Math.PI / (2 * Math.sqrt(3) * 0.6)), em.hexagonalPitch(10e-6, 0.6));
cmp("mcp stacked 2 plates", 1024 ** 2, em.stackedGain(1024, 2));
console.log("mcp saturatedChannelGain(10um)", em.saturatedChannelGain(10e-6), " (25um)", em.saturatedChannelGain(25e-6));
// CPM
cmp("cpm anode sensitivity A/W", 0.25 * 410e-9 * q / (h * c) * 1e5, em.anodeSensitivity(0.25, 410e-9, 1e5));
cmp("cpm pulse FWHM N=25 F=2", 2 * Math.sqrt(2 * Math.LN2) * Math.sqrt(2 / 25), em.pulseResolutionFwhm(25, 2));
cmp("cpm F from FWHM .666", 1 + 0, em.excessNoiseFromFwhm(0.666)); // print only
cmp("cpm photon counting SNR", 2500 / Math.sqrt(2510), em.photonCountingSnr(2500, 10, 1));
// photon counting
cmp("pc nonpar measured 1e6 50ns", 1e6 / 1.05, dt.measuredRate(1e6, 50e-9, "nonparalyzable" as never));
cmp("pc Fano 1/(1+n tau)^2", 1 / 1.05 ** 2, dt.nonParalyzableFano(1e6, 50e-9));
