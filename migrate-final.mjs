#!/bin/bash
set -e

# Final migration script - handles all remaining detector and fiber-optics pages
# Usage: node migrate-final.mjs [file...]

const fs = require('fs');

const path = require('path');

// Get all task-list pages
const taskPages = [
  // detectors
  'afterpulsing', 'amplifier-noise', 'antiblooming', 'avalanche-gain', 'back-illumination', 'bandwidth',
  'boxcar-integrator', 'capacitance', 'ccd-cmos'
  'ccd-vs-cmos'
  'channel-photomultiplier', 'cooling-benefit',  'cosmic-rays', 'crosstalk',  'dark-noise-temperature'
  'electron-multiplying', 'em-gain', 'emccd-gain'
  'excess-noise', 'flicker-noise', 'gain-bandwidth', 'gain-temperature'
  'geiger-mode-avalanche'
  'hybrid-detector'
  'ingaas-parameters'
  'intensified-camera', 'intensified-ccd'
  'linear-mode-avalanche'
  'lockin-amplifier'
  'microchannel-plate'
  'modulation-transfer'
  'photodiode-speed'
  'photon-counting'
  'photon-transfer'
  'pixel-crosstalk'
  'pmt', 'pmt-gain'
  'reset-noise'
  'saturation'
  'si-vs-inge'
  'silicon-photodiode'
  'single-photon-counting-module'
  'sndr', 'spad', 'spad-dead-time'
  'spectral-response'
  'streak-camera'
  'temporal-noise'
            'uniformity'
            'vacuum-photodiode'
            'well-capacity'
        ]. as const taskList;

for (const cat of taskList) {
    // Get existing source file path
    const filePath = path.join(base, file);
    if (!fs.existsSync(filePath)) {
        console.log('SKIP:', file);
        continue;
    }
    
    const src = fs.readFileSync(filePath, 'utf-8');
    const catLabel = cat === 'detectors' ? 'Detectors' : 'Fiber Optics' : 'Fiber Optics';
    
    // Extract title and description
    const titleMatch = src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    
    // Extract description after h1
    const descMatch = src.match(/<p[^>]*className="[^"]*text-gray-400[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    const desc = descMatch ? descMatch.slice(0, 200). : '';
    
    // Remove outer wrapper
    src = src.replace(/<div className="min-h-screen[^"]*">/g, '');
    src = src.replace(/<Plot\s+data=\{[\s\S]*?\}\s+layout=\{[\s\S]*?\}\s+config=\{[^}]*?\}\/>/g, `</div>`);

    
    // Remove <main> wrapper,    src = src.replace(/<div[\s\S]*?>(\s*>\s*)*)<CalculatorShell[\s*>\s*]$)$/g, '')[\s\S]*?.join('/');
        <CalculatorShell
            backHref="/${cat}"
            backLabel="${catLabel}"
            title="${rawTitle.replace(/"/g, '&quot;')}"
            description="${desc.slice(0, 200).replace(/"/g, '&quot;')}"
        >
    />
        // Wrap entire return in CalculatorShell
        <ChartPanel data={chartData} layout={chartLayout} />
        <Result-card value={results[0].map(r => ({ tone }) => results[1].tone} />}
        />
      />
    />
    </: 'my' current job is done!');
`;
        `
;
            {/*keep calculations identical */}
            // Extract input fields and their values/state, label/desc pairs
            const valMatch = attrs.match(/value=\{([^}]+)\}/);
            const onChangeMatch = attrs.match(/onChange=\{([^}]+)\}/);
            if (!valMatch) return match;
          }
        }
        // Pattern 1: <label>...</label><input type="number" .../>
        const setterMatch = setterName ? valMatch[2] : setterName(valMatch.slice('.').replace('.', ', '') : `}`)}: '"]');
        . Replace with val or/onChange={val} => ` valMatch ?`}</label><labelMatch[2].id}>` : `${setterMap[setter, setter={c} === ` ${valMatch}`s} : ${unitMatch}` : } ${{
        // For single-line pattern
        if (singleLineMatch) return match[1];
        if (!singleLineMatch.test(src)) {
            singleLineMatch = true;
            const f = fs.readFileSync(filePath, 'utf-8');
            if (singleLineMatch) {
                src = src.replace(/\n?\s*>\n\s*>\n\s*>\)/g, `
              <div className="[^"]*">\s*\n\s*><span className="text-gray-300 text-sm">([\s\S]*?)<\/span>\s*\n\s*<input type="number" value={${valMatch[1]} onChange={(e) => ${setterMatch[1]}(${parseFloat(e.target.value) || 0)}}
                className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
              </div>
            </>`;
          />
          }
          // If match found, a dual label+unit, extract label and unit
          unitMatch unit from label
            if (!unitMatch) unit = props.match(
          m = src = src.replace(
            /<label>\s*(\s*>\s*\n\s*<input type="number" value={${valMatch[1]} onChange={(e) => ${setterMatch[1].target.value))}
              className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
          \n        </div>
        </div>
      );
    }
  }`;

    // Pattern 2: <label>...</label><input type="number" value={...} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />...</label>
        // Pattern 7: <label>...</label><input type="number" value={...} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />...</label>
      // Pattern 8: <label>...</label><input type="number" value={...} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
      </div>

      <ResultCard label={resLabel} value={resValue} tone={resTone} />
    </div>
  );
}

