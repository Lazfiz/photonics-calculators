// R1 batch 4: field-of-view, microscope, light-field, computational, coherent-Raman, SHG/SFG, cleared-tissue, FCS/FRAP
import * as F from "../../../../src/physics/imaging/field-of-view";
import * as MI from "../../../../src/physics/imaging/microscope";
import * as LF from "../../../../src/physics/imaging/light-field";
import * as CI from "../../../../src/physics/imaging/computational-imaging";
import * as CR from "../../../../src/physics/imaging/coherent-raman";
import * as SH from "../../../../src/physics/imaging/second-harmonic-generation";
import * as CT from "../../../../src/physics/imaging/cleared-tissue";
import * as FD from "../../../../src/physics/imaging/fluorescence-dynamics";
import * as G from "../../../../src/physics/imaging/gaussian-optics";

const row = (slug: string, q: string, mine: number, mod: number) =>
  console.log(`${slug.padEnd(14)} ${q.padEnd(30)} mine=${mine.toPrecision(6).padStart(12)} mod=${(+mod).toPrecision(6).padStart(12)} r=${(mod / mine).toFixed(4)}${Math.abs(mod / mine - 1) > 0.005 ? "  <<<" : ""}`);
const c = 299792458, h = 6.62607015e-34;
row("fov", "FN/M 22mm/40", 22e-3 / 40, F.objectFieldDiameter(22e-3, 40));
const fov = F.objectFov(13.3e-3, 13.3e-3, 60); row("fov", "sensor/M diag", Math.SQRT2 * 13.3e-3 / 60, fov.diagonal);
row("pixel-fov", "footprint 6.5µm/60 bin2", 2 * 6.5e-6 / 60, F.pixelFootprint(6.5e-6, 60, 2));
row("pixel-fov", "angle 2atan(s/2f)", 2 * Math.atan(10e-3 / (2 * 50e-3)), F.subtendedAngle(10e-3, 50e-3));
row("pixel-fov", "IFOV p/f", 6.5e-6 / 50e-3, F.pixelIfov(6.5e-6, 50e-3));
row("pixel-fov", "Nyq 1/(2p)", 1 / (2 * 6.5e-6), F.nyquistFrequency(6.5e-6));
row("pixel-fov", "Nyq pixel λ/(4NA)", 520e-9 / (4 * 1.4), F.nyquistPixel(520e-9, 1.4));
row("magnification", "fTL/fobj 200/4.5", 200 / 4.5, MI.objectiveMag(4.5e-3, 200e-3));
row("pupil-matching", "pupil 2fNA f=3.33mm NA1.4", 2 * 3.333e-3 * 1.4, MI.apertureDiameter(3.333e-3, 1.4));
row("magnification", "exit pupil 500mm·NA/M", 0.5 * 0.75 / 400, MI.exitPupilDiameter(0.75, 400));
const um = MI.usefulMagRange(1.4); row("magnification", "useful 500NA..1000NA", 700, um.min); row("magnification", "useful max", 1400, um.max);
row("illumination", "λ/(NAo+NAc)", 550e-9 / (1.4 + 0.9), MI.abbePeriodLimit(550e-9, 1.4, 0.9));
row("illumination", "1.22λ/(NAo+NAc)", 1.22 * 550e-9 / (1.4 + 0.9), MI.rayleighCondenserResolution(550e-9, 1.4, 0.9));
row("light-field", "N = M/(2NA) 40x/0.95", 40 / (2 * 0.95), LF.lensletFNumber(40, 0.95));
row("light-field", "Sparrow 0.47λM/NA (535nm)", 0.47 * 535e-9 * 40 / 0.95, LF.imageSparrowSpot(535e-9, 0.95, 40));
row("comp-imaging", "synthetic NA", 0.25 + 0.5, CI.syntheticNa(0.25, 0.5));
row("comp-imaging", "coh period λ/NA", 520e-9 / 0.25, CI.coherentCutoffPeriod(520e-9, 0.25));
row("comp-imaging", "incoh period λ/2NA", 520e-9 / 0.5, CI.incoherentCutoffPeriod(520e-9, 0.25));
row("comp-imaging", "SBP gain ((a+b)/a)²", 9, CI.spaceBandwidthGain(0.25, 0.5));
// coherent Raman: pump 800 nm, shift 2850 cm-1 (passed as /m)
const nu = 2850e2;
row("coherent-raman", "λS 1/(1/λp−ν̃)", 1 / (1 / 800e-9 - nu), CR.stokesWavelength(800e-9, nu));
row("coherent-raman", "λAS", 1 / (1 / 800e-9 + nu), CR.antiStokesWavelength(800e-9, nu));
row("coherent-raman", "Ω c ν̃ (Hz)", c * nu, CR.ramanShiftFrequency(nu));
row("srs", "SNR δ√(ηPτλ/hc)", 1e-4 * Math.sqrt(0.8 * 10e-3 * 2e-6 * 1040e-9 / (h * c)), CR.srsShotNoiseSnr(1e-4, 10e-3, 1040e-9, 2e-6, 0.8));
row("coherent-raman", "TL Δν̃ 0.441/(cτ) 2ps (1/m)", 0.4413 / (c * 2e-12), CR.excitationBandwidth(2e-12));
console.log("  srsLineshape(0,Γ),(Γ,Γ):", CR.srsLineshape(0, 5), CR.srsLineshape(5, 5), " carsLineshape(0,5,0)", CR.carsLineshape(0, 5, 0), " carsPeakDet(5,0.1)", CR.carsPeakDetuning(5, 0.1));
// SHG
row("shg", "b = 2πn w0²/λ", 2 * Math.PI * 1.4 * (0.5e-6) ** 2 / 900e-9, SH.confocalParameter(900e-9, 1.4, 0.5e-6));
row("shg", "Lc fwd λ/(4Δn)", 900e-9 / (4 * 0.02), SH.forwardCoherenceLength(900e-9, 0.02));
row("shg", "Lc bwd λ/(4(nω+n2ω))", 900e-9 / (4 * (1.40 + 1.42)), SH.backwardCoherenceLength(900e-9, 1.40, 1.42));
row("sfg", "λ3", 1 / (1 / 800e-9 + 1 / 1040e-9), SH.sumFrequencyWavelength(800e-9, 1040e-9));
row("shg", "BK h max 1.068 (ξ2.84,σ0.57)", 1.068, SH.boydKleinmanH(0.57, 2.84));
// cleared tissue
row("cleared-tissue", "ballistic e^-(μa+μs)z", Math.exp(-(10 + 1000) * 1e-3), CT.ballisticFraction(10, 1000, 1e-3));
row("cleared-tissue", "depth −ln f/μt", -Math.log(0.01) / 1010, CT.ballisticDepth(10, 1000, 0.01));
row("cleared-tissue", "parax shift ns/ni 1.33→1.52", 1.52 / 1.33, CT.paraxialFocalShift(1.33, 1.52));
{ const ti = Math.asin(0.9 / 1.33), ts = Math.asin(0.9 / 1.52); row("cleared-tissue", "marginal tanθi/tanθs", Math.tan(ti) / Math.tan(ts), CT.marginalFocalShift(0.9, 1.33, 1.52)); }
console.log("  marginal NA>ni:", CT.marginalFocalShift(1.4, 1.33, 1.52), " ns<ni NA>ns:", CT.marginalFocalShift(1.4, 1.52, 1.33));
// FCS/FRAP
row("fcs", "Veff π^1.5 w0² z0", Math.PI ** 1.5 * (0.2e-6) ** 2 * 1e-6, FD.fcsEffectiveVolume(0.2e-6, 1e-6));
row("fcs", "D w0²/(4τD)", (0.2e-6) ** 2 / (4 * 50e-6), FD.fcsDiffusionCoefficient(0.2e-6, 50e-6));
row("fcs", "G(τD) N=10 κ=5", (1 / 10) * 0.5 / Math.sqrt(1 + 1 / 25), FD.fcsDiffusionCorrelation(50e-6, { N: 10, tauD: 50e-6, kappa: 5 }));
row("frap", "Soumpasis t½/τD = 4·0.224", 0.8960, FD.frapHalfTimeRatio("disk"));
row("frap", "D 0.224w²/t½ (disk)", 0.224 * (1e-6) ** 2 / 1, FD.frapDiffusionCoefficient(1e-6, 1, FD.frapHalfTimeRatio("disk")));
// gaussian optics
const ti = G.thinLensImage(0.1, 0.15); row("image-distance", "1/i=1/f−1/o", 1 / (1 / 0.1 - 1 / 0.15), ti.i); row("image-distance", "M=−i/o", -(0.3) / 0.15, ti.M);
row("optical-power", "Gullstrand", 43 + 19 - (5.7e-3 / 1.336) * 43 * 19, G.twoElementPower(43, 19, 5.7e-3, 1.336));
row("optical-power", "spectacle K/(1+dK) −10D", -10 / (1 - 0.12), G.spectacleCorrection(-10, 0.012));
console.log("  thinLens o=f:", JSON.stringify(G.thinLensImage(0.1, 0.1)), " o<f:", JSON.stringify(G.thinLensImage(0.1, 0.05)));
