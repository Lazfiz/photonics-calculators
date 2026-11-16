import * as FBG from "../../../../src/physics/fiber-optics/fiber-bragg-grating";
import * as OT from "../../../../src/physics/fiber-optics/otdr";
import * as LB from "../../../../src/physics/fiber-optics/link-budget";
import * as SA from "../../../../src/physics/fiber-optics/sagnac";
import * as AT from "../../../../src/physics/fiber-optics/silica-attenuation";
import * as SE from "../../../../src/physics/fiber-optics/fiber-sensors";
const c = 299792458, h = 6.62607015e-34;
const cmp = (name: string, mine: number, code: number) =>
  console.log(`${name.padEnd(40)} mine=${mine.toPrecision(6)} code=${code.toPrecision(6)} ratio=${(code / mine).toFixed(4)}`);
// FBG uniform
const lB = 1550e-9, ne = 1.447, Lg = 0.01, dn = 1e-4;
const kap = Math.PI * dn / lB;
cmp("period", lB / (2 * ne), lB / (2 * ne)); cmp("braggWavelength(535.6nm)", 2 * ne * 535.6e-9, FBG.braggWavelength(ne, 535.6e-9));
cmp("kappa", kap, FBG.couplingCoefficient(dn, lB));
cmp("Rpeak tanh^2", Math.tanh(kap * Lg) ** 2, FBG.peakReflectance(kap * Lg));
const g = { lambdaB: lB, nEff: ne, length: Lg, deltaN: dn };
cmp("R at peak (uniformGratingReflectance)", Math.tanh(kap * Lg) ** 2, FBG.uniformGratingReflectance(g, lB));
cmp("first-zero BW (Erdogan)", lB * lB / (Math.PI * ne * Lg) * Math.sqrt((kap * Lg) ** 2 + Math.PI ** 2), FBG.firstZeroBandwidth(g));
// FWHM by own scan of Erdogan R(σ)
const R = (lam: number) => { const s = 2 * Math.PI * ne * (1 / lam - 1 / lB); const k2 = kap * kap, s2 = s * s; if (k2 > s2) { const q = Math.sqrt(k2 - s2); return Math.sinh(q * Lg) ** 2 / (Math.cosh(q * Lg) ** 2 - s2 / k2); } const q = Math.sqrt(s2 - k2); return Math.sin(q * Lg) ** 2 / (s2 / k2 - Math.cos(q * Lg) ** 2) ; };
let lo = lB, hi = lB; const R0 = R(lB); while (R(hi) > R0 / 2) hi += 1e-14; while (R(lo) > R0 / 2) lo -= 1e-14;
cmp("FWHM own scan", hi - lo, FBG.uniformFwhm(g));
cmp("weak grating R detuned (sigma L = 3)", R(lB * (1 - 3 / (2 * Math.PI * ne * Lg) * lB)), FBG.uniformGratingReflectance(g, lB * (1 - 3 / (2 * Math.PI * ne * Lg) * lB)));
const g2 = { ...g, deltaN: 1e-5, length: 0.005 }; const k2 = Math.PI * 1e-5 / lB;
cmp("weak grating Rpeak kL=0.1", Math.tanh(k2 * 0.005) ** 2, FBG.uniformGratingReflectance(g2, lB));
const pe = ne * ne / 2 * (0.252 - 0.16 * (0.113 + 0.252));
cmp("gauge 1-pe", 1 - pe, FBG.strainGaugeFactor(ne));
cmp("shift 500ue 20K", lB * ((1 - pe) * 500e-6 + 6.165e-6 * 20 + 0.5 * 1.431e-8 * 400), FBG.braggShift(lB, 500e-6, 20, 1 - pe, 6.165e-6, 1.431e-8));
cmp("chirped BW (chirp*L)", 0.1e-9 / 1e-2 * 0.01, FBG.chirpedBandwidth(0.1e-9 / 1e-2, 0.01));
cmp("chirped GDD tau/lambda = 2 n /(c chirp)", 2 * ne / (c * (0.1e-9 / 1e-2)), FBG.chirpedGratingDispersion(ne, 0.1e-9 / 1e-2));
// Fabry-Perot sensor
cmp("FSR lam^2/(2nd) d=20um n=1", lB * lB / (2 * 1 * 20e-6), SE.freeSpectralRange(lB, 1, 20e-6));
cmp("evanescent dp lambda/(2pi sqrt(ne^2-next^2)) amplitude 1/e", lB / (2 * Math.PI * Math.sqrt(ne * ne - 1.318 ** 2)), SE.penetrationDepth(lB, ne, 1.318));
// OTDR
cmp("2-pt resolution 100ns ng 1.4682", c * 100e-9 / (2 * 1.4682), OT.twoPointResolution(100e-9, 1.4682));
cmp("capture S Gaussian 3/(2(nkw)^2)", 3 / (2 * (1.447 * 2 * Math.PI / lB * 5.2e-6) ** 2), OT.captureFraction(lB, 5.2e-6, 1.447));
const as = 0.85 / 1.55 ** 4 * Math.LN10 / 10 / 1000;
const S = OT.captureFraction(lB, 5.2e-6, 1.447);
cmp("backscatter ratio S as v tau/2", S * as * c / 1.4682 * 100e-9 / 2, OT.backscatterRatio(S, as, 100e-9, 1.4682));
cmp("Fresnel", ((1.4682 - 1) / 2.4682) ** 2, OT.fresnelReflectance(1.4682, 1));
// link budget
const lb = LB.linkBudget({ txPowerDbm: 0, rxSensitivityDbm: -28, lengthKm: 50, fiberLossDbPerKm: 0.2, splices: 10, spliceLossDb: 0.1, connectors: 2, connectorLossDb: 0.5, marginDb: 3 } as any);
console.log("linkBudget", JSON.stringify(lb));
// Sagnac
const SF = 2 * Math.PI * 500 * 0.1 / (lB * c);
cmp("Sagnac SF 500m D=10cm", SF, SA.sagnacScaleFactor(500, 0.1, lB));
cmp("proper freq c/(2 n L)", c / (2 * 1.4682 * 500), SA.properFrequency(500, 1.4682));
cmp("shot phase sqrt(2hv/(eta P)) 1mW", Math.sqrt(2 * h * c / lB / 1e-3), SA.shotNoisePhase(1e-3, lB, 1));
cmp("earth rate deg/h", 15.041, SA.EARTH_ROTATION_RATE * SA.RAD_PER_S_TO_DEG_PER_H);
cmp("ARW: 1 deg/h/rtHz -> 1/60 deg/rth", 1 / 60, SA.angleRandomWalkDegPerRootHour(1 / SA.RAD_PER_S_TO_DEG_PER_H));
cmp("loop mirror R k=0.5", 1, SA.loopMirrorReflectance(0.5)); cmp("loop mirror R k=0.3", 4 * 0.3 * 0.7, SA.loopMirrorReflectance(0.3));
cmp("loop comb period lam^2/(B L)", lB * lB / (4e-4 * 1), SA.loopCombPeriod(4e-4, 1, lB));
// attenuation
const p = { rayleighA: 0.85, geO2Fraction: 0.04, ohPeakDbPerKm: 0.05 };
console.log("silicaLoss 1550", JSON.stringify(AT.silicaLossDbPerKm(p, lB)), " 1383:", JSON.stringify(AT.silicaLossDbPerKm(p, 1383e-9)), " min:", AT.minimumLossWavelength(p));
cmp("Rayleigh A/lambda^4", 0.85 / 1.55 ** 4, AT.rayleighScatteringDbPerKm(0.85, lB));
