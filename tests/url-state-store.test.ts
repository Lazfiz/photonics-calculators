import test from "node:test";
import assert from "node:assert/strict";

import {
  applyParamWrites,
  currentQuery,
  parseParam,
  readParam,
  subscribe,
  writeParam,
} from "../src/lib/url-state-store";

/** Minimal browser stub: `replaceState` updates `location` the way a browser does. */
function stubWindow(path: string) {
  const location = new URL(path, "https://example.test");
  const urls: string[] = [];
  let failing = false;
  const fakeWindow = {
    location,
    history: {
      state: null,
      replaceState(_state: unknown, _title: string, url: string) {
        if (failing) throw new Error("SecurityError: too many calls");
        urls.push(url);
        location.href = new URL(url, location.href).href;
      },
    },
  };
  Object.assign(globalThis, { window: fakeWindow });
  return {
    location,
    urls,
    setFailing(value: boolean) {
      failing = value;
    },
  };
}

test("parseParam: invalid or non-finite numbers fall back to the default", () => {
  assert.equal(parseParam("12.5", 532), 12.5);
  assert.equal(parseParam("1e-9", 532), 1e-9);
  assert.equal(parseParam(null, 532), 532);
  assert.equal(parseParam("", 532), 532);
  assert.equal(parseParam("abc", 532), 532);
  assert.equal(parseParam("Infinity", 532), 532);
  assert.equal(parseParam("OOK", "DPSK"), "OOK");
});

test("applyParamWrites: null deletes the param and keeps the others", () => {
  assert.equal(applyParamWrites("?k=5&utm_source=x", new Map([["k", null]])), "utm_source=x");
  assert.equal(applyParamWrites("", new Map([["k", "7"]])), "k=7");
  assert.equal(applyParamWrites("?k=5", new Map([["k", "6"]])), "k=6");
});

// Regression: the old flush loop only visited keys still pending, so a reset never removed the
// param and the shared link kept the stale value.
test("resetting to the default removes the param from the URL", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { urls } = stubWindow("/fiber/na?k=5&utm_source=x");
  assert.equal(readParam("/fiber/na", "k"), "5");

  let notified = 0;
  const unsubscribe = subscribe(() => notified++);
  writeParam("/fiber/na", "k", "3", "3");
  assert.equal(readParam("/fiber/na", "k"), null, "the pending reset is visible before the flush");
  assert.equal(notified, 1);
  assert.deepEqual(urls, [], "debounced");

  t.mock.timers.tick(100);
  assert.deepEqual(urls, ["/fiber/na?utm_source=x"]);
  assert.equal(readParam("/fiber/na", "k"), null);
  unsubscribe();
});

test("a burst of writes makes one URL update and keeps the hash", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { urls } = stubWindow("/p#chart");
  writeParam("/p", "a", "1", "0");
  t.mock.timers.tick(50);
  writeParam("/p", "a", "2", "0");
  writeParam("/p", "b", "x", "y");
  t.mock.timers.tick(100);
  assert.deepEqual(urls, ["/p?a=2&b=x#chart"]);
});

test("another page never sees this page's values, and stale writes are dropped", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { location, urls } = stubWindow("/a?wavelength=600");
  // During a client-side navigation the next page renders while the browser still shows /a.
  assert.equal(readParam("/b", "wavelength"), null);

  writeParam("/a", "wavelength", "700", "532");
  location.href = new URL("/b", location.href).href; // navigated before the flush
  t.mock.timers.tick(100);
  assert.deepEqual(urls, []);
  assert.equal(readParam("/b", "wavelength"), null);
});

test("a failed URL write keeps the value, and the next write retries it", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { urls, setFailing } = stubWindow("/p");
  setFailing(true);
  writeParam("/p", "a", "1", "0");
  t.mock.timers.tick(100);
  assert.equal(readParam("/p", "a"), "1");

  setFailing(false);
  writeParam("/p", "b", "2", "0");
  t.mock.timers.tick(100);
  assert.deepEqual(urls, ["/p?a=1&b=2"]);
});

// The share link must include writes from the last 100 ms, and never another page's params.
test("currentQuery: URL plus pending writes, empty on another page", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  stubWindow("/p?a=1#chart");
  assert.equal(currentQuery("/p"), "a=1");
  assert.equal(currentQuery("/q"), "");

  writeParam("/p", "b", "2", "0");
  assert.equal(currentQuery("/p"), "a=1&b=2", "pending write included before the flush");
  writeParam("/p", "a", "0", "0");
  writeParam("/p", "b", "0", "0");
  assert.equal(currentQuery("/p"), "", "all params reset");
  t.mock.timers.tick(100);
  assert.equal(currentQuery("/p"), "");
});
