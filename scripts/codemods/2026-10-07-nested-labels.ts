/**
 * Unwrap `ValidatedNumberInput`s nested in a card `<label>` (Phase 1 follow-up).
 *
 * `ValidatedNumberInput` renders its own card `<label>`, but some pages still wrap it in the old one:
 *
 *   <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>film</sub></span>
 *     <ValidatedNumberInput label="nfilm" value={nFilm} … /></label>
 *
 * That nests a `<label>` in a `<label>` (invalid HTML), shows the caption twice, and the input's own
 * copy has lost the markup. This codemod replaces the wrapper with the input and moves the span's
 * content into `label`: plain text becomes a string, `{identifier}` stays an expression, and anything
 * else becomes a fragment holding the span's children verbatim (`label={<>n<sub>film</sub></>}`).
 *
 * It only touches wrappers whose className is the input's own card class, so no layout is lost, and
 * skips (and reports) every other shape. It is idempotent: once no `<label>` wraps an input, a second
 * run changes nothing. Captions whose text differs from the input's old `label` are listed with
 * CODEMOD_LIST=1 for review; the caption wins, as in `2026-10-07-input-captions.ts`.
 *
 * Usage: npx tsx scripts/codemods/2026-10-07-nested-labels.ts [--write] [files...]
 * Default is a dry run over `src/app/<category>/<slug>/page-client.tsx`.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { Node, Project, SyntaxKind, ts, type JsxElement, type JsxSelfClosingElement, type SourceFile } from "ts-morph";

const INPUT = "ValidatedNumberInput";
/** The class `ValidatedNumberInput` puts on its own `<label>`. */
const CARD = "block rounded-lg border border-gray-800 bg-gray-900 p-4";

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

const meaningful = (el: JsxElement) =>
  el.getJsxChildren().filter((c) => !(Node.isJsxText(c) && c.containsOnlyTriviaWhiteSpaces()));

/** Every `<label>` with a `ValidatedNumberInput` somewhere inside it. */
const wrappers = (sf: SourceFile) =>
  sf.getDescendantsOfKind(SyntaxKind.JsxElement).filter((el) =>
    tagName(el) === "label" &&
    el.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).some((d) => tagName(d) === INPUT));

/** The value of a `className="…"` string attribute, or null for any other attribute set. */
function onlyClassName(el: JsxElement): string | null {
  const attrs = el.getOpeningElement().getAttributes();
  if (attrs.length !== 1) return null;
  const a = attrs[0];
  if (!Node.isJsxAttribute(a) || a.getNameNode().getText() !== "className") return null;
  const init = a.getInitializer();
  return init && Node.isStringLiteral(init) ? init.getLiteralValue() : null;
}

/** The text a reader sees, for comparing the caption with the input's old label. */
const plain = (s: string) => s.replace(/<[^>]*>/g, "").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

type Plan = { input: JsxSelfClosingElement; init: string; caption: string } | { skip: string };

function plan(wrapper: JsxElement): Plan {
  const cls = onlyClassName(wrapper);
  if (cls === null) return { skip: "wrapper has attributes other than a className string" };
  if (cls !== CARD) return { skip: `wrapper className "${cls}" is not the card class` };
  const kids = meaningful(wrapper);
  const [span, input] = kids;
  if (kids.length !== 2 || !Node.isJsxElement(span) || tagName(span) !== "span" ||
      !Node.isJsxSelfClosingElement(input) || tagName(input) !== INPUT) {
    return { skip: "wrapper is not exactly <span>…</span> + <ValidatedNumberInput/>" };
  }
  if (onlyClassName(span) === null) return { skip: "span has attributes other than a className string" };
  if (input.getAttributes().some((a) => Node.isJsxSpreadAttribute(a))) return { skip: "input spreads props" };
  const labels = input.getAttributes().filter((a) => Node.isJsxAttribute(a) && a.getNameNode().getText() === "label");
  if (labels.length !== 1) return { skip: "input has no single `label` attribute" };

  const spanKids = meaningful(span);
  if (spanKids.length === 0) return { skip: "empty caption" };
  const inner = span.getSourceFile().getFullText()
    .slice(span.getOpeningElement().getEnd(), span.getClosingElement().getStart());
  let init: string;
  if (spanKids.length === 1 && Node.isJsxExpression(spanKids[0]) && Node.isIdentifier(spanKids[0].getExpression())) {
    init = `{${spanKids[0].getExpression()!.getText()}}`;
  } else if (spanKids.length === 1 && Node.isJsxText(spanKids[0]) && !/[\n"&{}<>]/.test(inner.trim())) {
    init = JSON.stringify(inner.trim());
  } else {
    if (/\n/.test(inner)) return { skip: "multi-line rich caption" };
    init = `{<>${inner.trim()}</>}`;
  }
  return { input, init, caption: inner.trim() };
}

const project = new Project({ skipAddingFilesFromTsConfig: true, skipFileDependencyResolution: true });
const changed: string[] = [];
const skipped: { file: string; line: number; reason: string }[] = [];
const relabels: string[] = [];
let unchanged = 0;
let sites = 0;

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const sf = project.createSourceFile(`/virtual/${file}`, text, { overwrite: true });
  const edits: { start: number; end: number; with: string }[] = [];

  for (const wrapper of wrappers(sf)) {
    const line = wrapper.getStartLineNumber();
    const p = plan(wrapper);
    if ("skip" in p) { skipped.push({ file, line, reason: p.skip }); continue; }
    const attr = p.input.getAttributes().find((a) => Node.isJsxAttribute(a) && a.getNameNode().getText() === "label");
    if (!attr || !Node.isJsxAttribute(attr)) continue;
    const old = attr.getInitializer();
    if (!old) { skipped.push({ file, line, reason: "input `label` has no value" }); continue; }

    const oldText = old.getText();
    if (plain(oldText) !== plain(p.caption)) {
      relabels.push(`${file}:${line}  ${oldText} -> ${p.init}`);
    }
    // The input's text with the new label, in place of the whole wrapper.
    const inputStart = p.input.getStart();
    const inputText = text.slice(inputStart, p.input.getEnd());
    const replaced =
      inputText.slice(0, old.getStart() - inputStart) + p.init + inputText.slice(old.getEnd() - inputStart);
    edits.push({ start: wrapper.getStart(), end: wrapper.getEnd(), with: replaced });
  }

  if (edits.length === 0) { unchanged++; continue; }
  edits.sort((a, b) => b.start - a.start);
  for (let i = 1; i < edits.length; i++) {
    if (edits[i].end > edits[i - 1].start) throw new Error(`${file}: overlapping edits`);
  }
  let out = text;
  for (const e of edits) out = out.slice(0, e.start) + e.with + out.slice(e.end);

  // Verify: it parses, no handled wrapper is left, and only the wrappers were removed.
  const fail = (reason: string) => skipped.push({ file, line: 0, reason: `verification: ${reason}` });
  if (syntaxErrors(out, file) > 0) { fail("output has syntax errors"); continue; }
  const check = project.createSourceFile(`/virtual/check/${file}`, out, { overwrite: true });
  const left = wrappers(check).filter((w) => !("skip" in plan(w)));
  if (left.length > 0) { fail(`${left.length} wrapper(s) left`); continue; }
  const count = (s: SourceFile, name: string) =>
    [...s.getDescendantsOfKind(SyntaxKind.JsxElement), ...s.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)]
      .filter((e) => tagName(e) === name).length;
  if (count(check, INPUT) !== count(sf, INPUT)) { fail("input count changed"); continue; }
  if (count(check, "label") !== count(sf, "label") - edits.length) { fail("label count is off"); continue; }
  if (count(check, "span") !== count(sf, "span") - edits.length) { fail("span count is off"); continue; }

  sites += edits.length;
  changed.push(file);
  if (write) writeFileSync(file, out);
}

console.log(`${write ? "WRITE" : "DRY RUN"}: ${files.length} files`);
console.log(`changed ${changed.length} files, ${sites} wrappers removed, ${relabels.length} captions differ from the old label`);
console.log(`unchanged ${unchanged}, skipped ${skipped.length}`);
for (const s of skipped) console.log(`  skipped ${s.file}:${s.line}: ${s.reason}`);
if (process.env.CODEMOD_LIST) {
  for (const r of relabels) console.log(`  relabel ${r}`);
  for (const f of changed) console.log(`  changed ${f}`);
}
