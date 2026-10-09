"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { airyPeakNear, coefficientOfFinesse, reflectingFinesse } from "../../../physics/thin-film/interference";

export default function FabryPerotFilterPage() {
  const [nCavity, setNCavity] = useURLState("nCavity", 1.5);
  const [spacing, setSpacing] = useURLState("spacing", 500);
  const [reflectance, setReflectance] = useURLState("reflectance", 0.8);
  const [wlCenter, setWlCenter] = useURLState("wlCenter", 550);

  const { chartData, peak, finesse } = useMemo(() => {
    const F = coefficientOfFinesse(reflectance);
    const opticalThickness = nCavity * spacing * 1e-9; // nd, m
    // The transmission peak nearest the wavelength of interest, with its own FSR and FWHM.
    const peak = airyPeakNear(opticalThickness, wlCenter * 1e-9, F);
    const centre_nm = peak.wavelength * 1e9;
    const fsr_nm = peak.fsr * 1e9;
    const fwhm_nm = peak.fwhm * 1e9;

    const wls: number[] = [];
    const T: number[] = [];
    const Rcurve: number[] = [];
    // Window: the peak ± 1.2 FSR, sampled finely enough to resolve the peak (step ≤ FWHM/10, 500–20000 points).
    const lo = Math.max(1, centre_nm - 1.2 * fsr_nm);
    const hi = centre_nm + 1.2 * fsr_nm;
    if (Number.isFinite(F) && Number.isFinite(lo) && Number.isFinite(hi) && hi > lo) {
      const wanted = Number.isFinite(fwhm_nm) && fwhm_nm > 0 ? Math.ceil((hi - lo) / (fwhm_nm / 10)) + 1 : 500;
      const count = Math.min(20000, Math.max(500, wanted));
      for (let i = 0; i < count; i++) {
        const wl = lo + ((hi - lo) * i) / (count - 1);
        const delta = (4 * Math.PI * opticalThickness) / (wl * 1e-9);
        const s = F * Math.sin(delta / 2) ** 2;
        wls.push(wl);
        T.push(1 / (1 + s));
        Rcurve.push(s / (1 + s));
      }
    }
    const chartData = [
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "Transmittance", line: { color: "#60a5fa" } },
      { x: wls, y: Rcurve, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#f87171" } },
    ];
    return { chartData, peak, finesse: reflectingFinesse(F) };
  }, [nCavity, spacing, reflectance, wlCenter]);

  const peak_nm = peak.wavelength * 1e9;
  const fsr_nm = peak.fsr * 1e9;
  const fwhm_nm = peak.fwhm * 1e9;

  return (
    <>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="n (cavity)" value={nCavity} onChange={setNCavity} min={0.1} step="0.01" />
        <ValidatedNumberInput label="Cavity Spacing (nm)" value={spacing} onChange={setSpacing} min={1} step="10" />
        <ValidatedNumberInput label="Mirror Reflectance" value={reflectance} onChange={setReflectance} min={0} max={0.999} step="0.01" />
        <ValidatedNumberInput label="Wavelength of interest (nm)" value={wlCenter} onChange={setWlCenter} min={1} step="10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Nearest peak: λ_m (order m)</p>
          <p className="text-xl font-bold text-green-400">
            {Number.isFinite(peak_nm) ? `${peak_nm.toFixed(2)} nm (order ${peak.order})` : "—"}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FSR at the peak (λ²/2nd)</p>
          <p className="text-xl font-bold text-blue-400">{Number.isFinite(fsr_nm) ? `${fsr_nm.toFixed(2)} nm` : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FWHM at the peak</p>
          <p className="text-xl font-bold text-yellow-400">{Number.isFinite(fwhm_nm) ? `${fwhm_nm.toPrecision(3)} nm` : "— (T never falls below ½)"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Finesse</p>
          <p className="text-xl font-bold text-red-400">{Number.isFinite(finesse) ? finesse.toFixed(2) : "—"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">Airy Function</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>T = 1 / (1 + F·sin²(δ/2))</p>
          <p>δ = 4πnd/λ</p>
          <p>Peaks: δ = 2πm, i.e. λ_m = 2nd/m</p>
          <p>F = 4R/(1−R)²</p>
          <p>FSR = λ²/(2nd)</p>
          <p>ℱ = π√F/2</p>
          <p>FWHM = 4πnd[1/(2πm − w/2) − 1/(2πm + w/2)], w = 4 asin(1/√F)</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "T / R", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.02, y: 0.98 },
        }} />
      </div>
    </>
  );
}
