import test from "node:test";
import assert from "node:assert/strict";

import { modulationTransferSummary, mtfTerms } from "../src/physics/detectors/modulation-transfer";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

// Golden values from an independent scratch re-implementation of Holst & Lomheim (2011, doi:10.1117/3.2524677.ch10):
// |sinc(π f a)|·1/(1 + (2π f ℓ)²)·exp(−2π² σ² f²) at f = 1/(2p), a = p√FF.
test("modulationTransferSummary at the page defaults", () => {
  const r = modulationTransferSummary({ pitch: 5.4e-6, spreadLength: 1.5e-6, fillFactor: 0.95, blurSigma: 0 });
  assertRel(r.nyquist, 92592.5925925926, 1e-12, "Nyquist");
  assertRel(r.aperture, 5.26326894619684e-6, 1e-12, "aperture");
  assertRel(r.pixel, 0.6526415486992296, 1e-9, "pixel");
  assertRel(r.diffusion, 0.5676839498533575, 1e-9, "spread");
  assert.equal(r.blur, 1);
  assertRel(r.total, 0.370494132203991, 1e-9, "total");
});

test("modulationTransferSummary: 100 % fill, no spread: 2/π at Nyquist", () => {
  const r = modulationTransferSummary({ pitch: 4e-6, spreadLength: 0, fillFactor: 1, blurSigma: 0 });
  assertRel(r.total, 2 / Math.PI, 1e-9, "2/π");
});

test("mtfTerms with blur at p = 6.5 µm", () => {
  const p = { pitch: 6.5e-6, spreadLength: 2e-6, fillFactor: 0.8, blurSigma: 1.2e-6 };
  const t = mtfTerms(1 / (2 * p.pitch), p);
  assertRel(t.blur, 0.8451914789389138, 1e-9, "blur");
  assertRel(t.total, 0.3067217585977163, 1e-9, "total");
});
