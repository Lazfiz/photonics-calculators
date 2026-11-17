import * as TP from "../../../../src/physics/fiber-optics/fiber-taper";
import * as NL from "../../../../src/physics/fiber-optics/fiber-nonlinear";
import * as CD from "../../../../src/physics/fiber-optics/chromatic-dispersion";
import * as PMD from "../../../../src/physics/fiber-optics/polarization-mode-dispersion";
import * as CM from "../../../../src/physics/fiber-optics/coupled-mode";
const cmp = (name: string, mine: number, code: number) =>
  console.log(`${name.padEnd(40)} mine=${mine.toPrecision(6)} code=${code.toPrecision(6)} ratio=${(code / mine).toFixed(4)}`);
const r0 = 62.5e-6, L0 = 5e-3, x = 15e-3;
const s0 = TP.taperShape({ r0, L0, x, alpha: 0 } as any) as any;
cmp("taper waist r a=0 (Birks-Li r0 e^{-x/2L0})", r0 * Math.exp(-x / (2 * L0)), s0.waistRadius);
cmp("taper waist length a=0", L0, s0.waistLength);
const s1 = TP.taperShape({ r0, L0, x, alpha: 0.5 } as any) as any;
cmp("taper waist r a=0.5", r0 * (1 + 0.5 * x / L0) ** (-1 / (2 * 0.5)), s1.waistRadius);
cmp("taper waist L a=0.5 (L0+ax)", L0 + 0.5 * x, s1.waistLength);
cmp("transition length a=0 (x/2 each side? total z0 = x/2)", x / 2, s0.transitionLength);
cmp("V_cc estimate S=125/8.2", Math.sqrt(2 / (Math.log(125 / 8.2) + 0.25)), TP.transitionVEstimate(125 / 8.2));
// lossless / zero-length probes
console.log("probe fwmEfficiency(alpha=0, 80km, dB=0.00856) =", NL.fwmEfficiency(0, 80e3, 0.00856), " expected sinc^2 =", (Math.sin(0.00856 * 4e4) / (0.00856 * 4e4)) ** 2);
console.log("probe fwmEfficiency(alpha=0, 80km, 0) =", NL.fwmEfficiency(0, 80e3, 0));
console.log("probe Leff(alpha, 0) =", NL.effectiveLength(4.6e-5, 0), " sbs(Leff=0) =", NL.sbsThreshold({ Aeff: 80e-12, gB: 5e-11, Leff: 0 }));
console.log("probe sbs sourceLinewidth>0 without brillouinLinewidth =", NL.sbsThreshold({ Aeff: 80e-12, gB: 5e-11, Leff: 8000, sourceLinewidth: 1e6 }));
console.log("probe D sellmeier 1260 (<0 expected)", CD.sellmeierDispersion(1260e-9, 1310e-9, 92) * 1e6, " lam=0:", CD.sellmeierDispersion(0, 1310e-9, 92));
console.log("probe dgdExceedance mean=0:", PMD.dgdExceedanceProbability(1e-12, 0), " pmdLimitedLength coef 0:", PMD.pmdLimitedLength(0, 1e10));
console.log("probe codirectionalPeak kappa=0:", JSON.stringify(CM.codirectionalPeak(0, 1)), " dispersionLength b2=0:", CD.dispersionLength(1e-11, 0));
