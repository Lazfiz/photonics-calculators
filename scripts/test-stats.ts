// Counts the tests the About page quotes and writes src/lib/test-stats.json.
// Usage: npx tsx scripts/test-stats.ts   (tests/test-stats.test.ts fails until the JSON matches)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export interface TestStats {
  /** Every `test(…)` in tests/*.test.ts. */
  tests: number;
  /** Tests in files that import a physics module: the golden-value tests of the calculators. */
  physicsTests: number;
  physicsFiles: number;
}

const TEST_CALL = /^\s*(test|it)\(/gm;
const PHYSICS_IMPORT = /from "\.\.\/src\/(physics|lib\/laser-safety)/;

export function countTests(dir = "tests"): TestStats {
  const stats: TestStats = { tests: 0, physicsTests: 0, physicsFiles: 0 };
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".test.ts")).sort()) {
    const source = readFileSync(join(dir, name), "utf8");
    const count = source.match(TEST_CALL)?.length ?? 0;
    stats.tests += count;
    if (PHYSICS_IMPORT.test(source)) {
      stats.physicsTests += count;
      stats.physicsFiles += 1;
    }
  }
  return stats;
}

export const STATS_FILE = "src/lib/test-stats.json";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const stats = countTests();
  writeFileSync(STATS_FILE, `${JSON.stringify(stats, null, 2)}\n`);
  console.log(`${STATS_FILE}: ${JSON.stringify(stats)}`);
}
