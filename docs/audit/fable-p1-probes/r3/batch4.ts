// R3 batch 4: eye-safety-fso NOHD default, link-budget / geometric-loss / lasercom boundary probes.
import { row } from "./lib";
import { nominalOcularHazardDistance, roundBeam } from "../../../../src/physics/laser-safety/hazard-distance";
import * as LB from "../../../../src/physics/free-space-comms/link-budget";
import { pointingCapture } from "../../../../src/physics/free-space-comms/pointing-loss";
{
  // ICNIRP 2013, 1550 nm, 10 s: 5600 t^0.25 J/m2 over 10 s; 3.5 mm aperture (1.5 t^3/8 mm = 3.56 mm -> 3.5 mm cap)
  const mpe = 5600 * 10 ** 0.25 / 10, a = 3.5e-3, P = 0.1, d = 0.01, phi = 0.5e-3;
  const frac = mpe * Math.PI * a * a / 4 / P, Dr = 2 * Math.sqrt(2 * (a / 2) ** 2 / -Math.log(1 - frac));
  const r = Math.sqrt(Dr * Dr - d * d) / phi;
  const code = nominalOcularHazardDistance(1550e-9, P, roundBeam(d, phi), 10);
  row("NOHD 1550 100mW 10mm 0.5mrad 10s (m)", r, code.distance);
}
console.log("=== link-budget default page model at short range (divergence 2 mrad full, Rx 10 cm)");
for (const Rkm of [0.001, 0.05, 1, 10]) {
  const lam = 1550e-9, th = 1e-3, R = Rkm * 1e3; // half-angle 1 mrad
  const w0 = lam / (Math.PI * th), w = w0 * Math.sqrt(1 + (R * lam / (Math.PI * w0 * w0)) ** 2);
  const exact = 1 - Math.exp(-2 * 0.05 ** 2 / w / w);
  const code = pointingCapture(lam, w0, R, 0.1, 0, 0).alignedFraction;
  const fr = LB.friisReceivedPower(1, LB.gaussianTxGain(th), LB.apertureGain(0.1, lam), R, lam);
  row(`R=${Rkm} km exact capture`, exact, code);
  console.log(`   Friis fraction ${fr.fraction.toExponential(3)} capped=${fr.capped}`);
}
console.log("=== geometric-loss probes");
console.log(`  top-hat rx > beam: ${LB.topHatGeometricLoss(0.005, 1e-3, 10, 0.1)} dB (beam 1.5 cm < 10 cm -> 0)`);
const gg = LB.gaussianGeometricCapture(0.005, 1e-5, 1000, 0.1, 1550e-9);
console.log(`  theta=0.01 mrad: waist=${gg.waist.toFixed(4)} m (exit aperture 2.5 mm) diffLimited=${gg.diffractionLimited} frac=${gg.fraction.toFixed(4)}`);
console.log(`  zero range: top-hat ${LB.topHatGeometricLoss(0.005, 1e-3, 0, 0.1)}; gauss frac ${LB.gaussianGeometricCapture(0.005, 1e-3, 0, 0.1, 1550e-9).fraction}`);
console.log(`  fspl R=0 -> ${LB.freeSpacePathLoss(0, 1550e-9)} ; gaussianTxGain(0) -> ${LB.gaussianTxGain(0)}`);
