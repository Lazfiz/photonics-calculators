#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node final-migrate.mjs <file>...');
  process.exit(1);
}

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log('SKIP (not found):', file);
    continue;
  }
  
  let src = fs.readFileSync(file, 'utf-8');
  
  if (src.includes('CalculatorShell')) {
    console.log('SKIP (already migrated):', file);
    continue;
  }

  // Extract category
  const catMatch = file.match(/src\/app\/([^/]+)\//);
  const cat = catMatch ? catMatch[1] : 'calculators';
  const catLabel = cat.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

  // Extract title and description
  const titleMatch = src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Calculator';
  
  const descMatch = src.match(/<p[^>]*className="[^"]*text-gray-400[^"]*"[^>]*>([\s\S]*?)<\/p>/);
  const desc = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '';

  // 1. Replace imports
  src = src.replace(/import dynamic from "next\/dynamic";\n/g, '');
  src = src.replace(/import Link from "next\/link";\n/g, '');
  src = src.replace(/const Plot = dynamic\(\(\) => import\("react-plotly\.js"\), \{ ssr: false \}\);\n/g, '');
  
  // Add new imports after "use client"
  const newImports = `import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";`;
  
  src = src.replace(/"use client";\n\n/, `"use client";\n\n${newImports}\n\n`);

  // 2. Remove Link, h1, description
  src = src.replace(/<Link[^>]*>[\s\S]*?<\/Link>\s*\n?/g, '');
  src = src.replace(/<h1[^>]*>[\s\S]*?<\/h1>\s*\n?/g, '');
  src = src.replace(/<p[^>]*className="[^"]*text-gray-400[^"]*"[^>]*>[\s\S]*?<\/p>\s*\n?/g, '');

  // 3. Replace <Plot with <ChartPanel and remove config prop
  src = src.replace(/<Plot\s+/g, '<ChartPanel ');
  src = src.replace(/\s+config=\{\{[^}]*\}\}\s*\/>/g, ' />');
  src = src.replace(/\s+config=\{[^}]*\}\s*\/>/g, ' />');

  // 4. Remove outer wrapper div and wrap in CalculatorShell
  src = src.replace(/<div className="min-h-screen[^>]*>\s*\n?/g, '');
  
  // Find the last </div> before ); and replace with </CalculatorShell>
  const lines = src.split('\n');
  let lastDivClose = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^\s*<\/div>\s*$/.test(lines[i])) {
      lastDivClose = i;
      break;
    }
  }
  
  if (lastDivClose >= 0) {
    lines[lastDivClose] = lines[lastDivClose].replace('</div>', '</CalculatorShell>');
    src = lines.join('\n');
  }

  // Add CalculatorShell wrapper after return (
  src = src.replace(/return \(\s*\n/, `return (
    <CalculatorShell
      backHref="/${cat}"
      backLabel="${catLabel}"
      title="${title.replace(/"/g, '\\"')}"
      description="${desc.slice(0, 150).replace(/"/g, '\\"')}"
    >
`);

  // 5. Close CalculatorShell properly
  src = src.replace(/\s*\);\s*}$/, `
    </CalculatorShell>
  );`);

  // 6. Convert number inputs to InputSlider
  src = src.replace(/<input\s+type="number"\s+value=\{([^}]+)\}\s+onChange=\{e\s*=>\s*(set\w+)\(\+e\.target\.value\)\}\s+([^>]*)\s*\/>/g, (m, val, setter, rest) => {
    const labelMatch = rest.match(/className="[^"]*"/);
    const stepMatch = rest.match(/step="([^"]*)"/);
    const minMatch = rest.match(/min="([^"]*)"/);
    const maxMatch = rest.match(/max="([^"]*)"/);
    
    let props = `label="${val}" value={${val}} onChange={${setter}}`;
    if (stepMatch) props += ` step={${stepMatch[1]}}`;
    if (minMatch) props += ` min={${minMatch[1]}}`;
    if (maxMatch) props += ` max={${maxMatch[1]}}`;
    
    return `<InputSlider ${props} />`;
  });

  fs.writeFileSync(file, src);
  console.log('MIGRATED:', file);
}
