"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function ApertureAveragingPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);
  const [rxDiameter, setRxDiameter] = useURLState("rxDiameter", 10); // cm
  const [cn2, setCn2] = useURLState("cn2", 1e-15); // refractive index structure parameter m^(-2/3)
  const [range, setRange] = useURLState("range", 1000); // m
  const [windSpeed, setWindSpeed] = useURLState("windSpeed", 5); // m/s

  // Aperture averaging factor: F_A = (D / (√(λ·L)))^(-7/6) for D >> √(λL)
  // Scintillation reduction with large apertures
  // Andrews & Phillips model
  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const D = rxDiameter * 1e-2;
    const L = range;
    const k = 2 * Math.PI / lambda;

    // Fresnel zone: sqrt(λL)
    const fresnel = Math.sqrt(lambda * L);
    const fresnel_cm = fresnel * 100;

    // Aperture averaging factor (plane wave, weak turbulence)
    // F_A ≈ [1 + 1.062 (D / sqrt(λL))^(7/6)]^(-1)
    const ratio = D / fresnel;
    const FA_plane = 1 / (1 + 1.062 * Math.pow(ratio, 7 / 6));

    // For spherical wave:
    const FA_sphere = 1 / (1 + 0.5 * Math.pow(ratio, 7 / 6));

    // Normalized variance of irradiance (Rytov variance)
    const sigmaR2_plane = 1.23 * Math.pow(cn2, 1) * Math.pow(k, 7 / 6) * Math.pow(L, 11 / 6);
    const sigmaR2_sphere = 0.5 * sigmaR2_plane;

    // Scintillation index with aperture averaging
    const sigmaI2_plane = sigmaR2_plane * FA_plane;
    const sigmaI2_sphere = sigmaR2_sphere * FA_sphere;

    // Aperture averaging gain in dB
    const gainDB = -10 * Math.log10(Math.max(FA_plane, 1e-12));

    return { fresnel_cm, ratio, FA_plane, FA_sphere, sigmaR2_plane, sigmaR2_sphere, sigmaI2_plane, sigmaI2_sphere, gainDB };
  }, [wavelength, rxDiameter, cn2, range, windSpeed]);

  const plotData = useMemo(() => {
    const diameters = Array.from({ length: 100 }, (_, i) => 0.5 + i * 0.5); // cm
    const lambda = wavelength * 1e-9;
    const L = range;
    const k = 2 * Math.PI / lambda;
    const fresnel = Math.sqrt(lambda * L);

    const FA_plane = diameters.map((d) => {
      const ratio = (d * 1e-2) / fresnel;
      return 1 / (1 + 1.062 * Math.pow(ratio, 7 / 6));
    });
    const FA_sphere = diameters.map((d) => {
      const ratio = (d * 1e-2) / fresnel;
      return 1 / (1 + 0.5 * Math.pow(ratio, 7 / 6));
    });

    const sigmaI2_plane = FA_plane.map((fa) => 1.23 * cn2 * Math.pow(k, 7 / 6) * Math.pow(L, 11 / 6) * fa);
    const sigmaI2_sphere = FA_sphere.map((fa) => 0.496 * cn2 * Math.pow(k, 7 / 6) * Math.pow(L, 11 / 6) * fa);

    return [
      { x: diameters, y: FA_plane, type: "scatter", mode: "lines", name: "F_A (plane)", line: { color: "#06b6d4" } },
      { x: diameters, y: FA_sphere, type: "scatter", mode: "lines", name: "F_A (sphere)", line: { color: "#a855f7" } },
    ];
  }, [wavelength, cn2, range]);

  const plotData2 = useMemo(() => {
    const diameters = Array.from({ length: 100 }, (_, i) => 0.5 + i * 0.5);
    const lambda = wavelength * 1e-9;
    const L = range;
    const k = 2 * Math.PI / lambda;
    const fresnel = Math.sqrt(lambda * L);
    const sigmaR2 = 1.23 * cn2 * Math.pow(k, 7 / 6) * Math.pow(L, 11 / 6);

    const sigmaI2 = diameters.map((d) => {
      const ratio = (d * 1e-2) / fresnel;
      const fa = 1 / (1 + 1.062 * Math.pow(ratio, 7 / 6));
      return sigmaR2 * fa;
    });

    return [{ x: diameters, y: sigmaI2, type: "scatter", mode: "lines", name: "σ_I² (plane)", line: { color: "#f97316" } }];
  }, [wavelength, cn2, range]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Wavelength (nm)", wavelength, setWavelength],
            ["RX Diameter (cm)", rxDiameter, setRxDiameter],
            ["C_n² (m⁻²ᐟ³)", cn2, setCn2, 1e-15],
            ["Range (m)", range, setRange],
            ["Wind Speed (m/s)", windSpeed, setWindSpeed],
          ].map(([label, val, set, step]: any) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <ValidatedNumberInput label="{label}" value={val} onChange={set} />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Fresnel Zone √(λL)</span><span>{calc.fresnel_cm.toFixed(2)} cm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">D / √(λL) ratio</span><span>{calc.ratio.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">F_A (plane wave)</span><span className="font-bold">{calc.FA_plane.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">F_A (spherical wave)</span><span>{calc.FA_sphere.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Rytov σ_R² (plane)</span><span>{calc.sigmaR2_plane.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">σ_I² with averaging (plane)</span><span className="text-orange-400 font-bold">{calc.sigmaI2_plane.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Averaging Gain</span><span className="text-green-400">{calc.gainDB.toFixed(2)} dB</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Averaging Factor vs Diameter</h3>
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "RX Diameter (cm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "F_A", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 50 }, font: { color: "#9ca3af" },
            }} />
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Scintillation Index vs Diameter</h3>
            <ChartPanel data={plotData2} layout={{
              xaxis: { title: "RX Diameter (cm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "σ_I²", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 50 }, font: { color: "#9ca3af" },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
