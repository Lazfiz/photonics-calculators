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

let fixed = 0;
for (const file of getFiles()) {
  let src = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // Pattern: <div ...><span ...>LABEL</span>\n<input type="..." ... />\n</div>
  // Replace the entire div with InputSlider
  const regex = /<div className="[^"]*">\s*\n?\s*<span className="[^"]*">([\s\S]*?)<\/span>\s*\n?\s*<input type="(?:number|range)"([\s\S]*?)\s*\/>\s*\n?\s*<\/div>/g;
  
  if (regex.test(src)) {
    regex.lastIndex = 0;
    src = src.replace(regex, (match, labelText, attrs) => {
      const cleanAttrs = attrs.replace(/\s+/g, ' ').trim();
      
      let valMatch = cleanAttrs.match(/value=\{([^}]+)\}/) || cleanAttrs.match(/value="([^"]+)"/);
      let onChangeMatch = cleanAttrs.match(/onChange=\{([^}]+)\}/);
      if (!valMatch || !onChangeMatch) return match;
      
      const valRef = valMatch[1];
      const onChangeRaw = onChangeMatch[1];
      
      // Handle various onChange patterns:
      // (e) => setX(parseFloat(e.target.value) || 0)
      // (e) => setX(Number(e.target.value))
      // e => setX(+e.target.value)
      const setterMatch = onChangeRaw.match(/(?:\(\s*e\s*\)\s*=>|e\s*=>)\s*(set\w+)\s*\(/);
      if (!setterMatch) return match;
      const setterName = setterMatch[1];
      
      let unit = '';
      const unitMatch = labelText.match(/\(([^)]+)\)\s*$/);
      let cleanLabel = labelText.trim();
      if (unitMatch) { unit = unitMatch[1]; cleanLabel = labelText.trim().replace(/\s*\([^)]+\)\s*$/, ''); }
      
      const minMatch = cleanAttrs.match(/min="([^"]*)"/) || cleanAttrs.match(/min=\{([^}]+)\}/);
      const maxMatch = cleanAttrs.match(/max="([^"]*)"/) || cleanAttrs.match(/max=\{([^}]+)\}/);
      const stepMatch = cleanAttrs.match(/step="([^"]*)"/) || cleanAttrs.match(/step=\{([^}]+)\}/);
      
      let props = `label="${cleanLabel.replace(/"/g, '&quot;')}" value={${valRef}} onChange={${setterName}}`;
      if (minMatch) props += ` min={${minMatch[1]}}`;
      if (maxMatch) props += ` max={${maxMatch[1]}}`;
      if (stepMatch) props += ` step={${stepMatch[1]}}`;
      if (unit) props += ` unit="${unit}"`;
      
      changed = true;
      return `<InputSlider ${props} />`;
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
