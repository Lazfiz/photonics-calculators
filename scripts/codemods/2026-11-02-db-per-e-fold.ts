/**
 * Rename `DB_PER_NEPER` to `DB_PER_E_FOLD` (ROADMAP 6c). The constant is 10 log₁₀ e ≈ 4.343 dB per e-fold of power,
 * which ISO 80000-3 does not call a neper (1 Np = 8.686 dB, a field ratio). Both declarations
 * (`fiber-optics/macro-bending-loss.ts`, `free-space-comms/atmospheric-attenuation.ts`) are renamed through the
 * language service, so every import and use follows.
 *
 * Usage: npx tsx scripts/codemods/2026-11-02-db-per-e-fold.ts [--write]
 */
import { execSync } from "node:child_process";
import { Project, SyntaxKind } from "ts-morph";

const write = process.argv.includes("--write");
const OLD = "DB_PER_NEPER";
const NEW = "DB_PER_E_FOLD";

const files = execSync(`git grep -l ${OLD} -- src tests`, { encoding: "utf8" }).trim().split("\n");
const project = new Project({ skipAddingFilesFromTsConfig: true, skipFileDependencyResolution: true });
project.addSourceFilesAtPaths(files);

const declarations = project.getSourceFiles().flatMap((sf) =>
  sf.getVariableDeclarations().filter((d) => d.getName() === OLD && d.isExported()));
console.log(`${declarations.length} declarations, ${files.length} files`);
for (const d of declarations) d.getNameNode().asKindOrThrow(SyntaxKind.Identifier).rename(NEW);

let left = 0;
for (const sf of project.getSourceFiles()) {
  const n = sf.getDescendantsOfKind(SyntaxKind.Identifier).filter((id) => id.getText() === OLD).length;
  if (n) { left += n; console.log(`still ${OLD}: ${sf.getFilePath()} (${n})`); }
}
const changed = project.getSourceFiles().filter((sf) => !sf.isSaved());
console.log(`${changed.length} files changed, ${left} identifiers left`);
if (write) project.saveSync();
else console.log("dry run; pass --write to save");
