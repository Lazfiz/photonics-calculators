"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function ModeFieldDiameterPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 4.5); // μm
  const [na, setNa] = useURLState("na", 0.14);
  const [coreIndex, setCoreIndex] = useURLState("coreIndex", 1.4682);
  const [claddingIndex, setCladdingIndex] = useURLState("claddingIndex", 1.4629);
  const [fiberType, setFiberType] = useState<"smf28" | "smf28e" | "smf28e+">("smf28");

  const presets = {
    "smf28": { coreRadius: 4.5, na: 0.14, coreIndex: 1.4682, claddingIndex: Math.sqrt(1.4682 * 1.4682 - 0.14 * 0.14) },
    "smf28e": { coreRadius: 4.1, na: 0.14, coreIndex: 1.4682, claddingIndex: Math.sqrt(1.4682 * 1.4682 - 0.14 * 0.14) },
    "smf28e+": { coreRadius: 4.0, na: 0.14, coreIndex: 1.4685, claddingIndex: Math.sqrt(1.4685 * 1.4685 - 0.14 * 0.14) },
  };

  const applyPreset = (p: "smf28" | "smf28e" | "smf28e+") => {
    const preset = presets[p];
    setCoreRadius(preset.coreRadius);
    setNa(preset.na);
    setCoreIndex(preset.coreIndex);
    setCladdingIndex(preset.claddingIndex);
    setFiberType(p);
  };

  const results = useMemo(() => {
    const a = coreRadius; // μm
    const wl = wavelength / 1000; // μm
    const n1 = coreIndex;
    const n2 = claddingIndex;
    const delta = (n1 * n1 - n2 * n2) / (2 * n1 * n1);

    // V number
    const V = (2 * Math.PI * a / wl) * na;

    // Petermann II MFD (far-field, standard Marcuse approximation)
    const wPetermannII = a * (0.65 + 1.619 / Math.pow(V, 1.5) + 2.879 / Math.pow(V, 6));
    const mfdPetermannII = 2 * wPetermannII;

    // Gaussian approximation MFD
    const wGaussian = a * (0.761 + 1.237 / Math.pow(V, 1.441));
    const mfdGaussian = 2 * wGaussian;

    // Effective area
    const Aeff = Math.PI * wPetermannII * wPetermannII;

    // Mode field diameter vs wavelength
    const wavelengths = Array.from({ length: 100 }, (_, i) => 1100 + i * 10);
    const mfdVsWl = wavelengths.map((w) => {
      const Vw = (2 * Math.PI * a / (w / 1000)) * na;
      return 2 * a * (0.65 + 1.619 / Math.pow(Vw, 1.5) + 2.879 / Math.pow(Vw, 6));
    });

    // MFD vs core radius
    const radii = Array.from({ length: 50 }, (_, i) => 2 + i * 0.2);
    const mfdVsRadius = radii.map((r) => {
      const Vr = (2 * Math.PI * r / wl) * na;
      return 2 * r * (0.65 + 1.619 / Math.pow(Vr, 1.5) + 2.879 / Math.pow(Vr, 6));
    });

    // Spot size intensity profile (Gaussian approximation)
    const r = Array.from({ length: 101 }, (_, i) => (i - 50) * 0.2);
    const intensity = r.map((ri) => Math.exp(-2 * Math.pow(ri / wPetermannII, 2)));

    // Bending loss (simplified macrobend model)
    const bendRadii = Array.from({ length: 50 }, (_, i) => 5 + i * 2);
    const bendLoss = bendRadii.map((R) => {
      const C = (2 * Math.PI * n2) / wl * Math.pow(V, 2) * Math.exp(-2 * V * V / 3);
      return 10 * Math.log10(1 + C / R) / 1e3; // dB/m simplified
    });

    // Single-mode cutoff wavelength (result in μm, convert to nm)
    const cutoffWavelength = (2 * Math.PI * a * na) / 2.405 * 1000;

    return { V, delta, wPetermannII, mfdPetermannII, mfdGaussian, Aeff, wavelengths, mfdVsWl, radii, mfdVsRadius, r, intensity, bendRadii, bendLoss, cutoffWavelength };
  }, [wavelength, coreRadius, na, coreIndex, claddingIndex]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Mode Field Diameter" description="Calculate MFD, effective area, and spot size for single-mode fibers.">
            
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Fiber Parameters</h2>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Fiber Presets</label>
            <div role="group" aria-label="Options" className="flex gap-2">
              {(["smf28", "smf28e", "smf28e+"] as const).map((p) => (
                <button key={p} onClick={() => applyPreset(p)}
                  className={`px-3 py-1 text-xs rounded border transition ${fiberType === p ? "bg-blue-600 border-blue-500" : "bg-gray-800 border-gray-700 hover:border-blue-500"}`}>
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {[
            { label: "Wavelength (nm)", val: wavelength, set: setWavelength },
            { label: "Core Radius (μm)", val: coreRadius, set: setCoreRadius },
            { label: "Numerical Aperture", val: na, set: setNa },
            { label: "Core Index n₁", val: coreIndex, set: setCoreIndex },
            { label: "Cladding Index n₂", val: claddingIndex, set: setCladdingIndex },
          ].map(({ label, val, set }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <ValidatedNumberInput label="{label}" value={val} onChange={set} step="any" />
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-3">
            <ResultRow label="V Number" value={results.V.toFixed(3)} />
            <ResultRow label="Relative Index Δ" value={`${(results.delta * 100).toFixed(3)}%`} />
            <ResultRow label="MFD (Petermann II)" value={`${results.mfdPetermannII.toFixed(2)} μm`} />
            <ResultRow label="MFD (Gaussian)" value={`${results.mfdGaussian.toFixed(2)} μm`} />
            <ResultRow label="Spot Size w₀" value={`${results.wPetermannII.toFixed(2)} μm`} />
            <ResultRow label="Effective Area Aeff" value={`${results.Aeff.toFixed(1)} μm²`} />
            <ResultRow label="Cutoff λc" value={`${results.cutoffWavelength.toFixed(0)} nm`} />
            <ResultRow label="Mode" value={results.V < 2.405 ? "Single-mode" : "Multi-mode"} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Mode Intensity Profile</h2>
          <ChartPanel data={[
              { type: "scatter" as const, mode: "lines" as const, x: results.r, y: results.intensity, line: { color: "#3b82f6", width: 2 }, fill: "tozeroy", fillcolor: "rgba(59,130,246,0.2)" },
              { type: "scatter" as const, mode: "lines" as const, x: [-coreRadius, -coreRadius], y: [0, 1], line: { color: "#f59e0b", dash: "dash" }, name: "Core", showlegend: false },
              { type: "scatter" as const, mode: "lines" as const, x: [coreRadius, coreRadius], y: [0, 1], line: { color: "#f59e0b", dash: "dash" }, name: "Core", showlegend: false },
            ]}
            layout={{
              xaxis: { title: "Radial Position (μm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Normalized Intensity", color: "#9ca3af", gridcolor: "#374151", range: [0, 1.1] },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
           
           
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">MFD vs Wavelength</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.wavelengths, y: results.mfdVsWl, line: { color: "#22c55e", width: 2 } }]}
            layout={{
              xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "MFD (μm)", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
              shapes: [{ type: "line", x0: wavelength, x1: wavelength, y0: 6, y1: 14, line: { color: "#ef4444", dash: "dot" } }],
            }}
           
           
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">MFD vs Core Radius</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.radii, y: results.mfdVsRadius, line: { color: "#f59e0b", width: 2 } }]}
            layout={{
              xaxis: { title: "Core Radius (μm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "MFD (μm)", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
              shapes: [{ type: "line", x0: coreRadius, x1: coreRadius, y0: 6, y1: 14, line: { color: "#ef4444", dash: "dot" } }],
            }}
           
           
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Bending Loss vs Bend Radius</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.bendRadii, y: results.bendLoss.map((l) => l * 1000), line: { color: "#ef4444", width: 2 } }]}
            layout={{
              xaxis: { title: "Bend Radius (mm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Bending Loss (dB/turn)", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
           
           
          />
        </div>
      </div>
    </CalculatorShell>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}
