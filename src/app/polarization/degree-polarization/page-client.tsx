"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { CONVENTION_NOTE, fix, stokesProblem } from "../../../components/polarization-format";
import { applyMueller, muellerRetarderBandSweep } from "../../../physics/polarization/mueller";
import { degreeOfPolarization, ellipseAngles, isPhysicalStokes, polarizedIntensity, type Stokes } from "../../../physics/polarization/stokes";

const DEG = Math.PI / 180;
const NM = 1e-9; // nm → m

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

export default function DegreeOfPolarizationPage() {
  const [s0, setS0] = useURLState("s0", 1);
  const [s1, setS1] = useURLState("s1", 0.8);
  const [s2, setS2] = useURLState("s2", 0.3);
  const [s3, setS3] = useURLState("s3", 0.2);

  const [spectralMode, setSpectralMode] = useState(false);
  const [centerWl, setCenterWl] = useURLState("centerWl", 550);
  const [bandwidth, setBandwidth] = useURLState("bandwidth", 100);
  const [retardance, setRetardance] = useURLState("retardance", 5); // waves at center

  const problem = stokesProblem([s0, s1, s2, s3]);

  const results = useMemo(() => {
    const S: Stokes = [s0, s1, s2, s3];
    if (!isPhysicalStokes(S)) return null;
    const polIntensity = polarizedIntensity(S);
    const { psi, chi } = ellipseAngles(S);
    return {
      polIntensity,
      unpolIntensity: Math.max(0, s0 - polIntensity),
      dop: degreeOfPolarization(S),
      orientation: psi / DEG, // NaN for circular and unpolarized light
      ellipticityAngle: chi / DEG, // NaN for unpolarized light
      ellipticity: Math.tan(chi),
      s1norm: s1 / s0,
      s2norm: s2 / s0,
      s3norm: s3 / s0,
    };
  }, [s0, s1, s2, s3]);

  // Spectral inputs, clamped before use (the URL isn't).
  const lambda0 = Math.max(1, centerWl);
  const maxBandwidth = (19 * lambda0) / 10; // 1.9 × centre
  const bw = clamp(bandwidth, 0, maxBandwidth);
  const waves = clamp(retardance, 0, 10000);

  const spectral = useMemo(() => {
    if (!spectralMode || !results) return null;
    const S: Stokes = [s0, s1, s2, s3];

    // Band-averaged DoP as the band widens from 0 to B: one sweep over ascending widths, the last being B itself.
    const n = clamp(Math.ceil((8 * waves * bw) / lambda0) + 1, 61, 801);
    const widths_nm = Array.from({ length: n }, (_, i) => (i === n - 1 ? bw : (bw * i) / (n - 1)));
    const matrices = muellerRetarderBandSweep(waves, lambda0 * NM, widths_nm.map((w) => w * NM), Math.PI / 4);
    const bandwidths: number[] = [];
    const dopVals: number[] = [];
    matrices.forEach((M, i) => {
      const d = degreeOfPolarization(applyMueller(M, S));
      if (Number.isFinite(d)) {
        bandwidths.push(widths_nm[i]);
        dopVals.push(d);
      }
    });

    const avgS = applyMueller(matrices[n - 1], S); // NaN when the band holds too many retardance cycles
    return { avgS, avgDop: degreeOfPolarization(avgS), bandwidths, dopVals };
  }, [spectralMode, results, lambda0, bw, waves, s0, s1, s2, s3]);

  const plotLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "#111827",
    font: { color: "#e5e7eb" },
    margin: { t: 30, b: 40, l: 50, r: 10 },
    xaxis: { color: "#9ca3af", gridcolor: "#374151" },
    yaxis: { color: "#9ca3af", gridcolor: "#374151" },
    legend: { font: { color: "#9ca3af" } },
  };

  const dopText = results ? `${fix(results.dop * 100, 1)}%` : "—";

  return (
    <>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Stokes Parameters</h2>
          {[
            { label: "S₀ (total intensity)", val: s0, set: setS0 },
            { label: "S₁ (H − V)", val: s1, set: setS1 },
            { label: "S₂ (+45° − −45°)", val: s2, set: setS2 },
            { label: "S₃ (RCP − LCP)", val: s3, set: setS3 },
          ].map(({ label, val, set }) => (
            <div key={label} className="mb-3">
              <ValidatedNumberInput label={label} value={val} onChange={set} />
            </div>
          ))}
          {problem && <p className="mt-3 text-sm text-red-400">{problem}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => { setS0(1); setS1(1); setS2(0); setS3(0); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">H-Pol</button>
            <button onClick={() => { setS0(1); setS1(0); setS2(1); setS3(0); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">+45°</button>
            <button onClick={() => { setS0(1); setS1(0); setS2(0); setS3(1); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">RCP</button>
            <button onClick={() => { setS0(1); setS1(0); setS2(0); setS3(0); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">Unpol</button>
            <button onClick={() => { setS0(1); setS1(0.1905); setS2(0.1905); setS3(0.1905); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">33% DoP</button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-1">
            <ResultRow label="Degree of Polarization" value={results ? `${fix(results.dop * 100, 2)}%` : "—"} />
            <ResultRow label="Polarized intensity" value={results ? fix(results.polIntensity, 4) : "—"} />
            <ResultRow label="Unpolarized intensity" value={results ? fix(results.unpolIntensity, 4) : "—"} />
            <ResultRow label="Orientation angle (ψ)" value={results && !Number.isNaN(results.orientation) ? `${fix(results.orientation, 2)}°` : "—"} />
            <ResultRow label="Ellipticity angle (χ)" value={results && !Number.isNaN(results.ellipticityAngle) ? `${fix(results.ellipticityAngle, 2)}°` : "—"} />
            <ResultRow label="Ellipticity (e)" value={results ? fix(results.ellipticity, 4) : "—"} />
            <ResultRow label="S₁/S₀" value={results ? fix(results.s1norm, 4) : "—"} />
            <ResultRow label="S₂/S₀" value={results ? fix(results.s2norm, 4) : "—"} />
            <ResultRow label="S₃/S₀" value={results ? fix(results.s3norm, 4) : "—"} />
          </div>
          <div className="mt-4 p-3 bg-gray-800 rounded-lg text-center">
            <div className="text-sm text-gray-400">DoP</div>
            <div className={`text-3xl font-bold ${!results ? "text-gray-500" : results.dop > 0.9 ? "text-green-400" : results.dop > 0.5 ? "text-yellow-400" : "text-red-400"}`}>
              {dopText}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Decomposition</h2>
          <div className="relative w-48 h-48 mx-auto">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Outer circle - total */}
              <circle cx="100" cy="100" r="80" fill="none" stroke="#4b5563" strokeWidth="2" />
              <text x="100" y="20" textAnchor="middle" fill="#9ca3af" fontSize="10">S₀ = {Number.isFinite(s0) ? s0.toFixed(2) : "—"}</text>
              {/* Polarized portion */}
              {results && <circle cx="100" cy="100" r={results.dop * 80} fill="rgba(59,130,246,0.3)" stroke="#3b82f6" strokeWidth="2" />}
              {/* Unpolarized portion */}
              <text x="100" y="105" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                {results ? `${fix(results.dop * 100, 0)}%` : "—"}
              </text>
              <text x="100" y="120" textAnchor="middle" fill="#9ca3af" fontSize="9">polarized</text>
            </svg>
          </div>
        </div>
      </div>

      {spectralMode && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
          <h2 className="text-lg font-semibold mb-2">Spectral DoP Analysis</h2>
          <p className="text-sm text-gray-400 mb-4">
            Light flat in wavelength over the band passes a retarder of constant Δn·d with its fast axis at 45°. Each wavelength keeps the input&apos;s degree of polarization; their incoherent sum depolarizes.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <ValidatedNumberInput label="Centre wavelength (nm)" value={lambda0} onChange={setCenterWl} min={1} step="1" />
            <ValidatedNumberInput label="Bandwidth, full width (nm)" value={bw} onChange={setBandwidth} min={0} max={maxBandwidth} step="1" />
            <ValidatedNumberInput label="Retardance at centre (waves)" value={waves} onChange={setRetardance} min={0} max={10000} step="1" />
          </div>
          {spectral && spectral.bandwidths.length > 1 && bw > 0 && (
            <ChartPanel data={[
              { x: spectral.bandwidths, y: spectral.dopVals, name: "DoP", type: "scatter", mode: "lines", line: { color: "#f59e0b", width: 2 } },
            ]} layout={{ ...plotLayout, height: 250, xaxis: { ...plotLayout.xaxis, title: "Bandwidth, full width (nm)" }, yaxis: { ...plotLayout.yaxis, title: "Band-averaged DoP", range: [0, 1.05] } }} />
          )}
          {!results && <p className="mt-2 text-sm text-gray-500">—</p>}
          {spectral && Number.isNaN(spectral.avgDop) && (
            <p className="mt-2 text-sm text-yellow-400">Too many retardance cycles across this band to average; lower the retardance or the bandwidth.</p>
          )}
          {spectral && (
            <div className="mt-2 text-sm text-gray-400">
              Band-averaged DoP: <span className="text-white font-bold">{Number.isNaN(spectral.avgDop) ? "—" : `${fix(spectral.avgDop * 100, 2)}%`}</span>
              <span className="block font-mono">
                Output Stokes: S₀ = {fix(spectral.avgS[0], 4)}, S₁ = {fix(spectral.avgS[1], 4)}, S₂ = {fix(spectral.avgS[2], 4)}, S₃ = {fix(spectral.avgS[3], 4)}
              </span>
            </div>
          )}
        </div>
      )}

      {!spectralMode && (
        <button onClick={() => setSpectralMode(true)} className="mt-4 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-sm hover:border-blue-500">
          Show Spectral Analysis →
        </button>
      )}
      {spectralMode && (
        <button onClick={() => setSpectralMode(false)} className="mt-4 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-sm hover:border-blue-500">
          ← Hide Spectral Analysis
        </button>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-3">Key Formulas</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>DoP = √(S₁² + S₂² + S₃²) / S₀</p>
          <p>I_pol = √(S₁² + S₂² + S₃²) &nbsp; I_unpol = S₀ − I_pol</p>
          <p>Orientation: ψ = ½ · atan2(S₂, S₁)</p>
          <p>Ellipticity angle: χ = ½ · asin(S₃ / I_pol)</p>
          <p>Ellipticity: e = tan(χ)</p>
          <p>Spectral: ⟨S⟩ = ⟨M(λ)⟩ · S, Γ(λ) = 2π m λ₀/λ</p>
        </div>
        <p className="mt-3 text-xs text-gray-500">{CONVENTION_NOTE}</p>
      </div>
    </>
  );
}
