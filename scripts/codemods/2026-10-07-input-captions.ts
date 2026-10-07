/**
 * Drop the duplicate caption in front of each `ValidatedNumberInput` (Phase 1).
 *
 * A bulk migration replaced `<input>` with `<ValidatedNumberInput label=…>` but kept the old
 * caption, so the label shows twice:
 *
 *   <label className="block text-sm text-gray-400 mb-1">Facet R₁</label>
 *   <ValidatedNumberInput label="Internal Loss (cm⁻¹)" value={mirrorR1} … />
 *
 * In 44 sites the input's label is the literal string "{label}", and in some resonator pages the
 * input labels are shifted by one row. The caption is the one that matches the input's `value`,
 * so it wins: this codemod moves the caption into `label` and removes the caption element.
 *
 * It handles captions that are plain text or `{identifier}` and skips (and reports) rich ones.
 * It is idempotent: once no caption precedes an input, a second run changes nothing.
 *
 * Usage: npx tsx scripts/codemods/2026-10-07-input-captions.ts [--write] [files...]
 * Default is a dry run over `src/app/<category>/<slug>/page-client.tsx`.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { Node, Project, SyntaxKind, ts, type JsxElement, type JsxSelfClosingElement, type SourceFile } from "ts-morph";

const INPUT = "ValidatedNumberInput";

const args = process.argv.slice(2);
const write = args.includes("--write");
const explicit = args.filter((a) => !a.startsWith("--"));
const files =
  explicit.length > 0
    ? explicit.map((f) => f.replace(/\\/g, "/"))
    : execFileSync("git", ["ls-files", "src/app/*/*/page-client.tsx"], { encoding: "utf8" })
        .split("\n")
        .filter(Boolean);

function syntaxErrors(text: string, fileName: string): number {
  const out = ts.transpileModule(text, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext },
  });
  return out.diagnostics?.length ?? 0;
}

const tagName = (el: JsxElement | JsxSelfClosingElement) =>
  (Node.isJsxElement(el) ? el.getOpeningElement() : el).getTagNameNode().getText();

interface Pair { caption: JsxElement; input: JsxSelfClosingElement }

/** Every `<label>` that contains no element of its own and is directly followed by an input. */
function findPairs(sf: SourceFile): Pair[] {
  const pairs: Pair[] = [];
  for (const caption of sf.getDescendantsOfKind(SyntaxKind.JsxElement)) {
    if (tagName(caption) !== "label") continue;
    const parent = caption.getParent();
    if (!Node.isJsxElement(parent)) continue;
    const siblings = parent.getJsxChildren().filter((c) => !(Node.isJsxText(c) && c.containsOnlyTriviaWhiteSpaces()));
    const next = siblings[siblings.indexOf(caption) + 1];
    if (!next || !Node.isJsxSelfClosingElement(next) || tagName(next) !== INPUT) continue;
    // A <label> wrapping its own control (a card) is a separate input, not a caption.
    const hasControl = caption.getDescendants().some((d) =>
      d !== caption.getOpeningElement() &&
      (Node.isJsxOpeningElement(d) || Node.isJsxSelfClosingElement(d)) &&
      !["sub", "sup", "span", "strong", "em", "i", "b"].includes(d.getTagNameNode().getText()));
    if (hasControl) continue;
    pairs.push({ caption, input: next });
  }
  return pairs;
}

/** The new `label` initializer, or a reason to skip. */
function newLabel(caption: JsxElement): { init: string } | { skip: string } {
  const attrs = caption.getOpeningElement().getAttributes();
  if (attrs.some((a) => !Node.isJsxAttribute(a) || a.getNameNode().getText() !== "className")) {
    return { skip: "caption has attributes other than className" };
  }
  const kids = caption.getJsxChildren().filter((c) => !(Node.isJsxText(c) && c.containsOnlyTriviaWhiteSpaces()));
  if (kids.length === 1 && Node.isJsxExpression(kids[0])) {
    const expr = kids[0].getExpression();
    if (expr && Node.isIdentifier(expr)) return { init: `{${expr.getText()}}` };
    return { skip: "caption is a non-identifier expression" };
  }
  if (kids.length === 1 && Node.isJsxText(kids[0])) {
    const text = kids[0].getText().trim();
    if (/[\n"&{}<>]/.test(text)) return { skip: "caption text needs escaping" };
    return { init: JSON.stringify(text) };
  }
  return { skip: "rich caption (elements or mixed text and expressions)" };
}

const project = new Project({ skipAddingFilesFromTsConfig: true, skipFileDependencyResolution: true });
const changed: string[] = [];
const skipped: { file: string; line: number; reason: string }[] = [];
let unchanged = 0;
let sites = 0;
let literalLabel = 0;
let relabelled = 0;
const relabels: string[] = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const sf = project.createSourceFile(`/virtual/${file}`, text, { overwrite: true });
  const edits: { start: number; end: number; with: string }[] = [];
  let fileSites = 0;

  for (const { caption, input } of findPairs(sf)) {
    const line = caption.getStartLineNumber();
    const label = newLabel(caption);
    if ("skip" in label) { skipped.push({ file, line, reason: label.skip }); continue; }
    const labelAttrs = input.getAttributes().filter((a) => Node.isJsxAttribute(a) && a.getNameNode().getText() === "label");
    if (labelAttrs.length !== 1 || input.getAttributes().some((a) => Node.isJsxSpreadAttribute(a))) {
      skipped.push({ file, line, reason: "input has no single `label` attribute, or spreads props" });
      continue;
    }
    const attr = labelAttrs[0];
    if (!Node.isJsxAttribute(attr)) continue;
    const old = attr.getInitializer();
    if (!old) { skipped.push({ file, line, reason: "input `label` has no value" }); continue; }

    const oldText = old.getText();
    if (oldText === '"{label}"') literalLabel++;
    else if (oldText !== label.init) {
      relabelled++;
      relabels.push(`${file}:${input.getStartLineNumber()}  ${oldText} -> ${label.init}`);
    }
    if (oldText !== label.init) edits.push({ start: old.getStart(), end: old.getEnd(), with: label.init });

    // Remove the caption. When it sits alone on its line, remove the whole line.
    let start = caption.getStart();
    let end = caption.getEnd();
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = text.indexOf("\n", end);
    if (text.slice(lineStart, start).trim() === "" && lineEnd !== -1 && text.slice(end, lineEnd).trim() === "") {
      start = lineStart;
      end = lineEnd + 1;
    }
    edits.push({ start, end, with: "" });
    fileSites++;
  }

  if (edits.length === 0) { unchanged++; continue; }
  edits.sort((a, b) => b.start - a.start);
  for (let i = 1; i < edits.length; i++) {
    if (edits[i].end > edits[i - 1].start) throw new Error(`${file}: overlapping edits`);
  }
  let out = text;
  for (const e of edits) out = out.slice(0, e.start) + e.with + out.slice(e.end);

  // Verify: it parses, no handled caption is left, and only the captions were removed.
  const fail = (reason: string) => skipped.push({ file, line: 0, reason: `verification: ${reason}` });
  if (syntaxErrors(out, file) > 0) { fail("output has syntax errors"); continue; }
  const check = project.createSourceFile(`/virtual/check/${file}`, out, { overwrite: true });
  const left = findPairs(check).filter((p) => !("skip" in newLabel(p.caption)));
  if (left.length > 0) { fail(`${left.length} caption(s) left`); continue; }
  const count = (s: SourceFile, name: string) =>
    [...s.getDescendantsOfKind(SyntaxKind.JsxElement), ...s.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)]
      .filter((e) => tagName(e) === name).length;
  if (count(check, INPUT) !== count(sf, INPUT)) { fail("input count changed"); continue; }
  if (count(check, "label") !== count(sf, "label") - fileSites) { fail("label count is off"); continue; }

  sites += fileSites;
  changed.push(file);
  if (write) writeFileSync(file, out);
}

console.log(`${write ? "WRITE" : "DRY RUN"}: ${files.length} files`);
console.log(`changed ${changed.length} files, ${sites} captions removed`);
console.log(`  label="{label}" fixed ${literalLabel}, other labels replaced by their caption ${relabelled}`);
console.log(`unchanged ${unchanged}, skipped ${skipped.length}`);
for (const s of skipped) console.log(`  skipped ${s.file}:${s.line}: ${s.reason}`);
if (process.env.CODEMOD_LIST) {
  for (const r of relabels) console.log(`  relabel ${r}`);
  for (const f of changed) console.log(`  changed ${f}`);
}
