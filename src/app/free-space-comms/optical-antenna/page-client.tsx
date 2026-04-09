"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function OpticalAntennaPage() {
  const [aperture, setAperture] = useURLState("aperture", 10); // cm
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [obscuration, setObscuration] = useURLState("obscuration", 0.15); // fraction
  const [efficiency, setEfficiency] = useURLState("efficiency", 0.75);
  const [beamQuality, setBeamQuality] = useURLState("beamQuality", 1.1); // M²

  const calc = useMemo(() => {
    const D = aperture * 1e-2;
    const lambda = wavelength * 1e-9;
    const D_eff = D * Math.sqrt(1 - obscuration ** 2);

    // Gain
    const gain = (Math.PI * D_eff / lambda) ** 2 * efficiency;
    const gain_dBi = 10 * Math.log10(gain);

    // Half-angle divergence (rad)
    const theta = beamQuality * 4 * lambda / (Math.PI * D_eff);
    const theta_urad = theta * 1e6;

    // Beam waist at antenna
    const w0 = lambda / (Math.PI * theta);

    // Rayleigh range
    const zR = Math.PI * w0 ** 2 / lambda;

    // Directivity
    const directivity = 10 * Math.log10((Math.PI * D / lambda) ** 2);

    return { gain_dBi, gain, theta_urad, w0, zR, directivity, D_eff };
  }, [aperture, wavelength, obscuration, efficiency, beamQuality]);

  const plotData = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const apertures = Array.from({ length: 200 }, (_, i) => 1 + i * 0.5);
    const gains = apertures.map((a) => {
      const D = a * 1e-2;
      const D_eff = D * Math.sqrt(1 - obscuration ** 2);
      return 10 * Math.log10((Math.PI * D_eff / lambda) ** 2 * efficiency);
    });
    const divergences = apertures.map((a) => {
      const D = a * 1e-2;
      const D_eff = D * Math.sqrt(1 - obscuration ** 2);
      return beamQuality * 4 * lambda / (Math.PI * D_eff) * 1e6;
    });
    return [
      { x: apertures, y: gains, type: "scatter", mode: "lines", name: "Gain (dBi)", line: { color: "#06b6d4" }, yaxis: "y" },
      { x: apertures, y: divergences, type: "scatter", mode: "lines", name: "Divergence (μrad)", line: { color: "#f59e0b" }, yaxis: "y2" },
    ];
  }, [wavelength, obscuration, efficiency, beamQuality]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
            
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Aperture Diameter (cm)", aperture, setAperture],
            ["Wavelength (nm)", wavelength, setWavelength],
            ["Central Obscuration Ratio", obscuration, setObscuration],
            ["Aperture Efficiency", efficiency, setEfficiency],
            ["Beam Quality M²", beamQuality, setBeamQuality],
          ].map(([label, val, set]: any) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <ValidatedNumberInput label="{label}" value={val} onChange={set} />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between"><span className="text-gray-400">Effective Aperture</span><span>{(calc.D_eff * 100).toFixed(2)} cm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Antenna Gain</span><span className="text-cyan-300">{calc.gain_dBi.toFixed(1)} dBi</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Directivity</span><span>{calc.directivity.toFixed(1)} dBi</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Half-Angle Divergence</span><span>{calc.theta_urad.toFixed(1)} μrad</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Beam Waist</span><span>{(calc.w0 * 1e3).toFixed(3)} mm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Rayleigh Range</span><span>{calc.zR.toFixed(1)} m</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-xs text-gray-500 space-y-1">
            <p><strong className="text-gray-400">Gain:</strong> G = (π D<sub>eff</sub> / λ)² η</p>
            <p><strong className="text-gray-400">Divergence:</strong> θ = M² · 4λ / (π D<sub>eff</sub>)</p>
            <p><strong className="text-gray-400">Rayleigh Range:</strong> z<sub>R</sub> = π w₀² / λ</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Aperture (cm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Gain (dBi)", color: "#06b6d4", gridcolor: "#374151" },
              yaxis2: { title: "Divergence (μrad)", color: "#f59e0b", gridcolor: "#374151", overlaying: "y", side: "right" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 30, r: 60, b: 40, l: 60 }, font: { color: "#9ca3af" }, legend: { font: { size: 10 } },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
