"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function RetinalImageSizePage() {
  const [wavelength, setWavelength] = useState(632);
  const [beamDiam, setBeamDiam] = useState(2); // mm at cornea
  const [beamDivergence, setBeamDivergence] = useState(1); // mrad
  const [viewingDistance, setViewingDistance] = useState(100); // cm
  const [eyeLength, setEyeLength] = useState(17); // mm (standard)

  // Retinal image size depends on:
  // - Beam diameter at cornea
  // - Beam divergence
  // - Eye's focal length (~17mm)
  // - Diffraction limit
  //
  // Geometric image: d_retina ≈ d_cornea × (f_eye / viewing_distance)
  // For collimated beam: d_retina ≈ f_eye × θ_divergence (if beam fills pupil)
  // Diffraction limit: d_diff = 2.44 × λ × f / d_pupil (Airy disk diameter)
  // Actual image ≈ max(geometric, diffraction) approximately RSS

  const results = useMemo(() => {
    const lam = wavelength * 1e-6; // mm
    const dCornea = beamDiam; // mm
    const theta = beamDivergence / 1000; // rad
    const fEye = eyeLength; // mm
    const D = viewingDistance * 10; // mm

    // For a collimated beam filling the pupil:
    // Geometric retinal image from divergence
    const dRetinaDiv = fEye * theta; // mm

    // For a focused source at distance D:
    const dRetinaGeom = dCornea * fEye / D; // mm

    // Diffraction-limited spot (Airy disk, 1st zero)
    const pupilDiam = Math.min(dCornea, 7); // mm (max pupil ~7mm)
    const dDiff = 2.44 * lam * fEye / pupilDiam; // mm

    // Effective retinal image (RSS of geometric + diffraction)
    const dRetinaEffective = Math.sqrt(dRetinaDiv * dRetinaDiv + dDiff * dDiff);

    // Angular subtense α = d_retina / f_eye (radians)
    const alphaRad = dRetinaEffective / fEye;
    const alphaMrad = alphaRad * 1000; // mrad

    // Classification thresholds
    const alphaMin = 1.5; // mrad (point source)
    const alphaMax = 100; // mrad (extended source)

    const sourceType = alphaMrad < alphaMin ? "Point Source" :
                       alphaMrad < alphaMax ? "Small Extended" : "Extended Source";

    // CA factor (wavelength correction for retinal hazard)
    const lamMicron = wavelength / 1000;
    const CA = lamMicron >= 0.7 && lamMicron < 1.05 ?
      Math.pow(10, 0.02 * (lamMicron - 0.7)) : 1;

    return {
      dRetinaDiv: dRetinaDiv * 1000, // µm
      dRetinaGeom: dRetinaGeom * 1000, // µm
      dDiff: dDiff * 1000, // µm
      dRetinaEffective: dRetinaEffective * 1000, // µm
      alphaMrad,
      sourceType,
      CA,
      pupilDiam,
    };
  }, [wavelength, beamDiam, beamDivergence, viewingDistance, eyeLength]);

  const chartData = useMemo(() => {
    const divergences = Array.from({ length: 100 }, (_, i) => 0.1 + i * 0.2);
    const fEye = eyeLength;
    const lam = wavelength * 1e-6;
    const pupilDiam = Math.min(beamDiam, 7);

    const retinalSizes = divergences.map(div => {
      const theta = div / 1000;
      const dDiv = fEye * theta * 1000;
      const dDiff = 2.44 * lam * fEye / pupilDiam * 1000;
      return Math.sqrt(dDiv * dDiv + dDiff * dDiff);
    });

    const diffLimit = divergences.map(() => 2.44 * lam * fEye / pupilDiam * 1000);
    const alphaMinLine = divergences.map(() => 1.5 * eyeLength / 1000 * 1000); // µm at αmin

    return [
      { x: divergences, y: retinalSizes, type: "scatter" as const, mode: "lines" as const, name: "Effective Retinal Image (µm)", line: { color: "#60a5fa" } },
      { x: divergences, y: diffLimit, type: "scatter" as const, mode: "lines" as const, name: "Diffraction Limit (µm)", line: { color: "#f472b6", dash: "dash" } },
      { x: divergences, y: alphaMinLine, type: "scatter" as const, mode: "lines" as const, name: "α_min threshold", line: { color: "#fbbf24", dash: "dot" } },
    ];
  }, [wavelength, beamDiam, eyeLength]);

  const layout = {
    paper_bgcolor: "#030712",
    plot_bgcolor: "#030712",
    font: { color: "#9ca3af" },
    xaxis: { title: "Beam Divergence (mrad)", gridcolor: "#1f2937", color: "#9ca3af" },
    yaxis: { title: "Retinal Image Size (µm)", gridcolor: "#1f2937", color: "#9ca3af" },
    margin: { t: 30, b: 50, l: 70, r: 20 },
    legend: { font: { color: "#d1d5db" } },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/laser-safety" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Laser Safety</Link>
      <h1 className="text-3xl font-bold mb-2">Retinal Image Size</h1>
      <p className="text-gray-400 mb-8">Calculates retinal spot size from corneal beam parameters, including diffraction and geometric contributions per ANSI Z136.1.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Beam Diameter at Cornea (mm)</label>
          <input type="number" step="0.1" value={beamDiam} onChange={e => setBeamDiam(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Beam Divergence (mrad)</label>
          <input type="number" step="0.1" value={beamDivergence} onChange={e => setBeamDivergence(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Viewing Distance (cm)</label>
          <input type="number" value={viewingDistance} onChange={e => setViewingDistance(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Eye Length (mm)</label>
          <input type="number" step="0.5" value={eyeLength} onChange={e => setEyeLength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Retinal Image</div>
          <div className="text-2xl font-bold text-blue-400">{results.dRetinaEffective.toFixed(1)}</div>
          <div className="text-xs text-gray-500">µm</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Diffraction Limit</div>
          <div className="text-2xl font-bold text-pink-400">{results.dDiff.toFixed(1)}</div>
          <div className="text-xs text-gray-500">µm</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Angular Subtense</div>
          <div className="text-2xl font-bold text-yellow-400">{results.alphaMrad.toFixed(2)}</div>
          <div className="text-xs text-gray-500">mrad</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Source Type</div>
          <div className={`text-lg font-bold ${results.sourceType === "Point Source" ? "text-green-400" : "text-orange-400"}`}>{results.sourceType}</div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 font-mono text-sm text-gray-300">
        <p className="text-gray-500 mb-1">Key Formulas:</p>
        <p>d<sub>retina</sub> = f<sub>eye</sub> × θ<sub>div</sub> (collimated beam)</p>
        <p>d<sub>Airy</sub> = 2.44 × λ × f<sub>eye</sub> / d<sub>pupil</sub></p>
        <p>d<sub>eff</sub> = √(d<sub>geo</sub>² + d<sub>diff</sub>²)</p>
        <p>α<sub>min</sub> = 1.5 mrad (point source threshold) | α<sub>max</sub> = 100 mrad (extended)</p>
      </div>

      <Plot data={chartData} layout={layout} config={{ responsive: true }} className="w-full h-[400px]" />
    </div>
  );
}
