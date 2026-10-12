import test from "node:test";
import assert from "node:assert/strict";

import {
  type PrincipalIndices, conoscopicFigure, conoscopicPoint, eigenKz, impermeability, opticAxialAngle, transverseEigen,
} from "../src/physics/polarization/conoscopy";
import { plateRetardance, plateWaves } from "../src/physics/polarization/uniaxial";

const deg = Math.PI / 180;
const lambda = 589.3e-9, d = 1e-3;
// Quartz (+) and calcite (−) near 589 nm; the checks below are consistency checks, not data checks.
const quartz: PrincipalIndices = [1.5442, 1.5442, 1.5533];
const calcite: PrincipalIndices = [1.4864, 1.6584, 1.6584];

test("Conoscopy: optic axial angle cos²V_z = (n_β⁻² − n_γ⁻²)/(n_α⁻² − n_γ⁻²) (Born & Wolf ch. 15)", () => {
  // Hand calculation for n = 1.5, 1.6, 1.7: cos²V_z = 0.044604/0.098423 = 0.453190, V_z = 47.68°, so negative.
  const a = opticAxialAngle([1.5, 1.6, 1.7]);
  assert.ok(Math.abs(Math.cos(a.Vz) ** 2 - (1 / 2.56 - 1 / 2.89) / (1 / 2.25 - 1 / 2.89)) < 1e-14);
  assert.equal(a.sign, "−");
  assert.ok(Math.abs(a.twoV / deg - 2 * (90 - Math.acos(Math.sqrt(0.45319)) / deg)) < 1e-3);
  // Small birefringence: Mallard's tan²V_z ≈ (n_β − n_α)/(n_γ − n_β) to first order.
  const b = opticAxialAngle([1.6, 1.601, 1.603]);
  assert.ok(Math.abs(Math.tan(b.Vz) ** 2 - 0.5) < 2e-3, `tan²V ${Math.tan(b.Vz) ** 2}`);
  // Uniaxial limits and guards.
  assert.equal(opticAxialAngle(quartz).twoV, 0);
  assert.equal(opticAxialAngle(calcite).sign, "−");
  assert.ok(Math.abs(opticAxialAngle(calcite).twoV) < 1e-7);
  assert.ok(Number.isNaN(opticAxialAngle([1.5, 1.5, 1.5]).Vz) && opticAxialAngle([1.6, 1.5, 1.7]).sign === null);
});

test("Conoscopy: uniaxial limit equals the exact plate solution of uniaxial.ts", () => {
  // Plate ⊥ optic axis, and tilted 30° toward azimuth 0 or 40°; incidence in the x–z plane at ν = 0.5.
  for (const [n, tilt, rot] of [[quartz, 0, 0], [quartz, 30, 0], [calcite, 30, 40], [calcite, 0, 0]] as const) {
    const T = impermeability(n, { tilt: tilt * deg, rotation: rot * deg });
    const p = conoscopicPoint(T, 0.5, 0, d, lambda);
    const no = n[1], ne = n === quartz ? n[2] : n[0];
    const w = plateWaves(no, ne, { nIncident: 1, incidence: Math.asin(0.5), axisPolar: tilt * deg, axisAzimuth: rot * deg });
    const exact = Math.abs(plateRetardance(w, d, lambda));
    assert.ok(Math.abs(p.gamma - exact) < 1e-9 * exact, `${tilt}°/${rot}°: ${p.gamma} vs ${exact}`);
  }
});

test("Conoscopy: eigen-directions — radial slow axis in a positive crystal, tangential in a negative one", () => {
  const phi = 30 * deg, nu = 0.4;
  const pos = conoscopicPoint(impermeability(quartz, { tilt: 0, rotation: 0 }), nu * Math.cos(phi), nu * Math.sin(phi), d, lambda);
  const neg = conoscopicPoint(impermeability(calcite, { tilt: 0, rotation: 0 }), nu * Math.cos(phi), nu * Math.sin(phi), d, lambda);
  const mod = (a: number) => ((a % Math.PI) + Math.PI) % Math.PI;
  assert.ok(Math.abs(mod(pos.psi - phi)) < 1e-9 || Math.abs(mod(pos.psi - phi) - Math.PI) < 1e-9, `quartz ψ ${pos.psi / deg}`);
  assert.ok(Math.abs(mod(neg.psi - phi) - Math.PI / 2) < 1e-9, `calcite ψ ${neg.psi / deg}`);
  // Centre of a plate ⊥ the optic axis: no retardance.
  assert.ok(Math.abs(conoscopicPoint(impermeability(calcite, { tilt: 0, rotation: 0 }), 0, 0, d, lambda).gamma) < 1e-9);
});

test("Conoscopy: the biaxial melatope (optic axis) has zero retardance at ν = n_β sin V", () => {
  const n: PrincipalIndices = [1.53, 1.68, 1.685]; // aragonite-like, negative, 2V ≈ 19°
  const { twoV } = opticAxialAngle(n);
  const T = impermeability(n, { tilt: 0, rotation: 0 });
  const nuAxis = n[1] * Math.sin(twoV / 2);
  const at = conoscopicPoint(T, nuAxis, 0, 1e-4, lambda);
  const off = conoscopicPoint(T, nuAxis + 0.02, 0, 1e-4, lambda);
  assert.ok(Math.abs(at.gamma) < 1e-6 && off.gamma > 0.1, `Γ at ${at.gamma}, off ${off.gamma}`);
  // The melatope moves with the stage rotation: at 90° it is on the y axis.
  const T90 = impermeability(n, { tilt: 0, rotation: 90 * deg });
  assert.ok(Math.abs(conoscopicPoint(T90, 0, nuAxis, 1e-4, lambda).gamma) < 1e-6);
});

test("Conoscopy: the figure is transparent outside the NA, dark on the isogyres and symmetric", () => {
  const N = 41;
  const { rgba, maxR } = conoscopicFigure({
    indices: calcite, orientation: { tilt: 0, rotation: 0 }, d: 1e-4, lambda, NA: 0.5, P: 0, A: Math.PI / 2, mode: "mono",
  }, N);
  assert.equal(rgba[3], 0, "corner outside the field");
  const px = (i: number, j: number) => rgba[4 * (j * N + i)];
  // Centre column (x = 0) is on the N–S isogyre: extinct everywhere.
  for (let j = 2; j < N - 2; j++) assert.ok(px(20, j) < 2, `row ${j}: ${px(20, j)}`);
  assert.equal(px(30, 10), px(10, 30));
  assert.ok(maxR > 0 && Number.isFinite(maxR));
});

test("Conoscopy: tilted uniaxial plate — the melatope sits at ν = n_o sin(tilt), on the side of the tilt", () => {
  // A wave along the optic axis travels at n_o, so its transverse wave vector is n_o sin 25° = 0.65261.
  const T = impermeability(quartz, { tilt: 25 * deg, rotation: 0 });
  const nu = quartz[0] * Math.sin(25 * deg);
  assert.ok(Math.abs(conoscopicPoint(T, nu, 0, 1e-4, lambda).R) < 1e-15);
  // Opposite side, against the exact plate solution (uniaxial.ts): 585.27 nm for d = 100 µm.
  const w = plateWaves(quartz[0], quartz[2], { nIncident: 1, incidence: Math.asin(nu), axisPolar: 25 * deg, axisAzimuth: Math.PI });
  const exact = (plateRetardance(w, 1e-4, lambda) * lambda) / (2 * Math.PI);
  const R = conoscopicPoint(T, -nu, 0, 1e-4, lambda).R;
  assert.ok(Math.abs(R - exact) < 1e-9 * exact && Math.abs(R - 585.27e-9) < 0.01e-9, `R ${R}, exact ${exact}`);
});

test("Conoscopy: the bisection fallback alone finds the same k_z, including ordinary waves on the bracket ends", () => {
  // Quartz fast (n = n_α) and calcite slow (n = n_γ) are ordinary waves whose root is a bracket end.
  let worst = 0;
  for (const n of [quartz, calcite, [1.53, 1.68, 1.685], [1.5, 1.7, 2.4], [1, 1, 3]] as PrincipalIndices[]) {
    const T = impermeability(n, { tilt: 40 * deg, rotation: 30 * deg });
    const n0 = transverseEigen(T, [0, 0, 1]);
    for (let k = 0; k < 20; k++) {
      const r = 0.9 * Math.min(n[0], 1) * Math.sqrt((k + 0.5) / 20), ph = 2.4 * k;
      for (const [branch, start] of [["slow", n0.nSlow], ["fast", n0.nFast]] as const) {
        const a = eigenKz(T, r * Math.cos(ph), r * Math.sin(ph), branch, start).kz;
        const b = eigenKz(T, r * Math.cos(ph), r * Math.sin(ph), branch, start, 0).kz;
        assert.ok(Number.isFinite(a) && Number.isFinite(b), `${n} ${branch} r ${r}: ${a} vs ${b}`);
        worst = Math.max(worst, Math.abs(a - b));
      }
    }
  }
  assert.ok(worst < 1e-12, `worst |Δk_z| ${worst}`);
  // Beyond the largest index the wave is evanescent: NaN, not a fake root.
  assert.ok(Number.isNaN(eigenKz(impermeability(quartz, { tilt: 0, rotation: 0 }), 1.6, 0, "slow", 1.55, 0).kz));
});

test("Conoscopy: strongly birefringent crystals fill the whole field (no evanescent or failed pixels)", () => {
  const N = 41;
  for (const [n, NA] of [[[1.5, 1.7, 2.4], 1.4], [[1, 1, 3], 0.95]] as [PrincipalIndices, number][]) {
    const { rgba } = conoscopicFigure({
      indices: n, orientation: { tilt: 40 * deg, rotation: 30 * deg }, d: 1e-5, lambda, NA, P: 0, A: Math.PI / 2, mode: "mono",
    }, N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = (2 * (i + 0.5)) / N - 1, y = 1 - (2 * (j + 0.5)) / N;
      if (x * x + y * y <= 1) assert.equal(rgba[4 * (j * N + i) + 3], 255, `${n}: pixel ${i}, ${j}`);
    }
  }
});

test("Conoscopy: isochromes finer than a pixel fade to the mean instead of aliasing", () => {
  // Calcite ⊥ axis, 5 mm, NA 0.5 on 41 px: near the rim R changes by ≈ 10 λ per pixel. On the diagonals (ψ = 45°
  // from the polars) the mean of sin²(Γ/2) is ½, sRGB-encoded 0.7354 → 188 (IEC 61966-2-1); white light likewise.
  const N = 41;
  const settings = { indices: calcite, orientation: { tilt: 0, rotation: 0 }, d: 5e-3, lambda, NA: 0.5, P: 0, A: Math.PI / 2 };
  const mono = conoscopicFigure({ ...settings, mode: "mono" }, N).rgba;
  const white = conoscopicFigure({ ...settings, mode: "white" }, N).rgba;
  for (const [i, j] of [[33, 7], [31, 9], [7, 7], [9, 31]]) {
    const k = 4 * (j * N + i);
    assert.ok(Math.abs(mono[k] - 188) <= 2, `mono ${i}, ${j}: ${mono[k]}`);
    for (let c = 0; c < 3; c++) assert.ok(Math.abs(white[k + c] - 188) <= 3, `white ${i}, ${j}: ${white[k + c]}`);
  }
});
