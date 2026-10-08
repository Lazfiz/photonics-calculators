"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { quarterWaveLayers, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function SolarProtectionPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [uvWl, setUvWl] = useURLState("uvWl", 350);
  const [irWl, setIrWl] = useURLState("irWl", 1000);
  const [uvPairs, setUvPairs] = useURLState("uvPairs", 4);
  const [irPairs, setIrPairs] = useURLState("irPairs", 6);

  const solarSpectrum = useMemo(() => {
    // Simplified AM1.5 solar irradiance (W/m²/nm) — key wavelengths
    return [
      { wl: 300, e: 0.04 }, { wl: 350, e: 0.08 }, { wl: 400, e: 0.14 },
      { wl: 450, e: 0.18 }, { wl: 500, e: 0.19 }, { wl: 550, e: 0.19 },
      { wl: 600, e: 0.17 }, { wl: 650, e: 0.15 }, { wl: 700, e: 0.13 },
      { wl: 750, e: 0.11 }, { wl: 800, e: 0.09 }, { wl: 850, e: 0.08 },
      { wl: 900, e: 0.07 }, { wl: 950, e: 0.05 }, { wl: 1000, e: 0.04 },
      { wl: 1100, e: 0.03 }, { wl: 1200, e: 0.02 }, { wl: 1400, e: 0.01 },
      { wl: 1600, e: 0.008 }, { wl: 2000, e: 0.004 }, { wl: 2500, e: 0.002 },
    ];
  }, []);

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => 250 + i * 2500 / N);

    // Quarter-wave stack at wl (nm) on the substrate; startH puts H next to the substrate:
    // air | (LH)^p | sub, otherwise air | (HL)^p | sub.
    const addLayers = (wl: number, pairs: number, startH: boolean) => {
      const indices = Array.from({ length: 2 * pairs }, (_, j) => ((j % 2 === 0) === startH ? nL : nH));
      const layers = quarterWaveLayers(indices, wl * 1e-9);
      return reflectanceSpectrum({ incident: 1, layers, substrate: { n: nSub } }, wls.map((w) => w * 1e-9));
    };

    const Ruv = addLayers(uvWl, uvPairs, false); // SP for UV
    const Rir = addLayers(irWl, irPairs, true);   // LP for IR
    const Tcombined = wls.map((_, i) => (1 - Ruv[i]) * (1 - Rir[i]));

    // Solar metrics
    let totalSolar = 0, transmittedSolar = 0;
    solarSpectrum.forEach(({ wl, e }) => {
      const idx = Math.round((wl - 250) / (2500 / N));
      const t = idx >= 0 && idx < N ? Tcombined[idx] : 0;
      totalSolar += e;
      transmittedSolar += e * t;
    });

    return { wls, Tcombined, solarTransmission: totalSolar > 0 ? transmittedSolar / totalSolar : 0 };
  }, [nH, nL, nSub, uvWl, irWl, uvPairs, irPairs, solarSpectrum]);

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>high</sub></>} value={nH} onChange={setNH} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>low</sub></>} value={nL} onChange={setNL} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label="UV design λ (nm)" value={uvWl} onChange={setUvWl} />
        <ValidatedNumberInput label="IR design λ (nm)" value={irWl} onChange={setIrWl} />
        <ValidatedNumberInput label="UV Pairs" value={uvPairs} onChange={setUvPairs} min={1} max={15} />
        <ValidatedNumberInput label="IR Pairs" value={irPairs} onChange={setIrPairs} min={1} max={15} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Solar Heat Transmission</p>
          <p className="text-3xl font-bold text-orange-400">{(tmm.solarTransmission * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Solar Heat Rejection</p>
          <p className="text-3xl font-bold text-green-400">{((1 - tmm.solarTransmission) * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
                              </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[
          { x: tmm.wls, y: tmm.Tcombined, type: "scatter", mode: "lines", name: "Total T", line: { color: "#60a5fa", width: 2 } },
          { x: tmm.wls, y: tmm.Tcombined.map(t => 1 - t), type: "scatter", mode: "lines", name: "Total R+A", line: { color: "#f87171", width: 1 } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "T / (R+A)", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </>
  );
}
