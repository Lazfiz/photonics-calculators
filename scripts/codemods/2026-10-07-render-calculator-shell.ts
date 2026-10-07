/**
 * Render `CalculatorShell` in the pages that import it but never use it (Phase 1).
 *
 * 64 `page-client.tsx` files lost their header in a bulk edit: they import `CalculatorShell`, but
 * their root is a bare `<div className="min-h-screen bg-gray-950 …">`, so the page has no title,
 * breadcrumb or share button. This codemod replaces that root (and an inner `max-w-* mx-auto`
 * wrapper, if any) with `<CalculatorShell>`, taking `title` and `description` from the sibling
 * `page.tsx` metadata and `backHref`/`backLabel` from the category folder. An empty leftover
 * header `<div>` as first child is removed. Children are kept byte for byte.
 *
 * Pages that never imported the shell get the import. Skips (and reports) roots without a max
 * width or with other shapes. Idempotent: pages that already render `<CalculatorShell>` are left
 * unchanged.
 *
 * Usage: npx tsx scripts/codemods/2026-10-07-render-calculator-shell.ts [--write] [files...]
 * Default is a dry run over `src/app/<category>/<slug>/page-client.tsx`.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { Node, Project, SyntaxKind, ts, type JsxElement, type ObjectLiteralExpression, type SourceFile } from "ts-morph";

const CATEGORY: Record<string, string> = {
  detectors: "Detectors",
  "fiber-optics": "Fiber Optics",
  "free-space-comms": "Free Space Comms",
  imaging: "Imaging",
  "laser-safety": "Laser Safety",
  materials: "Materials",
  polarization: "Polarization",
  spectroscopy: "Spectroscopy",
  "thin-film": "Thin Film",
  "wave-optics": "Wave Optics",
};
const ROOT = /^min-h-screen bg-gray-950 text-(?:white|gray-100) p-[68](?: (max-w-\w+) mx-auto)?$/;
const INNER = /^(max-w-\w+) mx-auto$/;
const DEFAULT_MAX_WIDTH = "max-w-4xl"; // CalculatorShell's default
const SHELL_IMPORT = "../../../components/calculator-shell";

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

function stringProp(obj: ObjectLiteralExpression, name: string): string | undefined {
  const prop = obj.getProperty(name);
  if (!prop || !Node.isPropertyAssignment(prop)) return undefined;
  const init = prop.getInitializer();
  if (Node.isStringLiteral(init) || Node.isNoSubstitutionTemplateLiteral(init)) return init.getLiteralValue();
  return undefined;
}

/** A JSX attribute: a plain string when JSX can hold it verbatim, else a JS string expression. */
function attr(name: string, value: string): string {
  return /^[^"&{}<>\n\\]*$/.test(value) ? `${name}="${value}"` : `${name}={${JSON.stringify(value)}}`;
}

const tagName = (el: JsxElement) => el.getOpeningElement().getTagNameNode().getText();
const className = (el: JsxElement): string | undefined => {
  const a = el.getOpeningElement().getAttribute("className");
  const init = a && Node.isJsxAttribute(a) ? a.getInitializer() : undefined;
  return init && Node.isStringLiteral(init) ? init.getLiteralValue() : undefined;
};
const elementChildren = (el: JsxElement) =>
  el.getJsxChildren().filter((c) => !(Node.isJsxText(c) && c.containsOnlyTriviaWhiteSpaces()));
const rendersShell = (sf: SourceFile) =>
  sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement).some((e) => e.getTagNameNode().getText() === "CalculatorShell") ||
  sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).some((e) => e.getTagNameNode().getText() === "CalculatorShell");
const jsxCount = (sf: SourceFile) =>
  sf.getDescendantsOfKind(SyntaxKind.JsxElement).length + sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length;

const project = new Project({ skipAddingFilesFromTsConfig: true, skipFileDependencyResolution: true });
const changed: string[] = [];
const skipped: { file: string; reason: string }[] = [];
let unchanged = 0;
let notImported = 0;
let innerUnwrapped = 0;
let headerRemoved = 0;

for (const file of files) {
  const skip = (reason: string) => skipped.push({ file, reason });
  const m = /^src\/app\/([^/]+)\/([^/]+)\/page-client\.tsx$/.exec(file);
  if (!m) { skip("not src/app/<category>/<slug>/page-client.tsx"); continue; }
  const [, cat] = m;
  const backLabel = CATEGORY[cat];
  if (!backLabel) { skip(`unknown category folder '${cat}'`); continue; }

  const text = readFileSync(file, "utf8");
  const sf = project.createSourceFile(`/virtual/${file}`, text, { overwrite: true });
  if (rendersShell(sf)) { unchanged++; continue; }
  const imports = sf.getImportDeclarations();
  const imp = imports.find((d) => d.getModuleSpecifierValue().endsWith("components/calculator-shell"));
  if (imp && imp.getDefaultImport()?.getText() !== "CalculatorShell") { skip("calculator-shell imported under another name"); continue; }
  // Pages that never imported the shell get the import, in order among the relative imports.
  let importEdit: { start: number; end: number; with: string } | undefined;
  if (!imp) {
    if (sf.getDescendantsOfKind(SyntaxKind.Identifier).some((i) => i.getText() === "CalculatorShell")) {
      skip("another `CalculatorShell` binding exists");
      continue;
    }
    if (imports.length === 0) { skip("no imports to place the shell import after"); continue; }
    const spec = SHELL_IMPORT;
    const before = imports.find((d) => d.getModuleSpecifierValue().startsWith("../") && d.getModuleSpecifierValue() > spec);
    const line = `import CalculatorShell from "${spec}";\n`;
    importEdit = before
      ? { start: before.getStart(), end: before.getStart(), with: line }
      : { start: imports[imports.length - 1].getEnd() + 1, end: imports[imports.length - 1].getEnd() + 1, with: line };
    notImported++;
  }

  // The page's root: the one returned JSX element with the full-page background.
  const roots = sf.getDescendantsOfKind(SyntaxKind.ReturnStatement)
    .map((r) => r.getExpression())
    .map((e) => (e && Node.isParenthesizedExpression(e) ? e.getExpression() : e))
    .filter((e): e is JsxElement => !!e && Node.isJsxElement(e) && (className(e) ?? "").startsWith("min-h-screen"));
  if (roots.length !== 1) { skip(`${roots.length} full-page roots`); continue; }
  const root = roots[0];
  const rootClass = className(root) ?? "";
  const rm = ROOT.exec(rootClass);
  if (tagName(root) !== "div" || !rm) { skip(`root <${tagName(root)} className="${rootClass}">`); continue; }

  // The element whose children go into the shell: the root, or its single max-width wrapper.
  let body = root;
  let maxWidth = rm[1];
  if (!maxWidth) {
    const kids = elementChildren(root);
    const inner = kids.length === 1 && Node.isJsxElement(kids[0]) ? kids[0] : undefined;
    const im = inner && tagName(inner) === "div" && inner.getOpeningElement().getAttributes().length === 1
      ? INNER.exec(className(inner) ?? "") : null;
    if (!inner || !im) { skip("root has no max width and no single max-width wrapper"); continue; }
    body = inner;
    maxWidth = im[1];
  }

  // page.tsx metadata
  const pageFile = file.replace(/page-client\.tsx$/, "page.tsx");
  const page = project.createSourceFile(`/virtual/${pageFile}`, readFileSync(pageFile, "utf8"), { overwrite: true });
  const meta = page.getVariableDeclaration("metadata")?.getInitializer();
  if (!meta || !Node.isObjectLiteralExpression(meta)) { skip("page.tsx metadata is not an object literal"); continue; }
  const title = stringProp(meta, "title");
  const description = stringProp(meta, "description");
  if (!title || !description) { skip("page.tsx metadata title/description is not a plain string"); continue; }

  const open =
    `<CalculatorShell backHref="/${cat}" backLabel="${backLabel}" ${attr("title", title)} ${attr("description", description)}` +
    (maxWidth === DEFAULT_MAX_WIDTH ? "" : ` maxWidthClassName="${maxWidth}"`) + ">";
  const edits: { start: number; end: number; with: string }[] = [
    { start: root.getOpeningElement().getStart(), end: body.getOpeningElement().getEnd(), with: open },
    { start: body.getClosingElement().getStart(), end: root.getClosingElement().getEnd(), with: "</CalculatorShell>" },
  ];
  if (body !== root) {
    // Close at the root's indentation: replace from the start of the inner closing tag's line.
    const lineStart = (pos: number) => text.lastIndexOf("\n", pos - 1) + 1;
    const innerClose = body.getClosingElement().getStart();
    const rootClose = root.getClosingElement().getStart();
    if (text.slice(lineStart(innerClose), innerClose).trim() !== "" || text.slice(lineStart(rootClose), rootClose).trim() !== "") {
      skip("wrapper closing tags share a line with other code");
      continue;
    }
    edits[1] = { start: lineStart(innerClose), end: root.getClosingElement().getEnd(), with: text.slice(lineStart(rootClose), rootClose) + "</CalculatorShell>" };
  }
  if (body !== root) {
    // Only whitespace may sit between the two wrappers.
    const between = [
      text.slice(root.getOpeningElement().getEnd(), body.getOpeningElement().getStart()),
      text.slice(body.getClosingElement().getEnd(), root.getClosingElement().getStart()),
    ];
    if (between.some((s) => s.trim() !== "")) { skip("text between the wrappers"); continue; }
  }

  // The empty header <div> the bulk edit left behind (its <h1> was removed).
  const first = elementChildren(body)[0];
  let removedHeader = 0;
  if (first && Node.isJsxElement(first) && tagName(first) === "div" && elementChildren(first).length === 0) {
    const lineStart = text.lastIndexOf("\n", first.getStart() - 1) + 1;
    const lineEnd = text.indexOf("\n", first.getEnd());
    if (text.slice(lineStart, first.getStart()).trim() !== "" || text.slice(first.getEnd(), lineEnd).trim() !== "") {
      skip("empty header <div> shares a line with other code");
      continue;
    }
    edits.push({ start: lineStart, end: lineEnd + 1, with: "" });
    removedHeader = 1;
  }

  if (importEdit) edits.push(importEdit);
  edits.sort((a, b) => b.start - a.start);
  let out = text;
  for (const e of edits) out = out.slice(0, e.start) + e.with + out.slice(e.end);

  // Verify: parses, renders exactly one shell as the root, and only the wrappers/header went away.
  if (syntaxErrors(out, file) > 0) { skip("verification: output has syntax errors"); continue; }
  const check = project.createSourceFile(`/virtual/check/${file}`, out, { overwrite: true });
  const shells = check.getDescendantsOfKind(SyntaxKind.JsxOpeningElement).filter((e) => e.getTagNameNode().getText() === "CalculatorShell");
  if (shells.length !== 1) { skip(`verification: ${shells.length} shells`); continue; }
  const shellImports = check.getImportDeclarations().filter((d) => d.getModuleSpecifierValue().endsWith("components/calculator-shell"));
  if (shellImports.length !== 1 || shellImports[0].getDefaultImport()?.getText() !== "CalculatorShell") {
    skip("verification: shell import missing or duplicated");
    continue;
  }
  const removed = (body === root ? 1 : 2) + removedHeader;
  if (jsxCount(check) !== jsxCount(sf) - removed + 1) { skip("verification: element count is off"); continue; }

  headerRemoved += removedHeader;
  if (body !== root) innerUnwrapped++;
  changed.push(file);
  if (write) writeFileSync(file, out);
}

console.log(`${write ? "WRITE" : "DRY RUN"}: ${files.length} files`);
console.log(`changed ${changed.length} (inner wrapper unwrapped ${innerUnwrapped}, empty header removed ${headerRemoved})`);
console.log(`already rendering the shell ${unchanged}, import added ${notImported}, skipped ${skipped.length}`);
for (const s of skipped) console.log(`  skipped ${s.file}: ${s.reason}`);
if (process.env.CODEMOD_LIST) for (const f of changed) console.log(`  changed ${f}`);
