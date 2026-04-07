"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function RingCavityPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1064); // nm
  const [roundTripLength, setRoundTripLength] = useURLState("roundTripLength", 300); // mm
  const [mirrorR, setMirrorR] = useURLState("mirrorR", 1000); // mm, curved mirror ROC
  const [numMirrors, setNumMirrors] = useURLState("numMirrors", 3);
  const [outputCouplerR, setOutputCouplerR] = useURLState("outputCouplerR", 0.95);
  const [intracavityLoss, setIntracavityLoss] = useURLState("intracavityLoss", 0.01); // per round trip

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-6; // mm
    const L = roundTripLength; // mm
    const R = mirrorR; // mm
    const nMirrors = numMirrors;
    const Rout = outputCouplerR;
    const loss = intracavityLoss;

    // Perimeter ≈ round trip length
    // Segment length between mirrors
    const segL = L / nMirrors;

    // ABCD for one curved mirror segment (mirror + free space)
    // Mirror: [[1,0],[-2/R,1]], Free space: [[1,d],[0,1]]
    const A = 1 - 2 * segL / R;
    const B = segL;
    const C = -2 / R * (1 - segL / R);
    const D = 1 - 2 * segL / R;

    // Stability: trace of round-trip ABCD
    const trace = nMirrors * (A + D); // simplified for symmetric
    // For symmetric ring: stability if |A+D| < 2
    const halfTrace = A + D;
    const stable = Math.abs(halfTrace) < 2;

    // Beam parameters (if stable)
    let w0 = 0, zR = 0, divergence = 0, spotSize = 0;
    if (stable) {
      const cosTheta = halfTrace / 2;
      const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
      // Beam radius at reference plane
      const wRef = Math.sqrt(Math.abs(lambda * B / Math.PI / sinTheta));
      zR = Math.abs(B / sinTheta);
      w0 = Math.sqrt(lambda * zR / Math.PI);
      divergence = lambda / (Math.PI * w0) * 1000; // mrad
      spotSize = wRef;
    }

    // Cavity properties
    const fsr = 3e8 / (L * 1e-3); // Hz (c/L)
    const finesse = Math.PI * Math.sqrt(Rout * (1 - loss)) / (1 - Rout * (1 - loss));
    const linewidth = fsr / finesse;
    const thresholdGain = loss + (1 - Rout);
    const freeSpectralRangeWl = wavelength * wavelength / (L * 1e6); // nm (approx for large L)

    // Mode spectrum
    const modeSpacing = fsr;
    const numModes = 7;
    const modeFreqs = Array.from({ length: numModes }, (_, i) => -Math.floor(numModes / 2) + i);
    const modeFreqHz = modeFreqs.map(q => q * modeSpacing);
    const modeFreqRel = modeFreqHz.map(f => f / 1e9); // GHz

    // Airy function for mode shape
    const N = 200;
    const detuning = Array.from({ length: N }, (_, i) => (-modeSpacing * 1.5 + 3 * modeSpacing * i) / (N - 1));
    const Fcoeff = 4 * Rout * (1 - loss) / Math.pow(1 - Rout * (1 - loss), 2);
    const cavityResponse = detuning.map(f => {
      const delta = 2 * Math.PI * f * L * 1e-3 / 3e8;
      return 1 / (1 + Fcoeff * Math.sin(delta / 2) ** 2);
    });

    return { stable, halfTrace, w0, zR, divergence, spotSize, fsr, finesse, linewidth, thresholdGain, freeSpectralRangeWl, detuning, cavityResponse, modeFreqRel };
  }, [wavelength, roundTripLength, mirrorR, numMirrors, outputCouplerR, intracavityLoss]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Ring Resonator Design" description="Ring cavity stability, modes, and spectral analysis.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Round-trip length (mm)" value={roundTripLength} onChange={setRoundTripLength} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <ValidatedNumberInput label="Mirror ROC (mm)" value={mirrorR} onChange={setMirrorR} />
        <ValidatedNumberInput label="Number of mirrors" value={numMirrors} onChange={setNumMirrors} min={3} max={6} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Output coupler R" value={outputCouplerR} onChange={setOutputCouplerR} min={0} max={0.999} step="0.01" />
        <ValidatedNumberInput label="Intracavity loss (per round trip)" value={intracavityLoss} onChange={setIntracavityLoss} min={0} step="0.001" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stability</p>
          <p className={`text-xl font-bold ${calc.stable ? "text-green-400" : "text-red-400"}`}>
            {calc.stable ? "Stable" : "Unstable"}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FSR</p>
          <p className="text-xl font-bold text-blue-400">{(calc.fsr / 1e6).toFixed(2)} MHz</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Finesse</p>
          <p className="text-xl font-bold text-green-400">{calc.finesse.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Threshold Loss</p>
          <p className="text-xl font-bold text-orange-400">{calc.thresholdGain.toFixed(3)}</p>
        </div>
      </div>

      {calc.stable && (
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Beam Waist</p>
            <p className="text-xl font-bold text-blue-400">{calc.w0.toFixed(2)} mm</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Spot at Mirrors</p>
            <p className="text-xl font-bold text-green-400">{calc.spotSize.toFixed(2)} mm</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Divergence</p>
            <p className="text-xl font-bold text-orange-400">{calc.divergence.toFixed(2)} mrad</p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <p className="text-gray-300 text-sm mb-2 font-mono">
          FSR = c/L  |  ℱ = π√(R(1−α))/(1−R(1−α))  |  |½Tr(M)| &lt; 2 → stable
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[{
          x: calc.detuning.map(f => f / 1e6), y: calc.cavityResponse,
          type: "scatter" as const, mode: "lines" as const, name: "Cavity response",
          line: { color: "#60a5fa" },
        }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Detuning (MHz)", gridcolor: "#374151" },
          yaxis: { title: "Transmission", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
