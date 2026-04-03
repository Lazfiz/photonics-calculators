#!/usr/bin/env node
// Fix the 8 laser-safety pages with dark theme variant
import fs from 'fs';
import path from 'path';

const files = [
  'src/app/laser-safety/beam-diameter-conversion/page.tsx',
  'src/app/laser-safety/blue-light-hazard/page.tsx',
  'src/app/laser-safety/infrared-corneal/page.tsx',
  'src/app/laser-safety/maximum-exposure/page.tsx',
  'src/app/laser-safety/power-density/page.tsx',
  'src/app/laser-safety/scanned-mpe/page.tsx',
  'src/app/laser-safety/thermal-vs-photochemical/page.tsx',
  'src/app/laser-safety/uv-exposure/page.tsx',
];

for (const f of files) {
  let c = fs.readFileSync(f, 'utf-8');
  
  // Add imports after react import
  if (!c.includes('CalculatorShell')) {
    c = c.replace(
      /(import \{[^}]+\} from "react";)/,
      '$1\nimport CalculatorShell from "../../../components/calculator-shell";\nimport ChartPanel from "../../../components/chart-panel";\nimport LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";'
    );
  }
  
  // Fix the wrapper opening (add title)
  c = c.replace(
    /<CalculatorShell backHref="\/laser-safety" backLabel="Laser Safety">/,
    '<CalculatorShell backHref="/laser-safety" backLabel="Laser Safety">'
  );
  
  // Remove leftover empty lines from removed imports
  c = c.replace(/\n\n\n+/g, '\n\n');
  
  // Find and replace the closing div
  // These pages use a different wrapper, find the last </div> before ); }
  const lines = c.split('\n');
  let shellIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<CalculatorShell')) { shellIdx = i; break; }
  }
  if (shellIdx >= 0) {
    let funcEnd = lines.length;
    for (let i = shellIdx + 1; i < lines.length; i++) {
      if (/^(export )?(default )?function /.test(lines[i].trimStart())) { funcEnd = i; break; }
    }
    // Find last </div> at 4-space indent before ); 
    for (let i = funcEnd - 1; i > shellIdx; i--) {
      if (/^    <\/div>$/.test(lines[i])) {
        const after = lines.slice(i + 1, Math.min(i + 4, funcEnd)).map(l => l.trim()).filter(Boolean).join('');
        if (after.startsWith(');')) {
          lines[i] = '    </CalculatorShell>';
          break;
        }
      }
    }
  }
  
  fs.writeFileSync(f, lines.join('\n'));
  console.log(`✅ ${path.basename(path.dirname(f))}`);
}
