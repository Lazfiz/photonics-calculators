import test from "node:test";
import assert from "node:assert/strict";

import { dropletTirFraction, tirOnsetAngle, waterFilmResponse, waterSurfaceTension, wetting } from "../src/physics/thin-film/anti-fog";
import { stackResponse } from "../src/physics/thin-film/transfer-matrix";

const deg = Math.PI / 180;

test("water surface tension: IAPWS R1-76(2014) Table 1", () => {
  // Calculated column of Table 1, mN/m.
  for (const [tC, mNm] of [[0.01, 75.65], [20, 72.74], [25, 71.97], [100, 58.91]]) {
    const g = waterSurfaceTension(tC + 273.15) * 1e3;
    assert.ok(Math.abs(g - mNm) < 0.005, `${tC} °C: ${g}`);
  }
  assert.ok(Number.isNaN(waterSurfaceTension(240)));
  assert.ok(Number.isNaN(waterSurfaceTension(647.096)));
});

test("droplet TIR fraction: closed form against a sampled cap", () => {
  const n = 1.333;
  // Onset at asin(1/n) = 48.61°; a hemispherical drop (90°) traps 1 − 1/n² = 43.72 % of its base area.
  assert.ok(Math.abs(tirOnsetAngle(n) / deg - 48.6066) < 1e-3);
  assert.equal(dropletTirFraction(45 * deg, n), 0);
  assert.ok(Math.abs(dropletTirFraction(90 * deg, n) - (1 - 1 / n ** 2)) < 1e-15);
  // Independent check: rays on a fine grid over the base disc, each tested with Snell's law at the cap.
  for (const theta of [60, 75, 90]) {
    const r = 1, a = r * Math.sin(theta * deg);
    let hit = 0, all = 0;
    const N = 1200;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const x = -a + (2 * a * (i + 0.5)) / N, y = -a + (2 * a * (j + 0.5)) / N;
        const rho = Math.hypot(x, y);
        if (rho > a) continue;
        all++;
        const alpha = Math.asin(rho / r);
        if (n * Math.sin(alpha) > 1) hit++;
      }
    }
    assert.ok(Math.abs(hit / all - dropletTirFraction(theta * deg, n)) < 3e-3, `${theta}°: ${hit / all}`);
  }
  assert.ok(Number.isNaN(dropletTirFraction(-0.1)));
  assert.ok(Number.isNaN(dropletTirFraction(120 * deg)), "beyond a hemisphere");
});

test("water film: incoherent sum of the multiple reflections", () => {
  // Explicit bounce series between the air/water interface and the coated substrate seen from the water.
  const coating = [{ n: 1.38, thickness: 99.6e-9 }];
  const lambda = 550e-9, nw = 1.333, ns = 1.52;
  const R1 = ((nw - 1) / (nw + 1)) ** 2, T1 = 1 - R1;
  const back = stackResponse({ incident: nw, layers: coating, substrate: { n: ns } }, lambda);
  let R = R1, T = 0, amp = T1;
  for (let k = 0; k < 50; k++) {
    T += amp * back.T;
    R += amp * back.R * T1;
    amp *= back.R * R1;
  }
  const film = waterFilmResponse(coating, ns, lambda, nw);
  assert.ok(Math.abs(film.R - R) < 1e-15 && Math.abs(film.T - T) < 1e-15);
  assert.ok(Math.abs(film.R + film.T - 1) < 1e-14, "lossless");
  // No coating and a water-matched substrate: only the air/water face reflects, 2.04 %.
  assert.ok(Math.abs(waterFilmResponse([], nw, lambda, nw).R - 0.020373) < 1e-6);
});

test("wetting: Young–Dupré", () => {
  const g = 0.07274;
  assert.deepEqual(wetting(g, 0), { adhesionTension: g, workOfAdhesion: 2 * g });
  const w = wetting(g, 90 * deg);
  assert.ok(Math.abs(w.adhesionTension) < 1e-17 && Math.abs(w.workOfAdhesion - g) < 1e-17);
  assert.ok(Number.isNaN(wetting(g, 4).workOfAdhesion));
});
