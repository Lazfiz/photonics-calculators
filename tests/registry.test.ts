import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

import { calculators, categories, calculatorsIn, findCalculator } from "../src/registry";
import { buildSearchIndex } from "../src/registry/search";
import { CATEGORY_IDS } from "../src/registry/types";
import { homeCategories, totalCalculatorCount } from "../src/lib/home-categories";

const PLACEHOLDER = /calculator for photonics and optical engineering/;

const pageFiles = execFileSync("git", ["ls-files", "src/app/*/*/page.tsx"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .filter((file) => !file.startsWith("src/app/about/"));

function parse(file: string) {
  return ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
}

function walk(node: ts.Node, visit: (node: ts.Node) => void) {
  visit(node);
  node.forEachChild((child) => walk(child, visit));
}

function literal(node: ts.Node | undefined): string | undefined {
  return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
}

test("the registry has exactly one entry per calculator page", () => {
  const onDisk = pageFiles.map((file) => "/" + file.split("/").slice(2, 4).join("/")).sort();
  assert.deepEqual(calculators.map((c) => c.href).sort(), onDisk);
  assert.equal(new Set(calculators.map((c) => c.href)).size, calculators.length);
  assert.deepEqual(categories.map((c) => c.id).sort(), [...CATEGORY_IDS].sort());
});

test("each category's entries are sorted by slug", () => {
  for (const category of categories) {
    const slugs = calculatorsIn(category.id).map((c) => c.slug);
    assert.deepEqual(slugs, [...slugs].sort((a, b) => (a < b ? -1 : 1)), category.id);
  }
});

test("entries are complete and their overrides aren't redundant", () => {
  for (const c of calculators) {
    assert.ok(c.title.trim() && c.description.trim(), c.href);
    assert.doesNotMatch(c.description, PLACEHOLDER, c.href);
    assert.notEqual(c.heading, c.title, `${c.href}: heading equals title`);
    assert.notEqual(c.lede, c.description, `${c.href}: lede equals description`);
    for (const link of c.related ?? []) assert.ok(findCalculator(link.href), `${c.href}: related ${link.href}`);
  }
});

// Until stage 2b generates them, each page repeats its registry text: metadata in page.tsx and the
// CalculatorShell heading in page-client.tsx. They must agree with the registry.
test("each page's metadata and heading match its registry entry", () => {
  const mismatches: string[] = [];
  for (const file of pageFiles) {
    const c = findCalculator("/" + file.split("/").slice(2, 4).join("/"))!;
    walk(parse(file), (node) => {
      if (
        ts.isVariableDeclaration(node) &&
        node.name.getText() === "metadata" &&
        node.initializer &&
        ts.isObjectLiteralExpression(node.initializer)
      ) {
        for (const p of node.initializer.properties) {
          if (!ts.isPropertyAssignment(p)) continue;
          const name = p.name.getText();
          if (name === "title" && literal(p.initializer) !== c.title) mismatches.push(`${file}: title`);
          if (name === "description" && literal(p.initializer) !== c.description) mismatches.push(`${file}: description`);
        }
      }
    });
    const client = file.replace(/page\.tsx$/, "page-client.tsx");
    if (!existsSync(client)) continue;
    walk(parse(client), (node) => {
      if (!(ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node))) return;
      if (node.tagName.getText() !== "CalculatorShell") return;
      for (const a of node.attributes.properties) {
        if (!ts.isJsxAttribute(a) || !a.initializer || !ts.isStringLiteral(a.initializer)) continue;
        const name = a.name.getText();
        if (name === "title" && a.initializer.text !== (c.heading ?? c.title)) mismatches.push(`${client}: title`);
        if (name === "description" && a.initializer.text !== (c.lede ?? c.description))
          mismatches.push(`${client}: description`);
      }
    });
  }
  assert.deepEqual(mismatches, []);
});

test("the search index has every visible page and category, and nothing hidden", () => {
  const index = buildSearchIndex();
  const hrefs = index.map((item) => item.href);
  assert.equal(new Set(hrefs).size, hrefs.length);
  const expected = [
    ...categories.map((c) => `/${c.id}`),
    ...calculators.filter((c) => !c.hidden).map((c) => c.href),
    "/about",
  ];
  assert.deepEqual([...hrefs].sort(), expected.sort());
  assert.deepEqual(buildSearchIndex(), index);
});

test("the laser-safety index lists every visible laser-safety calculator once", () => {
  const text = readFileSync("src/app/laser-safety/page.tsx", "utf8");
  const listed = [...text.matchAll(/href: "(\/laser-safety\/[^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(listed).size, listed.length);
  const visible = calculatorsIn("laser-safety").filter((c) => !c.hidden).map((c) => c.href);
  assert.deepEqual([...listed].sort(), visible.sort());
});

test("the home page counts every calculator", () => {
  assert.deepEqual(homeCategories.map((c) => c.id), categories.map((c) => c.id));
  assert.equal(homeCategories.reduce((sum, c) => sum + c.count, 0), calculators.length);
  assert.equal(totalCalculatorCount, pageFiles.length);
});

// The registry is ~200 KB of strings. It must stay out of client bundles: no "use client" module may
// import it, directly or through other modules. related-calculators is the one known exception until
// stage 2b passes related links as server props.
const CLIENT_ALLOWED = new Set(["src/lib/related-calculators.ts"]);

function resolveImport(from: string, spec: string): string | undefined {
  let base: string;
  if (spec.startsWith("@/")) base = path.posix.join("src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.posix.join(path.posix.dirname(from), spec);
  else return undefined;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
    if (/\.(ts|tsx)$/.test(candidate) && existsSync(candidate)) return candidate;
  }
  return undefined;
}

function valueImports(file: string): string[] {
  const out: string[] = [];
  for (const statement of parse(file).statements) {
    if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
    if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (clause?.isTypeOnly) continue;
      const named = clause?.namedBindings;
      const typeOnly =
        clause && !clause.name && named && ts.isNamedImports(named) && named.elements.every((e) => e.isTypeOnly);
      if (typeOnly) continue;
    } else if (statement.isTypeOnly) continue;
    const resolved = resolveImport(file, statement.moduleSpecifier.text);
    if (resolved) out.push(resolved);
  }
  return out;
}

test("no client component pulls the registry into its bundle", () => {
  const files = execFileSync("git", ["ls-files", "src/**/*.ts", "src/**/*.tsx"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  const reaches = new Map<string, string[] | null>();
  function chain(file: string): string[] | null {
    if (reaches.has(file)) return reaches.get(file)!;
    reaches.set(file, null);
    let result: string[] | null = null;
    if (file.startsWith("src/registry/")) result = [file];
    else if (!CLIENT_ALLOWED.has(file)) {
      for (const dep of valueImports(file)) {
        const sub = chain(dep);
        if (sub) {
          result = [file, ...sub];
          break;
        }
      }
    }
    reaches.set(file, result);
    return result;
  }
  const leaks = files
    .filter((file) => /^\s*["']use client["']/.test(readFileSync(file, "utf8")))
    .map(chain)
    .filter((c): c is string[] => c !== null)
    .map((c) => c.join(" → "));
  assert.deepEqual(leaks, []);
});
