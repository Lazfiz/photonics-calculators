// R1 batch 1: APD, EMCCD, photon transfer, SPAD, dead time, TIA. Independent values vs module (ratio).
import * as apd from "../../../../src/physics/detectors/apd";
import * as cam from "../../../../src/physics/detectors/camera-snr";
import * as sn from "../../../../src/physics/detectors/sensor-noise";
import * as spad from "../../../../src/physics/detectors/spad";
import * as dt from "../../../../src/physics/detectors/dead-time";
import * as tia from "../../../../src/physics/detectors/tia";
const q = 1.602176634e-19, h = 6.62607015e-34, c = 299792458, kB = 1.380649e-23;
const cmp = (name: string, mine: number, code: number) =>
  console.log(`${name.padEnd(46)} mine=${mine.toPrecision(6).padStart(12)} code=${String(Number(code.toPrecision(6))).padStart(12)} ratio=${(code / mine).toFixed(5)}`);
// excess-noise
const F = (M: number, k: number) => k * M + (1 - k) * (2 - 1 / M);
cmp("excess-noise F(100,0.02)", F(100, 0.02), apd.excessNoiseFactor(100, 0.02));
cmp("excess-noise x(100,0.02)", Math.log(F(100, 0.02)) / Math.log(100), apd.excessNoiseIndex(100, 0.02));
cmp("excess-noise F(50,k=1)", 50, apd.excessNoiseFactor(50, 1));
cmp("excess-noise F(1,0.3)", 1, apd.excessNoiseFactor(1, 0.3));
console.log("probe F(0.5,0.02)", apd.excessNoiseFactor(0.5, 0.02), "F(100,-0.1)", apd.excessNoiseFactor(100, -0.1));
// avalanche-gain (Miller)
cmp("avalanche-gain Miller(140,150,3)", 1 / (1 - (140 / 150) ** 3), apd.millerGain(140, 150, 3));
cmp("avalanche-gain Miller(149.9,150,3)", 1 / (1 - (149.9 / 150) ** 3), apd.millerGain(149.9, 150, 3));
console.log("probe Miller V=150", apd.millerGain(150, 150, 3), "V=155", apd.millerGain(155, 150, 3), "V=-10", apd.millerGain(-10, 150, 3));
// linear-mode-avalanche
const resp = (0.8 * q * 800e-9) / (h * c);
const Ip = 1e-9 * resp, Id = 2.2e-13, B = 100e6, R = 1000, T = 300;
const snrM = (M: number, k: number) => (M * Ip) ** 2 / (2 * q * (Ip + Id) * M * M * F(M, k) * B + (4 * kB * T * B) / R);
const p = { photocurrent: Ip, darkCurrent: Id, k: 0.02, bandwidth: B, loadResistance: R, temperature: T };
cmp("lin-APD SNR(M=100) linear", snrM(100, 0.02), apd.apdReceiver(p, 100).snr);
let best = 1, bs = 0; for (let M = 1; M < 5000; M *= 1.0001) { const s = snrM(M, 0.02); if (s > bs) { bs = s; best = M; } }
cmp("lin-APD M_opt", best, apd.optimumGain(p));
const p2 = { ...p, k: 1, loadResistance: 1e6 }; let b2 = 1, s2 = 0; for (let M = 1; M < 5000; M *= 1.0001) { const s = (M * Ip) ** 2 / (2 * q * (Ip + Id) * M * M * F(M, 1) * B + (4 * kB * T * B) / 1e6); if (s > s2) { s2 = s; b2 = M; } }
cmp("lin-APD M_opt k=1 R=1M", b2, apd.optimumGain(p2));
// EM gain
const N = cam.EM_REGISTER_STAGES;
const emF2 = (G: number, n: number) => 2 * (G - 1) * G ** (-(n + 1) / n) + 1 / G;
cmp("em-gain p_stage(100,604)", 100 ** (1 / N) - 1, cam.emStageProbability(100, N));
cmp("em-gain F2(100,604)", emF2(100, N), cam.emExcessNoiseFactorSq(100, N));
cmp("em-gain F2(1,604)", 1, cam.emExcessNoiseFactorSq(1, N));
const f2 = emF2(100, N);
const snrEm = 10 / Math.sqrt(f2 * (10 + 0.001) + (50 / 100) ** 2);
cmp("em-gain EM SNR S=10", snrEm, cam.cameraSnr({ signal: 10, read: 50, cic: 0.001, gain: 100, excessNoiseFactorSq: f2 }));
cmp("em-gain conv SNR S=10", 10 / Math.sqrt(10 + 36), cam.cameraSnr({ signal: 10, read: 6 }));
const xo = (36 - 0.25 - f2 * 0.001) / (f2 - 1);
cmp("em-gain crossover S", xo, cam.emCrossoverSignal({ gain: 100, excessNoiseFactorSq: f2, emRead: 50, conventionalRead: 6, cic: 0.001 }));
// electron-multiplying
const f3 = emF2(1000, N);
cmp("EMCCD SNR S=10 G=1000", 10 / Math.sqrt(f3 * 10.001 + 0.06 ** 2), cam.cameraSnr({ signal: 10, read: 60, dark: 0.001, gain: 1000, excessNoiseFactorSq: f3 }));
cmp("sCMOS SNR S=10", 10 / Math.sqrt(10.001 + 2.25), cam.cameraSnr({ signal: 10, read: 1.5, dark: 0.001 }));
// photon-transfer
cmp("PTC shot=read crossover", 100, sn.shotReadCrossover(10));
cmp("PTC shot=PRNU crossover (1%)", 1e4, sn.shotPrnuCrossover(0.01));
cmp("PTC DR dB", 20 * Math.log10(50000 / 10), cam.dynamicRangeDb(50000, 10));
const s1 = sn.sensorNoise({ signal: 1e4, read: 10, prnu: 0.01 });
console.log("sensorNoise(1e4,10,1%)", JSON.stringify(s1), "mine total", Math.sqrt(1e4 + 100 + 1e4));
// SPAD
const rate = 1e-15 / ((h * c) / 1550e-9);
cmp("spad photon rate -120dBm 1550", rate, spad.photonRate(spad.dbmToWatts(-120), 1550e-9));
const Rs = 0.115 * rate, Rd = 1.19, tau = 20e-6, P = 0.022, Tg = 1, Rt = Rs + Rd, m = Rt / (1 + Rt * tau);
cmp("spad SNR (docstring model)", (Rs / Rt) * Math.sqrt(m * Tg) / Math.sqrt(1 + (1 + Rt * tau) ** 2 * P * (1 - P) / (1 + P) ** 2), spad.countingSnr({ signalRate: Rs, darkRate: Rd, afterpulseProb: P, deadTime: tau, gateTime: Tg }));
cmp("spad SNR simple Rs T/sqrt(RT)", Rs / Math.sqrt(Rt), spad.countingSnr({ signalRate: Rs, darkRate: Rd, afterpulseProb: 0, deadTime: 0, gateTime: 1 }));
const kBeV = kB / q; cmp("spad doubling interval 163K Ea .25", (kBeV * 163.15 ** 2 * Math.LN2) / 0.25, spad.doublingInterval(0.25, 163.15));
cmp("spad Arrhenius 223K vs 163K", Math.exp(-0.25 / kBeV * (1 / 223.15 - 1 / 163.15)), spad.arrheniusFactor(0.25, 223.15, 163.15));
// dead time
cmp("deadtime nonpar m(1e7,25ns)", 1e7 / 1.25, dt.measuredRate(1e7, 25e-9, "nonparalyzable" as never));
cmp("deadtime par m(1e7,25ns)", 1e7 * Math.exp(-0.25), dt.measuredRate(1e7, 25e-9, "paralyzable" as never));
cmp("deadtime loss nonpar", 0.2, dt.countLoss(1e7, 25e-9, "nonparalyzable" as never));
cmp("deadtime par peak 1/tau", 1 / 25e-9, dt.paralyzablePeakRate(25e-9));
// TIA
cmp("TIA f3dB sqrt(GBW/2piRC)", Math.sqrt(1e9 / (2 * Math.PI * 1e6 * 1e-11)), tia.tiaBandwidth(1e9, 1e6, 1e-11));
cmp("TIA Cf Butterworth sqrt(C/(2pi R GBW))", Math.sqrt(1e-11 / (2 * Math.PI * 1e6 * 1e9)), tia.tiaButterworthCf(1e9, 1e6, 1e-11));
const tp = { currentNoise: 5e-15, voltageNoise: 5e-9, feedbackR: 1e6, inputC: 1e-11, temperature: 300 };
const sp = tia.tiaSpotNoise(tp, 1e5);
cmp("TIA spot total @100kHz A2/Hz", 25e-30 + 4 * kB * 300 / 1e6 + (5e-9 / 1e6) ** 2 + (5e-9 * 2 * Math.PI * 1e-11 * 1e5) ** 2, sp.total);
const f0 = tia.tiaBandwidth(1e9, 1e6, 1e-11); const fl = tia.tiaFilteredNoise(tp, f0, 100e6);
// my model: 2-pole Butterworth |H|^2 = 1/(1+(f/f0)^4), integrated 0..band
let I0 = 0, I2 = 0; const df = 100e6 / 2e6; for (let f = df / 2; f < 100e6; f += df) { const H = 1 / (1 + (f / f0) ** 4); I0 += H * df; I2 += H * f * f * df; }
console.log("TIA filtered: code enbw", fl.enbw.toPrecision(5), "my Butterworth ENBW(0..band)", I0.toPrecision(5), "pi/(2sqrt2) f0", (Math.PI / (2 * Math.SQRT2) * f0).toPrecision(5));
console.log("TIA filtered terms code", JSON.stringify(fl.terms), " my total A2 (=terms*enbw?)", ((25e-30 + 4 * kB * 300 / 1e6 + 25e-30) * I0 + (5e-9 * 2 * Math.PI * 1e-11) ** 2 * I2).toExponential(4), "code total*enbw", (fl.terms.total * fl.enbw).toExponential(4));
