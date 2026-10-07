/**
 * Replace the 55 placeholder descriptions ("Interactive X calculator for photonics and optical
 * engineering.") and the slug-derived titles ("Ber", "Wdm Coupler") in page `metadata` (Phase 1).
 *
 * Values come from `2026-10-07-placeholder-descriptions.json`, written by reading each page's
 * inputs and results. A page is edited only while its description is still the placeholder; a
 * page that already carries the new values is unchanged. Run `2026-10-07-rebuild-json-ld.ts`
 * afterwards so the JSON-LD picks up the new metadata.
 *
 * Usage: npx tsx scripts/codemods/2026-10-07-placeholder-descriptions.ts [--write] [keys...]
 * Keys are `<category>/<slug>`; default is every key in the JSON file. Default is a dry run.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { Node, Project, ts, type ObjectLiteralExpression, type StringLiteral, type NoSubstitutionTemplateLiteral } from "ts-morph";

const PLACEHOLDER = /^Interactive .+ calculator for photonics and optical engineering\.$/;
const MAP: Record<string, { title?: string; description: string }> = JSON.parse(
  readFileSync(new URL("./2026-10-07-placeholder-descriptions.json", import.meta.url), "utf8"),
);

const args = process.argv.slice(2);
const write = args.includes("--write");
const explicit = args.filter((a) => !a.startsWith("--"));
const keys = explicit.length > 0 ? explicit : Object.keys(MAP);

/** Single-quoted literal unless the value needs escaping or contains a single quote. */
function lit(s: string): string {
  const plain = JSON.stringify(s) === `"${s}"`;
  return plain && !s.includes("'") ? `'${s}'` : JSON.stringify(s);
}

type Str = StringLiteral | NoSubstitutionTemplateLiteral;
function stringInit(obj: ObjectLiteralExpression, name: string): Str | undefined {
  const prop = obj.getProperty(name);
  if (!prop || !Node.isPropertyAssignment(prop)) return undefined;
  const init = prop.getInitializer();
  return Node.isStringLiteral(init) || Node.isNoSubstitutionTemplateLiteral(init) ? init : undefined;
}

function metadataOf(project: Project, path: string, text: string): ObjectLiteralExpression | undefined {
  const sf = project.createSourceFile(path, text, { overwrite: true });
  const init = sf.getVariableDeclaration("metadata")?.getInitializer();
  return init && Node.isObjectLiteralExpression(init) ? init : undefined;
}

const project = new Project({ skipAddingFilesFromTsConfig: true, skipFileDependencyResolution: true });
const changed: string[] = [];
const unchanged: string[] = [];
const skipped: { key: string; reason: string }[] = [];
let titles = 0;

for (const key of keys) {
  const skip = (reason: string) => skipped.push({ key, reason });
  const entry = MAP[key];
  const file = `src/app/${key}/page.tsx`;
  if (!entry) { skip("no entry in the JSON file"); continue; }
  if (!existsSync(file)) { skip(`${file} does not exist`); continue; }

  const text = readFileSync(file, "utf8");
  const meta = metadataOf(project, `/virtual/${file}`, text);
  if (!meta) { skip("metadata is not an object literal"); continue; }
  const desc = stringInit(meta, "description");
  const title = stringInit(meta, "title");
  if (!desc || !title) { skip("metadata title/description is not a plain string"); continue; }

  const descNow = desc.getLiteralValue();
  if (descNow === entry.description && (!entry.title || title.getLiteralValue() === entry.title)) {
    unchanged.push(file);
    continue;
  }
  if (!PLACEHOLDER.test(descNow)) { skip(`description is not the placeholder: '${descNow.slice(0, 60)}'`); continue; }

  // Edit from the end of the file backwards so earlier positions stay valid.
  const edits: { start: number; end: number; text: string }[] = [
    { start: desc.getStart(), end: desc.getEnd(), text: lit(entry.description) },
  ];
  if (entry.title && entry.title !== title.getLiteralValue()) {
    edits.push({ start: title.getStart(), end: title.getEnd(), text: lit(entry.title) });
  }
  edits.sort((a, b) => b.start - a.start);
  let out = text;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);

  // Verify: parses, and the metadata now holds exactly the new values.
  const diag = ts.transpileModule(out, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext },
  }).diagnostics ?? [];
  const check = metadataOf(project, `/virtual/check/${file}`, out);
  const gotDesc = check && stringInit(check, "description")?.getLiteralValue();
  const gotTitle = check && stringInit(check, "title")?.getLiteralValue();
  if (diag.length > 0 || gotDesc !== entry.description ||
      gotTitle !== (entry.title ?? title.getLiteralValue())) {
    skip("verification of the edited metadata failed");
    continue;
  }

  if (edits.length > 1) titles++;
  changed.push(file);
  if (write) writeFileSync(file, out);
}

console.log(`${write ? "WRITE" : "DRY RUN"}: ${keys.length} pages`);
console.log(`changed ${changed.length} (with new title ${titles}), unchanged ${unchanged.length}, skipped ${skipped.length}`);
for (const s of skipped) console.log(`  skipped ${s.key}: ${s.reason}`);
