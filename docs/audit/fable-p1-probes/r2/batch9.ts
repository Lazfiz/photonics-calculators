import * as BR from "../../../../src/physics/fiber-optics/fiber-birefringence";
import * as SA from "../../../../src/physics/fiber-optics/sagnac";
import * as DG from "../../../../src/physics/fiber-optics/doped-fiber-gain";
const cmp = (name: string, mine: number, code: number) =>
  console.log(`${name.padEnd(40)} mine=${mine.toPrecision(6)} code=${code.toPrecision(6)} ratio=${(code / mine).toFixed(4)}`);
const r = 0.99 / 1.01; const L = -Math.log(r / (0.999 / 1.001)) / (2 * 1e-6);
cmp("PM length to PER 20 dB from 30 dB, h=1e-6", L, BR.lengthToRatio(1e-3, 1e-2, 1e-6));
// ellipticity validity: compare B at e=0.02 and e=0.5 scaled
const f = { a: 4.5e-6, n1: 1.468, n2: 1.463 };
const b1 = BR.geometricBirefringence({ ...f, ellipticity: 0.02 }, 1550e-9).B, b2 = BR.geometricBirefringence({ ...f, ellipticity: 0.5 }, 1550e-9).B;
console.log("geometric B e=0.02:", b1.toExponential(3), " e=0.5:", b2.toExponential(3), " ratio", (b2 / b1).toFixed(2), " beat length e=.02 (m):", (1550e-9 / b1).toFixed(2));
cmp("loop mirror T k=0.5 dphi=0", 0, SA.loopMirrorTransmittance(0.5, 0));
cmp("loop mirror T k=0.3 dphi=pi (1-4k(1-k)cos^2(pi/2))", 1, SA.loopMirrorTransmittance(0.3, Math.PI));
const opt = DG.optimumOutputCoupler(13 / 4.343, 10 ** (-0.05));
let best = 0, bR = 0; for (let R2 = 0.001; R2 < 1; R2 += 0.0005) { const o = DG.rigrodOutput(13 / 4.343, 10 ** (-0.05), R2); if (o > best) { best = o; bR = R2; } }
cmp("fiber-laser optimum R2 (scan)", bR, opt.R2); cmp("fiber-laser optimum output (scan)", best, opt.output);
