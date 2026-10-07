import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Until the calculator registry exists (Phase 2), every page.tsx repeats its metadata in the
// JSON-LD call. 6929ab07 corrupted 427 of these with a regex; this guards the invariant.
const SITE = "https://photonics-calculators.vercel.app";
const PLACEHOLDER = /calculator for photonics and optical engineering/;

const pages = execFileSync("git", ["ls-files", "src/app/*/*/page.tsx"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

function str(node: ts.Node | undefined): string | undefined {
  return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : undefined;
}

function prop(obj: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
  for (const p of obj.properties) {
    if (ts.isPropertyAssignment(p) && p.name.getText() === name) return p.initializer;
  }
  return undefined;
}

function inspect(file: string) {
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  let meta: ts.ObjectLiteralExpression | undefined;
  const calls: ts.CallExpression[] = [];
  const visit = (n: ts.Node) => {
    if (ts.isVariableDeclaration(n) && n.name.getText() === "metadata" && n.initializer &&
        ts.isObjectLiteralExpression(n.initializer)) meta = n.initializer;
    if (ts.isCallExpression(n) && n.expression.getText() === "generateCalculatorJsonLd") calls.push(n);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return { meta, calls };
}

test("calculator pages have a full set of page.tsx files", () => {
  assert.ok(pages.length >= 500, `only ${pages.length} pages found`);
});

test("each calculator page's JSON-LD repeats its metadata as plain strings", () => {
  const bad: string[] = [];
  for (const file of pages) {
    const [, cat, slug] = /^src\/app\/([^/]+)\/([^/]+)\/page\.tsx$/.exec(file)!;
    const { meta, calls } = inspect(file);
    if (!meta) { bad.push(`${file}: no metadata object`); continue; }
    const title = str(prop(meta, "title"));
    const description = str(prop(meta, "description"));
    const alternates = prop(meta, "alternates");
    const canonical = alternates && ts.isObjectLiteralExpression(alternates) ? str(prop(alternates, "canonical")) : undefined;
    if (canonical !== `${SITE}/${cat}/${slug}`) bad.push(`${file}: canonical ${canonical}`);
    if (!title || !description) { bad.push(`${file}: title/description not plain strings`); continue; }
    if (PLACEHOLDER.test(description)) bad.push(`${file}: placeholder description`);
    if (calls.length !== 1) { bad.push(`${file}: ${calls.length} generateCalculatorJsonLd calls`); continue; }
    const args = calls[0].arguments.slice(0, 3).map((a) => (ts.isStringLiteral(a) ? a.text : undefined));
    if (args[0] !== title || args[1] !== description || args[2] !== canonical) {
      bad.push(`${file}: JSON-LD arguments differ from metadata`);
    }
  }
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} pages failed`);
});
