// R2 batch 3: wavenumber, Lambert-Beer, QY, Stokes, peak-model, diatomic, dual-comb, terahertz, SERS
import * as WN from "../../../../src/physics/spectroscopy/wavenumber";
import * as BL from "../../../../src/physics/spectroscopy/lambert-beer-law";
import { relativeQuantumYield } from "../../../../src/physics/spectroscopy/quantum-yield";
import { stokesShift } from "../../../../src/physics/spectroscopy/stokes-shift";
import { peakArea, peakShape } from "../../../../src/physics/spectroscopy/peak-model";
import * as DI from "../../../../src/physics/spectroscopy/diatomic";
import { aliasFreeBandwidth, beatNote } from "../../../../src/physics/spectroscopy/dual-comb-spectroscopy";
import * as TH from "../../../../src/physics/spectroscopy/terahertz";
import * as SE from "../../../../src/physics/spectroscopy/sers";
import { c, h, k_B, N_A } from "../../../../src/physics/constants";
import { complex } from "../../../../src/physics/complex";

const p = (s: string, mine: number, mod: number) => console.log(`${s.padEnd(46)} mine=${mine.toPrecision(6)} mod=${mod.toPrecision(6)} ratio=${(mod / mine).toFixed(5)}`);

const ph = WN.photonFromWavelength(632.8e-9);
p("WN 632.8 nm wavenumber cm-1", 15802.78, ph.wavenumber / 100);
p("WN 632.8 nm eV", 1.959333, ph.energy / 1.602176634e-19);
p("WN dlambda for 1 GHz @1550 (pm)", 8.0141, WN.wavelengthWidth(1550e-9, 1e9) * 1e12);
p("BL A eps=1e4 L/mol/cm c=1e-5 M l=1cm", 0.1, BL.absorbance(1e4 * 0.1, 1e-5 * 1000, 0.01));
p("BL sigma for eps=1e4 L/mol/cm (cm2)", 3.8235e-17, BL.crossSectionFromEpsilon(1e3) * 1e4);
p("BL napierian alpha from sigma (1/m) == ln10 eps c", Math.LN10 * 1e3 * 0.01, BL.napierianAbsorptionCoefficient(BL.crossSectionFromEpsilon(1e3), 0.01));
p("QY abs-form", 0.95 * (2 / 1) * ((1 - 10 ** -0.05) / (1 - 10 ** -0.05)) * (1.36 / 1.333) ** 2, relativeQuantumYield({ sampleEmission: 2, referenceEmission: 1, sampleAbsorbance: 0.05, referenceAbsorbance: 0.05, sampleIndex: 1.36, referenceIndex: 1.333, referenceYield: 0.95 }));
const st = stokesShift(490, 520);
p("Stokes 490->520 cm-1", 1e7 * (1 / 490 - 1 / 520), st.dCm); p("Stokes eV", 1239.84198 * (1 / 490 - 1 / 520), st.dEv);
p("peak area gaussian h=1 w=1", Math.sqrt(Math.PI / (4 * Math.LN2)), peakArea(1, 1, "gaussian"));
p("peak area lorentz h=1 w=1", Math.PI / 2, peakArea(1, 1, "lorentzian"));
p("peak shape at half width = 0.5", 0.5, peakShape(0.5, 1, "gaussian"));
// diatomic CO
const amu = 1.66053906660e-27;
const muCO = 12 * 15.994914619 / (27.994914619) * amu;
const B = h / (8 * Math.PI ** 2 * c * muCO * (1.128323e-10) ** 2);
p("CO Be (cm-1) lit 1.93128", 1.93128, DI.rotationalConstant(DI.reducedMass(12, 15.994914619), 1.128323e-10) / 100);
p("CO Be mine vs module", B, DI.rotationalConstant(DI.reducedMass(12, 15.994914619), 1.128323e-10));
const Bv0 = DI.rotationalConstantV(DI.DIATOMICS.co, 0);
p("CO B0 (cm-1) lit 1.9225", 1.92253, Bv0 / 100);
const Bh = DI.rotationalConstantV(DI.DIATOMICS.hcl, 0); p("HCl B0 (cm-1) lit 10.4398", 10.4398, Bh / 100);
p("CO Jmax 300K", Math.round(Math.sqrt(k_B * 300 / (2 * h * c * Bv0)) - 0.5), DI.mostPopulatedJ(Bv0, 300));
p("CO Q_rot 300K ~ kT/hcB + 1/3", k_B * 300 / (h * c * Bv0) + 1 / 3, DI.rotationalPartition(Bv0, DI.DIATOMICS.co.De, 300));
const ve = DI.vibrationalTerm(1, DI.DIATOMICS.co) - DI.vibrationalTerm(0, DI.DIATOMICS.co);
p("CO fundamental nu0 (cm-1) lit 2143.27", 2143.27, ve / 100);
p("CO force const (N/m) lit ~1902", 1902, DI.forceConstant(DI.reducedMass(12, 15.994914619), DI.DIATOMICS.co.we));
// dual comb
p("DC alias-free BW 100 MHz, 100 Hz (THz)", 50, aliasFreeBandwidth({ frep: 100e6, fceo: 0 }, { frep: 100e6 + 100, fceo: 0 }) / 1e12);
p("DC beat n=1000", 1000 * 100, beatNote({ frep: 100e6, fceo: 0 }, { frep: 100e6 + 100, fceo: 0 }, 1000));
// THz: constant n=2, alpha=10/cm, d=1 mm, 1 THz; extract back
{
  const f = 1e12, d = 1e-3; const nk = TH.complexIndex(TH.constantPermittivity(f, 2, 1000));
  p("THz n back", 2, nk.re); p("THz alpha back (1/m)", 1000, TH.absorptionCoefficient(nk, f));
  const pol = TH.slabTransmissionPolar(nk, f, d); const ex = TH.extractIndex(pol.magnitude, pol.phase, f, d);
  p("THz extract n", 2, ex.n); p("THz extract alpha (small-kappa Fresnel)", 1000, ex.alpha);
  p("THz alpha_max DR=1000 n=2 d=1mm (1/m)", 2 / d * Math.log(1000 * 8 / 9), TH.maxAbsorption(1000, 2, d));
  const w = TH.waterPermittivity(1e12, 293.15); console.log("  water eps(1 THz, 20C)", w.re.toFixed(3), w.im.toFixed(3), "(lit. ~4.3 + 2.0i at 1 THz; Liebe/Rønne)");
  const nw = TH.complexIndex(w); console.log("  water n, alpha(1/cm) at 1 THz:", nw.re.toFixed(3), (TH.absorptionCoefficient(nw, 1e12) / 100).toFixed(1), "(lit. n~2.1, alpha~220 /cm)");
}
// SERS: silver 10 nm sphere in water at resonance; check Re eps = -2 eps_m at resonance
{
  const em = 1.333 ** 2; const lr = SE.silverSphereResonance(em); const e = SE.silverPermittivity(lr);
  console.log("SERS resonance (nm)", (lr * 1e9).toFixed(1), "Re eps", e.re.toFixed(3), "target", (-2 * em).toFixed(3), "(lit. Ag sphere in water ~ 390-400 nm)");
  const ee = complex(-2 * em, 0.3); const g = SE.sphereFactor(ee, em);
  const E = SE.sphereFieldEnhancement(ee, em, 10e-9, 0);
  const gm = (-3 * em) / complex(0, 0.3).im; // g = (eps - em)/(eps+2em) = -3em/(0.3 i)
  p("SERS pole |1+2g|^2 (eps=-2em+0.3i)", 1 + 4 * gm * gm, E.pole);
}
