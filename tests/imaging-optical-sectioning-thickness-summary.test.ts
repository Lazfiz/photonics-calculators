import assert from "node:assert/strict";
import { test } from "node:test";
import { opticalSectioningSummary } from "../src/physics/imaging/optical-sectioning-thickness-summary";

const close = (actual: number, expected: number, rel = 1e-9) =>
  assert.ok(Math.abs(actual / expected - 1) <= rel, `${actual} vs ${expected}`);

// λ = 600 nm, n = 1.33, NA = 1.0, pinhole 2 AU. D = n − √(n² − NA²) = 1.33 − √0.7689 = 0.4531306, worked by an independent script:
//  widefield λ/D (high-NA scale as in Wilhelm et al.; Born & Wolf §8.8 is the paraxial sinc²(u/4)) = 1.324122 µm; confocal √[(0.88589λ/D)² + (√2 n PH/NA)²], PH = 2·1.22·λ/NA = 1.464 µm
//  (Wilhelm et al., Carl Zeiss 2003) = 2.993084 µm; point pinhole 0.64λ/D = 0.847438 µm;
//  two photon 2√(ln 2)·0.532·(2λ)/(√2 D) (Zipfel et al., Nat. Biotechnol. 21, 1369, 2003) = 1.658812 µm.
test("optical sectioning summary matches hand-worked formulas", () => {
  const s = opticalSectioningSummary(600e-9, 1.33, 1.0, 2);
  close(s.widefield, 1.324121658934509e-6);
  close(s.confocal, 2.993084035379417e-6);
  close(s.pointPinhole, 0.8474378617180859e-6);
  close(s.twoPhoton, 1.6588122954439037e-6);
  close(s.pinholeDiameter, 1.464e-6);
  assert.ok(Number.isFinite(s.waveOptical) && s.waveOptical < s.confocal); // Wilson-Sheppard section lies below Wilhelm
});

test("optical sectioning summary is NaN when NA reaches the index", () => {
  const s = opticalSectioningSummary(600e-9, 1.0, 1.0, 1);
  for (const key of ["widefield", "confocal", "waveOptical", "pointPinhole", "twoPhoton"] as const) assert.ok(Number.isNaN(s[key]));
});
