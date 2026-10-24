"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { beamRadius } from "../../../physics/free-space-comms/pointing-loss";
import { beamWanderLossDb, beamWanderVariance } from "../../../physics/free-space-comms/turbulence";

const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const chartLayout = (xTitle: string, yTitle: string, logX = false) => ({
  xaxis: { title: xTitle, color: "#9ca3af", gridcolor: "#374151", ...(logX ? { type: "log" } : {}) },
  yaxis: { title: yTitle, color: "#9ca3af", gridcolor: "#374151" },
  margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#d1d5db" },
  legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
});

export default function BeamWanderPage() {
  const [cn2, setCn2] = useURLState("cn2", 1e-15, { min: 1e-18, max: 1e-11 }); // m^(−2/3)
  const [pathLength, setPathLength] = useURLState("pathLength", 1, { min: 0.001, max: 1000 }); // km
  const [w0Cm, setW0Cm] = useURLState("beamRadius", 2, { min: 0.01, max: 100 }); // transmit beam radius W₀, cm
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 200, max: 20000 }); // nm

  const results = useMemo(() => {
    const L = pathLength * 1e3;
    const W0 = w0Cm * 1e-2;
    const lambda = wavelength * 1e-9;
    const variance = beamWanderVariance(cn2, L, W0);
    const rms = Math.sqrt(variance);
    const W = beamRadius(W0, lambda, L);
    return { variance, rms, angular: rms / L, W, lossDb: beamWanderLossDb(variance, W) };
  }, [cn2, pathLength, w0Cm, wavelength]);

  const cn2Data = useMemo(() => {
    const L = pathLength * 1e3;
    const W0 = w0Cm * 1e-2;
    const n = 60;
    const xs = Array.from({ length: n }, (_, i) => 10 ** (-17 + (5 * i) / (n - 1)));
    return [{
      type: "scatter", mode: "lines", x: xs, y: xs.map((c) => Math.sqrt(beamWanderVariance(c, L, W0)) * 100),
      name: "rms wander", line: { color: "#a78bfa", width: 2 },
    }];
  }, [pathLength, w0Cm]);

  const distData = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const W0 = w0Cm * 1e-2;
    const n = 80;
    const kms = Array.from({ length: n }, (_, i) => 0.1 * 100 ** (i / (n - 1))); // 0.1 .. 10 km
    return [
      { type: "scatter", mode: "lines", x: kms, y: kms.map((k) => Math.sqrt(beamWanderVariance(cn2, k * 1e3, W0)) * 100), name: "rms wander", line: { color: "#a78bfa", width: 2 } },
      { type: "scatter", mode: "lines", x: kms, y: kms.map((k) => beamRadius(W0, lambda, k * 1e3) * 100), name: "beam radius W(L)", line: { color: "#3b82f6", dash: "dash" } },
    ];
  }, [cn2, w0Cm, wavelength]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Cn² (m⁻²ᐟ³)" value={cn2} onChange={setCn2} min={1e-18} max={1e-11} step="any" />
        <ValidatedNumberInput label="Path Length (km)" value={pathLength} onChange={setPathLength} min={0.001} max={1000} step="any" />
        <ValidatedNumberInput label="Transmit Beam Radius W₀ (cm)" value={w0Cm} onChange={setW0Cm} min={0.01} max={100} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={20000} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Wander variance ⟨r_c²⟩" value={`${fmt(results.variance)} m²`} tone="purple" />
        <ResultCard label="RMS wander √⟨r_c²⟩" value={`${fmt(results.rms * 100)} cm`} tone="blue" />
        <ResultCard label="Angular RMS wander" value={`${fmt(results.angular * 1e6)} µrad`} tone="cyan" subtext="√⟨r_c²⟩ / L" />
        <ResultCard label="Beam radius W(L)" value={`${fmt(results.W * 100)} cm`} tone="gray" subtext="free-space Gaussian spread at the receiver" />
        <ResultCard label="Mean on-axis loss" value={`${fmt(results.lossDb)} dB`} tone="orange" subtext="10·log10(1 + 2⟨r_c²⟩/W²)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">RMS wander vs Cn²</h2>
          <ChartPanel data={cn2Data} layout={chartLayout("Cn² (m⁻²ᐟ³)", "RMS wander (cm)", true)} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Wander and beam radius vs distance</h2>
          <ChartPanel data={distData} layout={chartLayout("Distance (km)", "Radius (cm)")} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">⟨r_c²⟩ = 2.42 Cn² L³ W₀^(−1/3),   loss = 10·log10(1 + 2⟨r_c²⟩/W²)</p>
        <p>
          Collimated beam, Kolmogorov spectrum with infinite outer scale (Andrews &amp; Phillips, <em>Laser Beam
          Propagation through Random Media</em>, 2nd ed., 2005). At this order the wander does not depend on
          wavelength; λ only enters through the beam radius W(L) at the receiver. A finite outer scale reduces the
          wander, so the value is an upper bound.
        </p>
      </div>
    </>
  );
}
