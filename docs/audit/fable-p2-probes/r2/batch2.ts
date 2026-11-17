// R2 batch 2: spectral-resolution, grating-efficiency, etalon-fsr, ftir, line broadening, CRDS, Raman
import * as SR from "../../../../src/physics/spectroscopy/spectral-resolution";
import * as ET from "../../../../src/physics/spectroscopy/etalon";
import { airyPeakNear, coefficientOfFinesse, reflectingFinesse } from "../../../../src/physics/thin-film/interference";
import * as FT from "../../../../src/physics/spectroscopy/ftir";
import * as LB from "../../../../src/physics/spectroscopy/line-broadening";
import * as CR from "../../../../src/physics/spectroscopy/cavity-ring-down";
import * as RA from "../../../../src/physics/spectroscopy/raman";
import { c, h, k_B } from "../../../../src/physics/constants";

const p = (s: string, mine: number, mod: number) => console.log(`${s.padEnd(46)} mine=${mine.toPrecision(6)} mod=${mod.toPrecision(6)} ratio=${(mod / mine).toFixed(5)}`);
const D = Math.PI / 180;

// spectral-resolution defaults: 1200 l/mm, 500 nm, alpha 10, f 500 mm, slit 25 um, W 50 mm
{
  const d = 1e-3 / 1200, lam = 500e-9, a = 10 * D, f = 0.5, w = 25e-6, W = 0.05;
  const beta = Math.asin(lam / d - Math.sin(a));
  const r = SR.spectralResolutionByMode({ mode: "grating", lambda: lam, slitWidth: w, focalLength: f, grooveSpacing: d, order: 1, incidence: a, gratingWidth: W, angularDispersion: 1e5, beamWidth: 0.025, fsr: 0.05e-9, finesse: 50 });
  p("SR grating beta (deg)", beta / D, r.beta / D);
  p("SR grating slit bandpass (nm)", (w * d * Math.cos(a)) / f * 1e9, r.slit * 1e9);
  p("SR grating diffraction (nm)", lam / (W / d) * 1e9, r.diff * 1e9);
  p("SR recip lin disp (nm/mm)", d * Math.cos(beta) / f * 1e6, r.recipLinear * 1e6);
  const pr = SR.spectralResolutionByMode({ mode: "prism", lambda: lam, slitWidth: w, focalLength: f, grooveSpacing: d, order: 1, incidence: a, gratingWidth: W, angularDispersion: 1e5, beamWidth: 0.025, fsr: 0.05e-9, finesse: 50 });
  p("SR prism slit (nm)", 0.5, pr.slit * 1e9);
  p("SR prism diff (nm)", 0.2, pr.diff * 1e9);
  // Airy FWHM page line 84 vs exact
  const Fc = (2 * 50 / Math.PI) ** 2; p("FP Airy FWHM (nm) exact", 0.05 * 2 / Math.PI * Math.asin(1 / Math.sqrt(Fc)), (2 * 0.05 / Math.PI) * Math.asin(Math.PI / (2 * 50)));
  // extreme: alpha=-80, order 1 at 500 nm unreachable? sin b = 0.6+0.985 > 1 -> NaN
  const u = SR.spectralResolutionByMode({ mode: "grating", lambda: lam, slitWidth: w, focalLength: f, grooveSpacing: d, order: 1, incidence: -80 * D, gratingWidth: W, angularDispersion: 1e5, beamWidth: 0.025, fsr: 0.05e-9, finesse: 50 });
  console.log("SR alpha=-80 kind", u.kind, "res", u.res);
}
// grating-efficiency defaults: 1200 l/mm, phi 17.5, 500 nm, m=1, Littrow
{
  const d = 1e-3 / 1200, phi = 17.5 * D, lam = 500e-9;
  p("GE blaze wl Littrow (nm)", 2 * d * Math.sin(phi) * 1e9, SR.blazeWavelength(d, 1, phi, phi) * 1e9);
  const th = Math.asin(lam / (2 * d));
  // independent: sinc^2 envelopes, rho = cos(phi) (alpha < phi), sum over propagating orders
  const env = (m: number) => { const sb = m * lam / d - Math.sin(th); if (Math.abs(sb) > 1) return 0; const b = Math.asin(sb); const x = Math.PI * d * Math.cos(phi) * (Math.sin(th - phi) + Math.sin(b - phi)) / lam; return x === 0 ? 1 : (Math.sin(x) / x) ** 2; };
  let tot = 0; for (let m = -3; m <= 3; m++) tot += env(m);
  p("GE scalar efficiency Littrow 500 nm", env(1) / tot, SR.littrowBlazeEfficiency(lam, d, 1, phi));
  p("GE Littrow angle (deg)", th / D, SR.littrowAngle(lam, d, 1) / D);
}
// etalon defaults: n=1, d=10 um, R=0.8, 1550 nm
{
  const n = 1, d = 10e-6, R = 0.8, lam = 1550e-9;
  const F = coefficientOfFinesse(R);
  p("ET coefficient F", 4 * R / (1 - R) ** 2, F);
  p("ET reflecting finesse", Math.PI * Math.sqrt(R) / (1 - R), reflectingFinesse(F));
  p("ET FSR nu (Hz)", c / (2 * n * d), ET.fsrFrequency(n, d, 1));
  p("ET FSR lambda (nm)", lam * lam / (2 * n * d) * 1e9, ET.fsrWavelength(lam, n, d, 1) * 1e9);
  p("ET FWHM nu (Hz) exact", c / (2 * n * d) * (2 / Math.PI) * Math.asin(1 / Math.sqrt(F)), ET.fwhmFrequency(ET.fsrFrequency(n, d, 1), F));
  const pk = airyPeakNear(n * d, lam, F); const m = Math.round(2 * n * d / lam); const dl = 2 * Math.asin(1 / Math.sqrt(F));
  p("ET nearest peak (nm)", 2 * n * d / m * 1e9, pk.wavelength * 1e9);
  p("ET peak FWHM lambda exact (nm)", 4 * Math.PI * n * d * (1 / (2 * Math.PI * m - dl) - 1 / (2 * Math.PI * m + dl)) * 1e9, pk.fwhm * 1e9);
  // other regime: angle 60 deg into n=1.5
  const th = ET.gapAngle(60 * D, 1.5); p("ET gap angle 60deg n1.5", Math.asin(Math.sin(60 * D) / 1.5) / D, th / D);
}
// FTIR FWHMs, independent numerical cosine transform
{
  const A: Record<string, (u: number) => number> = {
    boxcar: () => 1, triangular: (u) => 1 - u, "happ-genzel": (u) => 0.54 + 0.46 * Math.cos(Math.PI * u),
    "nb-weak": (u) => { const q = 1 - u * u; return 0.384093 - 0.087577 * q + 0.703484 * q * q; },
    "nb-medium": (u) => { const q = 1 - u * u; return 0.152442 - 0.136176 * q + 0.983734 * q * q; },
    "nb-strong": (u) => { const q = 1 - u * u; return 0.045335 + 0.554883 * q * q + 0.399782 * q ** 4; },
    bh4: (u) => 0.35875 + 0.48829 * Math.cos(Math.PI * u) + 0.14128 * Math.cos(2 * Math.PI * u) + 0.01168 * Math.cos(3 * Math.PI * u),
  };
  for (const [name, a] of Object.entries(A)) {
    const ils = (s: number) => { let t = 0; const N = 4000; for (let i = 0; i <= N; i++) { const u = i / N; t += a(u) * Math.cos(2 * Math.PI * s * u) * (i === 0 || i === N ? 0.5 : 1); } return t / N; };
    const i0 = ils(0); let lo = 0, hi = 3; for (let k = 0; k < 50; k++) { const mid = (lo + hi) / 2; if (ils(mid) > i0 / 2) lo = mid; else hi = mid; }
    p(`FTIR ILS FWHM x L ${name}`, 2 * lo, FT.ilsFwhm(name as FT.FtirApodization));
  }
  p("FTIR nominal res L=0.5cm", 2, FT.nominalResolution(0.5));
  p("FTIR scan time L=1cm v=0.5cm/s", 1, FT.scanTime(1, 0.5));
}
// line broadening
{
  const amu = 1.66053906660e-27;
  p("Doppler frac Na 589 300K m=22.99u", Math.sqrt(8 * k_B * 300 * Math.LN2 / (22.99 * amu * c * c)), LB.dopplerFwhmFraction(300, 22.99 * amu));
  console.log("  -> Na D at 300 K Doppler FWHM (GHz)", (LB.dopplerFwhmFraction(300, 22.99 * amu) * c / 589e-9 / 1e9).toFixed(3), "(lit. ~1.3 GHz)");
  for (const [G, L] of [[1, 1], [1, 0.01], [0.01, 1], [1, 5]]) p(`Voigt FWHM exact vs OL G=${G} L=${L}`, LB.voigtFwhm(G, L), LB.voigtFwhmOlivero(G, L));
  // normalisation
  let sg = 0, sl = 0, sv = 0; const N = 400000, X = 2000; for (let i = 0; i <= N; i++) { const x = -X + 2 * X * i / N; const w = (i === 0 || i === N ? 0.5 : 1) * 2 * X / N; sg += LB.gaussianProfile(x, 1) * w; sl += LB.lorentzianProfile(x, 1) * w; sv += LB.voigtProfile(x, 1, 1) * w; }
  p("Gaussian area", 1, sg); p("Lorentzian area (tails beyond +-2000 lost 3.2e-4)", 1 - 1 / (Math.PI * 1000), sl); p("Voigt area", 1 - 1 / (Math.PI * 1000), sv);
  p("Voigt(0,G=1,L=0) via G=1e-9 L", LB.gaussianProfile(0, 1), LB.voigtProfile(0, 1, 1e-9));
  p("natural FWHM tau=16ns (MHz)", 1 / (2 * Math.PI * 16e-9) / 1e6, LB.naturalFwhmHz(16e-9) / 1e6);
}
// CRDS: L=0.5 m, R=0.9999 both, no other loss, A=0
{
  const L = 0.5, R = 0.9999; const lam = CR.roundTripLoss(R, R, 0, 0);
  p("CRDS tau0 (us) L/(c(1-R))", L / (c * (1 - R)) * 1e6, CR.ringDownTime(L, lam) * 1e6);
  p("CRDS finesse pi sqrt R/(1-R)", Math.PI * Math.sqrt(R) / (1 - R), CR.cavityFinesse(lam));
  const tau0 = CR.ringDownTime(L, lam);
  p("CRDS alpha_min (1/cm) dtau/tau=1e-3", 1e-3 * (1 - R) / L / 100, CR.minDetectableAbsorption(tau0, 1e-3) / 100);
  const al = 1e-6 * 100; const A = al * L / Math.LN10; // per pass absorbance for alpha=1e-6 /cm
  const tau = CR.ringDownTime(L, CR.roundTripLoss(R, R, 0, A));
  p("CRDS alpha back from tau (1/m)", al, CR.absorptionFromRingDown(tau, tau0));
}
// Raman: 532 nm, 1000 cm-1, 300 K
{
  const lL = 532e-9, sh = 1000e2, T = 300; const nuL = 1 / lL;
  p("Raman Stokes wl (nm)", 1 / (nuL - sh) * 1e9, RA.stokesWavelength(lL, sh) * 1e9);
  p("Raman antiStokes wl (nm)", 1 / (nuL + sh) * 1e9, RA.antiStokesWavelength(lL, sh) * 1e9);
  p("aS/S power", ((nuL + sh) / (nuL - sh)) ** 4 * Math.exp(-h * c * sh / (k_B * T)), RA.antiStokesStokesRatio(lL, sh, T, "power"));
  p("shift of 563.98 nm line (cm-1)", (1 / 532e-9 - 1 / 563.98e-9) / 100, RA.ramanShiftOf(lL, 563.98e-9) / 100);
}
