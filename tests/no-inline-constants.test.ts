import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

import * as K from "../src/physics/constants";

// CLAUDE.md rule 4: constants come only from src/physics/constants.ts. The codemod
// scripts/codemods/2026-10-08-inline-constants.ts replaced 273 rounded literals (3e8, 1.6e-19, …).
// This fails on any numeric literal within 1 % of an SI constant, whatever its spelling. Comments,
// strings and JSX text aren't numeric literals, so formulas shown to the reader are fine.
const GUARDED: Record<string, number> = {
  c: K.c, h: K.h, q: K.q, k_B: K.k_B, N_A: K.N_A, epsilon_0: K.epsilon_0, mu_0: K.mu_0,
  m_e: K.m_e, m_p: K.m_p, m_u: K.m_u, sigma_SB: K.sigma_SB,
};

const srcDir = path.join(process.cwd(), "src");
const constantsFile = path.join(srcDir, "physics", "constants.ts");

function inlineConstants(file: string): string[] {
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const hits: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isNumericLiteral(node)) {
      const value = Number(node.text);
      const name = Object.keys(GUARDED).find((k) => Math.abs(value / GUARDED[k] - 1) < 0.01);
      if (name) {
        const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
        const rel = path.relative(process.cwd(), file).replace(/\\/g, "/");
        hits.push(`${rel}:${line}  ${node.getText(sf)} looks like ${name}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

test("no physical constant is written as a literal outside src/physics/constants.ts", () => {
  const files = readdirSync(srcDir, { recursive: true, encoding: "utf8" })
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => path.join(srcDir, f))
    .filter((f) => f !== constantsFile);
  assert.ok(files.length > 1000, `only ${files.length} source files found`);
  const hits = files.flatMap(inlineConstants);
  assert.deepEqual(hits, [], "import these from src/physics/constants.ts instead");
});
