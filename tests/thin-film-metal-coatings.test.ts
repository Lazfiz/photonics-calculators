import test from "node:test";
import assert from "node:assert/strict";

import { rakicIndex } from "../src/physics/materials/lorentz-drude";
import { enhancedMetalReflectance, enhancedMirrorLayers } from "../src/physics/thin-film/metal-mirror";
import {
  coatingResponse, glazingPerformance, opaqueEmittance, paneResponse, totalNormalEmittance, type CoatingLayer,
} from "../src/physics/thin-film/low-emissivity";

const nm = 1e-9;

test("enhanced Al: transfer matrix at λ₀ equals the quarter-wave admittance formula", () => {
  // Macleod ch. 5: Y = (n_H/n_L)^(2N) · N_Al, R = |(1 − Y)/(1 + Y)|². 200 nm of Al is opaque (T < 1e-15).
  const lambda0 = 550 * nm;
  const al = rakicIndex("Al", lambda0);
  for (const pairs of [0, 1, 2, 3]) {
    const layers = enhancedMirrorLayers({ metal: "Al", metalThickness: 200 * nm, nL: 1.46, nH: 2.35, pairs, lambda0 });
    const R = coatingResponse(layers, { material: "dielectric", n: 1.52 }, lambda0).R;
    const closed = enhancedMetalReflectance(al, 1.46, 2.35, pairs);
    assert.ok(Math.abs(R - closed) < 1e-12, `${pairs} pairs: ${R} vs ${closed}`);
  }
  // Bare Al at 550 nm: 91.52 % (n = 0.966, κ = 6.458); one SiO₂/TiO₂ pair: 96.58 %; two: 98.66 %. Hand check, one
  // pair: Y = (2.35/1.46)² (0.9656 + 6.4581i) = 2.5017 + 16.731i, R = ((1 − 2.5017)² + 16.731²)/((3.5017)² + 16.731²) = 0.96575.
  assert.ok(Math.abs(enhancedMetalReflectance(al, 1.46, 2.35, 0) - 0.9152) < 5e-4);
  assert.ok(Math.abs(enhancedMetalReflectance(al, 1.46, 2.35, 1) - 0.96575) < 1e-5, `${enhancedMetalReflectance(al, 1.46, 2.35, 1)}`);
  assert.ok(Math.abs(enhancedMetalReflectance(al, 1.46, 2.35, 2) - 0.9866) < 5e-5, `${enhancedMetalReflectance(al, 1.46, 2.35, 2)}`);
  assert.ok(Number.isNaN(enhancedMetalReflectance(al, 0, 2.35, 1)));
});

test("pane: bare glass reduces to the two-surface formula", () => {
  // One lossless sheet, both faces incoherent: R = 2R₁/(1 + R₁), T = (1 − R₁)/(1 + R₁), R₁ = ((n − 1)/(n + 1))².
  const n = 1.52, R1 = ((n - 1) / (n + 1)) ** 2;
  const p = paneResponse([], n, 550 * nm);
  assert.ok(Math.abs(p.R - (2 * R1) / (1 + R1)) < 1e-15 && Math.abs(p.T - (1 - R1) / (1 + R1)) < 1e-15);
  const g = glazingPerformance([], n);
  assert.ok(Math.abs(g.Tvis - 0.918318) < 1e-6 && Math.abs(g.Tsol - 0.918318) < 1e-6);
  // Lossless glass treated as opaque: ε = 1 − R₁ at every wavelength.
  assert.ok(Math.abs(g.emittance - (1 - R1)) < 1e-12);
});

test("pane: absorbing coating conserves energy only with absorption, and T is reciprocal", () => {
  const coat: CoatingLayer[] = [
    { material: "dielectric", n: 2.35, thickness: 30 * nm },
    { material: "Ag", thickness: 12 * nm },
    { material: "dielectric", n: 2.35, thickness: 30 * nm },
  ];
  const lam = 550 * nm;
  const fromAir = coatingResponse(coat, { material: "dielectric", n: 1.52 }, lam);
  const fromGlass = coatingResponse(coat.slice().reverse(), { material: "dielectric", n: 1 }, lam, 1.52);
  assert.ok(Math.abs(fromAir.T - fromGlass.T) < 1e-12, "reciprocity");
  assert.ok(fromAir.A > 0.01 && Math.abs(fromAir.R + fromAir.T + fromAir.A - 1) < 1e-12);
  // Regression for the heat-mirror page's default (TiO₂-like 2.35 / Ag 12 nm / 2.35, 30 nm each, on 1.52).
  const g = glazingPerformance(coat, 1.52);
  // Its coated face reflects 1.8 % at 550 nm (bare glass 4.3 %), so the pane passes slightly more light than bare glass.
  assert.ok(Math.abs(g.Tvis - 0.9193) < 5e-4, `Tvis ${g.Tvis}`);
  assert.ok(Math.abs(g.emittance - 0.0334) < 5e-4, `ε ${g.emittance}`);
});

test("emittance of opaque metals", () => {
  // Bulk Ag at 9.970 µm from the Yang et al. (2015) row n = 9.950, κ = 68.85: 1 − R = 4n/((n + 1)² + κ²) = 0.0081889.
  assert.ok(Math.abs(opaqueEmittance([], { material: "Ag" }, 9.97e-6) - 0.0081889) < 1e-7);
  // Bulk Al from the Rakić LD model at 9.9771 µm (tabulated n = 22.201, κ = 82.602): 4n/((n + 1)² + κ²) = 0.012066.
  assert.ok(Math.abs(opaqueEmittance([], { material: "Al" }, 9.9771e-6) - 0.012066) < 2e-5);
  // A Planck-weighted mean of a constant ε is that constant.
  const gray = totalNormalEmittance([], { material: "dielectric", n: 1, k: 0 }, 300, 2.5e-6, 50e-6);
  assert.ok(Math.abs(gray - 1) < 1e-12);
  assert.ok(Number.isNaN(totalNormalEmittance([], { material: "Ag" }, 0, 2.5e-6, 50e-6)));
});
