import test from "node:test";
import assert from "node:assert/strict";

import { lightFieldMicroscope, plenopticCamera } from "../src/physics/imaging/light-field";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const um = 1e-6;
const nm = 1e-9;
const mm = 1e-3;

test("light-field microscope reproduces Levoy et al. 2006 Table 1 (535 nm, 125 µm lenslets)", () => {
  // Rows: objective, R_obj (µm), N_u, D_tot1, D_tot2, D_tot3 (µm), printed to 2–4 significant figures.
  const table: [number, number, number, number, number, number, number, number][] = [
    [50, 1.3, 1.52, 9.67, 12.93, 0.48, 3.59, 40.67],
    [40, 0.95, 1, 10.59, 11.81, 0.59, 4.09, 41.91],
    [16, 0.4, 1, 10.06, 12.43, 3.34, 24.12, 261.57],
  ];
  for (const [m, na, n, rObj, nu, d1, d2, d3] of table) {
    // Pixels small enough not to limit N_u, as the table assumes.
    const r = lightFieldMicroscope({ na, magnification: m, n, lensletPitch: 125 * um, pixelPitch: 1 * um, lambda: 535 * nm });
    const label = `${m}×/${na}`;
    assertRel(r.sparrowImage / um, rObj, 0.003, `${label} R_obj`);
    assertRel(r.nu, nu, 0.003, `${label} N_u`);
    assertRel(r.dofConventional / um, d1, 0.012, `${label} D_tot1`);
    assertRel(r.dofRefocused / um, d2, 0.003, `${label} D_tot2`);
    assertRel(r.dofView / um, d3, 0.003, `${label} D_tot3`);
    assert.equal(r.pixelLimited, false);
  }
  // Eq. 1: a 40×/0.95 objective wants f/20 microlenses (M/(2NA) = 21.05; the paper rounds to its f/20 array).
  const forty = lightFieldMicroscope({ na: 0.95, magnification: 40, n: 1, lensletPitch: 125 * um, pixelPitch: 1 * um, lambda: 535 * nm });
  assertRel(forty.lensletFNumber, 40 / 1.9, 1e-12, "f-number");
  assertRel(forty.lateralSample / um, 3.125, 1e-12, "W/M (paper: 3.1 µm)");
  // Footnote 4: the Canon 5D's 8.2 µm pixels gave about 7 resolvable spots, not 11.8.
  const canon = lightFieldMicroscope({ na: 0.95, magnification: 40, n: 1, lensletPitch: 125 * um, pixelPitch: 8.2 * um, lambda: 535 * nm });
  assert.equal(canon.pixelLimited, true);
  assertRel(canon.nu, 7.622, 1e-3, "pixel-limited N_u");
});

test("light-field page defaults: 20×/0.2, 150 µm lenslets, 6.5 µm pixels, 550 nm (hand calculation)", () => {
  const r = lightFieldMicroscope({ na: 0.2, magnification: 20, n: 1, lensletPitch: 150 * um, pixelPitch: 6.5 * um, lambda: 550 * nm });
  assertRel(r.lateralSample / um, 7.5, 1e-12, "W/M");
  assertRel(r.nu, 150 / (0.47 * 0.55 * 20 / 0.2), 1e-12, "N_u");
  assertRel(r.nu, 5.8027, 1e-4, "N_u");
  assertRel(r.dofRefocused / um, 53.644, 1e-4, "refocused DOF");
  assertRel(r.dofView / um, 245.24, 1e-4, "single-view DOF");
  assertRel(r.lensletFocal / mm, 7.5, 1e-12, "f/50 lenslet focal length");
  // Domain: NA at or above the medium index gives no result.
  const bad = lightFieldMicroscope({ na: 1, magnification: 20, n: 1, lensletPitch: 150 * um, pixelPitch: 6.5 * um, lambda: 550 * nm });
  assert.ok(Number.isNaN(bad.nu) && Number.isNaN(bad.dofRefocused) && Number.isNaN(bad.lateralSample));
});

test("plenoptic camera: Ng et al. 2005 prototype (125 µm f/4 lenslets, 9 µm pixels)", () => {
  const prototype = {
    lensletPitch: 125 * um, lensletFocal: 0.5 * mm, pixelPitch: 9 * um, sensorWidthPx: 4000, sensorHeightPx: 4000,
    mainFNumber: 4, mainFocal: 140 * mm, focusDistance: 1, lambda: 550 * nm,
  };
  const r = plenopticCamera(prototype);
  // §3.1: spacing accurate to x_p·f_m/x_m = 9·500/125 = 36 µm; §5: f/4 lenslets matched to an f/4 image side.
  assertRel(r.spacingTolerance / um, 36, 1e-12, "spacing tolerance");
  assert.equal(r.lensletFNumber, 4);
  assert.equal(r.microImageFill, 1);
  // 4000·9/125 = 288 lenslets exactly (the paper's array is 296 wide, a little larger than the sensor).
  assert.equal(r.lensletsX, 288);
  assert.equal(r.pixelsAcross, 13);
  assert.equal(r.views, 169);
  assert.equal(r.samples, 288 * 288 * 169);
  assertRel(r.angularStep, Math.atan(9 / 500), 1e-12, "angle per pixel");
  // §4.2: refocus within the depth of field of an aperture N times narrower: ±N·N_w·p_µ = ±13·4·0.125 mm.
  assertRel(r.imageRefocusRange / mm, 6.5, 1e-12, "image-side range");
  // Thin lens, f 140 mm at 1 m: s_i = 162.79 mm; 169.29 mm → 809.1 mm and 156.29 mm → 1343.1 mm.
  assertRel(r.refocusNear, 0.80915, 1e-4, "near");
  assertRel(r.refocusFar, 1.3431, 1e-4, "far");
  // A wider main aperture (f/2.5) than the f/3.33 lenslets: micro-images 133 % of the pitch, still 27 pixels across.
  const overlap = plenopticCamera({ ...prototype, lensletPitch: 150 * um, pixelPitch: 5.5 * um, sensorWidthPx: 4000, sensorHeightPx: 3000, mainFNumber: 2.5, mainFocal: 50 * mm });
  assertRel(overlap.microImageFill, 4 / 3, 1e-12, "fill");
  assert.equal(overlap.pixelsAcross, 27);
  assertRel(overlap.angularStep * (180 * 60) / Math.PI, 37.81, 1e-4, "37.81 arcmin per pixel");
  // Edge: refocus range beyond the infinity focus puts the far limit at infinity.
  assert.equal(overlap.refocusFar, Infinity);
  // Domain: focus at or inside the focal length gives no result.
  assert.ok(Number.isNaN(plenopticCamera({ ...prototype, focusDistance: 0.1 }).refocusNear));
});
