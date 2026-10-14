import test from "node:test";
import assert from "node:assert/strict";

import { ATM, TORR } from "../src/physics/constants";
import {
  EVAPORANTS, airMeanFreePath, evaporationMassFlux, inFitRange, meanSpeed, structureZone,
  surfaceSourceProfile, surfaceSourceRate, vapourPressure,
} from "../src/physics/thin-film/thermal-evaporation";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("vapour pressures agree with an independent fit of the Alcock et al. data", () => {
  // CalebBell/chemicals, "Alcock_Itkin_Horrigan_metalic_elements(_sublimation).tsv": DIPPR-101 refits
  // ln p = A + B/T + C ln T + D T^E (Pa) of the same 1984 data. Values at the temperatures below.
  const cases: [keyof typeof EVAPORANTS, number, number][] = [
    ["Al", 886, 3.649e-8], // solid
    ["Al", 1213, 3.650e-3], // liquid
    ["Ag", 1357, 3.727], // liquid
    ["Au", 1270, 4.032e-4], // solid: 9.152, not the misprinted 9.52 (2.3× higher)
    ["Au", 1471, 3.826e-2],
    ["Cu", 1494, 7.395e-1],
    ["Ni", 1640, 9.339e-2],
    ["Ti", 2123, 4.477],
    ["Pd", 1734, 1.188],
    ["In", 1000, 1.2736e-2], // liquid, inside the fit range
  ];
  for (const [id, T, p] of cases) assertRel(vapourPressure(EVAPORANTS[id], T), p, 0.04, `${id} ${T} K`);
});

test("solid and liquid fits meet at the melting point", () => {
  // Independent consistency check of the transcribed coefficients (the fits are ±5 %).
  for (const [id, ev] of Object.entries(EVAPORANTS)) {
    const [As, Bs, Cs] = ev.solid;
    const [Al, Bl, Cl] = ev.liquid;
    const T = ev.Tm;
    const ps = ATM * 10 ** (As + Bs / T + Cs * Math.log10(T));
    const pl = ATM * 10 ** (Al + Bl / T + Cl * Math.log10(T));
    assertRel(ps, pl, 0.05, `${id} at T_m`);
  }
});

test("aluminium: 1 Pa near 1485 K and the fit range", () => {
  // Liquid: log₁₀(p/Pa) = 5.006 + 5.911 − 16211/T = 0 at T = 16211/10.917 = 1484.9 K
  // (CRC Handbook vapour-pressure table: 1 Pa at 1482 K).
  assertRel(vapourPressure(EVAPORANTS.Al, 16211 / 10.917), 1, 1e-3, "Al 1 Pa");
  assertRel(vapourPressure(EVAPORANTS.Al, 1482), 1, 0.06, "CRC 1482 K"); // within the ±5 % fit
  assert.equal(inFitRange(1482, 1), true);
  assert.equal(inFitRange(2000, 500), false); // above 10⁻³ atm
  assert.ok(Number.isNaN(vapourPressure(EVAPORANTS.Al, 0)));
});

test("Hertz–Knudsen flux and surface-source growth rate", () => {
  // Al at 1523 K: p = 101325 · 10^(5.911 − 16211/1523) = 1.8732 Pa;
  // Γ = p √(M/(2πRT)) = 1.8732 · √(0.026982/(2π · 8.31446 · 1523)) = 1.09087e-3 kg m⁻² s⁻¹.
  // Ø 2 cm source, h = 30 cm: rate = Γ π r_s² / (π ρ h²) = 1.09087e-3 · 1e-4 / (2700 · 0.09) = 0.44892 nm/s.
  const p = vapourPressure(EVAPORANTS.Al, 1523);
  assertRel(p, 1.87324, 1e-4, "p");
  const G = evaporationMassFlux(p, EVAPORANTS.Al.M, 1523);
  assertRel(G, 1.090871e-3, 1e-4, "Γ");
  assertRel(surfaceSourceRate(G, Math.PI * 0.01 ** 2, 2700, 0.3), 0.448918e-9, 1e-4, "rate");
  assertRel(evaporationMassFlux(p, EVAPORANTS.Al.M, 1523, 0.5), G / 2, 1e-12, "α = 0.5");
  assert.ok(Number.isNaN(evaporationMassFlux(p, EVAPORANTS.Al.M, 1523, 1.5)));
});

test("thickness profile, mean free path, mean speed, structure zone", () => {
  // Ohring ch. 3: d/d₀ = (1 + (l/h)²)⁻²; l = h gives 1/4; l = 5, h = 30 gives (37/36)⁻² = 1296/1369.
  assert.equal(surfaceSourceProfile(30, 30), 0.25);
  assertRel(surfaceSourceProfile(5, 30), 1296 / 1369, 1e-12, "edge");
  assert.equal(surfaceSourceProfile(0, 30), 1);
  // Ohring ch. 2: λ = 5×10⁻³ cm at 1 torr, so 50 m at 10⁻⁶ torr.
  assertRel(airMeanFreePath(1e-6 * TORR), 50, 1e-12, "λ");
  assert.ok(Number.isNaN(airMeanFreePath(0)));
  // Mean speed of N₂ (28.0134 g/mol) at 300 K: √(8RT/(πM)) = 476.2 m/s.
  assertRel(meanSpeed(28.0134e-3, 300), 476.2, 1e-3, "v̄");
  // Zones: 0.3 and 0.45 of T_m (Thornton 1977).
  assert.equal(structureZone(279, 933), 1);
  assert.equal(structureZone(0.3 * 933, 933), 2);
  assert.equal(structureZone(0.45 * 933, 933), 3);
  assert.ok(Number.isNaN(structureZone(933, 933)), "substrate at the melting point");
});
