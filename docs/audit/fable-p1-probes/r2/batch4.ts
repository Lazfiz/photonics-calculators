import * as BR from "../../../../src/physics/fiber-optics/fiber-birefringence";
import * as CM from "../../../../src/physics/fiber-optics/coupled-mode";
import * as W from "../../../../src/physics/fiber-optics/wdm-channel-plan";
import * as FB from "../../../../src/physics/fiber-optics/fiber-bundle";
import * as DG from "../../../../src/physics/fiber-optics/doped-fiber-gain";
const c = 299792458, h = 6.62607015e-34;
const cmp = (name: string, mine: number, code: number) =>
  console.log(`${name.padEnd(40)} mine=${mine.toPrecision(6)} code=${code.toPrecision(6)} ratio=${(code / mine).toFixed(4)}`);
const lam = 1550e-9;
cmp("beat length 3.5e-4", lam / 3.5e-4, BR.beatLength(3.5e-4, lam));
cmp("bend B 0.133(d/R)^2? or (r/R)^2", 0.133 * (62.5e-6 / 15e-3) ** 2, BR.bendBirefringence(125e-6, 15e-3));
cmp("loop retardance d125 D30mm N2", 2 * Math.PI ** 2 * 0.133 * (125e-6) ** 2 * 2 / (lam * 30e-3) * 0.25, BR.loopRetardance(125e-6, 30e-3, lam, 2));
cmp("PER after 1km h=1e-6, eps0=1e-3", (1e-3 + Math.tanh(1e-3)) / (1 + 1e-3 * Math.tanh(1e-3)), BR.crossPolarizedRatio(1e-3, 1e-6, 1000));
cmp("fibre crosstalk dB hL=1e-3", 10 * Math.log10(Math.tanh(1e-3)), BR.fibreCrosstalkDb(1e-6, 1000));
cmp("dgd per length groupB 3.5e-4", 3.5e-4 / c, BR.dgdPerLength(3.5e-4));
// coupled mode
const k = 1.0, db = 1.0, psi = Math.sqrt(k * k + db * db / 4);
cmp("codirectional transfer z=1", k * k / (psi * psi) * Math.sin(psi * 1) ** 2, CM.codirectionalTransfer(k, db, 1));
cmp("codirectional peak fraction", k * k / psi ** 2, CM.codirectionalPeak(k, db).fraction);
cmp("codirectional peak length pi/(2psi)", Math.PI / (2 * psi), CM.codirectionalPeak(k, db).length);
// WDM
const grid = W.ituGrid(100e9, 193.1e12) as any; console.log("ituGrid", JSON.stringify(grid).slice(0, 200));
console.log("channels 8 x 0.8nm @1550 equalFreq:", W.channelWavelengths(8, 1550e-9, 0.8e-9, true).map((x: number) => (x * 1e9).toFixed(3)).join(","));
cmp("gauss isolation 0.8/0.4", 10 * Math.log10(Math.E) * 4 * Math.LN2 * 4, W.gaussianAdjacentIsolationDb(0.8e-9, 0.4e-9));
cmp("gaussian passband at FWHM/2", 0.5, W.gaussianPassband(0.2e-9, 0.4e-9));
// bundle
cmp("hex rings 37", 3, FB.hexRingCount(37)); cmp("hex diam 37x125", 875e-6, FB.hexBundleDiameter(37, 125e-6));
cmp("bundle fill", 37 * 62.5 ** 2 / 875 ** 2, FB.bundleFill(37, 62.5e-6, 875e-6));
cmp("hex 7 x 220", 660e-6, FB.hexBundleDiameter(7, 220e-6));
cmp("tapered NA", 0.22 * 660 / 400, FB.taperedPumpNA(0.22, 660e-6, 400e-6));
cmp("etendue (pi a NA)^2 ?", (Math.PI * 100e-6 * 0.22) ** 2, FB.fiberEtendue(200e-6, 0.22));
cmp("square diam 36x125 (6x6 -> 6*125*sqrt2 circ?)", 6 * 125e-6 * Math.SQRT2, FB.squareBundleDiameter(36, 125e-6));
// doped
cmp("abs dB/m", 10 / Math.LN10 * 0.8 * 2.2e-25 * 1e24, DG.absorptionDbPerM(0.8, 2.2e-25, 1e24));
const A = Math.PI * (2.2e-6) ** 2;
cmp("Psat signal", h * c / lam * A / (0.8 * 5.2e-25 * 10.2e-3), DG.intrinsicSaturationPower(lam, A, 0.8, 2.2e-25, 3e-25, 10.2e-3));
const rig = (g: number, R1: number, R2: number) => (1 - R2) * Math.sqrt(R1) * (g + Math.log(Math.sqrt(R1 * R2))) / ((Math.sqrt(R1) + Math.sqrt(R2)) * (1 - Math.sqrt(R1 * R2)));
cmp("Rigrod g0L=1.5 R1=.99 R2=.1", rig(1.5, 0.99, 0.1), DG.rigrodOutput(1.5, 0.99, 0.1));
cmp("ion density 1000 wt-ppm Er (167.26 g/mol, 2.2 g/cc)", 1000e-6 * 2200 / (167.259e-3) * 6.02214076e23, DG.ionDensityFromWtPpm(1000, 167.259e-3));
