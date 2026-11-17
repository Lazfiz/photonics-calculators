import * as GC from "../../../../src/physics/fiber-optics/gaussian-coupling";
import * as OT from "../../../../src/physics/fiber-optics/otdr";
import * as SE from "../../../../src/physics/fiber-optics/fiber-sensors";
import * as SP from "../../../../src/physics/fiber-optics/specialty-fiber";
import * as BR from "../../../../src/physics/fiber-optics/fiber-birefringence";
const cmp = (name: string, mine: number, code: number) =>
  console.log(`${name.padEnd(40)} mine=${mine.toPrecision(6)} code=${code.toPrecision(6)} ratio=${(code / mine).toFixed(4)}`);
const lam = 1550e-9;
// gap etalon 50 nm air between n=1.447
const R = ((1.447 - 1) / 2.447) ** 2, d = 4 * Math.PI * 1 * 50e-9 / lam;
cmp("etalon T 50nm air", (1 - R) ** 2 / ((1 - R) ** 2 + 4 * R * Math.sin(d / 2) ** 2), GC.gapEtalonTransmission(1.447, 1, 50e-9, lam));
cmp("etalon T lam/4 gap (min)", (1 - R) ** 2 / (1 + R) ** 2, GC.gapEtalonTransmission(1.447, 1, lam / 4, lam));
const cl = GC.connectorLoss({ w: 4.5e-6, lambda: lam, nFiber: 1.447, nGap: 1, offset: 0.3e-6, tilt: 0.3 * Math.PI / 180, gap: 0.05e-6 });
const lat = -10 * Math.log10(Math.exp(-((0.3 / 4.5) ** 2)));
const ang = -10 * Math.log10(Math.exp(-((Math.PI * 1.447 * 4.5e-6 * 0.3 * Math.PI / 180 / lam) ** 2)));
console.log("connectorLoss", JSON.stringify(cl), " mine lat", lat.toFixed(5), " ang(n=1.447)", ang.toFixed(5), " ang(n=1)", (ang / 1.447 ** 2).toFixed(5));
// OTDR dynamic range: one-way 5 log10(Pbs/Pn)
cmp("DR one-way 5log10", 5 * Math.log10(5.58e-8 / 4.367e-12), OT.dynamicRangeDb(5.58e-8, 4.367e-12));
cmp("noise NEP sqrt(1/(2tau))/sqrt(N)", 0.5e-12 * Math.sqrt(1 / 2e-7) / 256, OT.noisePower(0.5e-12, 100e-9, 65536));
cmp("reflective peak 5log10(1+R/eta)? R=0.036,eta=5.58e-7", 5 * Math.log10(1 + 0.036 / 5.58e-7), OT.reflectivePeakDb(0.036, 5.58e-7));
// FP sensor: two-beam / Airy with R=0.033
const Rm = 0.033, ph = 4 * Math.PI * 1 * 20e-6 / lam;
const F = 4 * Rm / (1 - Rm) ** 2;
cmp("FP cavity R (Airy) d=20um n=1", F * Math.sin(ph / 2) ** 2 / (1 + F * Math.sin(ph / 2) ** 2), SE.cavityReflectance(lam, 1, 20e-6, Rm));
// specialty + birefringence summaries printed
console.log("specialty fibers keys:", Object.keys(SP).join(","));
const fb = BR.fiberBirefringence({ n1: 1.468, n2: 1.463, a: 4.5e-6, ellipticity: 0.98 } as any, lam);
console.log("birefringence", JSON.stringify(fb).slice(0, 400));
cmp("G(V) at V=2", 0, BR.geometricG(2)); cmp("G(V) at V=1.5", 0, BR.geometricG(1.5)); cmp("G(V) at V=2.4", 0, BR.geometricG(2.4));
