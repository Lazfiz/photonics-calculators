// R1 batch 4: well capacity, saturation, read/temporal noise, SNDR, uniformity, antiblooming, BI, CCD vs CMOS,
// Geiger-mode afterpulse, vacuum photodiode, amplifier noise, SPCM.
import * as cam from "../../../../src/physics/detectors/camera-snr";
import * as nz from "../../../../src/physics/detectors/noise";
import * as sn from "../../../../src/physics/detectors/sensor-noise";
import * as ab from "../../../../src/physics/detectors/antiblooming";
import * as dt from "../../../../src/physics/detectors/dead-time";
import * as pe from "../../../../src/physics/detectors/photoemission";
import * as spad from "../../../../src/physics/detectors/spad";
const q = 1.602176634e-19, h = 6.62607015e-34, c = 299792458, kB = 1.380649e-23, me = 9.1093837139e-31, eps0 = 8.8541878188e-12;
const cmp = (name: string, mine: number, code: number) =>
  console.log(`${name.padEnd(44)} mine=${mine.toPrecision(6).padStart(12)} code=${String(Number(code.toPrecision(6))).padStart(12)} ratio=${(code / mine).toFixed(5)}`);
cmp("well DR 50000/5", 80, cam.dynamicRangeDb(50000, 5));
cmp("well pixel C = FW q/V", 50000 * q / 1.5, cam.pixelCapacitance(50000, 1.5));
cmp("well MDS SNR=3 floor 5 (with shot)", (9 + Math.sqrt(81 + 36 * 25)) / 2, nz.minDetectableSignal(5, 3));
cmp("saturation q-noise 20000/4096/sqrt12", 20000 / 4096 / Math.sqrt(12), cam.quantizationNoise(20000 / 4096));
cmp("saturation DR 20000/5", 20 * Math.log10(4000), cam.dynamicRangeDb(20000, 5));
cmp("readout noise sqrt(100+0.001)", Math.sqrt(100 + 0.001), nz.sensorNoiseElectrons({ signal: 0, read: 10, dark: 0.001 }));
const S0 = 1; // per Hz, white; corner 1 kHz, B 1 MHz, fLow 50 Hz
console.log("temporal cornerFlickerRms(1,1e3,1e6,50)", nz.cornerFlickerRms(1, 1e3, 1e6, 50), " mine total(white over B incl.) sqrt(1+fc/B ln(B/fL))", Math.sqrt(1 + 1e-3 * Math.log(1e6 / 50)), " flicker-only sqrt(fc/B ln)", Math.sqrt(1e-3 * Math.log(1e6 / 50)));
const pq = 10 ** (-(6.0206 * 12 + 1.7609) / 10);
cmp("sndr SINAD dB", 10 * Math.log10(1 / (1e-7 + 1e-8 + pq)), nz.sinadWithQuantizationDb(1, 1e-7, 1e-8, 12));
cmp("sndr ideal SQNR 12b", 6.0206 * 12 + 1.7609, nz.idealSqnrDb(12));
cmp("sndr ENOB(68.247)", (68.247 - 1.7609) / 6.0206, nz.enobFromSinad(68.247));
const u = sn.sensorNoise({ signal: 50000, read: 5, dark: 100, prnu: 0.01, dsnu: 2 });
cmp("uniformity total (PRNU on signal only)", Math.sqrt(50000 + 100 + 25 + 500 ** 2 + 4), u.total);
console.log("uniformity obj", JSON.stringify(u));
cmp("antiblooming onset", 40000 + 10000 / 0.01, ab.bloomingOnset(50000, 0.8, 0.99));
console.log("antiblooming(70000)", JSON.stringify(ab.antiblooming(70000, 50000, 0.8, 0.99)), " mine collected", 40000 + 0.01 * 30000);
cmp("BI shot-limited SNR gain sqrt(.95/.4)", Math.sqrt(0.95 / 0.4), nz.qeRatioSnrGain(0.95 / 0.4, "shot"));
cmp("BI read-limited SNR gain", 0.95 / 0.4, nz.qeRatioSnrGain(0.95 / 0.4, "read"));
cmp("ccd-vs-cmos emMaxSignal min(FW, reg/G)", Math.min(1e5, 8e5 / 300), cam.emMaxSignal(1e5, 8e5, 300));
cmp("geiger afterpulse .05 e^-50/20", 0.05 * Math.exp(-2.5), dt.afterpulseProbability([{ eta: 0.05, tau: 20e-9 }], 50e-9));
cmp("vacuum transit 2mm 100V", 2e-3 * Math.sqrt(2 * me / (q * 100)), pe.planarTransitTime(2e-3, 100));
// ramp current i ∝ t on [0,T]: find |H| = 1/sqrt2
const H = (w: number) => { let re = 0, im = 0; const N = 4000; for (let i = 0; i < N; i++) { const t = (i + 0.5) / N; re += 2 * t * Math.cos(w * t) / N; im += 2 * t * Math.sin(w * t) / N; } return Math.hypot(re, im); };
let lo = 0.1, hi = 10; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (H(m) > Math.SQRT1_2) lo = m; else hi = m; }
cmp("vacuum ramp-pulse f3dB*T", lo / (2 * Math.PI), pe.vacuumTransitBandwidth(1));
cmp("Child-Langmuir 100V 2mm A/m2", (4 * eps0 / 9) * Math.sqrt(2 * q / me) * 100 ** 1.5 / 4e-6, pe.childLangmuirCurrentDensity(100, 2e-3));
cmp("Richardson A0", 4 * Math.PI * me * kB ** 2 * q / h ** 3, pe.RICHARDSON_A0);
cmp("thermionic 2 eV 298K", 1.20173e6 * 298.15 ** 2 * Math.exp(-2 / (kB / q * 298.15)), pe.thermionicCurrentDensity(298.15, 2));
cmp("threshold wavelength 2 eV nm", 1239.841984 / 2, pe.thresholdWavelength(2) * 1e9);
const rate = 1e-12 / (h * c / 650e-9), Rs = 0.65 * rate, R = Rs + 100, tau = 22e-9, P = 0.005;
cmp("SPCM photon rate 1pW 650", rate, spad.photonRate(1e-12, 650e-9));
cmp("SPCM measured nonpar", R / (1 + R * tau), dt.measuredRate(R, tau, "nonparalyzable" as never));
const m = R / (1 + R * tau);
cmp("SPCM SNR", (Rs / R) * Math.sqrt(m) / Math.sqrt(1 + (1 + R * tau) ** 2 * P * (1 - P) / (1 + P) ** 2), spad.countingSnr({ signalRate: Rs, darkRate: 100, afterpulseProb: P, deadTime: tau, gateTime: 1 }));
cmp("amp-noise q-noise e/DN 2", 2 / Math.sqrt(12), nz.quantizationNoiseElectrons(2));
cmp("amp-noise total S=1000 read 5", Math.sqrt(1000 + 25), nz.sensorNoiseElectrons({ signal: 1000, read: 5 }));
