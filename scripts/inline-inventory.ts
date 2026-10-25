// Lists math (Math.sqrt/exp/…, PI, **) inside page component bodies: the 2-inline-b inventory.
// Usage: node --import tsx scripts/inline-inventory.ts > out.txt
import { Project, SyntaxKind, Node } from "ts-morph";

const project = new Project({ skipAddingFilesFromTsConfig: true });
project.addSourceFilesAtPaths("src/app/**/page-client.tsx");
const PHYS = /^Math\.(sqrt|exp|log|log10|log2|sin|cos|tan|asin|acos|atan|atan2|pow|PI|hypot|cbrt|sinh|cosh|tanh|E)$/;

const rows: string[] = [];
for (const sf of project.getSourceFiles()) {
  const rel = sf.getFilePath().split("/src/app/")[1].replace("/page-client.tsx", "");
  const hits: string[] = [];
  for (const fn of sf.getStatements()) {
    // only component functions (top-level helpers were cleaned in 2-inline-a)
    let body: Node | undefined;
    if (Node.isFunctionDeclaration(fn) && /^[A-Z]/.test(fn.getName() ?? "")) body = fn.getBody();
    if (Node.isVariableStatement(fn)) {
      for (const d of fn.getDeclarations()) {
        if (/^[A-Z]/.test(d.getName())) body = d.getInitializer();
      }
    }
    if (!body) continue;
    const seen = new Set<number>();
    const add = (n: Node) => {
      const stmt = n.getFirstAncestor((a) => Node.isStatement(a) || Node.isJsxExpression(a)) ?? n;
      const line = stmt.getStartLineNumber();
      if (seen.has(line)) return;
      seen.add(line);
      hits.push(`${line}: ${stmt.getText().replace(/\s+/g, " ").slice(0, 110)}`);
    };
    body.forEachDescendant((n) => {
      if (Node.isPropertyAccessExpression(n) && PHYS.test(n.getText())) add(n);
      if (Node.isBinaryExpression(n) && n.getOperatorToken().getKind() === SyntaxKind.AsteriskAsteriskToken) add(n);
    });
  }
  if (hits.length) rows.push(`## ${rel} (${hits.length})\n${hits.join("\n")}`);
}
console.log(rows.length + " pages");
console.log(rows.join("\n"));
