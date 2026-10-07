/**
 * Rebuild each calculator page's JSON-LD call from its `metadata` (Phase 1).
 *
 * `6929ab07` (2026-04-09) rewrote 427 `page.tsx` files with a regex and left source code inside
 * template literals: the call still parses, but the JSON-LD name reads
 * "Airy Disk Size Calculator',\n description: ...". This codemod replaces the whole
 * `const jsonLd = generateCalculatorJsonLd(...)` statement with one built from
 * `metadata.title`, `metadata.description`, `metadata.alternates.canonical` and the folder's
 * category. It is idempotent: a page whose call already matches is left unchanged.
 *
 * Usage: npx tsx scripts/codemods/2026-10-07-rebuild-json-ld.ts [--write] [files...]
 * Default is a dry run over `src/app/<category>/<slug>/page.tsx`.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { Node, Project, SyntaxKind, ts, type ObjectLiteralExpression } from "ts-morph";

const SITE = "https://photonics-calculators.vercel.app";
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

const args = process.argv.slice(2);
const write = args.includes("--write");
const explicit = args.filter((a) => !a.startsWith("--"));
const files =
  explicit.length > 0
    ? explicit.map((f) => f.replace(/\\/g, "/"))
    : execFileSync("git", ["ls-files", "src/app/*/*/page.tsx"], { encoding: "utf8" })
        .split("\n")
        .filter(Boolean);

/** Single-quoted literal unless the value contains a single quote. */
function lit(s: string): string {
  const plain = JSON.stringify(s) === `"${s}"`;
  return plain && !s.includes("'") ? `'${s}'` : JSON.stringify(s);
}

function stringProp(obj: ObjectLiteralExpression, name: string): string | undefined {
  const prop = obj.getProperty(name);
  if (!prop || !Node.isPropertyAssignment(prop)) return undefined;
  const init = prop.getInitializer();
  if (Node.isStringLiteral(init) || Node.isNoSubstitutionTemplateLiteral(init)) {
    return init.getLiteralValue();
  }
  return undefined;
}

function syntaxErrors(text: string, fileName: string): number {
  const out = ts.transpileModule(text, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext },
  });
  return out.diagnostics?.length ?? 0;
}

const project = new Project({ skipAddingFilesFromTsConfig: true, skipFileDependencyResolution: true });
const changed: string[] = [];
const unchanged: string[] = [];
const noJsonLd: string[] = [];
const skipped: { file: string; reason: string }[] = [];
let corrupted = 0;
let mismatched = 0;
let reformatted = 0;

for (const file of files) {
  const skip = (reason: string) => skipped.push({ file, reason });
  const m = /^src\/app\/([^/]+)\/([^/]+)\/page\.tsx$/.exec(file);
  if (!m) { skip("not src/app/<category>/<slug>/page.tsx"); continue; }
  const [, cat, slug] = m;
  const category = CATEGORY[cat];
  if (!category) { skip(`unknown category folder '${cat}'`); continue; }

  const text = readFileSync(file, "utf8");
  const sf = project.createSourceFile(`/virtual/${file}`, text, { overwrite: true });

  const calls = sf
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((c) => c.getExpression().getText() === "generateCalculatorJsonLd");
  if (calls.length === 0) { noJsonLd.push(file); continue; }
  if (calls.length > 1) { skip(`${calls.length} generateCalculatorJsonLd calls`); continue; }
  const call = calls[0];

  const decl = call.getParentIfKind(SyntaxKind.VariableDeclaration);
  const stmt = decl?.getVariableStatement();
  if (!decl || decl.getName() !== "jsonLd" || !stmt || stmt.getDeclarations().length !== 1 ||
      stmt.getParent() !== sf) {
    skip("call is not `const jsonLd = generateCalculatorJsonLd(...)` at top level");
    continue;
  }

  const meta = sf.getVariableDeclaration("metadata")?.getInitializer();
  if (!meta || !Node.isObjectLiteralExpression(meta)) { skip("metadata is not an object literal"); continue; }
  const title = stringProp(meta, "title");
  const description = stringProp(meta, "description");
  const alternates = meta.getProperty("alternates");
  const altInit = alternates && Node.isPropertyAssignment(alternates) ? alternates.getInitializer() : undefined;
  const canonical = altInit && Node.isObjectLiteralExpression(altInit) ? stringProp(altInit, "canonical") : undefined;
  if (title === undefined || description === undefined || canonical === undefined) {
    skip("metadata title/description/alternates.canonical is not a plain string");
    continue;
  }
  if (canonical !== `${SITE}/${cat}/${slug}`) { skip(`canonical '${canonical}' does not match the path`); continue; }
  if ([title, description].some((s) => /[\n`]|generateCalculatorJsonLd|description:|category:/.test(s))) {
    skip("metadata title/description looks corrupted");
    continue;
  }
  const usesScript = sf
    .getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    .some((e) => e.getTagNameNode().getText() === "JsonLdScript");
  if (!usesScript) { skip("jsonLd is not rendered with <JsonLdScript>"); continue; }

  // Classify the existing call for the report.
  const oldArgs = call.getArguments();
  const isCorrupt = oldArgs.some((a) => Node.isTemplateExpression(a) ||
    (Node.isNoSubstitutionTemplateLiteral(a) && /\n/.test(a.getLiteralValue())));
  const oldStrings = oldArgs.slice(0, 3).map((a) =>
    Node.isStringLiteral(a) || Node.isNoSubstitutionTemplateLiteral(a) ? a.getLiteralValue() : undefined);
  const oldOptions = oldArgs[3];
  if (oldArgs.length > 4 || (oldOptions && !Node.isObjectLiteralExpression(oldOptions))) {
    skip("unexpected generateCalculatorJsonLd arguments");
    continue;
  }
  if (oldOptions && Node.isObjectLiteralExpression(oldOptions) &&
      oldOptions.getProperties().some((p) => !Node.isPropertyAssignment(p) || p.getName() !== "category")) {
    skip("options carry more than `category`; refusing to drop them");
    continue;
  }

  const newStmt =
    `const jsonLd = generateCalculatorJsonLd(\n` +
    `  ${lit(title)},\n` +
    `  ${lit(description)},\n` +
    `  ${lit(canonical)},\n` +
    `  { category: ${lit(category)} }\n` +
    `);`;

  // Replace from the end of the previous statement to the start of the next one, so the
  // statement sits between blank lines. Only whitespace may live in that trivia.
  const statements = sf.getStatements();
  const idx = statements.indexOf(stmt);
  const prev = statements[idx - 1];
  const next = statements[idx + 1];
  if (!prev || !next) { skip("jsonLd statement is first or last in the file"); continue; }
  const a = prev.getEnd();
  const b = next.getStart();
  if (text.slice(a, stmt.getStart()).trim() !== "" || text.slice(stmt.getEnd(), b).trim() !== "") {
    skip("comments around the jsonLd statement");
    continue;
  }
  const out = text.slice(0, a) + "\n\n" + newStmt + "\n\n" + text.slice(b);
  if (out === text) { unchanged.push(file); continue; }

  // Verify the output before writing: it parses, and the call now carries exactly the metadata.
  if (syntaxErrors(out, file) > 0) { skip("output has syntax errors"); continue; }
  const check = project.createSourceFile(`/virtual/check/${file}`, out, { overwrite: true });
  const newCall = check
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((c) => c.getExpression().getText() === "generateCalculatorJsonLd");
  const got = newCall.length === 1 ? newCall[0].getArguments() : [];
  const gotStrings = got.slice(0, 3).map((n) => (Node.isStringLiteral(n) ? n.getLiteralValue() : undefined));
  if (gotStrings.join("\u0000") !== [title, description, canonical].join("\u0000")) {
    skip("verification of the rebuilt call failed");
    continue;
  }

  if (isCorrupt) corrupted++;
  else if (oldStrings.join("\u0000") !== [title, description, canonical].join("\u0000")) mismatched++;
  else reformatted++;
  changed.push(file);
  if (write) writeFileSync(file, out);
}

console.log(`${write ? "WRITE" : "DRY RUN"}: ${files.length} files`);
console.log(`changed ${changed.length} (corrupted ${corrupted}, clean-but-mismatched ${mismatched}, whitespace-only ${reformatted})`);
console.log(`unchanged ${unchanged.length}, no JSON-LD call ${noJsonLd.length}, skipped ${skipped.length}`);
for (const f of noJsonLd) console.log(`  no-jsonld ${f}`);
for (const s of skipped) console.log(`  skipped ${s.file}: ${s.reason}`);
if (process.env.CODEMOD_LIST) for (const f of changed) console.log(`  changed ${f}`);
