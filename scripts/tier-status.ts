// Model-tier status from the registry, in a few lines (the ROADMAP status table comes from here).
//   npx tsx scripts/tier-status.ts              # one line per category: tiered / visible, known issues
//   npx tsx scripts/tier-status.ts <category>   # that category's untiered pages
import { calculators } from "../src/registry/index";

interface Row {
  visible: number;
  tiered: number;
  known: number;
  untiered: string[];
}

const only = process.argv[2];
const rows = new Map<string, Row>();
for (const calculator of calculators) {
  if (calculator.hidden) continue;
  let row = rows.get(calculator.category);
  if (!row) {
    row = { visible: 0, tiered: 0, known: 0, untiered: [] };
    rows.set(calculator.category, row);
  }
  row.visible++;
  if (calculator.tier) row.tiered++;
  else row.untiered.push(calculator.knownIssue ? `${calculator.slug} (known issue)` : calculator.slug);
  if (calculator.knownIssue) row.known++;
}

if (only) {
  const row = rows.get(only);
  if (!row) {
    console.error(`No category "${only}". Categories: ${[...rows.keys()].join(", ")}`);
    process.exit(1);
  }
  console.log(`${only}: ${row.tiered} / ${row.visible} tiered; untiered:`);
  console.log(row.untiered.join(", ") || "(none)");
} else {
  let visible = 0;
  let tiered = 0;
  let known = 0;
  for (const [category, row] of rows) {
    visible += row.visible;
    tiered += row.tiered;
    known += row.known;
    const issues = row.known ? `, ${row.known} known issues` : "";
    console.log(`${category.padEnd(17)} ${String(row.tiered).padStart(3)} / ${row.visible}${issues}`);
  }
  console.log(`${"total".padEnd(17)} ${String(tiered).padStart(3)} / ${visible}, ${known} known issues`);
}
