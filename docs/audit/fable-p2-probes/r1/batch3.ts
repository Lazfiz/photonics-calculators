// R1 batch 3: super-resolution, OCT, Shack-Hartmann, speckle, holography, photoacoustic
import * as S from "../../../../src/physics/imaging/super-resolution";
import * as O from "../../../../src/physics/imaging/oct";
import * as SH from "../../../../src/physics/imaging/shack-hartmann";
import * as SP from "../../../../src/physics/imaging/speckle";
import * as H from "../../../../src/physics/imaging/holography";
import * as PA from "../../../../src/physics/imaging/photoacoustic";

const row = (slug: string, q: string, mine: number, mod: number) =>
  console.log(`${slug.padEnd(14)} ${q.padEnd(30)} mine=${mine.toPrecision(6).padStart(12)} mod=${(+mod).toPrecision(6).padStart(12)} r=${(mod / mine).toFixed(4)}${Math.abs(mod / mine - 1) > 0.005 ? "  <<<" : ""}`);
const c = 299792458;
// STED
for (const [I, lam, NA] of [[0, 640e-9, 1.4], [50, 640e-9, 1.4]]) row("super-res", `STED I/Is=${I}`, lam / (2 * NA * Math.sqrt(1 + I)), S.stedLateralFwhm(lam, NA, I));
row("super-res", "STED λsted≠λ (595/775)", 595e-9 / (2 * 1.4 * Math.sqrt(1 + 20)), S.stedLateralFwhm(595e-9, 1.4, 20, 775e-9));
row("super-res", "loc σ=0.21λ/NA/√N", 0.21 * 670e-9 / 1.4 / Math.sqrt(1000), S.localizationPrecision(670e-9, 1.4, 1000));
// Mortensen
function mort(lam: number, NA: number, N: number, a: number, b2: number, mle: boolean, em: boolean) {
  const s = 0.21 * lam / NA; const sa2 = s * s + a * a / 12; const tau = 2 * Math.PI * sa2 * b2 / (N * a * a);
  let f: number;
  if (!mle) f = 16 / 9 + 4 * tau; // 8π sa² b²/(N a²) = 4τ
  else { let I = 0; const M = 20000; for (let i = 0; i < M; i++) { const t = (i + 0.5) / M; I += Math.log(t) / (1 + t / tau); } I /= M; f = b2 === 0 ? 1 : 1 / (1 + I); }
  return Math.sqrt(sa2 / N * f * (em ? 2 : 1));
}
for (const [N, b2] of [[1000, 0], [1000, 10], [200, 50]]) for (const mle of [false, true]) row("palm-storm", `Mort ${mle ? "MLE" : "LS"} N${N} b²${b2}`, mort(670e-9, 1.4, N, 100e-9, b2, mle, false), S.mortensenPrecision(670e-9, 1.4, N, 100e-9, b2, { estimator: mle ? "mle" : "ls" }));
row("palm-storm", "Mort LS EMCCD", mort(670e-9, 1.4, 1000, 100e-9, 10, false, true), S.mortensenPrecision(670e-9, 1.4, 1000, 100e-9, 10, { estimator: "ls", emccd: true }));
row("palm-storm", "Nyquist 2D ρ=1e15/m²", 2 / Math.sqrt(1e15), S.nyquistResolution(1e15, 2));
row("palm-storm", "eff √((2.355σ)²+N²)", Math.hypot(2 * Math.sqrt(2 * Math.LN2) * 20e-9, 60e-9), S.smlmEffectiveResolution(20e-9, 60e-9));
row("SIM", "kc 2NA/λem+2NA/λex", 2 * 1.4 / 520e-9 + 2 * 1.4 / 488e-9, S.simCutoff(488e-9, 520e-9, 1.4));
row("SIM", "FWHM 1/kc", 1 / (2 * 1.4 / 520e-9 + 2 * 1.4 / 488e-9), S.simLateralFwhm(488e-9, 520e-9, 1.4));
row("SIM", "raw 3 angles 1 order (3x3=9)", 9, S.simRawImageCount(1, 3));
row("expansion", "pre 250/4, 10+10nm", Math.hypot(250e-9 / 4, Math.hypot(10e-9, 10e-9)), S.expansionEffectiveResolution(250e-9, 4, 10e-9, 10e-9, "pre"));
// OCT
const l0 = 840e-9, dl = 50e-9;
row("oct", "Δz 0.4413λ²/(nΔλ) n1.38", 2 * Math.LN2 / Math.PI * l0 * l0 / (1.38 * dl), O.octAxialResolution(l0, dl, 1.38));
row("oct", "Δν cΔλ/λ²", c * dl / l0 ** 2, O.spectralWidthHz(l0, dl));
row("oct", "lc 0.883λ²/Δλ", 4 * Math.LN2 / Math.PI * l0 * l0 / dl, O.coherenceLength(l0, dl));
row("oct", "τc lc/c", 4 * Math.LN2 / Math.PI * l0 * l0 / dl / c, O.coherenceTime(l0, dl));
const lc = 4 * Math.LN2 / Math.PI * l0 * l0 / dl;
row("oct", "|γ(lc/2)| = 0.5", 0.5, O.degreeOfCoherence(lc / 2, l0, dl));
row("oct", "V 2√(RrRs)/(Rr+Rs) 1,1e-3", 2 * Math.sqrt(1e-3) / (1 + 1e-3), O.fringeVisibility(1, 1e-3));
row("oct", "fD 2nv cosθ/λ 1mm/s n1.38 10°", 2 * 1.38 * 1e-3 * Math.cos(10 * Math.PI / 180) / l0, O.dopplerFrequency(1e-3, l0, 1.38, 10 * Math.PI / 180));
const q = 1.602176634e-19;
row("oct", "SNR_FD ρPτ/(2q)?", 0.9 * 1e-6 * 20e-6 / (2 * q), O.fdOctSnr(0.9, 1e-6, 20e-6));
row("oct", "SNR_TD ρP/(2qB)?", 0.9 * 1e-6 / (2 * q * 1e6), O.tdOctSnr(0.9, 1e-6, 1e6));
// Shack-Hartmann (λ 633 nm, f 5 mm, d 150 µm)
const L = 633e-9, f = 5e-3, d = 150e-6;
row("shack-hartmann", "r0 square λf/d", L * f / d, SH.spotFirstZeroRadius(L, f, d, "square" as never));
row("shack-hartmann", "r0 circ 1.22λf/d", 1.21967 * L * f / d, SH.spotFirstZeroRadius(L, f, d, "circular" as never));
row("shack-hartmann", "FWHM square 0.8859λf/d", 0.88589 * L * f / d, SH.spotFwhm(L, f, d, "square" as never));
row("shack-hartmann", "FWHM circ 1.029λf/d", 1.02899 * L * f / d, SH.spotFwhm(L, f, d, "circular" as never));
row("shack-hartmann", "NF (d/2)²/(λf)", (d / 2) ** 2 / (L * f), SH.fresnelNumber(L, f, d));
row("shack-hartmann", "θmax (d/2-λf/d)/f sq", (d / 2 - L * f / d) / f, SH.dynamicRangeAngle(L, f, d, "square" as never));
row("shack-hartmann", "θmax circ", (d / 2 - 1.21967 * L * f / d) / f, SH.dynamicRangeAngle(L, f, d, "circular" as never));
row("shack-hartmann", "W/px  p·d/f (5.5µm)", 5.5e-6 * d / f, SH.wavefrontPerPixel(5.5e-6, f, d));
console.log("  centroidPrecision sq N=1000:", SH.centroidPrecision(L, f, d, "square" as never, 1000), " λf/d/√N=", L * f / d / Math.sqrt(1000), " (FWHM/2.355)/√N=", 0.88589 * L * f / d / 2.3548 / Math.sqrt(1000));
console.log("  lensletsInPupil(5mm,150µm)", SH.lensletsInPupil(5e-3, d), " π/4(D/d)²=", Math.PI / 4 * (5e-3 / d) ** 2, " dynRangeOverPupil", SH.dynamicRangeOverPupil(0.01, 5e-3));
// speckle
row("speckle", "obj 1.22λz/D (diam? /r?)", 1.21967 * 633e-9 * 1 / 1e-3, SP.objectiveSpeckleSize(633e-9, 1, 1e-3));
row("speckle", "subj 1.22(1+M)λF#", 1.21967 * 2 * 633e-9 * 8, SP.subjectiveSpeckleSize(633e-9, 8, 1));
row("speckle", "σφ 4πσh/λ", 4 * Math.PI * 50e-9 / 633e-9, SP.surfacePhaseRms(50e-9, 633e-9));
console.log("  speckleContrast(σφ=0.5,1;2,1;5,1;5,10)", [[0.5, 1], [2, 1], [5, 1], [5, 10]].map(([p, n]) => SP.speckleContrast(p, n).toFixed(4)).join(" "), " averaged(1,4)", SP.averagedContrast(1, 4));
// holography
row("holography", "Δξ λz/(NΔx)", 633e-9 * 0.1 / (2048 * 3.45e-6), H.fresnelReconstructionPitch(633e-9, 0.1, 2048, 3.45e-6));
row("holography", "NA sin(atan(NΔx/2z))", Math.sin(Math.atan(2048 * 3.45e-6 / 0.2)), H.hologramNA(2048, 3.45e-6, 0.1));
row("holography", "θmax 2asin(λ/2Δx)?", 2 * Math.asin(633e-9 / (2 * 3.45e-6)), H.maxInterferenceAngle(633e-9, 3.45e-6));
row("holography", "θmax asin(λ/2Δx)", Math.asin(633e-9 / (2 * 3.45e-6)), H.maxInterferenceAngle(633e-9, 3.45e-6));
row("holography", "DOF λ/NA²", 633e-9 / 0.03 ** 2, H.depthOfFocus(633e-9, 0.03));
row("holography", "NF a²/(λz)", 1e-6 / (633e-9 * 0.1), H.fresnelNumber(1e-3, 633e-9, 0.1));
row("holography", "SLM θ asin(λ/2Δx) 8µm", Math.asin(633e-9 / 16e-6), H.slmMaxAngle(633e-9, 8e-6));
row("holography", "replay λz/Δx", 633e-9 * 0.3 / 8e-6, H.replayField(633e-9, 0.3, 8e-6));
row("holography", "η sinc²(π/L) L=4", (Math.sin(Math.PI / 4) / (Math.PI / 4)) ** 2, H.phaseQuantizationEfficiency(4));
console.log("  inlineMinDistance", H.inlineMinDistance(633e-9, 2048, 3.45e-6, 1e-3), " effNA", H.hologramEffectiveNA(633e-9, 2048, 3.45e-6, 0.1), " envelope(f=1/(2Δx))", H.pixelEnvelope(1 / (2 * 8e-6), 8e-6, 1), "sinc²(π/2)=", (Math.sin(Math.PI / 2) / (Math.PI / 2)) ** 2);
// photoacoustic
row("photoacoustic", "p0 ΓμaF", 0.2 * 100 * 200, PA.initialPressure(0.2, 100, 200));
row("photoacoustic", "μeff √(3μa(μa+μs'))", Math.sqrt(3 * 10 * (10 + 1000)), PA.effectiveAttenuation(10, 1000));
row("photoacoustic", "axial 0.88c/Δf", 0.88 * 1540 / 20e6, PA.paAxialResolution(1540, 20e6));
row("photoacoustic", "lateral 0.71c/(NA fc)", 0.71 * 1540 / (0.5 * 50e6), PA.paLateralResolution(1540, 0.5, 50e6));
row("photoacoustic", "loss α0 f z dB (0.5dB/cm/MHz,10MHz,2cm)", 0.5 * 10 * 2, PA.acousticLossDb(0.5, 10e6, 2e-2));
console.log("  stress τ", PA.stressConfinementTime(10e-6, 1540), "mine", 10e-6 / 1540, " skin(532nm,10ns)", PA.skinPulseLimit(532e-9, 10e-9), "J/m² mine 200 J/m² (20 mJ/cm²); skin(1064,10ns)", PA.skinPulseLimit(1064e-9, 10e-9), "mine 1000 J/m²; long 532", PA.skinLongExposureIrradianceLimit(532e-9), "mine 2000 W/m²; 1064", PA.skinLongExposureIrradianceLimit(1064e-9), "mine 2000*10^(0.002*(1064-700))=", 2000 * 10 ** (0.002 * 364), "→ cap at 1050? (C_A=5 for 1050-1400 → 10000)");
