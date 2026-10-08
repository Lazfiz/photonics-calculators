"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  antiStokesWavelength, carsLineshape, carsPeakDetuning, ramanShiftFrequency, srsLineshape, stokesWavelength,
} from "../../../physics/imaging/coherent-raman";
import { focalPeakIntensity, gaussianPulsePeakPower, pulseEnergy } from "../../../physics/imaging/multiphoton-focus";

const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)} ${unit}` : "—");

export default function CoherentRamanPage() {
  const [mode, setMode] = useURLState("mode", "CARS");
  const [pumpWl, setPumpWl] = useURLState("pumpWl", 800); // nm
  const [wavenumber, setWavenumber] = useURLState("wavenumber", 2850); // cm⁻¹ (CH₂ stretch)
  const [pumpPower, setPumpPower] = useURLState("pumpPower", 50); // mW
  const [stokesPower, setStokesPower] = useURLState("stokesPower", 50); // mW
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 2); // ps
  const [repRate, setRepRate] = useURLState("repRate", 80); // MHz
  const [na, setNa] = useURLState("na", 1.0);
  const [linewidth, setLinewidth] = useURLState("linewidth", 15); // HWHM, cm⁻¹
  const [chiNR, setChiNR] = useURLState("chiNR", 0.3); // χ_NR / Im χ_R at resonance

  const results = useMemo(() => {
    const lambdaP = pumpWl * 1e-9;
    const shift = wavenumber * 100; // 1/m
    const lambdaS = stokesWavelength(lambdaP, shift);
    const f = repRate * 1e6, tau = pulseWidth * 1e-12;
    const peakPowerPump = gaussianPulsePeakPower(pumpPower * 1e-3, f, tau);
    const peakPowerStokes = gaussianPulsePeakPower(stokesPower * 1e-3, f, tau);
    return {
      stokesWl: lambdaS * 1e9,
      antiStokesWl: antiStokesWavelength(lambdaP, shift) * 1e9,
      freqDiff_THz: ramanShiftFrequency(shift) / 1e12,
      pulseEnergyPump: pulseEnergy(pumpPower * 1e-3, f),
      pulseEnergyStokes: pulseEnergy(stokesPower * 1e-3, f),
      peakPowerPump,
      peakPowerStokes,
      intensityPump: focalPeakIntensity(peakPowerPump, lambdaP, na), // W/m²
      intensityStokes: focalPeakIntensity(peakPowerStokes, lambdaS, na),
    };
  }, [pumpWl, wavenumber, pumpPower, stokesPower, pulseWidth, repRate, na]);

  const spectrumPlot = useMemo(() => {
    const wn: number[] = [];
    const cars: number[] = [];
    const srs: number[] = [];
    for (let w = wavenumber - 500; w <= wavenumber + 500; w += 2) {
      wn.push(w);
      cars.push(carsLineshape(w - wavenumber, linewidth, chiNR));
      srs.push(srsLineshape(w - wavenumber, linewidth));
    }
    const maxCars = Math.max(...cars.filter(Number.isFinite));
    return [
      { x: wn, y: cars.map((v) => v / maxCars), name: "CARS |χ_NR + χ_R|²", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: wn, y: srs, name: "SRS Im χ_R", line: { color: "#f87171" }, type: "scatter", mode: "lines" },
    ];
  }, [wavenumber, linewidth, chiNR]);

  const powerPlot = useMemo(() => {
    // Both beams scaled together by p/P: CARS ∝ I_p² I_s ∝ p³, SRS ∝ I_p I_s ∝ p².
    const powers: number[] = [];
    for (let p = 1; p <= 100; p += 1) powers.push(p);
    return [
      { x: powers, y: powers.map((p) => (p / 100) ** 3), name: "CARS ∝ P³", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: powers, y: powers.map((p) => (p / 100) ** 2), name: "SRS ∝ P²", line: { color: "#f87171" }, type: "scatter", mode: "lines" },
    ];
  }, []);

  const peakShift = carsPeakDetuning(linewidth, chiNR);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="cr-mode">Mode</label>
            <select id="cr-mode" value={mode} onChange={(e) => setMode(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="CARS">CARS (Coherent Anti-Stokes Raman)</option>
              <option value="SRS">SRS (Stimulated Raman Scattering)</option>
            </select>
          </div>
          <ValidatedNumberInput label="Pump wavelength (nm)" value={pumpWl} onChange={setPumpWl} min={400} max={2000} />
          <ValidatedNumberInput label="Raman shift (cm⁻¹)" value={wavenumber} onChange={setWavenumber} min={100} max={4000} />
          <ValidatedNumberInput label="Pump power (mW)" value={pumpPower} onChange={setPumpPower} min={0} max={500} />
          <ValidatedNumberInput label="Stokes power (mW)" value={stokesPower} onChange={setStokesPower} min={0} max={500} />
          <ValidatedNumberInput label="Pulse width, FWHM (ps)" value={pulseWidth} onChange={setPulseWidth} min={0.01} max={100} step="0.1" />
          <ValidatedNumberInput label="Rep rate (MHz)" value={repRate} onChange={setRepRate} min={0.01} max={250} />
          <ValidatedNumberInput label="NA" value={na} onChange={setNa} min={0.1} max={1.7} step="0.01" />
          <ValidatedNumberInput label="Raman linewidth Γ, HWHM (cm⁻¹)" value={linewidth} onChange={setLinewidth} min={1} max={100} />
          <ValidatedNumberInput label="Non-resonant χ_NR (relative to peak Im χ_R)" value={chiNR} onChange={setChiNR} min={0} max={10} step="0.05" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {!Number.isFinite(results.stokesWl) && (
            <p className="text-sm text-yellow-300" role="status">The Raman shift must be smaller than the pump wavenumber (1/λ_p = {(1e7 / pumpWl).toFixed(0)} cm⁻¹).</p>
          )}
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Stokes wavelength</span><span className="font-mono text-blue-400">{fmt(results.stokesWl, 1, "nm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Anti-Stokes (CARS signal) wavelength</span><span className="font-mono text-purple-400">{fmt(results.antiStokesWl, 1, "nm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Frequency difference</span><span className="font-mono">{fmt(results.freqDiff_THz, 2, "THz")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Pulse energy (pump / Stokes)</span><span className="font-mono">{(results.pulseEnergyPump * 1e9).toFixed(3)} / {(results.pulseEnergyStokes * 1e9).toFixed(3)} nJ</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Peak power (pump / Stokes)</span><span className="font-mono text-red-400">{(results.peakPowerPump).toFixed(1)} / {(results.peakPowerStokes).toFixed(1)} W</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Focal peak intensity, pump</span><span className="font-mono text-yellow-400">{fmt(results.intensityPump / 1e13, 1, "GW/cm²")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Focal peak intensity, Stokes</span><span className="font-mono text-yellow-400">{fmt(results.intensityStokes / 1e13, 1, "GW/cm²")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">CARS maximum (dispersive line)</span><span className="font-mono text-green-400">{fmt(peakShift, 1, "cm⁻¹")} from resonance</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>ν̃_S = ν̃_P − Ω̃, ν̃_aS = ν̃_P + Ω̃ (energy conservation)</p>
            <p>CARS ∝ |χ_NR + χ_R|² · I_p² · I_S; SRS ∝ Im χ_R · I_p · I_S, χ_R = −Γ/(Δ + iΓ)</p>
            <p>CARS has a non-resonant background and a dispersive line; SRS is background-free and linear in concentration (Cheng &amp; Xie, J. Phys. Chem. B 108, 827, 2004; Freudiger et al., Science 322, 1857, 2008).</p>
            <p>Focal intensity P_peak/(2π ω_xy²), ω_xy from Zipfel et al. 2003 at each beam&apos;s wavelength; Gaussian pulses. Absolute signal levels need χ⁽³⁾ and the detection chain, so the charts are relative.</p>
            <p>Active mode: <span className="text-green-400">{mode}</span></p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">CARS vs SRS Spectral Shape</h2>
          <ChartPanel data={spectrumPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Raman shift (cm⁻¹)", gridcolor: "#333" }, yaxis: { title: "Normalized signal", gridcolor: "#333" }, legend: { font: { size: 10 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Signal vs Power (both beams scaled)</h2>
          <ChartPanel data={powerPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Power (% of maximum)", gridcolor: "#333" }, yaxis: { title: "Normalized signal", gridcolor: "#333" }, legend: { font: { size: 10 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
      </div>
    </>
  );
}
