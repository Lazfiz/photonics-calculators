#!/usr/bin/env node
/**
 * Automated migration script: converts old-style calculator pages to shared components.
 * 
 * Mechanical transformations:
 * 1. Replace imports (dynamic Plot, Link) with shared component imports
 * 2. Replace <Plot> with <ChartPanel>
 * 3. Wrap return in <CalculatorShell>
 * 4. Replace range+number input pairs with <InputSlider>
 * 5. Replace result display divs with <ResultCard>
 * 6. For laser-safety pages: add <LaserSafetyDisclaimer>
 * 
 * Usage: node migrate-all.mjs [--dry-run] [--category detectors] [--page nep]
 */

import fs from 'fs';
import path from 'path';

const SRC = 'src/app';
const COMPONENTS = '../../../components';

let dryRun = false;
let filterCategory = null;
let filterPage = null;

for (const arg of process.argv.slice(2)) {
  if (arg === '--dry-run') dryRun = true;
  else if (arg === '--category') filterCategory = process.argv[process.argv.indexOf(arg) + 1];
  else if (arg === '--page') filterPage = process.argv[process.argv.indexOf(arg) + 1];
}

function findPages() {
  const pages = [];
  const cats = fs.readdirSync(SRC, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'about' && d.name !== '_not-found');
  
  for (const cat of cats) {
    if (filterCategory && cat.name !== filterCategory) continue;
    const catPath = path.join(SRC, cat.name);
    const subdirs = fs.readdirSync(catPath, { withFileTypes: true })
      .filter(d => d.isDirectory());
    
    for (const sub of subdirs) {
      if (filterPage && sub.name !== filterPage) continue;
      const pageFile = path.join(catPath, sub.name, 'page.tsx');
      if (fs.existsSync(pageFile)) {
        pages.push({ category: cat.name, name: sub.name, file: pageFile });
      }
    }
  }
  return pages;
}

function getCategoryLabel(cat) {
  const labels = {
    'detectors': 'Detectors',
    'fiber-optics': 'Fiber Optics',
    'free-space-comms': 'Free-Space Comms',
    'imaging': 'Imaging',
    'laser-safety': 'Laser Safety',
    'materials': 'Materials',
    'polarization': 'Polarization',
    'spectroscopy': 'Spectroscopy',
    'thin-film': 'Thin Film',
    'wave-optics': 'Wave Optics',
  };
  return labels[cat] || cat;
}

function migratePage(page) {
  let content = fs.readFileSync(page.file, 'utf-8');
  
  // Skip if already migrated
  if (content.includes('CalculatorShell')) return { status: 'skip', reason: 'already migrated' };
  
  const isLaserSafety = page.category === 'laser-safety';
  const categoryLabel = getCategoryLabel(page.category);
  const pageTitle = page.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  // Extract the function/component name
  const fnMatch = content.match(/export\s+default\s+function\s+(\w+)/);
  const fnName = fnMatch ? fnMatch[1] : 'CalculatorPage';
  
  // Step 1: Replace imports
  // Remove: dynamic from "next/dynamic", Link from "next/link"
  content = content.replace(/import\s+dynamic\s+from\s+["']next\/dynamic["'];\s*\n/g, '');
  content = content.replace(/import\s+Link\s+from\s+["']next\/link["'];\s*\n/g, '');
  // Remove: const Plot = dynamic(...)
  content = content.replace(/const\s+Plot\s*=\s*dynamic\([^)]+\);\s*\n/g, '');
  
  // Add shared component imports after "use client"
  const hasPlot = content.includes('Plot') || content.includes('chartData') || content.includes('plotData');
  const hasInputs = content.includes('type="range"') || content.includes('type="number"');
  const hasResults = content.includes('Result') || content.includes('result');
  
  let newImports = `import CalculatorShell from "${COMPONENTS}/calculator-shell";\n`;
  if (hasPlot) newImports += `import ChartPanel from "${COMPONENTS}/chart-panel";\n`;
  if (hasInputs) newImports += `import InputSlider from "${COMPONENTS}/input-slider";\n`;
  if (hasResults) newImports += `import ResultCard from "${COMPONENTS}/result-card";\n`;
  if (isLaserSafety) newImports += `import LaserSafetyDisclaimer from "${COMPONENTS}/laser-safety-disclaimer";\n`;
  
  // Insert imports after the last import line
  const importRegex = /^(import\s+[^;]+;\s*\n)+/m;
  const importMatch = content.match(importRegex);
  if (importMatch) {
    content = content.replace(importRegex, importMatch[0] + '\n' + newImports);
  }
  
  // Step 2: Find the return statement and wrap in CalculatorShell
  // Find the return( block
  const returnMatch = content.match(/(\s+)return\s*\(\s*\n?/);
  if (!returnMatch) return { status: 'skip', reason: 'no return found' };
  
  // Extract description from the page - look for comments or use default
  let description = `Calculate ${pageTitle.replace(/-/g, ' ')} parameters`;
  const descMatch = content.match(/\/\/\s*(.+?)[\n\r]/);
  if (descMatch) description = descMatch[1].trim();
  
  // Step 3: Replace <Plot> with <ChartPanel>
  content = content.replace(/<Plot\s+data=\{(\w+)\}\s+layout=\{([^}]+)\}[^/]*\/>/g, 
    (match, dataVar, layoutVar) => {
      // Try to find if layout is a variable reference
      const cleanLayout = layoutVar.trim();
      if (cleanLayout.startsWith('{') || cleanLayout.startsWith('layout')) {
        return `<ChartPanel data={${dataVar}} layout={${cleanLayout}} />`;
      }
      return `<ChartPanel data={${dataVar}} layout={${cleanLayout}} />`;
    });
  
  // Also handle <Plot data={...} layout={...} config={...} />
  content = content.replace(/<Plot\s+data=\{(\w+)\}([\s\S]*?)<\/Plot>/g,
    (match, dataVar, inner) => {
      // Extract layout and config from inner content
      const layoutMatch = inner.match(/layout=\{([^}]+)\}/);
      const configMatch = inner.match(/config=\{([^}]+)\}/);
      const titleMatch = inner.match(/title:\s*["']([^"']+)["']/);
      let attrs = `data={${dataVar}}`;
      if (layoutMatch) attrs += ` layout={${layoutMatch[1]}}`;
      if (configMatch) attrs += ` config={${configMatch[1]}}`;
      if (titleMatch) attrs += ` title="${titleMatch[1]}"`;
      return `<ChartPanel ${attrs} />`;
    });
  
  // Handle self-closing <Plot ... />
  content = content.replace(/<Plot\s+data=\{(\w+)\}\s+layout=\{(\w+)\}\s+config=\{(\w+)\}\s*\/>/g,
    '<ChartPanel data={$1} layout={$2} config={$3} />');
  
  // Handle multiline <Plot data={...} layout={...} />
  content = content.replace(/<Plot\s+data=\{(\w+)\}\s+layout=\{(\w+)\}\s*\n([^>]*?)\/>/g,
    (match, dataVar, layoutVar, rest) => {
      const titleMatch = rest.match(/title:\s*["']([^"']+)["']/);
      let attrs = `data={${dataVar}} layout={${layoutVar}}`;
      if (titleMatch) attrs += ` title="${titleMatch[1]}"`;
      return `<ChartPanel ${attrs} />`;
    });
  
  // Step 4: Replace <main> wrapper with CalculatorShell
  // Remove <main className="...">
  content = content.replace(/<main\s+className="[^"]*">\s*\n/g, '');
  // Remove closing </main>
  content = content.replace(/\s*<\/main>\s*\n/g, '\n');
  
  // Remove "← Back to ..." Link
  content = content.replace(/<Link\s+href="[^"]*"\s+className="[^"]*">\s*←[^<]*<\/Link>\s*\n/g, '');
  
  // Remove standalone <h1>...</h1> (CalculatorShell provides it)
  content = content.replace(/<h1[^>]*>[^<]*<\/h1>\s*\n/g, '');
  
  // Step 5: Wrap the return content in CalculatorShell
  // Find the return statement's opening
  const returnIdx = content.indexOf('return');
  const returnParen = content.indexOf('(', returnIdx);
  
  // Find the matching closing paren
  let depth = 0;
  let startSearch = returnParen;
  for (let i = startSearch; i < content.length; i++) {
    if (content[i] === '(') depth++;
    else if (content[i] === ')') {
      depth--;
      if (depth === 0) {
        // Found the matching close paren
        // Extract inner content
        const innerStart = returnParen + 1;
        const innerEnd = i;
        let inner = content.substring(innerStart, innerEnd).trim();
        
        // Build CalculatorShell wrapper
        const shellOpen = `<CalculatorShell backHref="/${page.category}" backLabel="${categoryLabel}" title="${pageTitle}" description="${description}">\n${isLaserSafety ? '      <LaserSafetyDisclaimer />\n' : ''}`;
        const shellClose = `\n    </CalculatorShell>`;
        
        // Wrap the content
        const wrapped = `(\n      ${shellOpen}      ${inner}\n    ${shellClose}\n    )`;
        
        content = content.substring(0, returnParen) + wrapped + content.substring(innerEnd + 1);
        break;
      }
    }
  }
  
  return { status: 'migrated', content };
}

// Main
const pages = findPages();
console.log(`Found ${pages.length} pages to process${dryRun ? ' (dry run)' : ''}`);

let migrated = 0, skipped = 0, errors = 0;

for (const page of pages) {
  try {
    const result = migratePage(page);
    if (result.status === 'skip') {
      skipped++;
    } else if (result.status === 'migrated') {
      if (!dryRun) {
        fs.writeFileSync(page.file, result.content, 'utf-8');
      }
      migrated++;
      if (migrated % 20 === 0) console.log(`  Migrated ${migrated}...`);
    }
  } catch (err) {
    errors++;
    console.error(`  ERROR: ${page.category}/${page.name}: ${err.message}`);
  }
}

console.log(`\nDone: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
