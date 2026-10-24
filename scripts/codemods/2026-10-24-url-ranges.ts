/**
 * Give numeric `useURLState` calls the min/max of the field that edits them (ROADMAP Findings 4f).
 *
 * `useURLState` only rejected non-finite values, so a crafted link (`?na=0`) reached the physics even
 * where the field would refuse 0. The hook now takes `{ min, max }` and clamps the URL value.
 *
 * A binding `const [x, setX] = useURLState("k", <number>)` is changed when
 *   - `x` reaches code outside `clamp(x, …)` / `clampToRange(x, …)` and hook dependency arrays (a
 *     binding the page already clamps is left alone), and
 *   - every `value={x}` in the same component is on a `ValidatedNumberInput` or `InputSlider`, all
 *     with the same min/max, each a numeric literal, a module-level `const NAME = <literal>` or absent
 *     (at least one present).
 * The call gets a third argument `{ min: …, max: … }` with the bounds as written. A call that already
 * has a third argument counts as done, so a second run changes nothing. Bindings that don't fit are
 * counted by reason; CODEMOD_LIST=1 lists them (with page and key), plus defaults outside their range
 * (CODEMOD_ALL=1 lists the changes too).
 *
 * Usage: npx tsx scripts/codemods/2026-10-24-url-ranges.ts [--write] [file-filter-substring …]
 */
import { Node, Project, SyntaxKind, type SourceFile } from "ts-morph";

const write = process.argv.includes("--write");
const filters = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const list = process.env.CODEMOD_LIST === "1";

const project = new Project({ skipAddingFilesFromTsConfig: true, skipFileDependencyResolution: true });
project.addSourceFilesAtPaths("src/app/**/page-client.tsx");

const INPUTS = new Set(["ValidatedNumberInput", "InputSlider"]);
const CLAMPS = /^(clamp|clampToRange)$/;
const HOOKS = /^(useMemo|useCallback|useEffect|useLayoutEffect)$/;
const NUMBER = /^-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

const counts: Record<string, number> = {};
const listed: Record<string, string[]> = {};
const note = (kind: string, what: string) => {
  counts[kind] = (counts[kind] ?? 0) + 1;
  (listed[kind] ??= []).push(what);
};

/** Value of a bound: a numeric literal, or a module-level `const NAME = <literal>`; else undefined. */
function boundValue(sf: SourceFile, text: string): number | undefined {
  const t = text.replace(/_/g, "");
  if (NUMBER.test(t)) return Number(t);
  if (!/^[A-Za-z_$][\w$]*$/.test(text)) return undefined;
  const decl = sf.getVariableDeclaration(text);
  if (!decl || decl.getVariableStatement()?.getParent() !== sf) return undefined;
  const init = decl.getInitializer()?.getText().replace(/_/g, "");
  return init !== undefined && NUMBER.test(init) ? Number(init) : undefined;
}

const changedFiles = new Set<string>();
for (const sf of project.getSourceFiles()) {
  const page = sf.getFilePath().split("/src/app/")[1].replace("/page-client.tsx", "");
  if (filters.length && !filters.some((f) => page.includes(f))) continue;
  const edits: { pos: number; text: string }[] = [];

  for (const call of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    if (call.getExpression().getText() !== "useURLState") continue;
    const args = call.getArguments();
    if (args.length < 2 || Node.isStringLiteral(args[1]) || Node.isNoSubstitutionTemplateLiteral(args[1])) continue;
    const key = args[0].getText();
    const where = `${page} ${key}`;
    if (args.length >= 3) { note("done", where); continue; }

    const pat = call.getParentIfKind(SyntaxKind.VariableDeclaration)?.getNameNode();
    const first = pat && Node.isArrayBindingPattern(pat) ? pat.getElements()[0] : undefined;
    if (!first || !Node.isBindingElement(first)) { note("skip: not `const [x, setX] =`", where); continue; }
    const name = first.getName();
    const component = call.getFirstAncestor((a) => Node.isFunctionDeclaration(a) || Node.isArrowFunction(a) || Node.isFunctionExpression(a));
    if (!component) { note("skip: outside a component", where); continue; }

    let raw = 0;
    const ranges = new Set<string>();
    let bounds: [string | undefined, string | undefined] | undefined;
    for (const id of component.getDescendantsOfKind(SyntaxKind.Identifier)) {
      if (id.getText() !== name || id === first.getNameNode()) continue;
      const p = id.getParent();
      if (!p) continue;
      if ((Node.isPropertyAccessExpression(p) || Node.isPropertyAssignment(p)) && p.getNameNode() === id) continue;
      if (Node.isBindingElement(p) || Node.isParameterDeclaration(p) || Node.isVariableDeclaration(p)) continue;
      if (Node.isCallExpression(p) && CLAMPS.test(p.getExpression().getText()) && p.getArguments()[0] === id) continue;
      const pp = p.getParent();
      if (Node.isArrayLiteralExpression(p) && pp && Node.isCallExpression(pp) && HOOKS.test(pp.getExpression().getText())) continue;
      if (Node.isJsxExpression(p) && pp && Node.isJsxAttribute(pp) && pp.getNameNode().getText() === "value") {
        const elem = pp.getParent().getParent();
        if (Node.isJsxSelfClosingElement(elem) || Node.isJsxOpeningElement(elem)) {
          const tag = elem.getTagNameNode().getText();
          if (!INPUTS.has(tag)) { ranges.add(`<${tag}>`); continue; }
          const attr = (a: string) => {
            const at = elem.getAttribute(a);
            if (!at) return undefined;
            if (!Node.isJsxAttribute(at)) return "{...}";
            return at.getInitializer()?.getText().replace(/^\{\s*|\s*\}$/g, "") ?? "true";
          };
          bounds = [attr("min"), attr("max")];
          ranges.add(bounds.join("|"));
          continue;
        }
      }
      raw++;
    }

    if (raw === 0) { note("skip: page clamps it already", where); continue; }
    if (ranges.size === 0 || !bounds) { note("skip: no field shows it", where); continue; }
    if (ranges.size > 1) { note("skip: several fields or another tag", `${where} ${[...ranges].join(" / ")}`); continue; }
    const [lo, hi] = bounds;
    const loV = lo === undefined ? undefined : boundValue(sf, lo);
    const hiV = hi === undefined ? undefined : boundValue(sf, hi);
    if ((lo !== undefined && loV === undefined) || (hi !== undefined && hiV === undefined) || (lo === undefined && hi === undefined)) {
      note("skip: bounds not constant", `${where} ${lo}|${hi}`);
      continue;
    }
    const def = Number(args[1].getText().replace(/_/g, ""));
    if (Number.isFinite(def) && ((loV !== undefined && def < loV) || (hiV !== undefined && def > hiV))) {
      note("warn: default outside range", `${where} ${def} ∉ [${lo}, ${hi}]`);
    }
    const parts = [lo !== undefined && `min: ${lo}`, hi !== undefined && `max: ${hi}`].filter(Boolean);
    edits.push({ pos: args[1].getEnd(), text: `, { ${parts.join(", ")} }` });
    note("change", where);
  }

  if (edits.length === 0) continue;
  changedFiles.add(page);
  if (write) {
    // Insert after the default argument, last edit first so positions stay valid.
    for (const e of edits.sort((a, b) => b.pos - a.pos)) sf.insertText(e.pos, e.text);
    sf.saveSync();
  }
}

console.log(write ? "WRITE" : "DRY RUN", `files changed: ${changedFiles.size}`, counts);
if (list) for (const [k, v] of Object.entries(listed)) if (process.env.CODEMOD_ALL === "1" || (k !== "change" && k !== "done")) console.log(`${k}:\n  ${v.join("\n  ")}`);
