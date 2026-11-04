/**
 * Mark charts that sit in a page's own card as `bare` (ROADMAP 6i-b, chart double padding).
 *
 * Many pages wrap a <ChartPanel> or <SimpleLineChart> in their own bordered, padded card (often with a heading and a
 * caption). The chart then drew a second border and padding inside it, leaving a 245 px plot at 360 px. `bare` makes
 * the chart leave out its own card.
 *
 * A chart is changed when its nearest enclosing JSX element has a string-literal className with bg-gray-900, a
 * border and a p-N padding. The attribute goes right after the tag name (`<ChartPanel bare …`). Charts reached
 * through an expression ({cond && …}, .map) are changed too and listed for review. A card whose className isn't a
 * string literal is skipped and reported. Idempotent: a chart that has `bare` already is unchanged.
 *
 * Usage: npx tsx scripts/codemods/2026-11-03-bare-charts.ts [--write] [files…]
 */
import { Node, Project, SyntaxKind, type JsxOpeningElement, type JsxSelfClosingElement } from "ts-morph";

const TAGS = new Set(["ChartPanel", "SimpleLineChart"]);
const write = process.argv.includes("--write");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));

const project = new Project({ tsConfigFilePath: "tsconfig.json", skipAddingFilesFromTsConfig: true });
if (only.length > 0) project.addSourceFilesAtPaths(only);
else project.addSourceFilesAtPaths("src/app/**/*.tsx");

const isCard = (cls: string) => /\bbg-gray-900\b/.test(cls) && /(^|\s)border(\s|$)/.test(cls) && /(^|\s)p-\d+(\s|$)/.test(cls);

let changedFiles = 0, changedCharts = 0, unchanged = 0;
const skipped: string[] = [];
const review: string[] = [];

for (const sf of project.getSourceFiles()) {
  const charts: (JsxOpeningElement | JsxSelfClosingElement)[] = [
    ...sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
    ...sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
  ].filter((e) => TAGS.has(e.getTagNameNode().getText()));
  const inserts: number[] = [];
  for (const opening of charts) {
    const where = `${sf.getFilePath().replace(/.*\/src\/app\//, "")}:${opening.getStartLineNumber()}`;
    const element = Node.isJsxSelfClosingElement(opening) ? opening : opening.getParentOrThrow();
    let parent: Node | undefined = element.getParent();
    let viaExpression = false;
    while (parent && !Node.isJsxElement(parent)) {
      if (Node.isJsxExpression(parent)) viaExpression = true;
      parent = parent.getParent();
    }
    if (!parent || !Node.isJsxElement(parent)) continue;
    const attr = parent.getOpeningElement().getAttribute("className");
    if (!attr || !Node.isJsxAttribute(attr)) continue;
    const init = attr.getInitializer();
    if (!init || !Node.isStringLiteral(init)) {
      if (init && /bg-gray-900/.test(init.getText()) && /\bp-\d/.test(init.getText())) skipped.push(`${where} card className ${init.getText().slice(0, 60)}`);
      continue;
    }
    if (!isCard(init.getLiteralText())) continue;
    if (opening.getAttribute("bare")) { unchanged++; continue; }
    if (viaExpression) review.push(where);
    inserts.push(opening.getTagNameNode().getEnd());
  }
  if (inserts.length === 0) continue;
  changedFiles++;
  changedCharts += inserts.length;
  if (write) {
    for (const pos of inserts.sort((a, b) => b - a)) sf.insertText(pos, " bare");
    sf.saveSync();
  }
}

console.log(`${write ? "wrote" : "dry run"}: changed ${changedCharts} charts in ${changedFiles} files, unchanged ${unchanged}, skipped ${skipped.length}`);
for (const s of skipped) console.log(`  skipped ${s}`);
for (const r of review) console.log(`  review (inside an expression) ${r}`);
