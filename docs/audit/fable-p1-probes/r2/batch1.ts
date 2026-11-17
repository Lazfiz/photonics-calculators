import * as NL from "../../../../src/physics/fiber-optics/fiber-nonlinear";
import * as CD from "../../../../src/physics/fiber-optics/chromatic-dispersion";
import * as PMD from "../../../../src/physics/fiber-optics/polarization-mode-dispersion";
const c = 299792458;
const cmp = (name: string, mine: number, code: number) =>
  console.log(`${name.padEnd(42)} mine=${mine.toPrecision(6)} code=${code.toPrecision(6)} ratio=${(code / mine).toFixed(4)}`);
// --- effective length, SBS, SRS (10 km, 0.2 dB/km, Aeff 80 um2)
const a = 0.2 / (10 * Math.log10(Math.E)) / 1e3; // 1/m
const L = 10e3, Aeff = 80e-12;
const Leff = (1 - Math.exp(-a * L)) / a;
cmp("alpha 1/m", a, NL.alphaFromDbPerKm(0.2));
cmp("Leff 10km", Leff, NL.effectiveLength(a, L));
cmp("Leff alpha=0", 5000, NL.effectiveLength(0, 5000));
const Pb = 21 * Aeff / (5e-11 * Leff) * (1 + 1 / 35);
cmp("SBS K=1 dnu=1MHz", Pb, NL.sbsThreshold({ Aeff, gB: 5e-11, Leff, K: 1, sourceLinewidth: 1e6, brillouinLinewidth: 35e6 }));
cmp("SBS K=1.5 dnu=1GHz", Pb / (1 + 1 / 35) * 1.5 * (1 + 1000 / 35), NL.sbsThreshold({ Aeff, gB: 5e-11, Leff, K: 1.5, sourceLinewidth: 1e9, brillouinLinewidth: 35e6 }));
cmp("SBS short 1m", 21 * Aeff / (5e-11 * 1), NL.sbsThreshold({ Aeff, gB: 5e-11, Leff: 1, K: 1, sourceLinewidth: 0, brillouinLinewidth: 35e6 }));
cmp("nu_B 1550", 2 * 1.45 * 5960 / 1550e-9, NL.brillouinShift(1550e-9));
cmp("SRS K=1", 16 * Aeff / (6.5e-14 * Leff), NL.srsThreshold(Aeff, 6.5e-14, Leff, 1));
cmp("gR(1550) ~ 1e-13*1um/lambda", 1e-13 / 1.55, NL.ramanGainAt(1550e-9));
cmp("stokes lambda (13.2THz)", 1 / (1 / 1550e-9 - 13.2e12 / c), NL.stokesWavelength(1550e-9, 13.2e12));
// --- nonlinear-effects defaults: 10 dBm, 80 km
const L2 = 80e3, Leff2 = (1 - Math.exp(-a * L2)) / a, P = 0.01;
const gam = 2 * Math.PI * 2.6e-20 / (1550e-9 * Aeff);
cmp("gamma 1/(W m)", gam, NL.nonlinearCoefficient(2.6e-20, 1550e-9, Aeff));
cmp("phiSPM", gam * P * Leff2, NL.nonlinearPhase(gam, P, Leff2));
cmp("phiXPM max 7 others", gam * P * Leff2 * (1 + 2 * 7), NL.xpmPhaseMax(gam, P, Leff2, 7));
cmp("SPM rms broad phi=1 (Agrawal 4.1.x)", Math.sqrt(1 + 4 / (3 * Math.sqrt(3)) * 1), NL.spmRmsBroadening(1));
const D = 17e-6, lam = 1550e-9, b2 = -lam * lam * D / (2 * Math.PI * c);
cmp("beta2 from D", b2, CD.beta2FromD(D, lam));
const df = 100e9;
const dB = b2 * (2 * Math.PI) ** 2 * df * df; // degenerate, |Δβ|
const dbcode = NL.fwmPhaseMismatch(b2, df, df, 0);
cmp("FWM |dbeta| 100GHz", Math.abs(dB), Math.abs(dbcode));
const eta = (x: number, LL: number) => a * a / (a * a + x * x) * (1 + 4 * Math.exp(-a * LL) * Math.sin(x * LL / 2) ** 2 / (1 - Math.exp(-a * LL)) ** 2);
cmp("FWM eta", eta(dB, L2), NL.fwmEfficiency(a, L2, dbcode));
cmp("FWM eta dbeta=0", 1, NL.fwmEfficiency(a, L2, 0));
const phi = gam * P * Leff2;
cmp("FWM ratio degenerate (d=3: eta*phi^2)", eta(dB, L2) * phi * phi, NL.fwmProductRatio(eta(dB, L2), phi, true));
cmp("FWM ratio nondeg (d=6: 4 eta phi^2)", 4 * eta(dB, L2) * phi * phi, NL.fwmProductRatio(eta(dB, L2), phi, false));
// --- chromatic dispersion
const D0 = 0.092e3 / 4 * (lam - (1310e-9) ** 4 / lam ** 3);
cmp("D sellmeier 1550", D0, CD.sellmeierDispersion(lam, 1310e-9, 0.092e3));
cmp("S sellmeier 1550", 0.092e3 / 4 * (1 + 3 * (1310 / 1550) ** 4), CD.sellmeierSlope(lam, 1310e-9, 0.092e3));
const S = 0.058e3;
cmp("beta3", (lam * lam / (2 * Math.PI * c)) ** 2 * (S + 2 * D / lam), CD.beta3FromDS(D, S, lam));
cmp("LD T0=10ps", 1e-22 / Math.abs(b2), CD.dispersionLength(10e-12, b2));
cmp("sigma_omega from sigma_lambda 0.1nm", 2 * Math.PI * c * 0.1e-9 / lam ** 2, CD.sigmaOmegaFromLambda(0.1e-9, lam));
const s0 = 50e-12 / (2 * Math.sqrt(2 * Math.LN2));
const so = 2 * Math.PI * c * 0.1e-9 / lam ** 2, Vw = 2 * so * s0;
const b2s = CD.beta2FromD(D0, lam), b3s = CD.beta3FromDS(D0, CD.sellmeierSlope(lam, 1310e-9, 92), lam);
const sig = s0 * Math.sqrt(1 + (1 + Vw * Vw) * (b2s * 80e3 / (2 * s0 * s0)) ** 2 + 0.5 * (1 + Vw * Vw) ** 2 * (b3s * 80e3 / (4 * s0 ** 3)) ** 2);
cmp("sigma out 80km 0.1nm rms 50ps", sig, CD.gaussianPulseRmsWidth({ sigma0: s0, beta2: b2s, beta3: b3s, L: 80e3, sigmaOmega: so }));
cmp("sigma_D approx D L sigma_lambda", Math.hypot(s0, D0 * 80e3 * 0.1e-9), sig);
console.log("sellmeierPulseSummary", JSON.stringify(CD.sellmeierPulseSummary({ lambda: lam, lambda0: 1310e-9, S0: 92, L: 80e3, sigmaLambda: 0.1e-9, pulseFwhm: 50e-12, bitRate: 1e9 })));
cmp("transform limited B (B sqrt(|b2|L)=1/4)", 0.25 / Math.sqrt(Math.abs(b2s) * 80e3), CD.transformLimitedBitRate(b2s, 80e3));
cmp("gauss bw 0.187/sigma", Math.sqrt(2 * Math.LN2) / (2 * Math.PI * 1e-10), CD.gaussianBandwidth(1e-10));
cmp("group delay 1km ng 1.468", 1.468e3 / c, CD.groupDelay(1e3, 1.468));
// --- PMD
const pmdc = 0.5e-12 / Math.sqrt(1e3);
cmp("mean DGD 100km", 5e-12, PMD.meanDgd(pmdc, 100e3));
cmp("P(DGD>3 mean)", 4.2e-5, PMD.dgdExceedanceProbability(15e-12, 5e-12));
cmp("pmd limited L 10G", 400e3, PMD.pmdLimitedLength(pmdc, 1e10));
cmp("dgdAtExceedance(4.2e-5)", 15e-12, PMD.dgdAtExceedance(4.2e-5, 5e-12));
