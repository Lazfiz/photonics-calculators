"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  focalIntensityRadius, focalPeakIntensity, gaussianPulsePeakPower, multiphotonFwhm, pulseEnergy,
} from "../../../physics/imaging/multiphoton-focus";
import {
  averageShgPower, backwardCoherenceLength, forwardCoherenceLength, shgCoefficient,
} from "../../../physics/imaging/second-harmonic-generation";

const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)} ${unit}` : "—");
const sci = (x: number, unit: string) => (Number.isFinite(x) ? `${x.toExponential(2)} ${unit}` : "—");

export default function SecondHarmonicGenerationPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 800); // nm
  const [na, setNa] = useURLState("na", 0.8);
  const [n, setN] = useURLState("n", 1.33);
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 100); // fs
  const [avgPower, setAvgPower] = useURLState("avgPower", 50); // mW
  const [repRate, setRepRate] = useURLState("repRate", 80); // MHz
  const [chi2, setChi2] = useURLState("chi2", 1); // d_eff, pm/V
  const [crystalLength, setCrystalLength] = useURLState("crystalLength", 10); // µm
  const [dn, setDn] = useURLState("dn", 0.01); // n(2ω) − n(ω)

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const P = avgPower * 1e-3, f = repRate * 1e6, tau = pulseWidth * 1e-15;
    const w0 = focalIntensityRadius(lam, na);
    const shg = shgCoefficient({ lambda: lam, length: crystalLength * 1e-6, deff: chi2 * 1e-12, nOmega: n, deltaN: dn, w0 });
    const shPower = averageShgPower(shg.K, P, f, tau);
    const fwhm = multiphotonFwhm(lam, n, na, 2);
    const peakPower = gaussianPulsePeakPower(P, f, tau);
    return {
      shgNm: wavelength / 2,
      lateral: fwhm.lateral * 1e9,
      axial: fwhm.axial * 1e6,
      pulseEnergy: pulseEnergy(P, f) * 1e9,
      peakIntensity: focalPeakIntensity(peakPower, lam, na),
      w0: w0 * 1e6,
      b: shg.b * 1e6,
      xi: shg.xi,
      h: shg.h,
      forwardLc: forwardCoherenceLength(lam, dn) * 1e6,
      backwardLc: backwardCoherenceLength(lam, n, n + dn) * 1e9,
      shPower,
      efficiency: shPower / P,
      nearFieldEfficiency: averageShgPower(shg.KNearField, P, f, tau) / P,
      bandwidth: 0.441 / tau / 1e12, // THz, transform-limited Gaussian
    };
  }, [wavelength, na, n, pulseWidth, avgPower, repRate, chi2, crystalLength, dn]);

  const plotData = useMemo(() => {
    const lam = wavelength * 1e-9;
    const P = avgPower * 1e-3, f = repRate * 1e6, tau = pulseWidth * 1e-15;
    const w0 = focalIntensityRadius(lam, na);
    const lengths = Array.from({ length: 81 }, (_, i) => 10 ** (-1 + i * 0.05)); // 0.1–1000 µm
    const positive = (y: number) => (y > 0 ? y : NaN);
    const at = (L: number) => shgCoefficient({ lambda: lam, length: L * 1e-6, deff: chi2 * 1e-12, nOmega: n, deltaN: dn, w0 });
    const coeffs = lengths.map(at);
    const current = at(crystalLength);
    return [
      { x: lengths, y: coeffs.map((r) => positive(averageShgPower(r.K, P, f, tau) * 1e9)), name: "Focused (Boyd–Kleinman)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: lengths, y: coeffs.map((r) => positive(averageShgPower(r.KNearField, P, f, tau) * 1e9)), name: "Plane wave, L² sinc²", line: { color: "#f87171", dash: "dash" }, type: "scatter", mode: "lines" },
      { x: [crystalLength], y: [positive(averageShgPower(current.K, P, f, tau) * 1e9)], name: "Current", marker: { color: "#fbbf24", size: 11 }, type: "scatter", mode: "markers" },
    ];
  }, [wavelength, na, n, pulseWidth, avgPower, repRate, chi2, crystalLength, dn]);

  const valid = Number.isFinite(results.h) && Number.isFinite(results.axial);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <ValidatedNumberInput label="Excitation wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={2000} />
          </div>
          <div>
            <ValidatedNumberInput label="Objective NA" value={na} onChange={setNa} min={0.05} max={1.5} step="0.01" />
          </div>
          <div>
            <ValidatedNumberInput label="Refractive index n(ω)" value={n} onChange={setN} min={1} max={3} step="0.01" />
          </div>
          <div>
            <ValidatedNumberInput label="Pulse width, FWHM (fs)" value={pulseWidth} onChange={setPulseWidth} min={10} max={1000} />
          </div>
          <div>
            <ValidatedNumberInput label="Average power (mW)" value={avgPower} onChange={setAvgPower} min={0} max={500} />
          </div>
          <div>
            <ValidatedNumberInput label="Rep rate (MHz)" value={repRate} onChange={setRepRate} min={0.01} max={250} />
          </div>
          <div>
            <ValidatedNumberInput label="d_eff (pm/V)" value={chi2} onChange={setChi2} min={0.01} max={100} step="0.1" />
          </div>
          <div>
            <ValidatedNumberInput label="Sample thickness (µm)" value={crystalLength} onChange={setCrystalLength} min={0.1} max={1000} />
          </div>
          <div>
            <ValidatedNumberInput label="Dispersion n(2ω) − n(ω)" value={dn} onChange={setDn} min={-0.5} max={0.5} step="0.001" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {!valid && <p className="text-sm text-yellow-300" role="status">No result: check that NA &lt; n, n(2ω) ≥ 1 and the thickness, rate and pulse width are positive.</p>}
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">SHG wavelength</span><span className="font-mono text-blue-400">{results.shgNm.toFixed(0)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral / axial FWHM (I²)</span><span className="font-mono text-green-400">{fmt(results.lateral, 0, "nm")} / {fmt(results.axial, 2, "µm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Pulse energy</span><span className="font-mono text-yellow-400">{fmt(results.pulseEnergy, 3, "nJ")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Focal peak intensity</span><span className="font-mono text-purple-400">{fmt(results.peakIntensity / 1e16, 2, "TW/cm²")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Focus w₀ / confocal parameter b</span><span className="font-mono">{fmt(results.w0, 3, "µm")} / {fmt(results.b, 2, "µm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Focusing ξ = L/b, h(σ, ξ)</span><span className="font-mono">{valid ? `${results.xi.toFixed(2)}, ${results.h.toPrecision(3)}` : "—"}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Coherence length, forward</span><span className="font-mono text-blue-300">{Number.isFinite(results.forwardLc) ? `${results.forwardLc.toFixed(2)} µm` : "∞ (phase-matched)"}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Coherence length, backward</span><span className="font-mono text-cyan-400">{fmt(results.backwardLc, 0, "nm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Average SH power</span><span className="font-mono text-pink-400">{sci(results.shPower * 1e6, "µW")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Conversion efficiency (average)</span><span className="font-mono text-pink-400">{sci(results.efficiency * 100, "%")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Plane-wave L² estimate</span><span className="font-mono text-gray-400">{sci(results.nearFieldEfficiency * 100, "%")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Fundamental bandwidth (Gaussian, TL)</span><span className="font-mono text-orange-400">{fmt(results.bandwidth, 2, "THz")}</span></div>
          {results.efficiency > 0.1 && <p className="text-sm text-yellow-300" role="status">Above ≈ 10 % the fundamental is depleted and this undepleted-pump estimate is too high.</p>}
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>P_2ω = 16π² d_eff² L P_ω² h(σ, ξ)/(ε₀ c n_ω n_2ω λ³), h = |∫_−ξ^ξ e^(iστ)/(1 + iτ) dτ|²/(4ξ), ξ = L/b, σ = bΔk/2, Δk = 2k_ω − k_2ω (Boyd &amp; Kleinman, J. Appl. Phys. 39, 3597, 1968).</p>
            <p>For L ≪ b this is the plane-wave 8π² d² L² I sinc²(ΔkL/2)/(ε₀ c n² n λ²). For L ≫ b and normal dispersion (n(2ω) &gt; n(ω)), the Gouy phase cancels the harmonic from a uniform slab: in tissue, SHG comes from structure on the scale of the focus and the coherence lengths.</p>
            <p>Gaussian focus w₀ = 2ω_xy (Zipfel et al. 2003), b = 2πn w₀²/λ; paraxial, so only indicative above NA ≈ 0.5. Gaussian pulses: ⟨P_2ω⟩ = K · 0.664 ⟨P⟩²/(fτ).</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Average SH Power vs Sample Thickness</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Thickness L (µm)", gridcolor: "#333", type: "log" }, yaxis: { title: "SH power (nW)", gridcolor: "#333", type: "log" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
      </div>
    </>
  );
}
