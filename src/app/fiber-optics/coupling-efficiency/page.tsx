"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function CouplingEfficiencyCalculator() {
  const [sourceNa, setSourceNa] = useState<number>(0.22);
  const [fiberNa, setFiberNa] = useState<number>(0.12);
  const [sourceSpotSize, setSourceSpotSize] = useState<number>(50); // μm
  const [mfd, setMfd] = useState<number>(10.4); // μm (mode field diameter)
  const [lateralOffset, setLateralOffset] = useState<number>(0); // μm
  const [angularMisalign, setAngularMisalign] = useState<number>(0); // degrees
  const [wavelength, setWavelength] = useState<number>(1550); // nm

  // Mode field radius
  const w0 = useMemo(() => mfd / 2, [mfd]);

  // NA mismatch loss
  const naMismatchLoss = useMemo(() => {
    if (sourceNa <= fiberNa) return 1; // No loss if source NA <= fiber NA
    return (fiberNa / sourceNa) ** 2;
  }, [sourceNa, fiberNa]);

  // Lateral offset coupling factor
  const lateralCoupling = useMemo(() => {
    const offset = lateralOffset;
    return Math.exp(-(offset / w0) ** 2);
  }, [lateralOffset, w0]);

  // Angular misalignment coupling factor
  // Using Gaussian beam coupling formula: exp(-(π*n*w0*θ/λ)²)
  const angularCoupling = useMemo(() => {
    const theta = (angularMisalign * Math.PI) / 180; // Convert to radians
    const lambda = wavelength * 1e-3; // Convert to μm
    const n = 1.46; // Assume silica refractive index
    const exponent = ((Math.PI * n * w0 * theta) / lambda) ** 2;
    return Math.exp(-exponent);
  }, [angularMisalign, w0, wavelength]);

  // Total coupling efficiency (without NA mismatch)
  const geometricCoupling = useMemo(() => {
    return lateralCoupling * angularCoupling;
  }, [lateralCoupling, angularCoupling]);

  // Total coupling efficiency including NA mismatch
  const totalCoupling = useMemo(() => {
    return geometricCoupling * naMismatchLoss;
  }, [geometricCoupling, naMismatchLoss]);

  // Loss in dB
  const lossDb = useMemo(() => {
    if (totalCoupling === 0) return Infinity;
    return -10 * Math.log10(totalCoupling);
  }, [totalCoupling]);

  // Generate plot data: coupling vs lateral offset
  const plotData = useMemo(() => {
    const offsets: number[] = [];
    const efficiencies: number[] = [];
    
    for (let offset = 0; offset <= 20; offset += 0.5) {
      const coupling = Math.exp(-(offset / w0) ** 2) * angularCoupling * naMismatchLoss;
      offsets.push(offset);
      efficiencies.push(coupling * 100);
    }
    
    return {
      x: offsets,
      y: efficiencies,
      type: "scatter" as const,
      mode: "lines" as const,
      name: "Coupling Efficiency",
      line: { color: "#3b82f6", width: 2 },
    };
  }, [w0, angularCoupling, naMismatchLoss]);

  // Current point marker
  const currentMarker = {
    x: [lateralOffset],
    y: [totalCoupling * 100],
    type: "scatter" as const,
    mode: "markers" as const,
    name: "Current",
    marker: { color: "#22c55e", size: 12 },
  };

  const layout = {
    title: "Coupling Efficiency vs Lateral Offset",
    xaxis: { title: "Lateral Offset (μm)", gridcolor: "#374151" },
    yaxis: { title: "Coupling Efficiency (%)", gridcolor: "#374151", range: [0, 105] },
    paper_bgcolor: "#111827",
    plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" },
    showlegend: false,
    height: 400,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/fiber-optics" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Fiber Optics
        </Link>

        <h1 className="text-3xl font-bold mb-2">Coupling Efficiency Calculator</h1>
        <p className="text-gray-400 mb-8">
          Calculate coupling efficiency between a light source and optical fiber
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2">
              Source Parameters
            </h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Source NA</label>
              <input
                type="number"
                value={sourceNa}
                onChange={(e) => setSourceNa(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                step="0.01"
                min="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Source Spot Size (μm)</label>
              <input
                type="number"
                value={sourceSpotSize}
                onChange={(e) => setSourceSpotSize(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                step="1"
                min="1"
              />
            </div>

            <h2 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2 pt-4">
              Fiber Parameters
            </h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Fiber NA</label>
              <input
                type="number"
                value={fiberNa}
                onChange={(e) => setFiberNa(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                step="0.01"
                min="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mode Field Diameter (μm)</label>
              <input
                type="number"
                value={mfd}
                onChange={(e) => setMfd(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                step="0.1"
                min="1"
              />
            </div>

            <h2 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2 pt-4">
              Misalignment
            </h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Lateral Offset (μm)</label>
              <input
                type="number"
                value={lateralOffset}
                onChange={(e) => setLateralOffset(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                step="0.1"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Angular Misalignment (°)</label>
              <input
                type="number"
                value={angularMisalign}
                onChange={(e) => setAngularMisalign(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                step="0.1"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Wavelength (nm)</label>
              <input
                type="number"
                value={wavelength}
                onChange={(e) => setWavelength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                step="1"
                min="100"
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">NA Mismatch Efficiency:</span>
                  <span className={`font-mono ${naMismatchLoss < 1 ? "text-yellow-400" : "text-green-400"}`}>
                    {(naMismatchLoss * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Lateral Offset Efficiency:</span>
                  <span className="font-mono">{(lateralCoupling * 100).toFixed(1)}%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Angular Misalign Efficiency:</span>
                  <span className="font-mono">{(angularCoupling * 100).toFixed(1)}%</span>
                </div>
                
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Total Coupling:</span>
                    <span className={`font-mono font-bold ${totalCoupling > 0.5 ? "text-green-400" : totalCoupling > 0.1 ? "text-yellow-400" : "text-red-400"}`}>
                      {(totalCoupling * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-lg mt-2">
                    <span className="font-medium">Loss:</span>
                    <span className="font-mono font-bold text-blue-400">
                      {isFinite(lossDb) ? `${lossDb.toFixed(2)} dB` : "∞ dB"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">
                η_lateral = exp(-(offset/w₀)²)
              </p>
              <p className="font-mono text-sm mt-1">
                η_angular = exp(-(π·n·w₀·θ/λ)²)
              </p>
              <p className="font-mono text-sm mt-1">
                η_NA = (NA_fiber/NA_source)² if NA_source &gt; NA_fiber
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 text-sm text-gray-400">
              <p>
                <strong>Note:</strong> Mode field radius w₀ = MFD/2 = {w0.toFixed(1)} μm
              </p>
            </div>
          </div>
        </div>

        {/* Plot Section */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <Plot
            data={[plotData, currentMarker]}
            layout={layout}
            config={{ responsive: true }}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
