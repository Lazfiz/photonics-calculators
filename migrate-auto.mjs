#!/usr/bin/env node
// v2: Simpler, safer migration script
// Skips ResultCard conversion (too fragile) — only does imports, wrapper, Plot→ChartPanel
// Usage: node migrate-auto.mjs [--dry-run] [--category CAT] [--count N]

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const catIdx = args.indexOf('--category');
const countIdx = args.indexOf('--count');
const targetCategory = catIdx >= 0 ? args[catIdx + 1] : null;
const targetCount = countIdx >= 0 ? parseInt(args[countIdx + 1]) : Infinity;

const srcDir = 'src/app';
const categories = targetCategory ? [targetCategory] : fs.readdirSync(srcDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'about')
  .map(d => d.name);

let totalOk = 0, totalSkip = 0, totalErr = 0;

for (const category of categories) {
  const catDir = path.join(srcDir, category);
  if (!fs.existsSync(catDir)) continue;

  const pages = fs.readdirSync(catDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => {
      const f = path.join(catDir, name, 'page.tsx');
      if (!fs.existsSync(f)) return false;
      return !fs.readFileSync(f, 'utf-8').includes('CalculatorShell');
    });

  if (!pages.length) continue;
  const batch = pages.slice(0, targetCount - totalOk);
  if (!batch.length) break;

  console.log(`\n📋 ${category}: ${pages.length} unmigrated, doing ${batch.length}`);

  for (const page of batch) {
    try {
      const filePath = path.join(catDir, page, 'page.tsx');
      const result = migrate(filePath, category, dryRun);
      if (result === 'ok') { totalOk++; console.log(`  ✅ ${page}`); }
      else { totalSkip++; console.log(`  ⏭️  ${page}`); }
    } catch (err) {
      totalErr++;
      console.log(`  ❌ ${page}: ${err.message}`);
    }
  }
  if (totalOk >= targetCount) break;
}

console.log(`\n📊 ${totalOk} migrated, ${totalSkip} skipped, ${totalErr} errors`);
if (dryRun) console.log('🔍 Dry run');

function migrate(filePath, category, dry) {
  let c = fs.readFileSync(filePath, 'utf-8');
  if (!c.includes('min-h-screen bg-gray-950')) return 'skip';

  // 1. Remove old imports
  c = c.replace(/import dynamic from "next\/dynamic";\n/g, '');
  c = c.replace(/const Plot = dynamic\(\(\) => import\("react-plotly\.js"\), \{ ssr: false \}\);\n\n?/g, '');
  c = c.replace(/import Link from "next\/link";\n/g, '');

  // 2. Determine needs
  const needsChart = c.includes('<Plot') || c.includes('chartData') || c.includes('chart_data');

  // 3. Build new imports
  let newImp = 'import CalculatorShell from "../../../components/calculator-shell";\n';
  if (needsChart) newImp += 'import ChartPanel from "../../../components/chart-panel";\n';
  if (category === 'laser-safety') newImp += 'import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";\n';

  // Insert after react import
  c = c.replace(/(import \{[^}]+\} from "react";)/, '$1\n' + newImp);

  // 4. Extract title/description
  const titleM = c.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const descM = c.match(/<p className="text-gray-400[^"]*">([\s\S]*?)<\/p>/);
  const title = titleM ? titleM[1].replace(/<[^>]*>/g, '').trim().replace(/"/g, '&quot;') : '';
  const desc = descM ? descM[1].replace(/<[^>]*>/g, '').trim().replace(/"/g, '&quot;') : '';

  // Back link category
  const backM = c.match(/<Link href="\/([^"]+)"/);
  const backCat = backM ? backM[1] : category;
  const catLabel = backCat.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

  // 5. Remove Link, h1, description
  c = c.replace(/\s*<Link href="\/[^"]+"[^>]*>[^<]*<\/Link>\n?/g, '\n');
  if (titleM) c = c.replace(/<h1[^>]*>[\s\S]*?<\/h1>\n?/g, '');
  if (descM) c = c.replace(/<p className="text-gray-400[^"]*">[\s\S]*?<\/p>\n?/g, '');

  // 6. Replace wrapper div opening
  c = c.replace(
    /<div className="min-h-screen bg-gray-950 text-white p-6 max-w-\d+xl mx-auto">/,
    `<CalculatorShell backHref="/${backCat}" backLabel="${catLabel}" title="${title}"${desc ? ` description="${desc}"` : ''}>`
  );

  // 7. Replace <Plot with <ChartPanel (mechanical)
  c = c.replace(/<Plot\s+/g, '<ChartPanel ');
  c = c.replace(/ className="w-full"/g, '');
  c = c.replace(/ style=\{\{[^}]*\}\}/g, '');
  c = c.replace(/ config=\{\{[^}]*\}\}/g, '');

  // 8. Replace the wrapper's closing </div> with </CalculatorShell>
  // Find CalculatorShell opening, then find the end of the MAIN function (before any subsequent function/export)
  const lines = c.split('\n');
  let shellLineIdx = -1, shellIndent = '';
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)<CalculatorShell /);
    if (m) { shellLineIdx = i; shellIndent = m[1]; break; }
  }
  
  if (shellLineIdx >= 0) {
    // Find where the main function ends (next top-level function/export or EOF)
    let funcEnd = lines.length;
    for (let i = shellLineIdx + 1; i < lines.length; i++) {
      if (/^(export )?(default )?function |^export const |^export class /.test(lines[i].trimStart())) {
        funcEnd = i;
        break;
      }
    }
    // Scan backwards from funcEnd to find </div> at shellIndent followed by );
    for (let i = funcEnd - 1; i > shellLineIdx; i--) {
      if (lines[i] === shellIndent + '</div>') {
        const after = lines.slice(i + 1, Math.min(i + 4, funcEnd)).map(l => l.trim()).filter(Boolean).join('');
        if (after.startsWith(');')) {
          lines[i] = shellIndent + '</CalculatorShell>';
          break;
        }
      }
    }
  }

  c = lines.join('\n');

  // 9. Style tweaks (safe, non-breaking)
  c = c.replace(/className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"/g,
    'className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"');
  c = c.replace(/className="block"/g,
    'className="block rounded-lg border border-gray-800 bg-gray-900 p-4"');
  c = c.replace(/className="text-gray-300 text-sm"/g,
    'className="text-sm text-gray-300"');

  if (!dry) fs.writeFileSync(filePath, c);
  return 'ok';
}
