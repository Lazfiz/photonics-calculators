"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  GAUSSIAN_FWHM_PER_SIGMA, abbeLateralFwhm, axialPsfFwhm, localizationPrecision, rayleighDistance, stedLateralFwhm,
} from "../../../physics/imaging/super-resolution";

const fmtNm = (x: number) => (Number.isFinite(x) ? `${(x * 1e9).toFixed(1)} nm` : "—");

export default function SuperResolutionPage() {
  const [na, setNa] = useURLState("na", 1.4);
  const [wavelength, setWavelength] = useURLState("wavelength", 580); // nm
  const [n, setN] = useURLState("n", 1.52);
  const [stedDepletion, setStedDepletion] = useURLState("stedDepletion", 30); // I_STED / I_sat
  const [palmPhotons, setPalmPhotons] = useURLState("palmPhotons", 5000);

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const palm = localizationPrecision(lam, na, palmPhotons);
    return {
      abbe: abbeLateralFwhm(lam, na),
      rayleigh: rayleighDistance(lam, na),
      axial: axialPsfFwhm(lam, n, na),
      sted: stedLateralFwhm(lam, na, stedDepletion),
      palm,
      palmFwhm: palm * GAUSSIAN_FWHM_PER_SIGMA,
    };
  }, [na, wavelength, n, stedDepletion, palmPhotons]);

  const stedPlot = useMemo(() => {
    const lam = wavelength * 1e-9;
    const zeta = Array.from({ length: 101 }, (_, i) => i * 2);
    return [
      { x: zeta, y: zeta.map((z) => stedLateralFwhm(lam, na, z) * 1e9), name: "STED lateral FWHM", line: { color: "#f87171" }, type: "scatter", mode: "lines" },
      { x: [stedDepletion], y: [stedLateralFwhm(lam, na, stedDepletion) * 1e9], name: "Current", marker: { color: "#fbbf24", size: 11 }, type: "scatter", mode: "markers" },
    ];
  }, [na, wavelength, stedDepletion]);

  const palmPlot = useMemo(() => {
    const lam = wavelength * 1e-9;
    const photons = Array.from({ length: 61 }, (_, i) => 10 ** (2 + i * 0.05)); // 100 – 10⁵
    return [
      { x: photons, y: photons.map((p) => localizationPrecision(lam, na, p) * 1e9), name: "σ (precision)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: photons, y: photons.map((p) => localizationPrecision(lam, na, p) * GAUSSIAN_FWHM_PER_SIGMA * 1e9), name: "FWHM = 2.35σ", line: { color: "#a78bfa", dash: "dash" }, type: "scatter", mode: "lines" },
    ];
  }, [na, wavelength]);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <ValidatedNumberInput label="NA" value={na} onChange={setNa} min={0.1} max={1.7} step="0.01" />
          </div>
          <div>
            <ValidatedNumberInput label="Emission wavelength (nm)" value={wavelength} onChange={setWavelength} min={300} max={1000} />
          </div>
          <div>
            <ValidatedNumberInput label="Refractive index (n)" value={n} onChange={setN} min={1} max={1.8} step="0.01" />
          </div>
          <div>
            <ValidatedNumberInput label="STED I_STED / I_sat" value={stedDepletion} onChange={setStedDepletion} min={0} max={200} />
          </div>
          <div>
            <ValidatedNumberInput label="PALM photons detected" value={palmPhotons} onChange={setPalmPhotons} min={1} max={1000000} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Diffraction limit, lateral FWHM λ/2NA</span><span className="font-mono">{fmtNm(results.abbe)}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Rayleigh distance 0.61λ/NA</span><span className="font-mono text-gray-400">{fmtNm(results.rayleigh)}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Diffraction limit, axial FWHM</span><span className="font-mono">{Number.isFinite(results.axial) ? fmtNm(results.axial) : "— (NA ≥ n)"}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">STED lateral FWHM (2D)</span><span className="font-mono text-red-400">{fmtNm(results.sted)}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">PALM/STORM precision σ</span><span className="font-mono text-blue-400">{fmtNm(results.palm)}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">PALM/STORM FWHM (2.35σ)</span><span className="font-mono text-purple-400">{fmtNm(results.palmFwhm)}</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>STED: d = λ/(2NA√(1 + I/I_sat)), Westphal &amp; Hell, Phys. Rev. Lett. 94, 143903 (2005). 2D (vortex) STED narrows only the lateral spot; the axial FWHM stays 0.88λ/(n − √(n² − NA²)).</p>
            <p>PALM/STORM: σ = s/√N, s = 0.21λ/NA, the Gaussian width of the PSF (Zhang et al., Appl. Opt. 46, 1819, 2007). This is the shot-noise limit (Thompson et al., Biophys. J. 82, 2775, 2002): pixelation, background and EMCCD excess noise (×√2) make it worse (Mortensen et al., Nat. Methods 7, 377, 2010).</p>
            <p>2D localization gives no axial position. 3D methods (astigmatism, biplane) are typically about twice as coarse axially as laterally (Huang et al., Science 319, 810, 2008).</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">STED resolution vs depletion</h2>
          <ChartPanel data={stedPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "I_STED / I_sat", gridcolor: "#333" }, yaxis: { title: "Lateral FWHM (nm)", gridcolor: "#333" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Localization precision vs photons</h2>
          <ChartPanel data={palmPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Photons detected", gridcolor: "#333", type: "log" }, yaxis: { title: "nm", gridcolor: "#333", type: "log" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
      </div>
    </>
  );
}
