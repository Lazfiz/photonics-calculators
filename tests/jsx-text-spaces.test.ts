import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Next's SWC drops the leading space of a JSX text node that follows an element or expression on the same line when
// the text runs onto another line and holds an entity: `V = {v} &gt; 2.405: …⏎` rendered "V = 2.41> 2.405" on 41
// pages until scripts/codemods/2026-11-21-jsx-leading-space.ts. tsc keeps the space, so only this scan catches it.
const files = execFileSync("git", ["ls-files", "src/**/*.tsx"], { encoding: "utf8" }).split("\n").filter(Boolean);
const ENTITY = /&(#\d+|#x[0-9a-f]+|[a-z]+);/i;

test("JSX text after an element or expression doesn't start with a space SWC would drop", () => {
  const bad: string[] = [];
  for (const file of files) {
    const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
      if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
        node.children.forEach((child, i) => {
          if (!ts.isJsxText(child) || i === 0 || ts.isJsxText(node.children[i - 1])) return;
          const raw = sf.text.slice(child.pos, child.end);
          if (/^[ \t]+\S/.test(raw) && raw.includes("\n") && ENTITY.test(raw)) {
            const { line } = sf.getLineAndCharacterOfPosition(child.pos);
            bad.push(`${file}:${line + 1} ${raw.trim().slice(0, 40)}`);
          }
        });
      }
      node.forEachChild(visit);
    };
    visit(sf);
  }
  assert.deepEqual(bad, [], 'write the space as {" "}');
});
