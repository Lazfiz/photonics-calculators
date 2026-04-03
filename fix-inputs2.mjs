#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const base = '/home/marius/.openclaw/workspace/photonics-calculators/src/app';

function getFiles() {
  const files = [];
  for (const cat of ['detectors', 'fiber-optics']) {
    for (const entry of fs.readdirSync(path.join(base, cat), { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const f = path.join(base, cat, entry.name, 'page.tsx');
        if (fs.existsSync(f)) files.push(f);
      }
    }
  }
  return files;
}

function processInput(match, labelHtml, attrsStr) {
  const attrs = attrsStr.replace(/\s+/g, ' ').trim();
  
  const valMatch = attrs.match(/value=\{([^}]+)\}/);
  const onChangeMatch = attrs.match(/onChange=\{([^}]+)\}/);
  if (!valMatch || !onChangeMatch) return match;
  
  const valRef = valMatch[1];
  const onChangeRaw = onChangeMatch[1];
  
  const setterMatch = onChangeRaw.match(/(?:e\s*=>\s*)?(set\w+)\s*\(/);
  if (!setterMatch) return match;
  const setterName = setterMatch[1];
  
  const labelText = labelHtml.replace(/<[^>]*>/g, '').trim();
  let unit = '';
  const unitMatch = labelText.match(/\(([^)]+)\)\s*$/);
  let cleanLabel = labelText;
  if (unitMatch) { unit = unitMatch[1]; cleanLabel = labelText.replace(/\s*\([^)]+\)\s*$/, '').trim(); }
  
  const minMatch = attrs.match(/min="([^"]*)"/);
  const maxMatch = attrs.match(/max="([^"]*)"/);
  const stepMatch = attrs.match(/step="([^"]*)"/);
  
  let props = `label="${cleanLabel.replace(/"/g, '&quot;')}" value={${valRef}} onChange={${setterName}}`;
  if (minMatch) props += ` min={${minMatch[1]}}`;
  if (maxMatch) props += ` max={${maxMatch[1]}}`;
  if (stepMatch) props += ` step={${stepMatch[1]}}`;
  if (unit) props += ` unit="${unit}"`;
  
  return `        <InputSlider ${props} />`;
}

let fixed = 0;
for (const file of getFiles()) {
  let src = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // Use [\s\S]+? instead of [^>]*? to handle > in JSX expressions like e => 
  // Pattern: <label className="block"><span ...>Label</span>\n  <input type="number" .../>  </label>
  // or: <label className="block"><span ...>Label</span>\n  <input type="number" .../>\n  </label>
  
  const regex = /<label className="block">([\s\S]*?)<\/label>/g;
  if (regex.test(src) && src.includes('<input type="number"')) {
    regex.lastIndex = 0;
    src = src.replace(regex, (match) => {
      if (!match.includes('<input type="number"')) return match;
      
      const labelMatch = match.match(/<span className="text-gray-300 text-sm">([\s\S]*?)<\/span>/);
      const inputMatch = match.match(/<input type="number"([\s\S]*?)\s*\/>/);
      if (!labelMatch || !inputMatch) return match;
      
      changed = true;
      return processInput(match, labelMatch[1], inputMatch[1]);
    });
  }

  if (changed) {
    src = src.replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(file, src, 'utf-8');
    fixed++;
    console.log('FIXED:', path.relative(base, file));
  }
}

console.log(`\nFixed ${fixed} files`);
