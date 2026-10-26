import test from "node:test";
import assert from "node:assert/strict";

import { URL_STATE_ATTRIBUTE, URL_STATE_PENDING_SCRIPT } from "../src/lib/url-state-pending";

/** Runs the inline script against a stub `location` and `<html>`; returns the attribute it set, if any. */
function run(search: string): string | undefined {
  const attributes: Record<string, string> = {};
  const document = { documentElement: { setAttribute: (k: string, v: string) => (attributes[k] = v) } };
  new Function("location", "document", URL_STATE_PENDING_SCRIPT)({ search }, document);
  return attributes[URL_STATE_ATTRIBUTE];
}

test("a link with calculator params is marked pending", () => {
  assert.equal(run("?wavelength=1064"), "pending");
  assert.equal(run("?utm_source=x&power=5"), "pending");
  assert.equal(run("?mode"), "pending");
});

test("no query, or only tracking params, leaves the page visible", () => {
  assert.equal(run(""), undefined);
  assert.equal(run("?"), undefined);
  assert.equal(run("?utm_source=newsletter&utm_medium=email&fbclid=abc&gclid=1"), undefined);
});

test("a malformed query doesn't throw", () => {
  assert.equal(run("?%E0%A4%A=1"), undefined);
});
