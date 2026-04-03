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
  
  // Parse setter: e => setX(...) or just setX(...)
  const setterMatch = onChangeRaw.match(/(?:e\s*=>\s*)?(set\w+)\s*\(/);
  if (!setterMatch) return match;
  const setterName = setterMatch[1];
  
  // Label text & unit
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

  // Pattern A: <label> and <span> on same line, <input> on next line, </label> same as input
  // <label className="block"><span ...>Label</span>\n  <input ... /></label>
  const regexA = /<label className="block"><span className="text-gray-300 text-sm">([\s\S]*?)<\/span>\s*\n(\s*)<input type="number"([^>]*?)\s*\/><\/label>/g;
  if (regexA.test(src)) {
    regexA.lastIndex = 0;
    src = src.replace(regexA, (m, label, indent, attrs) => {
      changed = true;
      return processInput(m, label, attrs);
    });
  }

  // Pattern B: All on one line
  // <label className="block"><span ...>Label</span><input ... /></label>
  const regexB = /<label className="block"><span className="text-gray-300 text-sm">([\s\S]*?)<\/span><input type="number"([^>]*?)\s*\/><\/label>/g;
  if (regexB.test(src)) {
    regexB.lastIndex = 0;
    src = src.replace(regexB, (m, label, attrs) => {
      changed = true;
      return processInput(m, label, attrs);
    });
  }

  // Pattern C: label on one line, span on next, input on next
  const regexC = /<label className="block">\s*\n\s*<span className="text-gray-300 text-sm">([\s\S]*?)<\/span>\s*\n\s*<input type="number"([^>]*?)\s*\/>\s*\n?\s*<\/label>/g;
  if (regexC.test(src)) {
    regexC.lastIndex = 0;
    src = src.replace(regexC, (m, label, attrs) => {
      changed = true;
      return processInput(m, label, attrs);
    });
  }

  // Pattern D: label, span same line, input next line, close label next line
  const regexD = /<label className="block"><span className="text-gray-300 text-sm">([\s\S]*?)<\/span>\s*\n\s*<input type="number"([^>]*?)\s*\/>\s*\n\s*<\/label>/g;
  if (regexD.test(src)) {
    regexD.lastIndex = 0;
    src = src.replace(regexD, (m, label, attrs) => {
      changed = true;
      return processInput(m, label, attrs);
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
