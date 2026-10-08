import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

import * as K from "../src/physics/constants";

// CLAUDE.md rule 4: constants come only from src/physics/constants.ts. The codemod
// scripts/codemods/2026-10-08-inline-constants.ts replaced 273 rounded literals (3e8, 1.6e-19, …).
// This fails on any numeric literal within 1 % of an SI constant or a unit-scaled one (GUARDS), whatever
// its spelling. Comments, strings and JSX text aren't numeric literals, so formulas shown to the reader
// are fine.
type Guard = { name: string; value: number; tol: number; dividend?: boolean };
const SI: Record<string, number> = {
  c: K.c, h: K.h, q: K.q, k_B: K.k_B, N_A: K.N_A, epsilon_0: K.epsilon_0, mu_0: K.mu_0,
  m_e: K.m_e, m_p: K.m_p, m_u: K.m_u, sigma_SB: K.sigma_SB,
};
const GUARDS: Guard[] = [
  ...Object.entries(SI).map(([name, value]) => ({ name, value, tol: 0.01 })),
  // Unit-scaled forms, replaced by scripts/codemods/2026-10-08-unit-scaled-constants.ts.
  { name: "c in km/s (nm·THz)", value: K.c * 1e-3, tol: 0.01 },
  { name: "c in cm/s", value: K.c * 1e2, tol: 0.01 },
  { name: "c in mm/s", value: K.c * 1e3, tol: 0.01 },
  { name: "c in nm/s", value: K.c * 1e9, tol: 0.01 },
  { name: "k_B in eV/K", value: K.k_B_eV, tol: 0.01 },
  { name: "ε₀ in F/cm", value: K.epsilon_0 * 1e-2, tol: 0.01 },
  { name: "Wien's b in nm·K", value: K.b_Wien * 1e9, tol: 0.01 },
  // Ordinary numbers lie within 1 % of these (8.3, 375 nm, a 2e-25 m² cross-section), so only
  // close spellings count.
  { name: "R_gas", value: K.R_gas, tol: 1e-3 },
  { name: "Z_0", value: K.Z_0, tol: 1e-3 },
  { name: "h·c in J·m", value: K.h * K.c, tol: 1e-3 },
  // 1240, 1.24 and 1.24e-6 are also a wavelength, an index and a length: only `1240 / λ` counts.
  // c in nm/fs (300) and in THz per cm⁻¹ (0.03) aren't guarded at all.
  { name: "hc in eV·nm", value: K.hc_eV_nm, tol: 1e-3, dividend: true },
  { name: "hc in eV·µm", value: K.hc_eV_nm * 1e-3, tol: 1e-3, dividend: true },
  { name: "hc/e in V·m", value: K.hc_eV_nm * 1e-9, tol: 1e-3, dividend: true },
];

const srcDir = path.join(process.cwd(), "src");
const constantsFile = path.join(srcDir, "physics", "constants.ts");

function inlineConstants(file: string): string[] {
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const hits: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isNumericLiteral(node)) {
      const value = Number(node.text);
      const p = node.parent;
      const dividend = ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.SlashToken && p.left === node;
      const name = GUARDS.find((g) => Math.abs(value / g.value - 1) < g.tol && (dividend || !g.dividend))?.name;
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
