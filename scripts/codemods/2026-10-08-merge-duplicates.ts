/**
 * Merge duplicate calculators (ROADMAP Phase 2).
 *
 * Input: `src/registry/redirects.json`, `{ "<removed href>": "<kept href>" }`. next.config.js serves it
 * as permanent redirects. For each removed href:
 *   - its entry leaves `src/registry/calculators/<category>.ts`. Its title (without " Calculator") joins
 *     the kept entry's `keywords`, unless the kept title or keywords already contain it, so search for
 *     the old name still finds the page;
 *   - `related` links to it point at the kept page instead, or go if the entry is the kept page itself
 *     or already links there (an emptied `related` goes too);
 *   - with --write, `git rm -r src/app/<category>/<slug>`.
 * Hrefs elsewhere (the laser-safety index, suite links, page text) are fixed by hand;
 * tests/redirects.test.ts finds any that are left.
 *
 * A redirect whose target isn't registered is skipped and reported. Idempotent: an entry that is
 * already gone counts as unchanged.
 *
 * Usage: npx tsx scripts/codemods/2026-10-08-merge-duplicates.ts [--write]
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import {
  IndentationText,
  Node,
  Project,
  QuoteKind,
  SyntaxKind,
  type ArrayLiteralExpression,
  type ObjectLiteralExpression,
  type PropertyAssignment,
} from "ts-morph";

const write = process.argv.includes("--write");
const redirects: Record<string, string> = JSON.parse(readFileSync("src/registry/redirects.json", "utf8"));

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  manipulationSettings: { indentationText: IndentationText.TwoSpaces, quoteKind: QuoteKind.Double },
});
const files = project.addSourceFilesAtPaths("src/registry/calculators/*.ts");

function stringProp(obj: ObjectLiteralExpression, name: string): string | undefined {
  const init = obj.getProperty(name)?.asKind(SyntaxKind.PropertyAssignment)?.getInitializer();
  return init && Node.isStringLiteral(init) ? init.getLiteralValue() : undefined;
}

// Every entry by href.
const entries = new Map<string, ObjectLiteralExpression>();
for (const file of files) {
  const category = file.getBaseNameWithoutExtension();
  const [declaration] = file.getVariableStatements().flatMap((s) => s.getDeclarations());
  const array = declaration.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);
  for (const element of array.getElements()) {
    const obj = element.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    entries.set(`/${category}/${stringProp(obj, "slug")}`, obj);
  }
}

const skipped: string[] = [];
const removed: string[] = [];
const keywordsAdded: string[] = [];
const inserted: PropertyAssignment[] = [];
let unchanged = 0;
let retargeted = 0;
let dropped = 0;

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

for (const [source, destination] of Object.entries(redirects)) {
  const kept = entries.get(destination);
  if (!kept) {
    skipped.push(`${source} → ${destination}: target not registered`);
    continue;
  }
  const old = entries.get(source);
  if (!old) {
    unchanged++;
    continue;
  }
  // The old name as a search keyword of the kept page.
  const oldName = stringProp(old, "title")!.replace(/ Calculator$/, "");
  const keywords = kept.getProperty("keywords")?.asKindOrThrow(SyntaxKind.PropertyAssignment);
  const keywordArray = keywords?.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);
  const known = [stringProp(kept, "title")!, ...(keywordArray?.getElements().map((e) => e.getText().slice(1, -1)) ?? [])];
  if (!known.some((k) => normalize(k).includes(normalize(oldName)))) {
    if (keywordArray) keywordArray.addElement(JSON.stringify(oldName));
    else {
      // After the text fields, where the other entries have it.
      const properties = kept.getProperties();
      const index = Math.max(
        ...["slug", "title", "description", "heading", "lede"].map((name) => properties.findIndex((p) => p === kept.getProperty(name))),
      );
      inserted.push(kept.insertPropertyAssignment(index + 1, { name: "keywords", initializer: `[${JSON.stringify(oldName)}]` }));
    }
    keywordsAdded.push(`${destination} += "${oldName}"`);
  }
  old.getParentIfKindOrThrow(SyntaxKind.ArrayLiteralExpression).removeElement(old);
  entries.delete(source);
  removed.push(source);
}

// Related links to removed pages.
for (const [href, obj] of entries) {
  const related = obj.getProperty("related")?.asKindOrThrow(SyntaxKind.PropertyAssignment);
  if (!related) continue;
  const array: ArrayLiteralExpression = related.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);
  const linkHref = (e: Node) => stringProp(e.asKindOrThrow(SyntaxKind.ObjectLiteralExpression), "href")!;
  for (const element of array.getElements()) {
    const target = redirects[linkHref(element)];
    if (!target) continue;
    const others = array.getElements().filter((e) => e !== element).map(linkHref);
    if (target === href || others.includes(target)) {
      array.removeElement(element);
      dropped++;
    } else {
      element
        .asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
        .getPropertyOrThrow("href")
        .asKindOrThrow(SyntaxKind.PropertyAssignment)
        .setInitializer(JSON.stringify(target));
      retargeted++;
    }
  }
  if (array.getElements().length === 0) related.remove();
}

// ts-morph leaves an inserted last property without the trailing comma the registry uses. Last step:
// insertText forgets the nodes navigated so far.
const commas = inserted
  .filter((p) => p.getNextSiblingIfKind(SyntaxKind.CommaToken) === undefined)
  .map((p) => ({ file: p.getSourceFile(), pos: p.getEnd() }))
  .sort((a, b) => b.pos - a.pos);
for (const { file, pos } of commas) file.insertText(pos, ",");

const dirs = removed.map((href) => `src/app${href}`).filter((dir) => existsSync(dir));
if (write) {
  project.saveSync();
  for (const dir of dirs) execFileSync("git", ["rm", "-r", "-q", dir]);
}

console.log(`${write ? "WRITE" : "DRY RUN"}: removed ${removed.length} entries / unchanged ${unchanged} / skipped ${skipped.length}`);
console.log(`page dirs ${write ? "removed" : "to remove"}: ${dirs.length}; related links retargeted ${retargeted}, dropped ${dropped}`);
console.log(`keywords added: ${keywordsAdded.length}${keywordsAdded.length ? "\n  " + keywordsAdded.join("\n  ") : ""}`);
for (const s of skipped) console.log(`  skip ${s}`);
