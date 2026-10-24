import test from "node:test";
import assert from "node:assert/strict";

import { buildSearchIndex } from "../src/registry/search";
import { scoreItem, searchItems, searchTerms, type SearchItem } from "../src/lib/site-search";

const index = buildSearchIndex();

test("site search: nonsense finds nothing instead of the highest-priority pages (Codex review 2026-10-13)", () => {
  assert.deepEqual(searchItems(index, "xyzzy"), []);
  assert.deepEqual(searchItems(index, "qwfp zzkv"), []);
  // One real word plus one nonsense word: every term must match.
  assert.deepEqual(searchItems(index, "laser xyzzy"), []);
  assert.deepEqual(searchItems(index, "   "), []);
});

test("site search: real queries rank title matches first", () => {
  const airy = searchItems(index, "airy disk");
  assert.ok(airy.length > 0);
  assert.match(airy[0].title.toLowerCase(), /airy/);
  const mpe = searchItems(index, "MPE");
  assert.ok(mpe.length > 0 && mpe.length <= 12);
  assert.ok(searchItems(index, "fiber", 5).length === 5);
});

test("scoreItem: priority only breaks ties between items that match", () => {
  const item = (title: string, priority: number): SearchItem => ({
    title, href: "/x/y", description: "", kind: "page", category: "wave-optics", tags: [], priority,
  });
  assert.equal(scoreItem(item("Airy Disk", 100), searchTerms("bessel")), 0);
  assert.equal(scoreItem(item("Airy Disk", 100), []), 0);
  // title === term 400, startsWith 220, includes 120, word === 120, word startsWith 80, + priority.
  assert.equal(scoreItem(item("Airy", 7), searchTerms("airy")), 400 + 220 + 120 + 120 + 80 + 7);
  const inDescription = { ...item("Point Spread Function", 100), description: "Airy pattern of a lens" };
  assert.equal(scoreItem(inDescription, ["airy"]), 50 + 100);
  assert.ok(scoreItem(item("Airy Disk", 0), ["airy"]) > scoreItem(inDescription, ["airy"]));
});
