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

  // 1. Remove leftover Plot const
  if (/const\s+Plot\s*=\s*dynamic\s*\(/.test(src)) {
    src = src.replace(/\n*const\s+Plot\s*=\s*dynamic\s*\([\s\S]*?\);\n*/g, '\n');
    changed = true;
  }

  // 2. Remove any remaining dynamic/Link imports
  if (/import\s+dynamic\s+from/.test(src)) {
    src = src.replace(/import\s+dynamic\s+from\s+"next\/dynamic";\s*\n/g, '');
    changed = true;
  }
  if (/import\s+Link\s+from/.test(src)) {
    src = src.replace(/import\s+Link\s+from\s+"next\/link";\s*\n/g, '');
    changed = true;
  }

  // 3. Replace multi-line <label>...<input type="number".../>...</label> with InputSlider
  // Use a more permissive regex with [\s\S] for multiline content
  const multiLineInputRegex = /<label className="block">\s*\n\s*<span className="text-gray-300 text-sm">([\s\S]*?)<\/span>\s*\n\s*<input type="number"([\s\S]*?)\/>\s*\n\s*<\/label>/g;
  
  if (multiLineInputRegex.test(src)) {
    multiLineInputRegex.lastIndex = 0;
    src = src.replace(multiLineInputRegex, (match, labelHtml, attrsBlock) => {
      // attrsBlock may span lines - collapse
      const attrs = attrsBlock.replace(/\s+/g, ' ').trim();
      
      const valMatch = attrs.match(/value=\{([^}]+)\}/);
      const onChangeMatch = attrs.match(/onChange=\{([^}]+)\}/);
      if (!valMatch || !onChangeMatch) return match;
      
      const valRef = valMatch[1];
      const onChangeRaw = onChangeMatch[1];
      
      // Parse onChange to get setter name
      const setterMatch = onChangeRaw.match(/(?:e\s*=>\s*)?(set\w+)\s*\(/);
      if (!setterMatch) return match;
      const setterName = setterMatch[1];
      
      // Extract label text and unit
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
      
      return `<InputSlider ${props} />`;
    });
    changed = true;
  }

  // Also try single-line variant (for any remaining)
  const singleLineInputRegex = /<label className="block"><span className="text-gray-300 text-sm">([\s\S]*?)<\/span>\s*<input type="number"([^>]*?)\s*\/>\s*<\/label>/g;
  if (singleLineInputRegex.test(src)) {
    singleLineInputRegex.lastIndex = 0;
    src = src.replace(singleLineInputRegex, (match, labelHtml, attrs) => {
      const valMatch = attrs.match(/value=\{([^}]+)\}/);
      const onChangeMatch = attrs.match(/onChange=\{([^}]+)\}/);
      if (!valMatch || !onChangeMatch) return match;
      
      const valRef = valMatch[1];
      const setterMatch = onChangeMatch[1].match(/(?:e\s*=>\s*)?(set\w+)\s*\(/);
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
      
      return `<InputSlider ${props} />`;
    });
    changed = true;
  }

  // 4. Remove config={...} from ChartPanel tags (not a supported prop)
  src = src.replace(/<ChartPanel([^>]*?)\s+config=\{[^}]*\}\s*(\/?>)/g, '<ChartPanel$1 $2');
  // Also handle config with complex content
  src = src.replace(/<ChartPanel([^>]*?)\s+config=\{\{[^}]*\}\}\s*(\/?>)/g, '<ChartPanel$1 $2');

  // 5. Remove paper_bgcolor, plot_bgcolor, font from layout in ChartPanel
  // These are handled by ChartPanel's dark theme
  src = src.replace(/<ChartPanel([\s\S]*?)\s*\/>/g, (match, inner) => {
    let clean = inner;
    // Remove paper_bgcolor lines
    clean = clean.replace(/paper_bgcolor:\s*"[^"]*",?\s*/g, '');
    clean = clean.replace(/plot_bgcolor:\s*"[^"]*",?\s*/g, '');
    // Remove font: { color: ... } 
    clean = clean.replace(/font:\s*\{\s*color:\s*"[^"]*"\s*\},?\s*/g, '');
    clean = clean.replace(/autosize:\s*true,?\s*/g, '');
    // Fix trailing commas
    clean = clean.replace(/,\s*}/g, ' }');
    clean = clean.replace(/,\s*\n\s*\)/g, '\n      )');
    return `<ChartPanel${clean} />`;
  });

  // 6. Remove className and style from ChartPanel (not supported props)
  // Already handled above since we clean all non-data/layout attrs

  // 7. Replace result divs that still have old styling with ResultCard
  // Pattern: bare result divs with just a value <p> (label was already stripped)
  // These are orphaned - let's just leave them as styled divs for now since we can't recover the labels

  // 8. Fix formula divs - add font-mono if missing
  src = src.replace(
    /className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1"/g,
    'className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"'
  );

  if (changed) {
    src = src.replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(file, src, 'utf-8');
    fixed++;
    console.log('FIXED:', path.relative(base, file));
  }
}

console.log(`\nFixed ${fixed} files`);
