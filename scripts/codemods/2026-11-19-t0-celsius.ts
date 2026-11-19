/**
 * Replace the Celsius-to-kelvin offset 273.15, written as a literal or as a local constant (`KELVIN`, `KELVIN_OFFSET`,
 * `K0`, `K`) in 20 pages, physics modules and schemas, with `T0_CELSIUS` from src/physics/constants.ts (ROADMAP open
 * findings, 11c-9a/9b). Local declarations are renamed through the language service, so their uses and imports
 * follow, then removed; the remaining literals become the identifier (`-273.15` → `-T0_CELSIUS`). Strings, JSX text
 * and comments aren't numeric literals and stay as they are.
 *
 * Usage: npx tsx scripts/codemods/2026-11-19-t0-celsius.ts [--write]
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { Node, Project, SyntaxKind, type SourceFile } from "ts-morph";

const write = process.argv.includes("--write");
const NAME = "T0_CELSIUS";
const VALUE = 273.15;
const constantsFile = path.resolve("src/physics/constants.ts");

const grep = (pattern: string) =>
  execSync(`git grep -l -E "${pattern}" -- src ":!src/physics/constants.ts"`, { encoding: "utf8" }).trim().split("\n");
const files = [...new Set([...grep("273\\.15"), ...grep("\\bKELVIN(_OFFSET)?\\b")])];
const project = new Project({ skipAddingFilesFromTsConfig: true, skipFileDependencyResolution: true });
project.addSourceFilesAtPaths(files);
const isOffset = (n: Node | undefined) => n !== undefined && Node.isNumericLiteral(n) && n.getLiteralValue() === VALUE;

// 1. Local constants: rename every use, then drop the declaration.
const declarations = project.getSourceFiles().flatMap((sf) =>
  sf.getVariableDeclarations().filter((d) => isOffset(d.getInitializer())));
for (const d of declarations) {
  console.log(`declaration ${d.getName()} in ${path.relative(".", d.getSourceFile().getFilePath())}`);
  d.getNameNode().asKindOrThrow(SyntaxKind.Identifier).rename(NAME);
}
for (const d of declarations) d.getVariableStatementOrThrow().remove();

// 2. Bare literals.
let literals = 0;
for (const sf of project.getSourceFiles()) {
  for (const lit of sf.getDescendantsOfKind(SyntaxKind.NumericLiteral).filter(isOffset).reverse()) {
    lit.replaceWithText(NAME);
    literals++;
  }
}

// 3. Imports: T0_CELSIUS comes from constants.ts only.
function constantsSpecifier(sf: SourceFile) {
  const rel = path.relative(path.dirname(sf.getFilePath()), constantsFile).replace(/\\/g, "/").replace(/\.ts$/, "");
  return rel.startsWith(".") ? rel : `./${rel}`;
}
for (const sf of project.getSourceFiles()) {
  for (const imp of sf.getImportDeclarations()) {
    const spec = imp.getNamedImports().find((s) => s.getName() === NAME);
    if (spec && imp.getModuleSpecifierValue() !== constantsSpecifier(sf)) spec.remove();
  }
  const used = sf.getDescendantsOfKind(SyntaxKind.Identifier).some((id) => id.getText() === NAME);
  if (!used) continue;
  const spec = constantsSpecifier(sf);
  const existing = sf.getImportDeclaration((imp) => imp.getModuleSpecifierValue() === spec);
  if (existing) {
    if (!existing.getNamedImports().some((s) => s.getName() === NAME)) existing.addNamedImport(NAME);
  } else {
    const last = sf.getImportDeclarations().at(-1);
    sf.insertImportDeclaration(last ? last.getChildIndex() + 1 : 0, { namedImports: [NAME], moduleSpecifier: spec });
  }
}

let left = 0;
for (const sf of project.getSourceFiles()) {
  const n = sf.getDescendantsOfKind(SyntaxKind.Identifier)
    .filter((id) => ["KELVIN", "KELVIN_OFFSET"].includes(id.getText())).length;
  if (n) { left += n; console.log(`still KELVIN: ${sf.getFilePath()} (${n})`); }
}
const changed = project.getSourceFiles().filter((sf) => !sf.isSaved());
console.log(`${declarations.length} declarations, ${literals} literals, ${changed.length} of ${files.length} files changed, ${left} KELVIN left`);
if (write) project.saveSync();
else console.log("dry run; pass --write to save");
