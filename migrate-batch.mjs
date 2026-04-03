#!/usr/bin/env node
// Simple mechanical migration: old pattern → shared components
// Handles the common patterns found in photonics-calculators pages
import fs from 'fs';
import path from 'path';

const category = process.argv[2] || 'detectors';
const count = parseInt(process.argv[3]) || 10;
const catDir = path.join('src/app', category);

const pages = fs.readdirSync(catDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .filter(name => {
    const f = path.join(catDir, name, 'page.tsx');
    if (!fs.existsSync(f)) return false;
    return !fs.readFileSync(f, 'utf-8').includes('CalculatorShell');
  })
  .slice(0, count);

console.log(`Migrating ${pages.length} pages in ${category}...`);

for (const page of pages) {
  const fp = path.join(catDir, page, 'page.tsx');
  let c = fs.readFileSync(fp, 'utf-8');
  
  // Detect features
  const hasPlot = /<Plot[\s/]/.test(c) || /chartData/.test(c);
  const hasResultCards = /ResultCard/.test(c);
  const isLaserSafety = category === 'laser-safety' && (/\b[lL]aser\b/.test(c) || /\b[sS]afety\b/.test(c));
  
  // 1. Remove old imports
  c = c.replace(/import dynamic from "next\/dynamic";?\n/g, '');
  c = c.replace(/const Plot = dynamic\(\(\) => import\("react-plotly\.js"\), \{ ssr: false \}\);?\n/g, '');
  c = c.replace(/import Link from "next\/link";?\n/g, '');
  
  // 2. Add shared component imports after "use client"
  let newImports = 'import CalculatorShell from "../../../components/calculator-shell";\n';
  if (hasPlot) newImports += 'import ChartPanel from "../../../components/chart-panel";\n';
  if (hasResultCards || /bg-gray-900 border border-gray-800 rounded-lg p-4/.test(c) || /bg-gray-900 rounded p-4 mb-6/.test(c)) {
    newImports += 'import ResultCard from "../../../components/result-card";\n';
  }
  if (isLaserSafety) newImports += 'import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";\n';
  
  // Insert imports after the existing import block
  if (/^import /.test(c.split('\n').slice(1).find(l => l.trim()) || '')) {
    // Already has imports after use client - find last import line
    const lines = c.split('\n');
    let lastImportIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (/^import /.test(lines[i])) lastImportIdx = i;
    }
    lines.splice(lastImportIdx + 1, 0, newImports);
    c = lines.join('\n');
  } else {
    c = c.replace(/("use client";\n)/, `$1\n${newImports}`);
  }
  
  // 3. Extract title and description
  const titleMatch = c.match(/<h1[^>]*>(.*?)<\/h1>/s);
  const descMatch = c.match(/<p className="text-gray-400[^"]*">(.*?)<\/p>/s);
  const title = titleMatch ? titleMatch[1].trim() : page.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  const description = descMatch ? descMatch[1].replace(/"/g, '&quot;').trim() : '';
  
  // 4. Remove back link
  c = c.replace(/<Link href="\/[^"]+"[^>]*>[^<]*<\/Link>\s*\n?/g, '');
  
  // 5. Remove old h1 and description p
  c = c.replace(/<h1[^>]*>.*?<\/h1>\s*\n?/s, '');
  c = c.replace(/<p className="text-gray-400[^"]*">.*?<\/p>\s*\n?/s, '');
  
  // 6. Style input labels
  c = c.replace(/className="block"/g, 'className="block rounded-lg border border-gray-800 bg-gray-900 p-4"');
  c = c.replace(/<span className="text-gray-300 text-sm">/g, '<span className="text-sm text-gray-300">');
  c = c.replace(/className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"/g,
    'className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"');
  
  // 7. Replace result divs with ResultCard
  c = c.replace(/<div className="bg-gray-900 border border-gray-800 rounded-lg p-4">\s*\n?\s*<p className="text-sm text-gray-400">([^<]+)<\/p>\s*\n?\s*<p className="text-xl font-bold text-(blue|green|yellow|red|purple|cyan|orange)-400">([\s\S]*?)<\/p>\s*\n?\s*<\/div>/g,
    (match, label, tone, value) => {
      const cleanValue = value.replace(/<\/?span[^>]*>/g, '').replace(/<sub>/g, '(').replace(/<\/sub>/g, ')').trim();
      return `<ResultCard label="${label.trim()}" value="${cleanValue}" tone="${tone}" />`;
    });
  
  // Also handle simpler result pattern
  c = c.replace(/<div>\s*<span className="text-gray-400 text-sm">([^<]+)<\/span>\s*<div className="text-xl font-mono(?: text-\w+-400)?">([\s\S]*?)<\/div>\s*<\/div>/g,
    (match, label, value) => {
      const cleanValue = value.replace(/<\/?span[^>]*>/g, '').replace(/<sub>/g, '(').replace(/<\/sub>/g, ')').trim();
      const tone = value.includes('green') ? 'green' : value.includes('yellow') ? 'yellow' : value.includes('red') ? 'red' : value.includes('purple') ? 'purple' : 'blue';
      return `<ResultCard label="${label.trim()}" value="${cleanValue}" tone="${tone}" />`;
    });
  
  // 8. Replace Plot → ChartPanel (simple cases)
  c = c.replace(/<Plot\s+data=\{/g, '<ChartPanel data={');
  // Remove className and style from ChartPanel tags
  c = c.replace(/className="w-full"\s+style=\{\{\s*height:\s*\d+\s*\}\}\s*\/>/g, '/>');
  c = c.replace(/config=\{\{[^}]*\}\}\s+style=\{\{[^}]*\}\}\s*\/>/g, '/>');
  c = c.replace(/config=\{\{[^}]*\}\}\s*\/>/g, '/>');
  c = c.replace(/className="\{[^}]*\}"\s*style=\{\{[^}]*\}\}\s*\/>/g, '/>');
  
  // 9. Replace outer wrapper div with CalculatorShell
  const catLabel = category.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  
  // Handle the common wrapper pattern
  const wrapperPattern = /<div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">\s*\n([\s\S]*)\n\s*<\/div>\s*\n?\s*<\/div>\s*\n?\s*\}\s*\n?\}/;
  
  if (wrapperPattern.test(c)) {
    const shellProps = `\n    backHref="/${category}" backLabel="${catLabel}" title="${title}"${description ? `\n    description="${description}"` : ''}`;
    const laserDisc = isLaserSafety ? '\n      <LaserSafetyDisclaimer />' : '';
    c = c.replace(wrapperPattern, (match, body) => {
      return `${laserDisc ? '' : ''}  return (\n    <CalculatorShell${shellProps}>${laserDisc}\n${body}\n    </CalculatorShell>\n  );\n}\n`;
    });
  } else {
    // Try alternative wrapper
    const altWrapper = /<div className="min-h-screen[^"]*">([\s\S]*)<\/div>\s*\n?\s*<\/div>\s*\n?\s*\}/;
    if (altWrapper.test(c)) {
      const shellProps = `\n    backHref="/${category}" backLabel="${catLabel}" title="${title}"${description ? `\n    description="${description}"` : ''}`;
      const laserDisc = isLaserSafety ? '\n      <LaserSafetyDisclaimer />' : '';
      c = c.replace(altWrapper, (match, body) => {
        return `  return (\n    <CalculatorShell${shellProps}>${laserDisc}\n${body}\n    </CalculatorShell>\n  );\n}\n`;
      });
    }
  }
  
  // 10. Clean up double closing divs that might result from wrapper removal
  // Remove orphaned </div> at end
  while (c.match(/\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/CalculatorShell>/)) {
    c = c.replace(/\n\s*<\/div>\s*\n(\s*<\/CalculatorShell>)/, '\n$1');
  }
  
  // Remove extra blank lines
  c = c.replace(/\n{3,}/g, '\n\n');
  
  fs.writeFileSync(fp, c);
  console.log(`  ✅ ${page}`);
}

console.log(`\nDone. ${pages.length} pages migrated. Run build to verify.`);
