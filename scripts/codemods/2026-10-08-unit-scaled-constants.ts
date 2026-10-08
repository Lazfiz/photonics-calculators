/**
 * Replace unit-scaled physical constants with imports from `src/physics/constants.ts` (ROADMAP Phase 2).
 *
 * The inline-constants codemod (2026-10-08-inline-constants.ts) left the scaled spellings: `1240 / λ`
 * (hc in eV·nm), `3e10` (c in cm/s), `8.617e-5` (k_B in eV/K), `2897771.955` (Wien's b in nm·K), ….
 * `1240` is also a wavelength in nm, so nothing is matched by value: SITES lists every site, checked
 * by hand, with the number of matches expected in its file. A site is one of
 *   - `literal`: each numeric literal spelled exactly so (`count` of them, default 1);
 *   - `expr`: the one binary expression with exactly this text (`1.24 / wl`, λ in µm);
 *   - `decl`: the one `const NAME = <literal>` declaration with this text. If `with` is an exported
 *     name, the statement is removed, NAME is renamed to it and dropped from hook dependency arrays.
 *     Otherwise `with` is a new declaration (`c_km_s = c * 1e-3`) and NAME is renamed to its name.
 * A replacement is parenthesized where precedence needs it (`x / 3e5` → `x / (c * 1e-3)`).
 *
 * A file whose match counts differ from SITES is left unchanged and reported. After editing, the file is
 * re-parsed: no site may match again, and every identifier spelled like an imported constant must
 * resolve to the import. A file whose sites all match nothing is reported as already done, so a second
 * run changes nothing. CODEMOD_LIST=1 lists every edit.
 *
 * Usage: npx tsx scripts/codemods/2026-10-08-unit-scaled-constants.ts [--write]
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  Node, Project, SyntaxKind, ts,
  type SourceFile, type VariableDeclaration, type VariableStatement,
} from "ts-morph";

type Site = { file: string; with: string } & (
  | { literal: string; count?: number }
  | { expr: string }
  | { decl: string }
);

const SITES: Site[] = [
  // hc in eV·nm: E[eV] = 1240 / λ[nm], λ[nm] = 1240 / E[eV].
  { file: "detectors/ingaas-parameters", literal: "1240", with: "hc_eV_nm", count: 2 },
  { file: "detectors/silicon-photodiode", literal: "1240", with: "hc_eV_nm" },
  { file: "detectors/vacuum-photodiode", literal: "1240", with: "hc_eV_nm", count: 2 },
  { file: "imaging/coherent-raman-microscopy", literal: "1240", with: "hc_eV_nm", count: 2 },
  { file: "imaging/sum-frequency-microscopy", literal: "1240", with: "hc_eV_nm", count: 5 },
  { file: "spectroscopy/pump-probe", literal: "1240", with: "hc_eV_nm", count: 2 },
  { file: "spectroscopy/stokes-shift", literal: "1240", with: "hc_eV_nm", count: 2 },
  { file: "spectroscopy/transient-absorption", literal: "1240", with: "hc_eV_nm" },
  { file: "spectroscopy/wavenumber-converter", literal: "1240", with: "hc_eV_nm", count: 5 },
  { file: "wave-optics/attosecond-pulse", literal: "1240", with: "hc_eV_nm", count: 2 },
  // hc in eV·µm: λ in µm, or E in keV with λ in nm.
  { file: "materials/semiconductor-bandgap", expr: "1.23984 / eg * 1000", with: "hc_eV_nm / eg" },
  { file: "materials/x-ray-optics", expr: "1.24 / E", with: "hc_eV_nm / (E * 1e3)" },
  { file: "thin-film/enhanced-aluminum", expr: "1.24 / wl", with: "hc_eV_nm / (wl * 1e3)" },
  { file: "thin-film/protected-silver", expr: "1.24 / wl", with: "hc_eV_nm / (wl * 1e3)" },
  // hc/e in V·m (photon energy in eV per wavelength in m) and hc in J·m.
  { file: "wave-optics/diode-laser-resonator", expr: "1.24e-6 / lambda_m", with: "h * c / (q * lambda_m)" },
  { file: "detectors/spectral-response", literal: "1.986e-25", with: "h * c" },
  { file: "wave-optics/optical-parametric-oscillator", literal: "1.986446e-25", with: "h * c" },
  // c in km/s (= nm·THz), nm/s, mm/s, cm/s, and THz per cm⁻¹.
  { file: "fiber-optics/birefringence-fiber", literal: "3e5", with: "c * 1e-3" },
  { file: "materials/chromatic-dispersion", decl: "c = 2.998e5", with: "c_km_s = c * 1e-3" },
  { file: "wave-optics/dual-comb-spectroscopy", literal: "299792.458", with: "c * 1e-3" },
  { file: "fiber-optics/nonzero-dispersion", literal: "3e17", with: "c * 1e9" },
  { file: "spectroscopy/wavenumber-converter", literal: "3e17", with: "c * 1e9" },
  { file: "wave-optics/cavity-mode-spacing", decl: "c = 3e11", with: "c_mm_s = c * 1e3" },
  { file: "imaging/coherent-raman-microscopy", literal: "2.998e10", with: "c * 100" },
  { file: "imaging/coherent-raman", literal: "2.998e10", with: "c * 100" },
  { file: "imaging/stimulated-raman-microscopy", literal: "3e10", with: "c * 100" },
  { file: "spectroscopy/coherent-anti-stokes-raman", literal: "2.998e10", with: "c * 100" },
  { file: "spectroscopy/microwave-spectroscopy", decl: "c = 2.998e10", with: "c_cm_s = c * 100" },
  { file: "spectroscopy/microwave-spectroscopy", literal: "2.998e10", with: "c * 100" },
  { file: "spectroscopy/two-dimensional", literal: "3e10", with: "c * 100" },
  { file: "spectroscopy/wavenumber-converter", literal: "3e10", with: "c * 100" },
  { file: "spectroscopy/raman-shift", literal: "0.029979", with: "c * 1e-10" },
  // k_B in eV/K, Wien's b in nm·K, R, Z₀, ε₀ in F/cm.
  { file: "detectors/cooling-benefit", decl: "kB = 8.617e-5", with: "k_B_eV" },
  { file: "detectors/dark-noise-temperature", decl: "kB = 8.617e-5", with: "k_B_eV" },
  { file: "spectroscopy/blackbody", literal: "2897771.955", with: "b_Wien * 1e9", count: 2 },
  { file: "materials/heat-capacity", decl: "R = 8.314", with: "R_gas" },
  { file: "polarization/wire-grid", decl: "Z0 = 377", with: "Z_0" },
  { file: "detectors/silicon-photodiode", literal: "8.85e-14", with: "epsilon_0 * 1e-2" },
];

/** Exports of constants.ts in file order; imports list names in this order. */
const ORDER = [
  "c", "h", "q", "k_B", "N_A", "hbar", "eV", "R_gas", "F_faraday", "sigma_SB", "c1_radiation",
  "c2_radiation", "WIEN_X", "b_Wien", "hc_eV_nm", "k_B_eV", "alpha", "mu_0", "epsilon_0", "Z_0",
  "m_e", "m_p", "m_u", "a_0", "G",
];
const EXPORTS = new Set(ORDER);
const CONSTANTS = path.resolve("src/physics/constants.ts");
const DEP_HOOKS = new Set(["useMemo", "useCallback", "useEffect", "useLayoutEffect"]);

const write = process.argv.includes("--write");
const list = process.env.CODEMOD_LIST === "1";

const fileOf = (s: Site) => `src/app/${s.file}/page-client.tsx`;
const constantNames = (text: string) => (text.match(/[A-Za-z_]\w*/g) ?? []).filter((w) => EXPORTS.has(w));

function syntaxErrors(text: string, fileName: string): number {
  const out = ts.transpileModule(text, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext },
  });
  return out.diagnostics?.length ?? 0;
}

/** Nodes a site matches, in source order. Literals inside a `decl` site of the same file don't count. */
function matches(sf: SourceFile, site: Site, sites: Site[]): Node[] {
  const decls = sites.flatMap((s) => ("decl" in s ? matches(sf, s, []) : []));
  const inside = (n: Node) => decls.some((d) => n.getStart() >= d.getStart() && n.getEnd() <= d.getEnd());
  if ("literal" in site) {
    return sf.getDescendantsOfKind(SyntaxKind.NumericLiteral).filter((n) => n.getText() === site.literal && !inside(n));
  }
  if ("expr" in site) return sf.getDescendantsOfKind(SyntaxKind.BinaryExpression).filter((n) => n.getText() === site.expr);
  return sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration).filter((n) => n.getText() === site.decl);
}

const expected = (site: Site) => ("literal" in site ? site.count ?? 1 : 1);

/** Whether `replacement` (a product or quotient) needs parentheses in place of `node`. */
function needsParens(node: Node, replacement: string): boolean {
  if (/^[A-Za-z_]\w*$/.test(replacement)) return false;
  const p = node.getParent();
  if (!p) return false;
  if (Node.isPrefixUnaryExpression(p) || Node.isPostfixUnaryExpression(p)) return true;
  if ((Node.isPropertyAccessExpression(p) || Node.isElementAccessExpression(p) || Node.isCallExpression(p)) &&
      p.getExpression() === node) return true;
  if (!Node.isBinaryExpression(p)) return false;
  const op = p.getOperatorToken().getKind();
  if (op === SyntaxKind.AsteriskAsteriskToken) return true;
  return p.getRight() === node && (op === SyntaxKind.SlashToken || op === SyntaxKind.PercentToken);
}

/** The dependency array of a React hook that `n` is an element of, if any. */
function depsArray(n: Node) {
  const arr = n.getParent();
  const call = arr?.getParent();
  if (!arr || !Node.isArrayLiteralExpression(arr) || !call || !Node.isCallExpression(call)) return;
  if (!DEP_HOOKS.has(call.getExpression().getText()) || call.getArguments()[1] !== arr) return;
  return arr;
}

type Edit = { start: number; end: number; with: string };

/** Removes a `const` statement; a line left with only whitespace and a `//` comment goes entirely. */
function statementRemoval(text: string, s: VariableStatement): Edit {
  let end = s.getEnd();
  while (text[end] === " " || text[end] === "\t") end++;
  const lineStart = text.lastIndexOf("\n", s.getStart() - 1) + 1;
  const nl = text.indexOf("\n", lineStart);
  const lineEnd = nl === -1 ? text.length : nl + 1;
  const rest = text.slice(lineStart, s.getStart()) + text.slice(end, lineEnd);
  return /^\s*(\/\/.*)?\s*$/.test(rest) ? { start: lineStart, end: lineEnd, with: "" } : { start: s.getStart(), end, with: "" };
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

/** Problems with the output: every identifier spelled like an imported constant must resolve to the import. */
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
const files = [...new Set(SITES.map(fileOf))];
const changed: string[] = [];
const done: string[] = [];
const skipped: { file: string; reason: string }[] = [];
let edited = 0;

for (const file of files) {
  const sites = SITES.filter((s) => fileOf(s) === file);
  const text = readFileSync(file, "utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const abs = path.resolve(file);
  const sf = project.createSourceFile(abs, text, { overwrite: true });
  try {
    const found = sites.map((s) => matches(sf, s, sites));
    if (found.every((f) => f.length === 0)) { done.push(file); continue; }
    sites.forEach((s, i) => {
      if (found[i].length !== expected(s)) {
        throw new Error(`${JSON.stringify(s)}: ${found[i].length} matches, expected ${expected(s)}`);
      }
    });

    const edits: Edit[] = [];
    const names = new Set<string>();
    const log: string[] = [];
    sites.forEach((site, i) => {
      for (const node of found[i]) {
        const line = node.getStartLineNumber();
        if (!("decl" in site)) {
          const with_ = needsParens(node, site.with) ? `(${site.with})` : site.with;
          edits.push({ start: node.getStart(), end: node.getEnd(), with: with_ });
          constantNames(site.with).forEach((n) => names.add(n));
          log.push(`${file}:${line}  ${node.getText()} -> ${with_}`);
          continue;
        }
        const d = node as VariableDeclaration;
        const stmt = d.getVariableStatementOrThrow();
        const nameNode = d.getNameNode();
        if (!Node.isIdentifier(nameNode)) throw new Error(`line ${line}: not a simple declaration`);
        if (!(stmt.getDeclarationList().getFlags() & ts.NodeFlags.Const) || stmt.getDeclarations().length !== 1) {
          throw new Error(`line ${line}: not a single const declaration`);
        }
        const remove = EXPORTS.has(site.with);
        const newName = remove ? site.with : site.with.split("=")[0].trim();
        if (!remove && sf.getDescendantsOfKind(SyntaxKind.Identifier).some((id) => id.getText() === newName)) {
          throw new Error(`line ${line}: ${newName} already exists`);
        }
        if (remove) edits.push(statementRemoval(text, stmt));
        else edits.push({ start: d.getStart(), end: d.getEnd(), with: site.with });
        constantNames(remove ? site.with : site.with.split("=")[1]).forEach((n) => names.add(n));
        log.push(`${file}:${line}  ${d.getText()} -> ${remove ? `removed, ${nameNode.getText()} renamed ${newName}` : site.with}`);
        const drops = new Map<Node, Set<Node>>();
        for (const ref of nameNode.findReferencesAsNodes()) {
          if (ref.getSourceFile() !== sf || ref === nameNode) continue;
          const arr = remove ? depsArray(ref) : undefined;
          if (arr) { drops.set(arr, (drops.get(arr) ?? new Set()).add(ref)); continue; }
          const p = ref.getParent();
          const with_ = p && Node.isShorthandPropertyAssignment(p) ? `${nameNode.getText()}: ${newName}` : newName;
          edits.push({ start: ref.getStart(), end: ref.getEnd(), with: with_ });
        }
        for (const [arr, drop] of drops) {
          if (!Node.isArrayLiteralExpression(arr)) continue;
          const kept = arr.getElements().filter((e) => !drop.has(e)).map((e) => e.getText());
          edits.push({ start: arr.getStart(), end: arr.getEnd(), with: `[${kept.join(", ")}]` });
          log.push(`${file}:${arr.getStartLineNumber()}  dropped ${nameNode.getText()} from hook deps`);
        }
      }
    });
    const imp = importEdit(sf, names, eol);
    if (imp) edits.push(imp);

    edits.sort((a, b) => b.start - a.start || b.end - a.end);
    for (let i = 1; i < edits.length; i++) {
      if (edits[i].end > edits[i - 1].start) throw new Error(`overlapping edits at offset ${edits[i].start}`);
    }
    let out = text;
    for (const e of edits) out = out.slice(0, e.start) + e.with + out.slice(e.end);

    if (syntaxErrors(out, file) > 0) throw new Error("output has syntax errors");
    const vsf = project.createSourceFile(abs, out, { overwrite: true });
    const left = sites.filter((s) => matches(vsf, s, sites).length > 0);
    if (left.length > 0) throw new Error(`still matches ${JSON.stringify(left[0])}`);
    const problems = verify(vsf, names);
    if (problems.length > 0) throw new Error(problems.slice(0, 3).join("; "));

    edited += log.length;
    if (list) for (const l of log) console.log(l);
    changed.push(file);
    if (write) writeFileSync(file, out);
  } catch (err) {
    skipped.push({ file, reason: (err as Error).message });
  } finally {
    // Keep the program small: each type check rebuilds it from every file still in the project.
    const cur = project.getSourceFile(abs);
    if (cur) project.removeSourceFile(cur);
  }
}

console.log(`${write ? "WRITE" : "DRY RUN"}: changed ${changed.length} / skipped ${skipped.length} / already done ${done.length} (of ${files.length})`);
console.log(`edits ${edited} (sites ${SITES.length})`);
for (const s of skipped) console.log(`  skip ${s.file}: ${s.reason}`);
