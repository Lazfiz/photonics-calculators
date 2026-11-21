/**
 * Next's SWC drops the leading space of a JSX text node that follows an element or expression on the same line when
 * the text runs onto another line and holds an entity (`V = {v} &gt; 2.405: …⏎` renders "V = 2.41> 2.405"); tsc keeps
 * it (ROADMAP open findings/UI, session 270). Replace that leading space with an explicit `{" "}`, which both compilers keep.
 * Found by comparing the string literals SWC and TypeScript emit for every .tsx (48 dropped spaces in 41 pages).
 *
 * Usage: npx tsx scripts/codemods/2026-11-21-jsx-leading-space.ts [--write]
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { Node, Project, SyntaxKind } from "ts-morph";

const write = process.argv.includes("--write");
const files = execSync('git ls-files "src/**/*.tsx"', { encoding: "utf8" }).trim().split("\n");
const project = new Project({ skipAddingFilesFromTsConfig: true, skipFileDependencyResolution: true });
project.addSourceFilesAtPaths(files);

const ENTITY = /&(#\d+|#x[0-9a-f]+|[a-z]+);/i;
let changed = 0, nodes = 0, sameLineOnly = 0;
for (const sf of project.getSourceFiles()) {
  const targets: number[] = [];
  for (const text of sf.getDescendantsOfKind(SyntaxKind.JsxText)) {
    const raw = text.getFullText();
    const lead = /^[ \t]+(?=\S)/.exec(raw);
    const prev = text.getPreviousSibling();
    if (!lead || !prev || Node.isJsxText(prev)) continue;
    if (!ENTITY.test(raw) || !raw.includes("\n")) { sameLineOnly++; continue; }
    targets.push(text.getPos());
  }
  if (!targets.length) continue;
  for (const pos of targets.reverse()) {
    const len = /^[ \t]+/.exec(sf.getFullText().slice(pos))![0].length;
    sf.replaceText([pos, pos + len], '{" "}');
  }
  nodes += targets.length;
  changed++;
  console.log(`${path.relative(".", sf.getFilePath())} (${targets.length})`);
}
console.log(`changed ${changed} files, ${nodes} text nodes; ${sameLineOnly} leading spaces outside the trigger kept`);
if (write) project.saveSync();
else console.log("dry run: pass --write to save");
