"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { accumulatedDispersion, residualSlope as residualSlopeOf } from "../../../physics/fiber-optics/dispersion-comp";

// UI units ↔ SI: D 1 ps/(nm·km) = 1e-6 s/m², S 1 ps/(nm²·km) = 1e3 s/m³, D·L 1 ps/nm = 1e-3 s/m, S·L 1 ps/nm² = 1e6 s/m².
const PS_NM_KM = 1e-6;
const PS_NM2_KM = 1e3;
const KM = 1e3;
const NM = 1e-9;
const S_PER_M_TO_PS_NM = 1e3;
const S_PER_M2_TO_PS_NM2 = 1e-6;
const toSI = (D_ps_nm_km: number, S_ps_nm2_km: number) => ({ D: D_ps_nm_km * PS_NM_KM, S: S_ps_nm2_km * PS_NM2_KM });

export default function DispersionMapPage() {
  const [lengthSMF, setLengthSMF] = useURLState("lengthSMF", 80, { min: 0, max: 500 });
  const [lengthDCF, setLengthDCF] = useURLState("lengthDCF", 15, { min: 0, max: 100 });
  const [dispSMF, setDispSMF] = useURLState("dispSMF", 17, { min: -30, max: 30 });
  const [dispDCF, setDispDCF] = useState(-100);
  const [slopeSMF, setSlopeSMF] = useURLState("slopeSMF", 0.056, { min: -1, max: 1 });
  const [slopeDCF, setSlopeDCF] = useState(-0.2);
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 1530, max: 1629 }); // nm, inside the plotted band

  const smf = toSI(dispSMF, slopeSMF);
  const dcf = toSI(dispDCF, slopeDCF);
  const totalDispSMF = accumulatedDispersion(smf, lengthSMF * KM) * S_PER_M_TO_PS_NM;
  const totalDispDCF = accumulatedDispersion(dcf, lengthDCF * KM) * S_PER_M_TO_PS_NM;
  const netDispersion = totalDispSMF + totalDispDCF;
  const residualSlope = residualSlopeOf(smf, lengthSMF * KM, dcf, lengthDCF * KM) * S_PER_M2_TO_PS_NM2;

  const chartData = useMemo(() => {
    const s = toSI(dispSMF, slopeSMF);
    const c = toSI(dispDCF, slopeDCF);
    const wls = Array.from({ length: 100 }, (_, i) => 1530 + i);
    const dispVsWl = wls.map(wl => {
      const detuning = (wl - wavelength) * NM;
      const net = accumulatedDispersion(s, lengthSMF * KM, detuning) + accumulatedDispersion(c, lengthDCF * KM, detuning);
      return Math.round(net * S_PER_M_TO_PS_NM * 1e6) / 1e6;
    });
    return [
      { x: wls, y: dispVsWl, type: "scatter" as const, mode: "lines" as const, name: "Net Dispersion", line: { color: "#60a5fa" } },
      { x: [wavelength], y: [netDispersion], type: "scatter" as const, mode: "markers" as const, name: "Operating λ", marker: { color: "#f87171", size: 12 } },
    ];
  }, [lengthSMF, lengthDCF, dispSMF, dispDCF, slopeSMF, slopeDCF, wavelength, netDispersion]);

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="SMF Length (km)" value={lengthSMF} onChange={setLengthSMF} min={0} max={500} />
        <ValidatedNumberInput label="SMF Dispersion (ps/nm/km)" value={dispSMF} onChange={setDispSMF} min={-30} max={30} step="0.1" />
        <ValidatedNumberInput label="SMF Slope (ps/nm²/km)" value={slopeSMF} onChange={setSlopeSMF} min={-1} max={1} step="0.001" />
        <ValidatedNumberInput label="DCF Length (km)" value={lengthDCF} onChange={setLengthDCF} min={0} max={100} />
        <ValidatedNumberInput label="DCF Dispersion (ps/nm/km)" value={dispDCF} onChange={setDispDCF} step="1" />
        <ValidatedNumberInput label="DCF Slope (ps/nm²/km)" value={slopeDCF} onChange={setSlopeDCF} step="0.01" />
        <ValidatedNumberInput label="Reference Wavelength (nm)" value={wavelength} onChange={setWavelength} min={1530} max={1629} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Net Dispersion</p>
          <p className={`text-2xl font-bold ${Math.abs(netDispersion) < 100 ? "text-green-400" : "text-yellow-400"}`}>{netDispersion.toFixed(0)} ps/nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SMF Total</p>
          <p className="text-2xl font-bold text-blue-400">{totalDispSMF.toFixed(0)} ps/nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">DCF Total</p>
          <p className="text-2xl font-bold text-purple-400">{totalDispDCF.toFixed(0)} ps/nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Residual Slope</p>
          <p className="text-2xl font-bold text-orange-400">{residualSlope.toFixed(3)} ps/nm²</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Net Dispersion (ps/nm)", gridcolor: "#374151", zerolinecolor: "#4b5563" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </>
  );
}
