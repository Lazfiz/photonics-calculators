// R1 batch 5: Zernike Strehl (strehl-ratio), high-NA defocus Strehl (mtf), camera SNR, denoising, Wiener
import * as W from "../../../../src/physics/imaging/wavefront";
import * as M from "../../../../src/physics/imaging/diffraction-mtf";
import * as CS from "../../../../src/physics/detectors/camera-snr";
import * as DN from "../../../../src/physics/imaging/denoising";

const row = (slug: string, q: string, mine: number, mod: number) =>
  console.log(`${slug.padEnd(14)} ${q.padEnd(32)} mine=${mine.toPrecision(6).padStart(12)} mod=${(+mod).toPrecision(6).padStart(12)} r=${(mod / mine).toFixed(4)}${Math.abs(mod / mine - 1) > 0.005 ? "  <<<" : ""}`);
const Z: Record<string, (r: number, t: number) => number> = {
  astigmatism: (r, t) => Math.sqrt(6) * r * r * Math.cos(2 * t),
  coma: (r, t) => Math.sqrt(8) * (3 * r ** 3 - 2 * r) * Math.cos(t),
  spherical: (r) => Math.sqrt(5) * (6 * r ** 4 - 6 * r * r + 1),
  trefoil: (r, t) => Math.sqrt(8) * r ** 3 * Math.cos(3 * t),
};
function strehlNum(f: (r: number, t: number) => number, s: number) {
  const NR = 400, NT = 360; let re = 0, im = 0;
  for (let i = 0; i < NR; i++) { const r = (i + 0.5) / NR; for (let j = 0; j < NT; j++) { const t = 2 * Math.PI * (j + 0.5) / NT; const p = 2 * Math.PI * s * f(r, t); re += Math.cos(p) * r; im += Math.sin(p) * r; } }
  const n = NR * NT / 2; return (re / n) ** 2 + (im / n) ** 2;
}
for (const mode of Object.keys(Z)) for (const s of [0.1, 0.3]) {
  if (!(mode in W.PV_RMS_RATIO)) { console.log("mode missing", mode); continue; }
  row("strehl-ratio", `${mode} σ=${s}`, strehlNum(Z[mode], s), W.zernikeStrehl(mode as never, s));
}
console.log("  modes in module:", Object.keys(W.PV_RMS_RATIO).join(","), " zernikeStrehl(coma,6):", W.zernikeStrehl("coma" as never, 6), " marechalRms(0.8,λ=1):", W.marechalRms(0.8, 1), "mine", Math.sqrt(-Math.log(0.8)) / (2 * Math.PI));
// high-NA defocus Strehl
function hiNa(D: number, s: number) { const N = 20000; let re = 0, im = 0; for (let i = 0; i < N; i++) { const r = (i + 0.5) / N; const p = 2 * Math.PI * D * Math.sqrt(1 - s * s * r * r); re += Math.cos(p) * 2 * r / N; im += Math.sin(p) * 2 * r / N; } return re * re + im * im; }
for (const [D, s] of [[0.5, 0.95], [1, 0.5], [2, 0.99], [0.909, 0.95]]) row("mtf", `hiNA Strehl D=${D} s=${s}`, hiNa(D, s), M.highNaDefocusStrehl(D, s));
row("mtf", "Wiener ½ at H=√NSR", 0.5, M.wienerTransfer(Math.sqrt(0.01), 0.01));
row("mtf", "W020 parax dz NA²/(2n)", 0.5e-6 * 0.5 ** 2 / 2, M.defocusW020(0.5e-6, 0.5, 1));
// camera SNR
const F2 = (G: number, N: number) => 2 * (G - 1) * G ** (-(N + 1) / N) + 1 / G;
row("signal-to-noise", "EM F² G=300 N=512", F2(300, 512), CS.emExcessNoiseFactorSq(300, 512));
{
  const S = 100, r = 1.5, d = 0.5, b = 2;
  row("signal-to-noise", "sCMOS SNR", S / Math.sqrt(S + b + d + r * r), CS.cameraSnr({ signal: S, read: r, dark: d, background: b }));
  const G = 300, F = CS.emExcessNoiseFactorSq(G, 512), cic = 0.005;
  row("signal-to-noise", "EM SNR", S / Math.sqrt(F * (S + b + d + cic) + (50 / G) ** 2), CS.cameraSnr({ signal: S, read: 50, dark: d, background: b, gain: G, excessNoiseFactorSq: F, cic }));
}
row("sensor-cmos", "binned read digital 2x2 σ·2", 1.5 * 2, CS.binnedReadNoise(1.5, 2, "digital"));
row("sensor-cmos", "binned read charge σ", 1.5, CS.binnedReadNoise(1.5, 2, "charge"));
row("dynamic-range", "DR 20log(30000/1.5)", 20 * Math.log10(30000 / 1.5), CS.dynamicRangeDb(30000, 1.5));
row("dynamic-range", "q/√12 (2 e/DN)", 2 / Math.sqrt(12), CS.quantizationNoise(2));
row("signal-to-noise", "frames (5→20)=16", 16, CS.framesForSnr(5, 20));
row("dynamic-range", "C=Q/V (30k e, 1V) F", 30000 * 1.602176634e-19 / 1, CS.pixelCapacitance(30000, 1));
// denoising
row("denoising", "box 3x3 ratio 1/3", 1 / 3, DN.boxNoiseRatio(3));
row("denoising", "SNR gain dB 20log(3)", 20 * Math.log10(3), DN.snrGainDb(1 / 3));
{ const k = DN.gaussianKernel(1.5) as unknown as number[]; console.log("  gauss kernel len", k.length, "sum", k.reduce((a, b) => a + b, 0).toFixed(6)); }
row("denoising", "gauss σ=2 ratio ≈1/(2√π σ)", 1 / (2 * Math.sqrt(Math.PI) * 2), DN.gaussianNoiseRatio(2));
row("denoising", "median big-n var π/2 (n=101)", Math.PI / 2, DN.medianVarianceFactor(101));
row("denoising", "VisuShrink σ√(2lnN)", 3 * Math.sqrt(2 * Math.log(1e6)), DN.visuShrinkThreshold(3, 1e6));
row("denoising", "box transfer k3 f0.2 |sin(3πf)/(3sinπf)|", Math.abs(Math.sin(3 * Math.PI * 0.2) / (3 * Math.sin(Math.PI * 0.2))), DN.boxTransfer(3, 0.2));
