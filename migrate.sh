#!/bin/bash
# Migrate pages to shared components
# This script reads each file, applies transformations, and writes back

cd /home/marius/.openclaw/workspace/photonics-calculators

NODE_SCRIPT=$(cat << 'ENDSCRIPT'
const fs = require('fs');
const path = require('path');

const pages = [
  // free-space-comms
  'free-space-comms/acquisition-tracking',
  'free-space-comms/adaptive-optics',
  'free-space-comms/adaptive-optics-gain',
  'free-space-comms/aperture-averaging',
  'free-space-comms/atmosphere',
  'free-space-comms/atmospheric-loss',
  'free-space-comms/background-noise',
  'free-space-comms/beam-wander',
  'free-space-comms/ber',
  'free-space-comms/bpsk-qpsk',
  'free-space-comms/channel-capacity',
  'free-space-comms/diversity-reception',
  'free-space-comms/eye-safety-fso',
  'free-space-comms/fade-probability',
  'free-space-comms/fog-attenuation',
  'free-space-comms/geometric-loss',
  'free-space-comms/lasercom-link',
  'free-space-comms/optical-antenna',
  'free-space-comms/point-ahead',
  'free-space-comms/pointing-error',
  'free-space-comms/pointing-loss',
  'free-space-comms/quantum-key-distribution',
  'free-space-comms/rain-attenuation',
  'free-space-comms/receiver-fov',
  'free-space-comms/scintillation',
  'free-space-comms/scintillation-index',
  'free-space-comms/security',
  'free-space-comms/snow-attenuation',
  'free-space-comms/wavelength-selection',
  // imaging
  'imaging/3d-reconstruction',
  'imaging/adaptive-optics',
  'imaging/adaptive-optics-microscopy',
  'imaging/afocal',
  'imaging/cleared-tissue',
  'imaging/coherent-anti-stokes',
  'imaging/coherent-raman',
  'imaging/coherent-raman-microscopy',
  'imaging/computational-imaging',
  'imaging/computer-generated-holography',
  'imaging/confocal-pin-hole',
  'imaging/contrast-methods',
  'imaging/deconvolution',
  'imaging/denoising-algorithms',
  'imaging/digital-holography',
  'imaging/dynamic-range',
  'imaging/expansion-microscopy',
  'imaging/fcs',
  'imaging/fluorescence-spectra',
  'imaging/frap',
  'imaging/harmonic-generation',
  'imaging/hyperspectral-microscopy',
  'imaging/illumination',
  'imaging/light-field',
  'imaging/light-sheet',
  'imaging/light-sheet-microscopy',
  'imaging/light-sheet-thickness',
  'imaging/low-coherence',
  'imaging/multiphoton-depth',
  'imaging/optical-sectioning',
  'imaging/optical-sectioning-thickness',
  'imaging/palm-storm',
  'imaging/photoacoustic',
  'imaging/plenoptic-camera',
  'imaging/pupil-matching',
  'imaging/registration',
  'imaging/second-harmonic',
  'imaging/second-harmonic-generation',
  'imaging/second-harmonic-microscopy',
  'imaging/selective-plane',
  'imaging/sensor-ccm',
  'imaging/sensor-cmos',
  'imaging/shack-hartmann',
  'imaging/signal-to-noise',
  'imaging/speckle-imaging',
  'imaging/spectral-unmixing',
  'imaging/spinning-disk',
  'imaging/sted-resolution',
  'imaging/stimulated-raman-microscopy',
  'imaging/stitching',
  'imaging/strehl-ratio',
  'imaging/structured-illumination',
  'imaging/sum-frequency-microscopy',
  'imaging/super-resolution',
  'imaging/telecentricity',
  'imaging/third-harmonic-generation',
  'imaging/third-harmonic-microscopy',
  'imaging/three-photon-microscopy',
  'imaging/tirf',
  'imaging/two-photon',
  'imaging/two-photon-excitation',
  'imaging/two-photon-microscopy',
  'imaging/wavefront-error',
  'imaging/wavefront-sensing',
  'imaging/wavefront-sensor',
];

const CATEGORY_LABELS = {
  'free-space-comms': 'Free-Space Comms',
  'imaging': 'Imaging',
};

function extractTitle(pageName) {
  return pageName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function extractDescription(src) {
  // Try to find <p className="text-gray-400 ...">description</p>
  const pMatch = src.match(/<p[^>]*className="[^"]*text-gray-400[^"]*"[^>]*>(.*?)<\/p>/s);
  if (pMatch) return pMatch[1].trim();
  // Try other patterns
  const pMatch2 = src.match(/<p[^>]*>(.*?)<\/p>/s);
  if (pMatch2) return pMatch2[1].trim();
  return '';
}

function extractH1(src) {
  const m = src.match(/<h1[^>]*>(.*?)<\/h1>/s);
  return m ? m[1].trim() : '';
}

function extractBackHref(src) {
  const m = src.match(/href="\/([^"]+)"/);
  return m ? '/' + m[1] : '';
}

function extractInputPairs(src) {
  // Match various input patterns
  const inputs = [];
  
  // Pattern 1: Map-based inputs like .map(([label, val, set]) => (
  // We need to extract the array
  const mapMatch = src.match(/\{(\[[\s\S]*?\]\.map\(\[\s*label,\s*val,\s*set\s*\])[\s\S]*?\}\)\s*\)/);
  
  // Pattern 2: Individual input blocks
  // <label>...</label> followed by <input ...>
  
  // Pattern 3: <InputSlider already exists (skip)
  if (src.includes('InputSlider')) return { type: 'already', inputs };
  
  return { type: 'unknown', raw: src };
}

let migrated = 0;
let skipped = 0;
let errors = 0;

for (const page of pages) {
  const filePath = `src/app/${page}/page.tsx`;
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP (not found): ${page}`);
    skipped++;
    continue;
  }
  
  let src = fs.readFileSync(filePath, 'utf8');
  
  if (src.includes('CalculatorShell')) {
    console.log(`SKIP (already done): ${page}`);
    skipped++;
    continue;
  }
  
  try {
    const category = page.split('/')[0];
    const pageName = page.split('/')[1];
    const categoryLabel = CATEGORY_LABELS[category];
    
    // Extract info from existing page
    const h1 = extractH1(src);
    const description = extractDescription(src);
    const backHref = `/` + category;
    
    // Step 1: Replace imports
    src = src.replace(/import dynamic from "next\/dynamic";?\n/g, '');
    src = src.replace(/import Link from "next\/link";?\n/g, '');
    src = src.replace(/const Plot = dynamic\(\(\) => import\("react-plotly\.js"\),\s*\{\s*ssr:\s*false\s*\}\);?\n/g, '');
    
    // Add new imports after "use client";
    const newImports = `import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";`;
    
    src = src.replace(
      /("use client";)/,
      `$1\n\n${newImports}`
    );
    
    // Now the hard part - transform the JSX. Let's do this more carefully.
    // Extract the function body (everything between the first { and the final })
    
    // We need to find the component function and its return statement
    // Then transform the return JSX
    
    console.log(`PROCESSING: ${page} - h1="${h1}" desc="${description.substring(0, 50)}..."`);
    console.log(`  (needs manual transformation - flagging)`);
    
    // For now, let's just do the import replacements and mark for manual work
    // Actually, let me try a different approach - use the full transformation
    
  } catch (e) {
    console.log(`ERROR: ${page}: ${e.message}`);
    errors++;
  }
}

console.log(`\nMigrated: ${migrated}, Skipped: ${skipped}, Errors: ${errors}`);
ENDSCRIPT
)

echo "$NODE_SCRIPT" | node
