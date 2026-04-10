"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function BackgroundNoisePage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [rxFOV, setRxFOV] = useURLState("rxFOV", 1); // mrad
  const [rxBandwidth, setRxBandwidth] = useURLState("rxBandwidth", 1); // nm optical
  const [rxArea, setRxArea] = useURLState("rxArea", 78.5); // cm² (10cm diameter)
  const [backgroundType, setBackgroundType] = useState<"day-sky" | "night-sky" | "solar-direct" | "urban-glow">("day-sky");
  const [filterRejection, setFilterRejection] = useURLState("filterRejection", 30); // dB

  const backgroundRadiance: Record<string, number> = {
    "day-sky": 50, // W/m²/sr/μm
    "night-sky": 0.001,
    "solar-direct": 1.5e7, // W/m²/sr/μm (spectral radiance, conserved from sun surface)
    "urban-glow": 0.5,
  };

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9; // m
    const lambdaUm = wavelength / 1000; // μm
    const fovRad = rxFOV * 1e-3;
    const omega = Math.PI * (fovRad / 2) ** 2; // solid angle (sr)
    const deltaLambda = rxBandwidth / 1000; // μm
    const A = rxArea * 1e-4; // m²
    const L = backgroundRadiance[backgroundType]; // W/m²/sr/μm

    // Background power: P_b = L × A × Ω × Δλ
    const Pbg = L * A * omega * deltaLambda; // W
    const PbgDBm = 10 * Math.log10(Pbg * 1e3);

    // After optical filter rejection
    const filterLinear = 10 ** (-filterRejection / 10);
    const PbgFiltered = Pbg * filterLinear;
    const PbgFilteredDBm = 10 * Math.log10(Math.max(PbgFiltered * 1e3, 1e-30));

    // Background photon rate
    const photonEnergy = 6.626e-34 * 3e8 / lambda;
    const photonRate = PbgFiltered / photonEnergy;

    // Background electrons per bit (at 1 Gbps)
    const electronsPerBit = photonRate * 0.5 / 1e9; // 0.5 quantum efficiency

    return { Pbg, PbgDBm, PbgFilteredDBm, photonRate, electronsPerBit, omega };
  }, [wavelength, rxFOV, rxBandwidth, rxArea, backgroundType, filterRejection]);

  const plotData = useMemo(() => {
    const fovs = Array.from({ length: 200 }, (_, i) => 0.01 + i * 0.02);
    const A = rxArea * 1e-4;
    const L = backgroundRadiance[backgroundType];
    const deltaLambda = rxBandwidth / 1000;
    const filterLinear = 10 ** (-filterRejection / 10);

    const powers = fovs.map((f) => {
      const omega = Math.PI * (f * 1e-3 / 2) ** 2;
      const P = L * A * omega * deltaLambda * filterLinear;
      return 10 * Math.log10(Math.max(P * 1e3, 1e-30));
    });

    const bandwidths = Array.from({ length: 200 }, (_, i) => 0.1 + i * 0.05);
    const omega = Math.PI * (rxFOV * 1e-3 / 2) ** 2;
    const bwPowers = bandwidths.map((b) => {
      const dl = b / 1000;
      const P = L * A * omega * dl * filterLinear;
      return 10 * Math.log10(Math.max(P * 1e3, 1e-30));
    });

    return [
      { x: fovs, y: powers, type: "scatter", mode: "lines", name: "vs FOV", line: { color: "#06b6d4" } },
      { x: bandwidths, y: bwPowers, type: "scatter", mode: "lines", name: "vs BW (nm)", line: { color: "#f59e0b" } },
    ];
  }, [rxArea, backgroundType, rxBandwidth, rxFOV, filterRejection]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
            
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Background Source</label>
            <select value={backgroundType} onChange={(e) => setBackgroundType(e.target.value as "day-sky" | "night-sky" | "solar-direct" | "urban-glow")}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
              <option value="day-sky">Day Sky</option>
              <option value="night-sky">Night Sky</option>
              <option value="solar-direct">Solar Direct</option>
              <option value="urban-glow">Urban Glow</option>
            </select>
          </div>
          {[
            ["Wavelength (nm)", wavelength, setWavelength],
            ["RX FOV (mrad)", rxFOV, setRxFOV],
            ["Optical BW (nm)", rxBandwidth, setRxBandwidth],
            ["RX Area (cm²)", rxArea, setRxArea],
            ["Filter Rejection (dB)", filterRejection, setFilterRejection],
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
              <div className="flex justify-between"><span className="text-gray-400">Background Power</span><span>{calc.PbgDBm.toFixed(1)} dBm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">After Filter</span><span className="text-cyan-300">{calc.PbgFilteredDBm.toFixed(1)} dBm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Photon Rate</span><span>{calc.photonRate.toExponential(2)} /s</span></div>
              <div className="flex justify-between"><span className="text-gray-400">e⁻/bit (1 Gbps, QE=0.5)</span><span>{calc.electronsPerBit.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Solid Angle</span><span>{calc.omega.toExponential(2)} sr</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-xs text-gray-500 space-y-1">
            <p><strong className="text-gray-400">P<sub>bg</sub> = L × A × Ω × Δλ</strong></p>
            <p><strong className="text-gray-400">Ω = π(FOV/2)²</strong></p>
            <p><strong className="text-gray-400">Radiance:</strong> {backgroundType} = {backgroundRadiance[backgroundType]} W/m²/sr/μm</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "FOV (mrad) / BW (nm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Filtered BG Power (dBm)", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 60 }, font: { color: "#9ca3af" }, legend: { font: { size: 10 } },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
