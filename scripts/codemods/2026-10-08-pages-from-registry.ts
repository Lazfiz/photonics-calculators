/**
 * Calculator pages from the registry (ROADMAP Phase 2, stage 2b).
 *
 * page.tsx: all 524 share one shape: three imports, `metadata` (canonical, title, description), `jsonLd =
 * generateCalculatorJsonLd(title, description, url, { category })` and a default export that renders
 * `<JsonLdScript>` and `<PageClient />`. Each is replaced by TEMPLATE, after checking that its strings
 * equal the registry entry, so the generated metadata and JSON-LD carry the same text.
 *
 * page-client.tsx: the one `<CalculatorShell …>` element becomes a fragment and its import goes; the
 * server shell in page.tsx renders the heading, lede, breadcrumbs and related links from the registry.
 *   - `title`/`description` must equal the entry's `heading ?? title` / `lede ?? description`. Pages
 *     without them (8 laser-safety pages with their own `<h1>`) are listed as "untitled".
 *   - `backHref` must be the category and `backLabel` its label (with or without the hyphen).
 *   - `maxWidthClassName` moves to page.tsx.
 *   - On the pages with related links, the shell's last child `<RelatedCalculatorLinks currentHref=…
 *     items={getRelatedCalculators(currentHref)} />`, its two imports and `const currentHref` go.
 *
 * A pair that doesn't match is skipped and reported. Both files change or neither does. Idempotent: a
 * page.tsx already calling `calculatorMetadata` with a shell-free client is unchanged.
 *
 * Usage: npx tsx scripts/codemods/2026-10-08-pages-from-registry.ts [--write] [page dirs...]
 * Default is a dry run over every `src/app/<category>/<slug>/`.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { Node, Project, SyntaxKind, ts, type JsxAttribute, type SourceFile } from "ts-morph";
import { displayName, findCalculator, getCategory } from "../../src/registry";
import { SITE_URL } from "../../src/registry/metadata";

const TEMPLATE = (href: string, maxWidth: string | undefined) => `import CalculatorShell from "@/components/calculator-shell";
import { calculatorMetadata } from "@/registry/metadata";
import PageClient from "./page-client";

const href = "${href}";

export const metadata = calculatorMetadata(href);

export default function Page() {
  return (
    <CalculatorShell href={href}${maxWidth ? ` maxWidthClassName="${maxWidth}"` : ""}>
      <PageClient />
    </CalculatorShell>
  );
}
`;

const OLD_PAGE_IMPORTS = ['next {type { Metadata }}', '../../../lib/json-ld {{ generateCalculatorJsonLd, JsonLdScript }}', './page-client {PageClient}'];
const OLD_PAGE_BODY = "{ return ( <> <JsonLdScript data={jsonLd} /> <PageClient /> </> ); }";
const RELATED_ATTRS = "currentHref={currentHref} items={getRelatedCalculators(currentHref)}";
const SHELL_ATTRS = new Set(["backHref", "backLabel", "title", "description", "maxWidthClassName"]);

const args = process.argv.slice(2);
const write = args.includes("--write");
const only = args.filter((a) => !a.startsWith("--")).map((a) => a.replace(/\\/g, "/").replace(/\/(page(-client)?\.tsx)?$/, ""));
const dirs = execFileSync("git", ["ls-files", "src/app/*/*/page.tsx"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .map((f) => f.replace(/\/page\.tsx$/, ""))
  .filter((d) => only.length === 0 || only.includes(d));

interface Edit { start: number; end: number; with: string }

function syntaxErrors(text: string, fileName: string): number {
  const out = ts.transpileModule(text, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext },
  });
  return out.diagnostics?.length ?? 0;
}

/** The node's range, widened to whole lines when nothing else shares them. */
function lineRange(text: string, start: number, end: number): Edit {
  let s = start;
  while (s > 0 && (text[s - 1] === " " || text[s - 1] === "\t")) s--;
  let e = end;
  while (e < text.length && (text[e] === " " || text[e] === "\t")) e++;
  const ownLine = (s === 0 || text[s - 1] === "\n") && (e === text.length || text[e] === "\n" || text.startsWith("\r\n", e));
  if (!ownLine) return { start, end, with: "" };
  if (text.startsWith("\r\n", e)) e += 2;
  else if (text[e] === "\n") e += 1;
  return { start: s, end: e, with: "" };
}

function apply(text: string, edits: Edit[]): string {
  edits.sort((a, b) => b.start - a.start);
  for (let i = 1; i < edits.length; i++) if (edits[i].end > edits[i - 1].start) throw new Error("overlapping edits");
  let out = text;
  for (const e of edits) out = out.slice(0, e.start) + e.with + out.slice(e.end);
  return out;
}

function stringValue(node: Node | undefined): string | undefined {
  if (!node) return undefined;
  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) return node.getLiteralValue();
  if (Node.isJsxExpression(node)) return stringValue(node.getExpression());
  return undefined;
}

/** Remove the import of `name` from a module ending in `from`; it must be the import's only binding. */
function importRemoval(sf: SourceFile, text: string, name: string, from: string): Edit {
  const decls = sf.getImportDeclarations().filter((d) => d.getModuleSpecifierValue().endsWith(from));
  if (decls.length !== 1) throw new Error(`${decls.length} imports from ${from}`);
  const d = decls[0];
  const bindings = [d.getDefaultImport()?.getText(), ...d.getNamedImports().map((n) => n.getText())].filter(Boolean);
  if (bindings.length !== 1 || bindings[0] !== name || d.getNamespaceImport()) {
    throw new Error(`import from ${from} binds ${bindings.join(", ")}, expected only ${name}`);
  }
  return lineRange(text, d.getStart(), d.getEnd());
}

/** Checks the old page.tsx against the registry entry. */
function checkPage(sf: SourceFile, href: string) {
  const c = findCalculator(href)!;
  const category = getCategory(c.category);
  const statements = sf.getStatements();
  const imports = sf.getImportDeclarations().map((d) => `${d.getModuleSpecifierValue()} {${d.getImportClause()?.getText() ?? ""}}`);
  if (statements.length !== 6 || imports.join("|") !== OLD_PAGE_IMPORTS.join("|")) throw new Error("page.tsx: unexpected statements or imports");

  const meta = sf.getVariableDeclarationOrThrow("metadata").getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
  const prop = (name: string) => meta.getPropertyOrThrow(name).asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializerOrThrow();
  const canonical = stringValue(prop("alternates").asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
    .getPropertyOrThrow("canonical").asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializer());
  const title = stringValue(prop("title"));
  const description = stringValue(prop("description"));
  if (meta.getProperties().length !== 3) throw new Error("page.tsx: metadata has extra fields");
  if (canonical !== `${SITE_URL}${href}`) throw new Error(`page.tsx: canonical ${canonical}`);
  if (title !== c.title) throw new Error("page.tsx: title differs from the registry");
  if (description !== c.description) throw new Error("page.tsx: description differs from the registry");

  const call = sf.getVariableDeclarationOrThrow("jsonLd").getInitializerIfKindOrThrow(SyntaxKind.CallExpression);
  const [a0, a1, a2, a3] = call.getArguments();
  if (call.getExpression().getText() !== "generateCalculatorJsonLd" || call.getArguments().length !== 4) {
    throw new Error("page.tsx: unexpected JSON-LD call");
  }
  if (stringValue(a0) !== title || stringValue(a1) !== description || stringValue(a2) !== canonical) {
    throw new Error("page.tsx: JSON-LD arguments differ from metadata");
  }
  const options = a3.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
  const label = stringValue(options.getPropertyOrThrow("category").asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializer());
  if (options.getProperties().length !== 1 || (label !== category.label && label !== category.label.replace("-", " "))) {
    throw new Error(`page.tsx: JSON-LD options ${options.getText()}`);
  }

  const page = sf.getFunctionOrThrow("Page");
  if (!page.isDefaultExport() || page.getBodyOrThrow().getText().replace(/\s+/g, " ") !== OLD_PAGE_BODY) {
    throw new Error("page.tsx: unexpected default export");
  }
}

/** Unwraps the shell in page-client.tsx; returns the new text and the shell's maxWidthClassName. */
function convertClient(sf: SourceFile, text: string, href: string) {
  const c = findCalculator(href)!;
  const category = getCategory(c.category);
  const shells = sf.getDescendantsOfKind(SyntaxKind.JsxElement).filter((e) => e.getOpeningElement().getTagNameNode().getText() === "CalculatorShell");
  const selfClosing = sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).filter((e) => e.getTagNameNode().getText() === "CalculatorShell");
  if (shells.length !== 1 || selfClosing.length > 0) throw new Error(`page-client.tsx: ${shells.length} CalculatorShell elements`);
  const shell = shells[0];
  const opening = shell.getOpeningElement();

  const attrs = new Map<string, string>();
  for (const a of opening.getAttributes()) {
    if (!Node.isJsxAttribute(a)) throw new Error("page-client.tsx: spread attribute on CalculatorShell");
    const name = (a as JsxAttribute).getNameNode().getText();
    const value = stringValue(a.getInitializer());
    if (!SHELL_ATTRS.has(name) || value === undefined) throw new Error(`page-client.tsx: shell attribute ${a.getText().slice(0, 60)}`);
    attrs.set(name, value);
  }
  if (attrs.get("backHref") !== `/${c.category}`) throw new Error(`page-client.tsx: backHref ${attrs.get("backHref")}`);
  const backLabel = attrs.get("backLabel");
  if (backLabel !== category.label && backLabel !== category.label.replace("-", " ")) throw new Error(`page-client.tsx: backLabel ${backLabel}`);
  const title = attrs.get("title");
  const description = attrs.get("description");
  if (title === undefined) {
    if (description !== undefined) throw new Error("page-client.tsx: description without title");
  } else {
    if (title !== displayName(c)) throw new Error("page-client.tsx: shell title differs from the registry");
    if (description !== (c.lede ?? c.description)) throw new Error("page-client.tsx: shell description differs from the registry");
  }
  const maxWidth = attrs.get("maxWidthClassName");
  if (maxWidth !== undefined && !/^max-w-\w+$/.test(maxWidth)) throw new Error(`page-client.tsx: maxWidthClassName ${maxWidth}`);

  const edits: Edit[] = [
    { start: opening.getStart(), end: opening.getEnd(), with: "<>" },
    { start: shell.getClosingElement().getStart(), end: shell.getClosingElement().getEnd(), with: "</>" },
    importRemoval(sf, text, "CalculatorShell", "components/calculator-shell"),
  ];

  const related = sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).filter((e) => e.getTagNameNode().getText() === "RelatedCalculatorLinks");
  if (related.length > 1) throw new Error("page-client.tsx: several RelatedCalculatorLinks");
  if (related.length === 1) {
    const r = related[0];
    if (r.getParent() !== shell) throw new Error("page-client.tsx: RelatedCalculatorLinks is not a child of the shell");
    if (r.getAttributes().map((a) => a.getText()).join(" ") !== RELATED_ATTRS) throw new Error(`page-client.tsx: ${r.getText()}`);
    const removal = lineRange(text, r.getStart(), r.getEnd());
    // Also the blank line that separated it from the content above.
    const blankAbove = /\n[ \t]*\r?\n$/.exec(text.slice(0, removal.start));
    if (removal.start !== r.getStart() && blankAbove) removal.start -= blankAbove[0].length - 1;
    edits.push(removal);
    edits.push(importRemoval(sf, text, "RelatedCalculatorLinks", "components/related-calculator-links"));
    edits.push(importRemoval(sf, text, "getRelatedCalculators", "lib/related-calculators"));
    const decl = sf.getVariableDeclarationOrThrow("currentHref");
    const uses = sf.getDescendantsOfKind(SyntaxKind.Identifier)
      .filter((id) => id.getText() === "currentHref" && !Node.isJsxAttribute(id.getParent())).length;
    if (stringValue(decl.getInitializer()) !== href) throw new Error(`page-client.tsx: currentHref ${decl.getInitializer()?.getText()}`);
    const stmt = decl.getVariableStatementOrThrow();
    // The declaration and the two uses in the removed element.
    if (uses === 3 && stmt.getDeclarations().length === 1 && stmt.getParent() === sf) {
      edits.push(lineRange(text, stmt.getStart(), stmt.getEnd()));
    }
  }

  const out = apply(text, edits);
  if (syntaxErrors(out, sf.getFilePath()) > 0) throw new Error("page-client.tsx: output has syntax errors");
  const left = /\b(CalculatorShell|RelatedCalculatorLinks|getRelatedCalculators)\b/.exec(out);
  if (left) throw new Error(`page-client.tsx: ${left[1]} still referenced`);
  if (!/^\s*["']use client["']/.test(out)) throw new Error("page-client.tsx: lost \"use client\"");
  return { out, maxWidth, untitled: title === undefined, related: related.length === 1 };
}

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  skipFileDependencyResolution: true,
  compilerOptions: { jsx: ts.JsxEmit.Preserve, allowJs: false, noLib: true },
});
const changed: string[] = [];
const skipped: { dir: string; reason: string }[] = [];
const untitled: string[] = [];
const widths = new Map<string, number>();
let unchanged = 0;
let relatedRemoved = 0;

for (const dir of dirs) {
  const [, , category, slug] = dir.split("/");
  const href = `/${category}/${slug}`;
  const pageFile = `${dir}/page.tsx`;
  const clientFile = `${dir}/page-client.tsx`;
  const created: SourceFile[] = [];
  try {
    if (!findCalculator(href)) throw new Error("not in the registry");
    const pageText = readFileSync(pageFile, "utf8");
    const clientText = readFileSync(clientFile, "utf8");
    const eol = pageText.includes("\r\n") ? "\r\n" : "\n";
    if (pageText.includes("calculatorMetadata(href)")) {
      if (/\bCalculatorShell\b/.test(clientText)) throw new Error("page.tsx converted but page-client.tsx still has the shell");
      unchanged++;
      continue;
    }

    const pageSf = project.createSourceFile(`${dir}/page.tsx`, pageText, { overwrite: true });
    const clientSf = project.createSourceFile(`${dir}/page-client.tsx`, clientText, { overwrite: true });
    created.push(pageSf, clientSf);
    checkPage(pageSf, href);
    const client = convertClient(clientSf, clientText, href);
    const pageOut = TEMPLATE(href, client.maxWidth).replace(/\n/g, eol);
    if (syntaxErrors(pageOut, pageFile) > 0) throw new Error("page.tsx: template has syntax errors");

    if (client.untitled) untitled.push(href);
    if (client.related) relatedRemoved++;
    if (client.maxWidth) widths.set(client.maxWidth, (widths.get(client.maxWidth) ?? 0) + 1);
    changed.push(dir);
    if (write) {
      writeFileSync(pageFile, pageOut);
      writeFileSync(clientFile, client.out);
    }
  } catch (err) {
    skipped.push({ dir, reason: (err as Error).message });
  } finally {
    for (const sf of created) project.removeSourceFile(sf);
  }
}

console.log(`${write ? "WRITE" : "DRY RUN"}: changed ${changed.length} pages (${changed.length * 2} files) / skipped ${skipped.length} / unchanged ${unchanged}`);
console.log(`related links removed: ${relatedRemoved}; widths moved: ${[...widths].map(([w, n]) => `${w} ${n}`).join(", ") || "none"}`);
console.log(`untitled (own <h1>, fix by hand): ${untitled.length}${untitled.length ? "\n  " + untitled.join("\n  ") : ""}`);
for (const s of skipped) console.log(`  skip ${s.dir}: ${s.reason}`);
