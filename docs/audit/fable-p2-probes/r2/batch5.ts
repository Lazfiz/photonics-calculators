// R2 batch 5: optical-path-length tilted slab "vs vacuum"; spectral-range defaults; throughput
import { slabPath } from "../../../../src/physics/spectroscopy/optical-path-length";
import { spectrometerRange } from "../../../../src/physics/spectroscopy/spectral-resolution";
import { ftsMaxHalfAngle, ftsMaxSolidAngle } from "../../../../src/physics/spectroscopy/throughput";
import { c } from "../../../../src/physics/constants";

const p = (s: string, mine: number, mod: number) => console.log(`${s.padEnd(50)} mine=${mine.toPrecision(6)} mod=${mod.toPrecision(6)} ratio=${(mod / mine).toFixed(5)}`);
const D = Math.PI / 180;
// Slab d = 1 cm, n = n_g = 1.5, one pass. Delay added by INSERTING the slab in a collimated beam, phase referenced
// to a plane normal to the beam after it: OPD = d(sqrt(n^2 - sin^2 th) - cos th); group: d/(c cos tt) (n_g - cos(th - tt)).
for (const th of [0, 30, 60]) {
  const t = th * D, n = 1.5, d = 0.01; const tt = Math.asin(Math.sin(t) / n);
  const r = slabPath(d, n, n, 1, t);
  p(`OPL opd 'vs vacuum' theta=${th} (mm)`, d * (Math.sqrt(n * n - Math.sin(t) ** 2) - Math.cos(t)) * 1e3, r.opdVacuum * 1e3);
  p(`OPL extra group delay theta=${th} (ps)`, d / (c * Math.cos(tt)) * (n - Math.cos(t - tt)) * 1e12, r.extraGroupDelay * 1e12);
}
// spectral-range defaults: 1200 l/mm, m1, 500 nm, Dv 30, f 100 mm, W 25.6 mm, 2048 px, slit 25 um, grating 25 mm
{
  const d = 1e-3 / 1200, f = 0.1, W = 0.0256, Dv = 30 * D;
  const psi = Math.asin(500e-9 / (2 * d * Math.cos(Dv / 2))); const a = psi + Dv / 2, b0 = psi - Dv / 2;
  const lam = (x: number) => d * (Math.sin(a) + Math.sin(b0 + Math.atan(x / f)));
  const r = spectrometerRange(500e-9, d, 1, Dv, W, f, 2048, 25e-6, 0.025);
  p("SRng range (nm)", (lam(W / 2) - lam(-W / 2)) * 1e9, r.range * 1e9);
  p("SRng slit limit (nm)", 25e-6 * d * Math.cos(a) / f * 1e9, r.slitLimit * 1e9);
  p("SRng pixel limit 2px (nm)", 2 * (W / 2048) * d * Math.cos(b0) / f * 1e9, r.pixelLimit * 1e9);
  p("SRng diffraction (nm)", 500e-9 / (0.025 / d) * 1e9, r.diffLimit * 1e9);
  console.log("  limitedBy", r.limitedBy);
}
p("FTS Omega_max 1000 cm-1 @ 1 cm-1 (sr)", 2 * Math.PI / 1000, ftsMaxSolidAngle(1000, 1));
p("FTS half angle (mrad) ~ sqrt(R/sigma)", Math.sqrt(1 / 1000) * 1e3, ftsMaxHalfAngle(1000, 1) * 1e3);
