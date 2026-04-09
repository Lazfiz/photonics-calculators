"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function ComputationalImagingPage() {
  const [na, setNa] = useURLState("na", 0.8);
  const [wavelength, setWavelength] = useURLState("wavelength", 550);
  const [numViews, setNumViews] = useURLState("numViews", 25);
  const [photonCount, setPhotonCount] = useURLState("photonCount", 1000);
  const [bgNoise, setBgNoise] = useURLState("bgNoise", 10);
  const [readNoise, setReadNoise] = useURLState("readNoise", 2);

  const results = useMemo(() => {
    const lambda_um = wavelength * 1e-3;
    const rayleigh = 0.61 * lambda_um / na;
    const abbe = lambda_um / (2 * na);
    const snrSingle = photonCount / Math.sqrt(photonCount + bgNoise + readNoise * readNoise);
    const snrMulti = snrSingle * Math.sqrt(numViews);
    const theoreticalLimit = rayleigh / Math.sqrt(numViews);
    const fourierLimit = 1 / (2 * numViews);
    const noiseEquivalent = (bgNoise + readNoise * readNoise) / photonCount;

    const views: number[] = [];
    const snrVals: number[] = [];
    const resVals: number[] = [];
    for (let n = 1; n <= 100; n += 1) {
      views.push(n);
      snrVals.push(snrSingle * Math.sqrt(n));
      resVals.push((rayleigh / Math.sqrt(n)) * 1000);
    }

    return { rayleigh, abbe, snrSingle, snrMulti, theoreticalLimit, noiseEquivalent, views, snrVals, resVals };
  }, [na, wavelength, numViews, photonCount, bgNoise, readNoise]);

  const plotData = useMemo(() => [
    {
      x: results.views, y: results.snrVals,
      type: "scatter" as const, mode: "lines" as const,
      name: "SNR (multi-view)", line: { color: "#60a5fa", width: 2 },
    },
  ], [results]);

  const darkLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#d1d5db" }, xaxis: { title: "Number of Views", gridcolor: "#374151" },
    yaxis: { title: "SNR", gridcolor: "#374151" },
    legend: { x: 0.02, y: 0.95 }, margin: { t: 30, r: 30, b: 50, l: 60 },
  };

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Computational Imaging" description="Multi-view fusion, resolution scaling, and SNR improvement through computational techniques.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Numerical Aperture (NA)</label>
            <ValidatedNumberInput label="Numerical Aperture (NA)" value={na} onChange={setNa} min={0.1} max={1.8} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={2000} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Number of Views</label>
            <ValidatedNumberInput label="Number of Views" value={numViews} onChange={setNumViews} min={1} max={200} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Photons per Pixel (single view)</label>
            <ValidatedNumberInput label="Photons per Pixel (single view)" value={photonCount} onChange={setPhotonCount} min={1} max={100000} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Background Noise (e⁻)</label>
            <ValidatedNumberInput label="Background Noise (e⁻)" value={bgNoise} onChange={setBgNoise} min={0} max={1000} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Read Noise (e⁻ rms)</label>
            <ValidatedNumberInput label="Read Noise (e⁻ rms)" value={readNoise} onChange={setReadNoise} min={0} max={50} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg">Results</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Rayleigh Resolution</div>
              <div className="text-xl font-mono text-blue-400">{(results.rayleigh * 1000).toFixed(1)} nm</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Abbe Limit</div>
              <div className="text-xl font-mono text-green-400">{(results.abbe * 1000).toFixed(1)} nm</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Single-View SNR</div>
              <div className="text-xl font-mono text-yellow-400">{results.snrSingle.toFixed(2)}</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Multi-View SNR</div>
              <div className="text-xl font-mono text-purple-400">{results.snrMulti.toFixed(2)}</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Theoretical Res. Limit</div>
              <div className="text-xl font-mono text-red-400">{(results.theoreticalLimit * 1000).toFixed(1)} nm</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Noise Equivalent</div>
              <div className="text-xl font-mono text-gray-300">{results.noiseEquivalent.toFixed(4)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <ChartPanel data={plotData} layout={darkLayout} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>r_Rayleigh = 0.61 λ / NA</p>
          <p>d_Abbe = λ / (2·NA)</p>
          <p>SNR_single = S / √(S + B + σ²_read)</p>
          <p>SNR_multi = SNR_single · √N</p>
          <p>r_theoretical = r_Rayleigh / √N</p>
        </div>
        <div className="text-sm text-gray-400 mt-4 space-y-1">
          <p>Computational imaging combines multiple measurements (views, angles, illumination patterns) with algorithms to exceed diffraction limits or reduce noise. The √N SNR improvement assumes uncorrelated measurements and optimal fusion.</p>
          <p>Resolution improvement beyond the diffraction limit requires that the measurements encode high-frequency information (e.g., SIM, multi-view tomography, or ptychography).</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
