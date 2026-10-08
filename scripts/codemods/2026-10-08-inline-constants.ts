/**
 * Replace inline physical constants with imports from `src/physics/constants.ts` (ROADMAP Phase 2).
 *
 * Pages write fundamental constants as rounded literals (`const c = 3e8;`, `6.626e-34 * 3e8 / λ`,
 * `M * 1.673e-27`). This codemod imports the exact SI / CODATA 2022 values instead:
 *   - A `const X = <literal>;` statement is removed. X is renamed to the exported name when it differs
 *     (`kB` → `k_B`), and dropped from hook dependency arrays (an import is not a dependency).
 *   - Every other literal is replaced by the exported name.
 *   - `4 * Math.PI * 1e-7` (μ₀ before the 2019 SI) becomes `mu_0`, also as the tail of a product.
 *   - `1.673e-27` is the proton mass, but every page that uses it multiplies a molar mass in g/mol,
 *     so it is the atomic mass unit there and maps to `m_u`.
 * Only the spellings in LITERALS match; each use was checked by hand to mean the constant. Unit-scaled
 * forms (1240 eV·nm, 3e5 km/s, 8.617e-5 eV/K) are out of scope: 1240 is also a wavelength in nm.
 *
 * A literal passed to `useState`/`useURLState` (a constant held as state) is skipped and reported, as
 * is a statement that declares something besides constants. After editing, the file is re-parsed and
 * every identifier spelled like an imported constant must resolve to the new import; otherwise the file
 * is left unchanged and reported (a local of that name would shadow it or be shadowed). It is
 * idempotent: a second run finds no literals. CODEMOD_LIST=1 lists every site.
 *
 * Usage: npx tsx scripts/codemods/2026-10-08-inline-constants.ts [--write] [files...]
 * Default is a dry run over `src/**\/*.ts(x)` except constants.ts.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  Node, Project, SyntaxKind, ts,
  type BinaryExpression, type SourceFile, type VariableDeclaration, type VariableStatement,
} from "ts-morph";

/** Export order in constants.ts; imports list names in this order. */
const ORDER = ["c", "h", "q", "k_B", "N_A", "epsilon_0", "mu_0", "m_e", "m_u", "sigma_SB"];
const LITERALS: Record<string, string> = {
  "3e8": "c", "2.998e8": "c", "299792458": "c",
  "6.626e-34": "h",
  "1.6e-19": "q", "1.602e-19": "q", "1.602176634e-19": "q",
  "1.381e-23": "k_B", "1.38e-23": "k_B", "1.380649e-23": "k_B",
  "6.022e23": "N_A",
  "8.854e-12": "epsilon_0",
  "9.109e-31": "m_e",
  "1.673e-27": "m_u", "1.661e-27": "m_u", "1.66054e-27": "m_u",
  "5.67e-8": "sigma_SB",
};
const CONSTANTS = path.resolve("src/physics/constants.ts");
const DEP_HOOKS = new Set(["useMemo", "useCallback", "useEffect", "useLayoutEffect"]);
const STATE_HOOKS = new Set(["useState", "useURLState"]);

const args = process.argv.slice(2);
const write = args.includes("--write");
const list = process.env.CODEMOD_LIST === "1";
const explicit = args.filter((a) => !a.startsWith("--"));
const files = (
  explicit.length > 0
    ? explicit.map((f) => f.replace(/\\/g, "/"))
    : execFileSync("git", ["ls-files", "src/*.ts", "src/*.tsx"], { encoding: "utf8" }).split("\n").filter(Boolean)
).filter((f) => path.resolve(f) !== CONSTANTS);

function syntaxErrors(text: string, fileName: string): number {
  const out = ts.transpileModule(text, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext },
  });
  return out.diagnostics?.length ?? 0;
}

const isMul = (n: Node): n is BinaryExpression =>
  Node.isBinaryExpression(n) && n.getOperatorToken().getKind() === SyntaxKind.AsteriskToken;

/** For `[x *] 4 * Math.PI * 1e-7`, the `4`: the site runs from it to the end of the product. */
function mu0Four(be: BinaryExpression): Node | undefined {
  if (!isMul(be) || be.getRight().getText() !== "1e-7") return;
  const l = be.getLeft();
  if (!isMul(l) || l.getRight().getText() !== "Math.PI") return;
  const ll = l.getLeft();
  if (Node.isNumericLiteral(ll) && ll.getText() === "4") return ll;
  if (isMul(ll) && ll.getRight().getText() === "4") return ll.getRight();
}

type Site = { node: Node; name: string; start: number; end: number; text: string };

function findSites(sf: SourceFile): Site[] {
  const out: Site[] = [];
  for (const lit of sf.getDescendantsOfKind(SyntaxKind.NumericLiteral)) {
    const name = LITERALS[lit.getText()];
    if (name) out.push({ node: lit, name, start: lit.getStart(), end: lit.getEnd(), text: lit.getText() });
  }
  for (const be of sf.getDescendantsOfKind(SyntaxKind.BinaryExpression)) {
    const four = mu0Four(be);
    if (four) out.push({ node: be, name: "mu_0", start: four.getStart(), end: be.getEnd(), text: "4 * Math.PI * 1e-7" });
  }
  return out.sort((a, b) => a.start - b.start);
}

const isConstStatement = (d: VariableDeclaration) => {
  const list = d.getParent();
  const stmt = list?.getParent();
  return Node.isVariableDeclarationList(list) && !!(list.getFlags() & ts.NodeFlags.Const) &&
    Node.isVariableStatement(stmt) && !stmt.isExported();
};

const stateCall = (site: Site) => {
  const call = site.node.getParent();
  return call && Node.isCallExpression(call) && STATE_HOOKS.has(call.getExpression().getText()) ? call : undefined;
};

/**
 * The declaration that only names the constant, and its name node: `const NAME = <site>`, or
 * `const [NAME, setNAME] = useState(<site>)` (also useURLState) whose setter is never used.
 */
function declOf(site: Site): { d: VariableDeclaration; name: Node } | undefined {
  if (site.start !== site.node.getStart()) return;
  const parent = site.node.getParent();
  if (parent && Node.isVariableDeclaration(parent) && parent.getInitializer() === site.node) {
    const name = parent.getNameNode();
    return Node.isIdentifier(name) && isConstStatement(parent) ? { d: parent, name } : undefined;
  }
  const call = stateCall(site);
  const d = call?.getParent();
  if (!call || call.getArguments().at(-1) !== site.node || !d || !Node.isVariableDeclaration(d)) return;
  const pattern = d.getNameNode();
  if (!Node.isArrayBindingPattern(pattern) || !isConstStatement(d)) return;
  const [value, setter, ...rest] = pattern.getElements();
  if (rest.length > 0 || !value || !Node.isBindingElement(value) || !Node.isIdentifier(value.getNameNode())) return;
  if (setter) {
    const set = Node.isBindingElement(setter) ? setter.getNameNode() : undefined;
    if (!set || !Node.isIdentifier(set) || set.findReferencesAsNodes().some((r) => r !== set)) return;
  }
  return { d, name: value.getNameNode() };
}

/** A state hook's initial value that isn't a removable declaration (its setter is used). */
const inStateHook = (site: Site) => !!stateCall(site) && !declOf(site);

/** The dependency array of a React hook that `n` is an element of, if any. */
function depsArray(n: Node) {
  const arr = n.getParent();
  const call = arr?.getParent();
  if (!arr || !Node.isArrayLiteralExpression(arr) || !call || !Node.isCallExpression(call)) return;
  if (!DEP_HOOKS.has(call.getExpression().getText()) || call.getArguments()[1] !== arr) return;
  return arr;
}

const lineOf = (text: string, pos: number) => text.slice(0, pos).split("\n").length;

type Edit = { start: number; end: number; with: string };

/**
 * Edits removing whole `const` statements. A line left with only whitespace (and a trailing `//`
 * comment, which described the constant) is removed entirely, newline included.
 */
function statementRemovals(text: string, stmts: VariableStatement[]): Edit[] {
  const byLine = new Map<number, Edit[]>();
  for (const s of stmts) {
    let end = s.getEnd();
    while (text[end] === " " || text[end] === "\t") end++;
    const lineStart = text.lastIndexOf("\n", s.getStart() - 1) + 1;
    const e = { start: s.getStart(), end, with: "" };
    byLine.set(lineStart, [...(byLine.get(lineStart) ?? []), e]);
  }
  const out: Edit[] = [];
  for (const [lineStart, edits] of byLine) {
    const nl = text.indexOf("\n", lineStart);
    const lineEnd = nl === -1 ? text.length : nl + 1;
    let rest = "";
    let pos = lineStart;
    for (const e of [...edits].sort((a, b) => a.start - b.start)) { rest += text.slice(pos, e.start); pos = e.end; }
    rest += text.slice(pos, lineEnd);
    if (/^\s*(\/\/.*)?\s*$/.test(rest)) out.push({ start: lineStart, end: lineEnd, with: "" });
    else out.push(...edits);
  }
  return out;
}

function importEdit(sf: SourceFile, names: Set<string>, eol: string): Edit | undefined {
  const target = CONSTANTS.replace(/\.ts$/, "");
  const dir = path.dirname(path.resolve(sf.getFilePath()));
  const existing = sf.getImportDeclarations().find((i) => {
    const spec = i.getModuleSpecifierValue();
    return spec.startsWith(".") && path.resolve(dir, spec) === target;
  });
  if (existing) {
    const have = new Set(existing.getNamedImports().map((n) => n.getName()));
    const add = ORDER.filter((n) => names.has(n) && !have.has(n));
    const last = existing.getNamedImports().at(-1);
    if (add.length === 0) return;
    if (!last) throw new Error("constants import has no named imports");
    return { start: last.getEnd(), end: last.getEnd(), with: `, ${add.join(", ")}` };
  }
  let rel = path.relative(dir, target).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  const line = `import { ${ORDER.filter((n) => names.has(n)).join(", ")} } from "${rel}";`;
  const anchor = sf.getImportDeclarations().at(-1) ?? sf.getStatements()[0];
  if (!anchor) throw new Error("empty file");
  return { start: anchor.getEnd(), end: anchor.getEnd(), with: eol + line };
}

/** Problems with `out`: every identifier spelled like an imported constant must resolve to the import. */
function verify(sf: SourceFile, names: Set<string>): string[] {
  const problems: string[] = [];
  const checker = sf.getProject().getTypeChecker();
  for (const id of sf.getDescendantsOfKind(SyntaxKind.Identifier)) {
    const name = id.getText();
    if (!names.has(name)) continue;
    const p = id.getParent();
    if (!p || Node.isImportSpecifier(p)) continue;
    if ((Node.isPropertyAccessExpression(p) || Node.isPropertyAssignment(p) || Node.isPropertySignature(p) ||
         Node.isPropertyDeclaration(p) || Node.isMethodDeclaration(p) || Node.isJsxAttribute(p)) &&
        p.getNameNode() === id) continue;
    const sym = Node.isShorthandPropertyAssignment(p)
      ? checker.getShorthandAssignmentValueSymbol(p)
      : checker.getSymbolAtLocation(id);
    const decl = sym?.getDeclarations()[0];
    const fromConstants = decl && Node.isImportSpecifier(decl) &&
      path.resolve(path.dirname(sf.getFilePath()), decl.getImportDeclaration().getModuleSpecifierValue()) ===
        CONSTANTS.replace(/\.ts$/, "");
    if (!fromConstants) problems.push(`\`${name}\` at line ${id.getStartLineNumber()} is not the import`);
  }
  return problems;
}

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  skipFileDependencyResolution: true,
  compilerOptions: { jsx: ts.JsxEmit.Preserve, allowJs: false, noLib: true },
});
const changed: string[] = [];
const skipped: { file: string; line: number; reason: string }[] = [];
const sitesByName = new Map<string, number>();
let unchanged = 0;
let removedDecls = 0;
let renamedRefs = 0;
let droppedDeps = 0;

const candidate = (text: string) => text.includes("1e-7") || Object.keys(LITERALS).some((l) => text.includes(l));

for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (!candidate(text)) { unchanged++; continue; }
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const abs = path.resolve(file);
  const sf = project.createSourceFile(abs, text, { overwrite: true });
  const sites = findSites(sf).filter((s) => {
    if (!inStateHook(s)) return true;
    skipped.push({ file, line: s.node.getStartLineNumber(), reason: `${s.text} is the initial value of a state hook` });
    return false;
  });
  if (sites.length === 0) { unchanged++; continue; }

  try {
    const edits: Edit[] = [];
    const names = new Set<string>();
    const decls = new Map<VariableStatement, VariableDeclaration[]>();
    const depsDrops = new Map<Node, Set<Node>>();
    const log: string[] = [];
    let renames = 0;

    for (const site of sites) {
      names.add(site.name);
      const found = declOf(site);
      const line = site.node.getStartLineNumber();
      if (!found) {
        edits.push({ start: site.start, end: site.end, with: site.name });
        log.push(`${file}:${line}  ${site.text} -> ${site.name}`);
        continue;
      }
      const { d, name } = found;
      const stmt = d.getVariableStatementOrThrow();
      decls.set(stmt, [...(decls.get(stmt) ?? []), d]);
      const local = name.getText();
      log.push(`${file}:${line}  ${d.getText()} -> removed${local === site.name ? "" : `, ${local} renamed ${site.name}`}`);
      if (!Node.isIdentifier(name)) continue;
      for (const ref of name.findReferencesAsNodes()) {
        if (ref.getSourceFile() !== sf || ref === name) continue;
        const arr = depsArray(ref);
        if (arr) { depsDrops.set(arr, (depsDrops.get(arr) ?? new Set()).add(ref)); continue; }
        if (local === site.name) continue;
        const p = ref.getParent();
        const with_ = p && Node.isShorthandPropertyAssignment(p) ? `${local}: ${site.name}` : site.name;
        edits.push({ start: ref.getStart(), end: ref.getEnd(), with: with_ });
        renames++;
      }
    }

    for (const [stmt, ds] of decls) {
      if (ds.length !== stmt.getDeclarations().length) {
        throw new Error(`line ${stmt.getStartLineNumber()}: statement also declares non-constants`);
      }
    }
    edits.push(...statementRemovals(text, [...decls.keys()]));
    for (const [arr, drop] of depsDrops) {
      if (!Node.isArrayLiteralExpression(arr)) continue;
      const kept = arr.getElements().filter((e) => !drop.has(e)).map((e) => e.getText());
      edits.push({ start: arr.getStart(), end: arr.getEnd(), with: `[${kept.join(", ")}]` });
    }
    const imp = importEdit(sf, names, eol);
    if (imp) edits.push(imp);

    edits.sort((a, b) => b.start - a.start || b.end - a.end);
    for (let i = 1; i < edits.length; i++) {
      if (edits[i].end > edits[i - 1].start) throw new Error(`overlapping edits at line ${lineOf(text, edits[i].start)}`);
    }
    let out = text;
    for (const e of edits) out = out.slice(0, e.start) + e.with + out.slice(e.end);

    if (syntaxErrors(out, file) > 0) throw new Error("output has syntax errors");
    const vsf = project.createSourceFile(abs, out, { overwrite: true });
    const left = findSites(vsf).filter((s) => !inStateHook(s));
    if (left.length > 0) throw new Error(`${left.length} literal(s) left, first at line ${left[0].node.getStartLineNumber()}`);
    const problems = verify(vsf, names);
    if (problems.length > 0) throw new Error(problems.slice(0, 3).join("; "));

    for (const s of sites) sitesByName.set(s.name, (sitesByName.get(s.name) ?? 0) + 1);
    removedDecls += [...decls.values()].reduce((n, ds) => n + ds.length, 0);
    renamedRefs += renames;
    droppedDeps += [...depsDrops.values()].reduce((n, s) => n + s.size, 0);
    if (list) for (const l of log) console.log(l);
    changed.push(file);
    if (write) writeFileSync(file, out);
  } catch (err) {
    skipped.push({ file, line: 0, reason: (err as Error).message });
  } finally {
    // Keep the program small: each type check rebuilds it from every file still in the project.
    const cur = project.getSourceFile(abs);
    if (cur) project.removeSourceFile(cur);
  }
}

console.log(`${write ? "WRITE" : "DRY RUN"}: changed ${changed.length} / skipped ${skipped.length} / unchanged ${unchanged}`);
console.log(`sites: ${ORDER.filter((n) => sitesByName.has(n)).map((n) => `${n} ${sitesByName.get(n)}`).join(", ")}`);
console.log(`declarations removed ${removedDecls}, references renamed ${renamedRefs}, hook deps dropped ${droppedDeps}`);
for (const s of skipped) console.log(`  skip ${s.file}${s.line ? `:${s.line}` : ""}: ${s.reason}`);
