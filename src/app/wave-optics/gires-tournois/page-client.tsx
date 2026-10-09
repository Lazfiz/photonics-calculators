"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { gtiGdd, gtiGroupDelay, gtiPhase, gtiRoundTripPhase } from "../../../physics/wave-optics/gires-tournois";

export default function GiresTournoisPage() {
  const [reflectivity, setReflectivity] = useURLState("reflectivity", 0.7);
  const [thickness, setThickness] = useURLState("thickness", 500); // nm
  const [n, setN] = useURLState("n", 2.3); // refractive index of coating
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm center
  const [bandwidth, setBandwidth] = useURLState("bandwidth", 100); // nm range to plot

  // Lossless GTI: front reflector R₁, 100 % back mirror (src/physics/wave-optics/gires-tournois.ts).
  const gti = useMemo(() => ({ R: reflectivity, n, d: thickness * 1e-9 }), [reflectivity, n, thickness]);
  const lambdas = useMemo(
    () => Array.from({ length: 400 }, (_, i) => wavelength - bandwidth / 2 + i * bandwidth / 400),
    [wavelength, bandwidth],
  );

  // The phase is wrapped to (−π, π], so it jumps by about 2π at each branch cut and a plain line would draw a vertical
  // stroke there. The line is broken wherever |Δφ| between neighbouring points exceeds π. SimpleChart draws one polyline
  // per trace (and reads null as 0), so each wrap-free run is its own trace instead of a null gap in one trace.
  const phaseTraces = useMemo(() => {
    const runs: { x: number[]; y: number[] }[] = [];
    let run: { x: number[]; y: number[] } = { x: [], y: [] };
    let prev = NaN;
    for (const l of lambdas) {
      const phi = gtiPhase(gti, l * 1e-9);
      if (!Number.isFinite(phi)) continue;
      if (Number.isFinite(prev) && Math.abs(phi - prev) > Math.PI) {
        runs.push(run);
        run = { x: [], y: [] };
      }
      run.x.push(l);
      run.y.push(phi);
      prev = phi;
    }
    if (run.x.length > 0) runs.push(run);
    return runs.map((seg, i) => ({
      x: seg.x, y: seg.y, type: "scatter", mode: "lines", line: { color: "#60a5fa", width: 2 }, yaxis: "y",
      ...(i === 0 ? { name: "Phase φ(λ)" } : { showlegend: false }),
    }));
  }, [gti, lambdas]);

  const chartData = useMemo(() => [
    ...phaseTraces,
    { x: lambdas, y: lambdas.map((l) => gtiGdd(gti, l * 1e-9) * 1e30), type: "scatter", mode: "lines", name: "GDD (fs²)", line: { color: "#f87171", width: 2 }, yaxis: "y2" },
  ], [gti, lambdas, phaseTraces]);

  const gdData = useMemo(() => [
    { x: lambdas, y: lambdas.map((l) => gtiGroupDelay(gti, l * 1e-9) * 1e15), type: "scatter", mode: "lines", name: "Group Delay (fs)", line: { color: "#fbbf24", width: 2 } },
  ], [gti, lambdas]);

  const layout1 = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Phase (rad)", gridcolor: "#374151" },
    yaxis2: { title: "GDD (fs²)", overlaying: "y", side: "right", gridcolor: "transparent", titlefont: { color: "#f87171" }, tickfont: { color: "#f87171" } },
    margin: { t: 30, r: 70, b: 50, l: 70 },
    legend: { x: 0.01, y: 0.99, bgcolor: "transparent" },
  };

  const layout2 = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Group Delay (fs)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  const deltaCenter = gtiRoundTripPhase(gti, wavelength * 1e-9);
  const tauCenter = gtiGroupDelay(gti, wavelength * 1e-9) * 1e15; // fs
  const gddCenter = gtiGdd(gti, wavelength * 1e-9) * 1e30; // fs²

  return (
    <>
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">δ</span> = 4πnL / λ (round-trip phase)</p>
        <p><span className="text-blue-400">φ(δ)</span> = 2 arctan[(1−√R)/(1+√R) · tan(δ/2)]</p>
        <p><span className="text-blue-400">τ</span> = dφ/dω = (2nL/c)·(1−R) / (1+R+2√R·cos δ)</p>
        <p><span className="text-blue-400">GDD</span> = dτ/dω = 8n²L²√R(1−R)·sin δ / [c²·(1+R+2√R·cos δ)²]</p>
        <p className="text-yellow-400">Key: a lossless GTI reflects all the power (|r|² = 1) at every δ; R₁ sets how sharply the phase varies</p>
        <p className="text-gray-400 text-xs">Model: lossless GTI with a front reflector of reflectance R₁ and a 100 % back mirror; the thickness is an effective optical thickness (a different mirror phase shifts the whole pattern).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Front Surface R₁" value={reflectivity} onChange={setReflectivity} min={0.01} max={0.99} step="0.01" />
        <ValidatedNumberInput label="Coating Thickness (nm)" value={thickness} onChange={setThickness} min={0} />
        <ValidatedNumberInput label="Refractive Index n" value={n} onChange={setN} min={1} step="0.01" />
        <ValidatedNumberInput label="Center λ (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Plot Bandwidth (nm)" value={bandwidth} onChange={setBandwidth} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Group Delay at Center λ</p>
          <p className="text-xl font-bold text-yellow-400">{tauCenter.toFixed(2)} fs</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Round-trip Phase δ₀</p>
          <p className="text-xl font-bold text-blue-400">{(deltaCenter % (2 * Math.PI)).toFixed(3)} rad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">GDD at Center λ</p>
          <p className="text-xl font-bold text-orange-400">{gddCenter.toFixed(1)} fs²</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-sm text-gray-400 mb-2">Phase & GDD vs Wavelength</h3>
        <ChartPanel data={chartData} layout={layout1} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Group Delay</h3>
        <ChartPanel data={gdData} layout={layout2} />
      </div>
    </>
  );
}
