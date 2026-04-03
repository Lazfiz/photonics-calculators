const fs = require('fs');
const path = require('path');

const BASE = 'src/app';

const pages = [
  ...['free-space-comms', 'acquisition-tracking','adaptive-optics','adaptive-optics-gain','aperture-averaging',
  'atmosphere','atmospheric-loss','background-noise','beam-wander','ber','bpsk-qpsk',
  'channel-capacity','diversity-reception','eye-safety-fso','fade-probability','fog-attenuation',
  'geometric-loss','lasercom-link','optical-antenna','point-ahead','pointing-error',
  'pointing-loss','quantum-key-distribution','rain-attenuation','receiver-fov','scintillation',
  'scintillation-index','security','snow-attenuation','wavelength-selection'].map(p => ['free-space-comms', p]),
  ...['imaging', '3d-reconstruction','adaptive-optics','adaptive-optics-microscopy','afocal','cleared-tissue',
  'coherent-anti-stokes','coherent-raman','coherent-raman-microscopy','computational-imaging',
  'computer-generated-holography','confocal-pin-hole','contrast-methods','deconvolution',
  'denoising-algorithms','digital-holography','dynamic-range','expansion-microscopy','fcs',
  'fluorescence-spectra','frap','harmonic-generation','hyperspectral-microscopy','illumination',
  'light-field','light-sheet','light-sheet-microscopy','light-sheet-thickness','low-coherence',
  'multiphoton-depth','optical-sectioning','optical-sectioning-thickness','palm-storm',
  'photoacoustic','plenoptic-camera','pupil-matching','registration','second-harmonic',
  'second-harmonic-generation','second-harmonic-microscopy','selective-plane','sensor-ccm',
  'sensor-cmos','shack-hartmann','signal-to-noise','speckle-imaging','spectral-unmixing',
  'spinning-disk','sted-resolution','stimulated-raman-microscopy','stitching','strehl-ratio',
  'structured-illumination','sum-frequency-microscopy','super-resolution','telecentricity',
  'third-harmonic-generation','third-harmonic-microscopy','three-photon-microscopy','tirf',
  'two-photon','two-photon-excitation','two-photon-microscopy','wavefront-error',
  'wavefront-sensing','wavefront-sensor'].map(p => ['imaging', p])
];

const CATEGORY_LABELS = {
  'free-space-comms': 'Free-Space Comms',
  'imaging': 'Imaging',
};

function titleCase(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Find matching closing brace for JSX attribute value
function findMatchingBrace(src, startIdx) {
  let depth = 0;
  let inString = false;
  let stringChar = '';
  for (let i = startIdx; i < src.length; i++) {
    const c = src[i];
    if (inString) {
      if (c === '\\' && i + 1 < src.length) { i++; continue; }
      if (c === stringChar) inString = false;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inString = true; stringChar = c; continue; }
    if (c === '{') depth++;
    if (c === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

// Remove a JSX prop like style={{...}} or config={{...}} with proper brace matching
function removeProp(src, propName) {
  let result = '';
  let i = 0;
  while (i < src.length) {
    // Look for propName=
    const searchStr = propName + '=';
    const idx = src.indexOf(searchStr, i);
    if (idx === -1) { result += src.substring(i); break; }
    
    // Check it's a prop boundary (preceded by space or newline)
    if (idx > 0 && !/[\s\n]/.test(src[idx - 1])) {
      result += src.substring(i, idx + searchStr.length);
      i = idx + searchStr.length;
      continue;
    }
    
    result += src.substring(i, idx);
    const afterEq = idx + searchStr.length;
    
    if (src[afterEq] === '{') {
      const closeBrace = findMatchingBrace(src, afterEq);
      if (closeBrace === -1) {
        result += src.substring(idx);
        break;
      }
      i = closeBrace + 1;
    } else if (src[afterEq] === '"') {
      const closeQuote = src.indexOf('"', afterEq + 1);
      if (closeQuote === -1) {
        result += src.substring(idx);
        break;
      }
      i = closeQuote + 1;
    } else {
      result += src.substring(idx, afterEq);
      i = afterEq;
    }
  }
  return result;
}

function migrateFile(category, pageName) {
  const filePath = path.join(BASE, category, pageName, 'page.tsx');
  if (!fs.existsSync(filePath)) return 'not-found';
  
  let src = fs.readFileSync(filePath, 'utf8');
  if (src.includes('CalculatorShell')) return 'already-done';
  if (!src.includes('dynamic from "next/dynamic"') && !src.includes('Link from "next/link"')) return 'skip';
  
  // Extract metadata BEFORE modifying
  const h1Match = src.match(/<h1[^>]*>(.*?)<\/h1>/s);
  const h1Title = h1Match ? h1Match[1].trim() : titleCase(pageName);
  const descMatch = src.match(/<p[^>]*className="[^"]*text-gray-400[^"]*"[^>]*>(.*?)<\/p>/s);
  const description = descMatch ? descMatch[1].trim() : '';
  
  // 1. Remove old imports
  src = src.replace(/import dynamic from "next\/dynamic";\n/g, '');
  src = src.replace(/import Link from "next\/link";\n/g, '');
  src = src.replace(/const Plot = dynamic\(\(\) => import\("react-plotly\.js"\), \{ ssr: false \}\);\n/g, '');
  
  // 2. Add new imports
  const newImports = `import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";`;
  
  src = src.replace(/("use client";)/, `$1\n\n${newImports}`);
  
  // 3. Replace <Plot with <ChartPanel and remove style prop
  src = src.replace(/<Plot /g, '<ChartPanel ');
  
  // Find each ChartPanel tag and remove style prop from it
  // Do this by finding <ChartPanel ... /> and processing each one
  let finalSrc = '';
  let i = 0;
  while (i < src.length) {
    const tagStart = src.indexOf('<ChartPanel', i);
    if (tagStart === -1) { finalSrc += src.substring(i); break; }
    
    finalSrc += src.substring(i, tagStart);
    
    // Find end of tag
    let tagEnd = -1;
    let depth = 0;
    let inStr = false;
    let strCh = '';
    for (let j = tagStart; j < src.length; j++) {
      const c = src[j];
      if (inStr) { if (c === '\\' && j+1 < src.length) { j++; continue; } if (c === strCh) inStr = false; continue; }
      if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue; }
      if (c === '{') depth++;
      if (c === '}') depth--;
      if (src.substring(j, j+2) === '/>') { tagEnd = j + 2; break; }
      if (c === '>' && depth === 0) { tagEnd = j + 1; break; }
    }
    
    if (tagEnd === -1) { finalSrc += src.substring(tagStart); break; }
    
    let tagContent = src.substring(tagStart, tagEnd);
    
    // Remove style prop with brace matching
    tagContent = removeProp(tagContent, 'style');
    
    finalSrc += tagContent;
    i = tagEnd;
  }
  src = finalSrc;
  
  // 4. Remove Link back button
  src = src.replace(/<Link href="[^"]*"[^>]*>←[^<]*<\/Link>\n?/g, '');
  
  // 5. Remove h1
  src = src.replace(/<h1[^>]*>.*?<\/h1>\n?/gs, '');
  
  // 6. Remove description p
  src = src.replace(/<p[^>]*className="[^"]*text-gray-400[^"]*"[^>]*>.*?<\/p>\n?/gs, '');
  
  // 7. Replace outer div with CalculatorShell
  const outerDivMatch = src.match(/<div className="min-h-screen[^"]*">/);
  if (outerDivMatch) {
    const shellOpen = `<CalculatorShell\n      backHref="/${category}"\n      backLabel="${CATEGORY_LABELS[category]}"\n      title="${h1Title.replace(/"/g, '&quot;')}"\n      description="${description.replace(/"/g, '&quot;')}"\n      maxWidthClassName="max-w-5xl"\n    >`;
    src = src.replace(outerDivMatch[0], shellOpen);
    
    // Replace last </div> with </CalculatorShell>
    let lastDivClose = -1;
    let searchFrom = 0;
    while (true) {
      const idx = src.indexOf('</div>', searchFrom);
      if (idx === -1) break;
      lastDivClose = idx;
      searchFrom = idx + 1;
    }
    if (lastDivClose > 0) {
      src = src.substring(0, lastDivClose) + '</CalculatorShell>' + src.substring(lastDivClose + 6);
    }
  }
  
  fs.writeFileSync(filePath, src, 'utf8');
  return 'migrated';
}

let stats = { migrated: 0, skipped: 0, errors: 0 };
for (const [cat, page] of pages) {
  try {
    const r = migrateFile(cat, page);
    const sym = r === 'migrated' ? '✓' : r === 'already-done' ? '-' : '○';
    console.log(`${sym} ${cat}/${page} (${r})`);
    if (r === 'migrated') stats.migrated++;
    else stats.skipped++;
  } catch(e) { console.log(`✗ ${cat}/${page}: ${e.message}`); stats.errors++; }
}
console.log(`\nDone: migrated=${stats.migrated} skipped=${stats.skipped} errors=${stats.errors}`);
