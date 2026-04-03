const fs = require('fs');
const path = require('path');

const BASE = 'src/app';

const fscPages = [
  'acquisition-tracking','adaptive-optics','adaptive-optics-gain','aperture-averaging',
  'atmosphere','atmospheric-loss','background-noise','beam-wander','ber','bpsk-qpsk',
  'channel-capacity','diversity-reception','eye-safety-fso','fade-probability','fog-attenuation',
  'geometric-loss','lasercom-link','optical-antenna','point-ahead','pointing-error',
  'pointing-loss','quantum-key-distribution','rain-attenuation','receiver-fov','scintillation',
  'scintillation-index','security','snow-attenuation','wavelength-selection'
];
const imgPages = [
  '3d-reconstruction','adaptive-optics','adaptive-optics-microscopy','afocal','cleared-tissue',
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
  'wavefront-sensing','wavefront-sensor'
];

const CATEGORY_LABELS = {
  'free-space-comms': 'Free-Space Comms',
  'imaging': 'Imaging',
};

function titleCase(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function findMatchingBrace(str, startIdx) {
  // startIdx points to the opening {
  let depth = 0;
  let inString = false;
  let stringChar = '';
  for (let i = startIdx; i < str.length; i++) {
    const c = str[i];
    if (inString) {
      if (c === '\\') { i++; continue; }
      if (c === stringChar) inString = false;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inString = true; stringChar = c; continue; }
    if (c === '{') depth++;
    if (c === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function findTagEnd(src, startIdx) {
  // Find the /> or > that closes the tag
  let inString = false;
  let stringChar = '';
  for (let i = startIdx; i < src.length; i++) {
    const c = src[i];
    if (inString) {
      if (c === '\\') { i++; continue; }
      if (c === stringChar) inString = false;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inString = true; stringChar = c; continue; }
    if (src.substring(i, i+2) === '/>') return i + 2;
    if (c === '>' && src[i-1] !== '/') return i + 1;
  }
  return -1;
}

function replacePlotWithChartPanel(src) {
  let result = '';
  let i = 0;
  while (i < src.length) {
    // Look for <Plot
    if (src.substring(i, i + 5) === '<Plot' && (i + 5 >= src.length || /[\s\/>]/.test(src[i+5]))) {
      // Found <Plot tag, find its end
      const tagEnd = findTagEnd(src, i);
      if (tagEnd === -1) {
        result += src[i]; i++; continue;
      }
      const tagContent = src.substring(i, tagEnd);
      
      // Extract data, layout, config, title props
      const dataMatch = tagContent.match(/data=\{(\w+)\}/);
      const titleMatch = tagContent.match(/title="([^"]*)"/);
      
      // Replace <Plot with <ChartPanel
      let newTag = tagContent.replace('<Plot', '<ChartPanel');
      
      // Remove style prop
      newTag = newTag.replace(/\s*style=\{[^}]*\}/, '');
      
      result += newTag;
      i = tagEnd;
    } else {
      result += src[i];
      i++;
    }
  }
  return result;
}

function migrateFile(category, pageName) {
  const filePath = path.join(BASE, category, pageName, 'page.tsx');
  if (!fs.existsSync(filePath)) return 'not-found';
  
  let src = fs.readFileSync(filePath, 'utf8');
  if (src.includes('CalculatorShell')) return 'already-done';
  if (!src.includes('dynamic from "next/dynamic"') && !src.includes('Link from "next/link"') && !src.includes('<Plot')) return 'skip-no-old-pattern';
  
  // 1. Remove old imports
  src = src.replace(/import dynamic from "next\/dynamic";\n/g, '');
  src = src.replace(/import Link from "next\/link";\n/g, '');
  src = src.replace(/const Plot = dynamic\(\(\) => import\("react-plotly\.js"\), \{ ssr: false \}\);\n/g, '');
  
  // 2. Add new imports after "use client";
  const newImports = `import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";`;
  
  src = src.replace(
    /("use client";)/,
    `$1\n\n${newImports}`
  );
  
  // 3. Replace <Plot ... /> with <ChartPanel ... /> (handles multiline)
  src = replacePlotWithChartPanel(src);
  
  // 4. Remove Link back button
  src = src.replace(/<Link href="[^"]*"[^>]*>←[^<]*<\/Link>\n?/g, '');
  
  // 5. Remove h1
  src = src.replace(/<h1[^>]*>.*?<\/h1>\n?/gs, '');
  
  // 6. Remove description p (the one right after h1 typically)
  src = src.replace(/<p[^>]*className="[^"]*text-gray-400[^"]*"[^>]*>.*?<\/p>\n?/gs, '');
  
  // 7. Extract metadata
  // Read title from the original (before we removed h1) - we'll reconstruct from pageName
  const title = titleCase(pageName);
  
  // 8. Replace outer wrapper div with CalculatorShell
  const outerDivRegex = /<div className="min-h-screen[^"]*">/;
  if (outerDivRegex.test(src)) {
    // Find description from the original file
    const origSrc = fs.readFileSync(filePath, 'utf8');
    const descMatch = origSrc.match(/<p[^>]*className="[^"]*text-gray-400[^"]*"[^>]*>(.*?)<\/p>/s);
    const description = descMatch ? descMatch[1].trim() : '';
    const h1Match = origSrc.match(/<h1[^>]*>(.*?)<\/h1>/s);
    const h1Title = h1Match ? h1Match[1].trim() : title;
    
    src = src.replace(outerDivRegex, `<CalculatorShell\n      backHref="/${category}"\n      backLabel="${CATEGORY_LABELS[category]}"\n      title="${h1Title.replace(/"/g, '&quot;')}"\n      description="${description.replace(/"/g, '&quot;')}"\n      maxWidthClassName="max-w-5xl"\n    >`);
    
    // Find and replace the outermost closing </div>
    // Strategy: find the return statement, then find the last </div> before the function closes
    const returnIdx = src.indexOf('return (');
    if (returnIdx === -1) {
      const returnIdx2 = src.indexOf('return\n');
      // find last </div>
    }
    
    // Simple approach: find last </div> in the file
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

let stats = { migrated: 0, skipped: 0, notfound: 0, errors: 0 };

for (const page of fscPages) {
  try {
    const result = migrateFile('free-space-comms', page);
    console.log(`${result === 'migrated' ? '✓' : result === 'already-done' ? '-' : '?'} free-space-comms/${page} (${result})`);
    if (result === 'migrated') stats.migrated++;
    else if (result === 'already-done') stats.skipped++;
    else stats.notfound++;
  } catch(e) { console.log(`✗ free-space-comms/${page}: ${e.message}`); stats.errors++; }
}

for (const page of imgPages) {
  try {
    const result = migrateFile('imaging', page);
    console.log(`${result === 'migrated' ? '✓' : result === 'already-done' ? '-' : '?'} imaging/${page} (${result})`);
    if (result === 'migrated') stats.migrated++;
    else if (result === 'already-done') stats.skipped++;
    else stats.notfound++;
  } catch(e) { console.log(`✗ imaging/${page}: ${e.message}`); stats.errors++; }
}

console.log(`\nResults: migrated=${stats.migrated} skipped=${stats.skipped} notfound=${stats.notfound} errors=${stats.errors}`);
