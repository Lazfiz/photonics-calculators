// Lead probe: line shapes, FTIR ILS, etalon, CRDS, Raman — independent numerics vs modules.
import * as lb from "../../../../src/physics/spectroscopy/line-broadening";
import * as ft from "../../../../src/physics/spectroscopy/ftir";
import * as et from "../../../../src/physics/spectroscopy/etalon";
import * as crd from "../../../../src/physics/spectroscopy/cavity-ring-down";
import * as rm from "../../../../src/physics/spectroscopy/raman";
const row = (s: string, mine: number, mod: number) =>
  console.log(s.padEnd(56), mine.toPrecision(7).padStart(13), mod.toPrecision(7).padStart(13), (mod / mine).toFixed(5));
const c = 299792458, h = 6.62607015e-34, kB = 1.380649e-23, u = 1.6605390666e-27;

// Voigt by direct convolution, G = L = 1
{
  const sig = 1 / (2 * Math.sqrt(2 * Math.LN2)), gam = 0.5;
  const V = (x: number) => {
    let s = 0;
    const N = 400000, R = 400;
    for (let k = 0; k < N; k++) {
      const t = -R + ((k + 0.5) * 2 * R) / N;
      s += (Math.exp(-0.5 * (t / sig) ** 2) * gam) / (Math.PI * ((x - t) ** 2 + gam * gam));
    }
    return (s * 2 * R) / N / (sig * Math.sqrt(2 * Math.PI));
  };
  row("Voigt V(0), fG=fL=1", V(0), lb.voigtProfile(0, 1, 1));
  row("Voigt V(1.3)", V(1.3), lb.voigtProfile(1.3, 1, 1));
  let a = 0.5, b = 1;
  const half = V(0) / 2;
  for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (V(m) > half) a = m; else b = m; }
  row("Voigt FWHM fG=fL=1", 2 * a, lb.voigtFwhm(1, 1));
  row("  Olivero-Longbothum", 2 * a, lb.voigtFwhmOlivero(1, 1));
  const w = lb.faddeeva(1, 0);
  row("Faddeeva Re w(1) = 1/e", Math.exp(-1), w[0]);
  row("Faddeeva Im w(1) = 2/sqrt(pi) Dawson(1)", (2 / Math.sqrt(Math.PI)) * 0.5380795069, w[1]);
  row("Doppler FWHM/nu, Na 500 K", Math.sqrt((8 * kB * 500 * Math.LN2) / (22.98977 * u * c * c)), lb.dopplerFwhmFraction(500, 22.98977 * u));
  const chi = 13.598 * 1.602176634e-19;
  row("Saha H 1e4 K (m^-3)", 2 * ((2 * Math.PI * 9.1093837015e-31 * kB * 1e4) / (h * h)) ** 1.5 * Math.exp(-chi / (kB * 1e4)), lb.sahaRatio(1e4, chi, 1));
}
// FTIR ILS: brute-force cosine transform of each window
for (const name of ft.FTIR_APODIZATION_NAMES) {
  const ils = (s: number) => {
    let a = 0, n = 0;
    const N = 20000;
    for (let k = 0; k < N; k++) { const x = (k + 0.5) / N; const A = ft.apodization(name, x); a += A * Math.cos(2 * Math.PI * s * x); n += A; }
    return a / n;
  };
  let a = 0, b = 1.5;
  for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (ils(m) > 0.5) a = m; else b = m; }
  row(`ILS FWHM*L ${name} A(0)=${ft.apodization(name, 0).toFixed(4)} A(1)=${ft.apodization(name, 1).toFixed(4)}`, 2 * a, ft.ilsFwhm(name));
}
console.log("sidelobes boxcar / HG / NB-strong / bh3:", ft.ilsHighestSidelobe("boxcar").toFixed(4), ft.ilsHighestSidelobe("happ-genzel").toFixed(4), ft.ilsHighestSidelobe("nb-strong").toFixed(5), ft.ilsHighestSidelobe("bh3").toExponential(2));
// Etalon
{
  const R = 0.95, F = (4 * R) / (1 - R) ** 2, fsr = c / (2 * 0.005);
  row("etalon FSR Hz, 5 mm air", fsr, et.fsrFrequency(1, 0.005, 1));
  row("etalon FWHM Hz (exact)", (fsr * 2 * Math.asin((1 - R) / (2 * Math.sqrt(R)))) / Math.PI, et.fwhmFrequency(fsr, F));
  console.log("  FWHM at F=0.5 (want NaN):", et.fwhmFrequency(fsr, 0.5));
}
// CRDS
{
  const L = 0.5, R = 0.9999;
  const loss = crd.roundTripLoss(R, R, 0, 0);
  row("CRDS tau (s) = L/(c(-ln R))", L / (c * -Math.log(R)), crd.ringDownTime(L, loss));
  row("finesse ~ pi sqrt(R)/(1-R)", (Math.PI * Math.sqrt(R)) / (1 - R), crd.cavityFinesse(loss));
}
row("Raman aS/S power 532 nm 1000 cm-1 300 K", ((1 / 532e-9 + 1e5) / (1 / 532e-9 - 1e5)) ** 4 * Math.exp(-(h * c * 1e5) / (kB * 300)), rm.antiStokesStokesRatio(532e-9, 1e5, 300, "power"));
