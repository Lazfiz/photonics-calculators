"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  ballisticFraction, gaussianPulsePeakPower, multiphotonFwhm, pulseEnergy,
} from "../../../physics/imaging/multiphoton-focus";

const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)} ${unit}` : "—");

export default function MultiphotonDepthPage() {
  const [na, setNa] = useURLState("na", 0.8);
  const [wavelength, setWavelength] = useURLState("wavelength", 800); // nm
  const [n, setN] = useURLState("n", 1.33);
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 100); // fs
  const [repRate, setRepRate] = useURLState("repRate", 80); // MHz
  const [avgPower, setAvgPower] = useURLState("avgPower", 20); // mW
  const [absorption, setAbsorption] = useURLState("absorption", 0.02); // mm⁻¹
  const [scattering, setScattering] = useURLState("scattering", 6); // mm⁻¹

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const fwhm = multiphotonFwhm(lam, n, na, 2);
    const mu = absorption + scattering; // mm⁻¹
    // 2P signal at constant surface power ∝ exp(−2µd): depth where it falls to a fraction F is −ln F/(2µ).
    const depthAt = (fraction: number) => (mu > 0 ? (-Math.log(fraction) / (2 * mu)) * 1000 : Infinity); // µm
    return {
      lateral: fwhm.lateral * 1e9, // nm
      axial: fwhm.axial * 1e6, // µm
      pulseEnergy: pulseEnergy(avgPower * 1e-3, repRate * 1e6) * 1e9, // nJ
      peakPower: gaussianPulsePeakPower(avgPower * 1e-3, repRate * 1e6, pulseWidth * 1e-15) / 1e3, // kW
      attenuationLength: mu > 0 ? 1000 / mu : Infinity, // µm
      depth1e2: depthAt(0.01),
      depth1e3: depthAt(0.001),
    };
  }, [na, wavelength, n, pulseWidth, repRate, avgPower, absorption, scattering]);

  const plotData = useMemo(() => {
    const depths: number[] = [];
    const signal: number[] = [];
    const excitation: number[] = [];
    const mu = (absorption + scattering) * 1000; // 1/m
    for (let d = 0; d <= 1000; d += 5) {
      depths.push(d);
      const att = ballisticFraction(d * 1e-6, mu);
      signal.push(att * att * 100);
      excitation.push(att * 100);
    }
    return [
      { x: depths, y: signal, name: "2P signal (%)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: depths, y: excitation, name: "Excitation (%)", line: { color: "#f87171", dash: "dash" }, type: "scatter", mode: "lines" },
    ];
  }, [absorption, scattering]);

  const valid = Number.isFinite(results.axial);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <ValidatedNumberInput label="Objective NA" value={na} onChange={setNa} min={0.2} max={1.5} step="0.01" />
          </div>
          <div>
            <ValidatedNumberInput label="Excitation wavelength (nm)" value={wavelength} onChange={setWavelength} min={680} max={1300} />
          </div>
          <div>
            <ValidatedNumberInput label="Refractive index (n)" value={n} onChange={setN} min={1} max={1.8} step="0.01" />
          </div>
          <div>
            <ValidatedNumberInput label="Pulse width, FWHM (fs)" value={pulseWidth} onChange={setPulseWidth} min={10} max={1000} />
          </div>
          <div>
            <ValidatedNumberInput label="Rep rate (MHz)" value={repRate} onChange={setRepRate} min={0.01} max={250} />
          </div>
          <div>
            <ValidatedNumberInput label="Average power (mW)" value={avgPower} onChange={setAvgPower} min={0} max={500} />
          </div>
          <div>
            <ValidatedNumberInput label="Absorption coeff (mm⁻¹)" value={absorption} onChange={setAbsorption} min={0} max={10} step="0.01" />
          </div>
          <div>
            <ValidatedNumberInput label="Scattering coeff (mm⁻¹)" value={scattering} onChange={setScattering} min={0} max={50} step="0.1" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {!valid && <p className="text-sm text-yellow-300" role="status">The NA must be smaller than the refractive index.</p>}
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">1P equivalent λ (½ excitation)</span><span className="font-mono text-blue-400">{(wavelength / 2).toFixed(0)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral FWHM (2P)</span><span className="font-mono text-green-400">{fmt(results.lateral, 0, "nm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Axial FWHM (2P)</span><span className="font-mono text-cyan-400">{fmt(results.axial, 2, "µm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Pulse energy</span><span className="font-mono text-yellow-400">{fmt(results.pulseEnergy, 3, "nJ")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Peak power (Gaussian pulse)</span><span className="font-mono text-purple-400">{fmt(results.peakPower, 2, "kW")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Attenuation length 1/µ</span><span className="font-mono text-blue-300">{fmt(results.attenuationLength, 0, "µm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Depth at 1% signal</span><span className="font-mono text-red-400">{fmt(results.depth1e2, 0, "µm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Depth at 0.1% signal</span><span className="font-mono text-orange-400">{fmt(results.depth1e3, 0, "µm")}</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>FWHM = 2√(ln 2)·ω; ω_xy = 0.320λ/(√2 NA) (NA ≤ 0.7) or 0.325λ/(√2 NA^0.91); ω_z = 0.532λ/(√2 (n − √(n² − NA²))) (Zipfel et al., Nat. Biotechnol. 21, 1369, 2003)</p>
            <p>Signal ∝ exp(−2µd) at constant surface power, µ = µ_a + µ_s | Depth = −ln(fraction)/(2µ)</p>
            <p>Default µ_s = 6 mm⁻¹: in vivo mouse cortex at 800 nm, where the depth limit of 5–6 attenuation lengths is about 0.8–1 mm (Kobat, Horton &amp; Xu, J. Biomed. Opt. 16, 106014, 2011).</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Signal &amp; Excitation vs Depth</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Depth (µm)", gridcolor: "#333" }, yaxis: { title: "%", gridcolor: "#333", type: "log" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
      </div>
    </>
  );
}
