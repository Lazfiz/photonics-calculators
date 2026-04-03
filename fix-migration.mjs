#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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

  // 1. Remove leftover Plot const declaration
  if (src.includes('const Plot = dynamic(') || src.includes('const Plot = dynamic (')) {
    src = src.replace(/\n*const\s+Plot\s*=\s*dynamic\s*\([^;]*\);\n*/g, '\n');
    changed = true;
  }

  // 2. Remove any remaining dynamic import
  if (src.includes('import dynamic from')) {
    src = src.replace(/import\s+dynamic\s+from\s+"next\/dynamic";\s*\n/g, '');
    changed = true;
  }
  // Remove any remaining Link import
  if (src.includes('import Link from')) {
    src = src.replace(/import\s+Link\s+from\s+"next\/link";\s*\n/g, '');
    changed = true;
  }

  // 3. Replace <input type="number"> with InputSlider
  // Match the label+span+input pattern more flexibly
  // The input may span multiple lines and have attrs in any order
  const inputRegex = /<label className="block">\s*<span className="text-gray-300 text-sm">([\s\S]*?)<\/span>\s*\n?\s*<input type="number"([^>]*?)\s*\/>\s*<\/label>/g;
  
  if (inputRegex.test(src)) {
    // Reset lastIndex
    inputRegex.lastIndex = 0;
    
    src = src.replace(inputRegex, (match, labelHtml, attrs) => {
      const valMatch = attrs.match(/value=\{([^}]+)\}/);
      const onChangeMatch = attrs.match(/onChange=\{([^}]+)\}/);
      if (!valMatch || !onChangeMatch) return match;
      
      const valRef = valMatch[1];
      const onChangeRaw = onChangeMatch[1];
      
      // Parse onChange: e => setX(+e.target.value) or e => setX(+e.target.value * 1e6) etc
      const simpleSetter = onChangeRaw.match(/e\s*=>\s*(set\w+)\(\+e\.target\.value/);
      const scaledSetter = onChangeRaw.match(/e\s*=>\s*(set\w+)\(\+e\.target\.value\s*\*\s*(\d[\deE+-.]*)\)/);
      
      let setterName, displayValue, scale;
      if (scaledSetter) {
        setterName = scaledSetter[1];
        scale = scaledSetter[2];
        // value ref is like countRate / 1e6, we need to adjust
        displayValue = valRef;
      } else if (simpleSetter) {
        setterName = simpleSetter[1];
      } else {
        return match; // can't parse, leave as-is
      }
      
      // Extract unit from label
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

  // 4. Replace result display divs with ResultCard
  // Pattern A: <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
  //            <p className="text-sm text-gray-400">LABEL</p>
  //            <p className="text-xl font-bold text-COLOR">VALUE</p>
  //            </div>
  const resultRegex = /<div className="bg-gray-900 border border-gray-800 rounded-lg p-4">\s*\n?\s*<p className="text-sm text-gray-400">([\s\S]*?)<\/p>\s*\n?\s*<p className="text-xl font-bold text-([\w-]+)">([\s\S]*?)<\/p>\s*\n?\s*<\/div>/g;
  
  if (resultRegex.test(src)) {
    resultRegex.lastIndex = 0;
    const toneMap = { red: 'red', blue: 'blue', green: 'green', yellow: 'yellow', purple: 'purple', orange: 'orange', cyan: 'cyan' };
    
    src = src.replace(resultRegex, (match, label, color, value) => {
      const tone = toneMap[color] || 'blue';
      const cleanLabel = label.trim().replace(/"/g, '&quot;');
      return `<ResultCard label="${cleanLabel}" value={\`${value.trim()}\`} tone="${tone}" />`;
    });
    changed = true;
  }

  // 5. Also handle <input type="number" ...> without self-close (some files use > instead of />)
  const inputRegex2 = /<label className="block">\s*<span className="text-gray-300 text-sm">([\s\S]*?)<\/span>\s*\n?\s*<input type="number"([^>]*?)>\s*<\/label>/g;
  if (inputRegex2.test(src) && !src.includes('InputSlider')) {
    // Don't double-process
  }

  if (changed) {
    // Clean up multiple blank lines
    src = src.replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(file, src, 'utf-8');
    fixed++;
    console.log('FIXED:', file);
  }
}

console.log(`\nFixed ${fixed} files`);
