// R1 batch 7: em-gain registry claim on the false optimum G = 2σ²/(S + CIC) with F² = 2 − 1/G.
import * as cam from "../../../../src/physics/detectors/camera-snr";
const N = cam.EM_REGISTER_STAGES, S = 10, cic = 0.001, r = 50;
const n2 = (G: number, inf: boolean) => (inf ? 2 - 1 / G : cam.emExcessNoiseFactorSq(G, N)) * (S + cic) + (r / G) ** 2;
for (const G of [100, 300, 500, 1000, 3000, 1e4, 3e4, 1e5]) console.log(`G=${G}`, "SNR finite-N", (S / Math.sqrt(n2(G, false))).toFixed(5), " SNR N=inf", (S / Math.sqrt(n2(G, true))).toFixed(5));
let best = 1, bs = 0; for (let G = 2; G < 1e5; G *= 1.001) { const s = S / Math.sqrt(n2(G, false)); if (s > bs) { bs = s; best = G; } }
console.log("finite-N SNR max at G", best.toFixed(0), " (Infinity-N optimum 2σ²/(S+c) =", (2 * r * r / (S + cic)).toFixed(0), ")");
