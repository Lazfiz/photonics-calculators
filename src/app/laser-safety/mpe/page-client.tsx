"use client";

import { useMemo, useState } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyCwBounds from "../../../components/laser-safety-cw-bounds";
import LaserSafetyCwReferences from "../../../components/laser-safety-cw-references";
import LaserSafetyCwScope from "../../../components/laser-safety-cw-scope";
import LaserSafetySuiteLinks from "../../../components/laser-safety-suite-links";
import { calculateEducationalContinuousMpe } from "../../../lib/laser-safety-mpe";
import { useURLState } from "../../../hooks/use-url-state";
const wavelengthPresets = [450, 532, 850, 1050];
const exposurePresets = [0.001, 0.25, 1, 10, 30, 100, 600, 3600];

export default function MPEPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 532);
  const [exposure, setExposure] = useURLState("exposure", 0.25);

  const result = useMemo(() => calculateEducationalContinuousMpe(wavelength, exposure), [wavelength, exposure]);

  const chartData = useMemo(() => {
    const logMin = -3;
    const logMax = Math.log10(3e4);
    const times = Array.from({ length: 240 }, (_, i) => Math.pow(10, logMin + (i / 239) * (logMax - logMin))); // 1 ms to 3×10^4 s
    const radiantExposure = times.map((t) => {
      const sample = calculateEducationalContinuousMpe(wavelength, t);
      return sample.status === "supported" ? sample.radiantExposureMpe_mJcm2 : null;
    });
    const irradiance = times.map((t) => {
      const sample = calculateEducationalContinuousMpe(wavelength, t);
      return sample.status === "supported" ? sample.equivalentIrradianceMpe_mWcm2 : null;
    });

    return [
      {
        x: times,
        y: radiantExposure,
        type: "scatter" as const,
        mode: "lines",
        name: "Radiant exposure Hₘₚₑ (mJ/cm²)",
        line: { color: "#60a5fa", width: 3 },
      },
      {
        x: times,
        y: irradiance,
        type: "scatter" as const,
        mode: "lines",
        name: "Equivalent irradiance Eₘₚₑ (mW/cm²)",
        line: { color: "#f59e0b", width: 3, dash: "dash" },
        yaxis: "y2",
      },
    ];
  }, [wavelength]);

  return (
    <CalculatorShell
      backHref="/laser-safety"
      backLabel="Laser Safety"
      title="Maximum Permissible Exposure (MPE)"
      description="Quarantined educational MPE view: bounded small-source ocular direct-beam branch with explicitly implemented ANSI-style time slices (1 ms to 3×10^4 s). Unsupported regimes are disabled instead of approximated."
    >
      <LaserSafetyDisclaimer />
      <LaserSafetyCwBounds />
      <LaserSafetyCwReferences />

      <LaserSafetyCwScope />

      <div className="mb-5 flex flex-wrap gap-2">
        {wavelengthPresets.map((preset) => (
          <button
            key={preset}
            onClick={() => setWavelength(preset)}
            className={`rounded-full border px-3 py-1 text-sm transition ${wavelength === preset ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}
          >
            {preset} nm
          </button>
        ))}
        {exposurePresets.map((preset) => (
          <button
            key={preset}
            onClick={() => setExposure(preset)}
            className={`rounded-full border px-3 py-1 text-sm transition ${exposure === preset ? "border-purple-400 bg-purple-500/15 text-purple-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}
          >
            {preset < 1 ? `${preset * 1000} ms` : preset < 60 ? `${preset}s` : preset < 3600 ? `${(preset / 60).toFixed(preset % 60 === 0 ? 0 : 1)} min` : `${(preset / 3600).toFixed(preset % 3600 === 0 ? 0 : 1)} h`}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <InputSlider label="Wavelength" value={wavelength} onChange={setWavelength} min={400} max={1050} step={1} unit="nm" />
        <InputSlider label="Exposure time" value={exposure} onChange={setExposure} min={0.001} max={30000} step={0.001} unit="s" />
      </div>

      {result.status === "supported" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
            <ResultCard label="Radiant exposure Hₘₚₑ" value={`${result.radiantExposureMpe_mJcm2.toFixed(3)} mJ/cm²`} tone="blue" />
            <ResultCard label="Equivalent irradiance Eₘₚₑ" value={`${result.equivalentIrradianceMpe_mWcm2.toFixed(3)} mW/cm²`} tone="yellow" />
            <ResultCard label="Hazard regime" value={result.regime} tone="red" />
            <ResultCard label="Scope" value={result.scope} tone="green" />
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
            <p><span className="font-semibold text-white">Hₘₚₑ</span> is the allowable radiant exposure (energy per area).</p>
            <p><span className="font-semibold text-white">Eₘₚₑ</span> is the equivalent irradiance (power per area), computed here as Hₘₚₑ / t.</p>
            <p>This page intentionally does not pretend those are interchangeable.</p>
          </div>

          <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 mb-6 text-sm text-red-100 leading-6">
            <ul className="list-disc space-y-1 pl-5">
              {result.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          <ChartPanel
            data={chartData}
            layout={{
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: { color: "#9ca3af" },
              xaxis: { title: "Exposure time (s)", gridcolor: "#374151", type: "log" },
              yaxis: { title: "Hₘₚₑ (mJ/cm²)", gridcolor: "#374151", type: "log" },
              yaxis2: {
                title: "Eₘₚₑ (mW/cm²)",
                overlaying: "y",
                side: "right",
                type: "log",
                gridcolor: "#374151",
              },
              margin: { t: 30, r: 80, b: 50, l: 70 },
              legend: { orientation: "h", y: -0.2 },
            }}
          />
        </>
      ) : (
        <div className="rounded-xl border border-red-800 bg-red-950/40 p-6 text-red-100">
          <p className="text-lg font-semibold">Unsupported regime intentionally disabled</p>
          <p className="mt-2 text-sm leading-6">{result.reason}</p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm leading-6 text-red-100/90">
            {result.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <LaserSafetySuiteLinks currentHref="/laser-safety/mpe" />
    </CalculatorShell>
  );
}
