"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  andrewsApertureFactor, apertureParameter, fresnelZone, rytovVariance, scintillationIndex,
  sphericalRytovVariance, weakApertureFactor,
} from "../../../physics/free-space-comms/turbulence";

const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const chartLayout = (xTitle: string, yTitle: string, logY = false, logX = false) => ({
  xaxis: { title: xTitle, color: "#9ca3af", gridcolor: "#374151", ...(logX ? { type: "log" } : {}) },
  yaxis: { title: yTitle, color: "#9ca3af", gridcolor: "#374151", ...(logY ? { type: "log" } : {}) },
  margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#d1d5db" },
  legend: { x: 0.02, y: 0.02, bgcolor: "rgba(0,0,0,0)" },
});

export default function ApertureAveragingPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 200, max: 20000 }); // nm
  const [rxDiameter, setRxDiameter] = useURLState("rxDiameter", 10, { min: 0, max: 100 }); // cm
  const [cn2, setCn2] = useURLState("cn2", 1e-15, { min: 1e-18, max: 1e-11 }); // m^(−2/3)
  const [distance, setDistance] = useURLState("distance", 1, { min: 0.001, max: 1000 }); // km

  const results = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const L = distance * 1e3;
    const D = rxDiameter * 1e-2;
    const sigmaR2 = rytovVariance(cn2, lambda, L);
    const d2 = apertureParameter(lambda, L, D);
    const aPlane = weakApertureFactor(d2, "plane");
    return {
      sigmaR2,
      sigmaR2Sph: sphericalRytovVariance(cn2, lambda, L),
      fresnel: fresnelZone(lambda, L),
      d2,
      aPlane,
      aSph: weakApertureFactor(d2, "spherical"),
      andPlane: andrewsApertureFactor(d2, "plane"),
      andSph: andrewsApertureFactor(d2, "spherical"),
      weakSigmaI2: aPlane * sigmaR2,
      allSigmaI2: scintillationIndex(sigmaR2, lambda, L, D),
      reductionDb: 10 * Math.log10(1 / aPlane),
    };
  }, [wavelength, rxDiameter, cn2, distance]);

  const factorData = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const L = distance * 1e3;
    const n = 80;
    const D0 = rxDiameter > 0 ? Math.min(1e-3, (rxDiameter * 1e-2) / 2) : 1e-3; // start below the current D
    const Dend = Math.max(1, rxDiameter * 1e-2);
    const Dm = Array.from({ length: n }, (_, i) => D0 * (Dend / D0) ** (i / (n - 1))); // 1 mm .. 1 m
    const d2s = Dm.map((D) => apertureParameter(lambda, L, D));
    const x = Dm.map((D) => D * 100);
    return [
      { type: "scatter", mode: "lines", x, y: d2s.map((d) => weakApertureFactor(d, "plane")), name: "plane, exact", line: { color: "#06b6d4", width: 2 } },
      { type: "scatter", mode: "lines", x, y: d2s.map((d) => andrewsApertureFactor(d, "plane")), name: "plane, Andrews 1992", line: { color: "#06b6d4", dash: "dash" } },
      { type: "scatter", mode: "lines", x, y: d2s.map((d) => weakApertureFactor(d, "spherical")), name: "spherical, exact", line: { color: "#a855f7", width: 2 } },
      { type: "scatter", mode: "lines", x, y: d2s.map((d) => andrewsApertureFactor(d, "spherical")), name: "spherical, Andrews 1992", line: { color: "#a855f7", dash: "dash" } },
      ...(rxDiameter > 0 ? [{
        type: "scatter", mode: "markers", name: "Current", x: [rxDiameter],
        y: [weakApertureFactor(apertureParameter(lambda, L, rxDiameter * 1e-2), "plane")],
        marker: { color: "#facc15", size: 10 },
      }] : []),
    ];
  }, [wavelength, distance, rxDiameter]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={20000} />
        <ValidatedNumberInput label="Receiver Diameter (cm)" value={rxDiameter} onChange={setRxDiameter} min={0} max={100} step="any" />
        <ValidatedNumberInput label="Cn² (m⁻²ᐟ³)" value={cn2} onChange={setCn2} min={1e-18} max={1e-11} step="any" />
        <ValidatedNumberInput label="Link Distance (km)" value={distance} onChange={setDistance} min={0.001} max={1000} step="any" />
      </div>

      {results.sigmaR2 >= 1 && (
        <div role="alert" className="mb-6 rounded-lg border border-yellow-600 bg-yellow-900/30 p-4 text-sm text-yellow-200">
          σ_R² ≥ 1: the weak-fluctuation aperture factor A no longer applies. Use the all-regime σ_I²(D) card instead.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Fresnel zone √(L/k)" value={`${fmt(results.fresnel * 100)} cm`} tone="cyan" />
        <ResultCard label="Aperture parameter d² = kD²/4L" value={fmt(results.d2)} tone="blue" />
        <ResultCard label="A, plane wave (Gaussian aperture)" value={fmt(results.aPlane)} tone="green" subtext={`Andrews 1992: ${fmt(results.andPlane)}`} />
        <ResultCard label="A, spherical wave (Gaussian aperture)" value={fmt(results.aSph)} tone="purple" subtext={`Andrews 1992: ${fmt(results.andSph)}`} />
        <ResultCard label="Rytov variance σ_R² / β₀²" value={`${fmt(results.sigmaR2)} / ${fmt(results.sigmaR2Sph)}`} tone="gray" subtext="plane / spherical" />
        <ResultCard label="Weak σ_I²(D) = A·σ_R²" value={fmt(results.weakSigmaI2)} tone="orange" subtext="plane wave, weak fluctuations only" />
        <ResultCard label="All-regime σ_I²(D)" value={fmt(results.allSigmaI2)} tone="green" subtext="plane wave, weak to strong; interpolation" />
        <ResultCard label="Scintillation reduction" value={`${fmt(results.reductionDb)} dB`} tone="cyan" subtext="10·log10(1/A), plane wave" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold mb-4">Aperture-averaging factor vs receiver diameter</h2>
        <ChartPanel data={factorData} layout={chartLayout("Receiver diameter (cm)", "A = σ_I²(D)/σ_I²(0)", true, true)} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">A = σ_I²(D)/σ_I²(0),   d² = kD²/(4L)</p>
        <p>
          For a Gaussian aperture in weak fluctuations, A is computed by numerical integration of the Kolmogorov
          spectrum (plane and spherical wave). Andrews&apos; interpolation [1 + 1.062 d²]^(−7/6) is within 13 %
          of the exact plane-wave value for d² ≥ 1 (4 % at 10 cm, 1 km), but his spherical-wave version (0.333) runs 25–37 % high at d² = 1–10 (peak 1.37× near d² ≈ 2.3) and 10–13 % low for d² ≥ 1000.
          For D ≫ √(L/k), A ∝ d^(−7/3).
        </p>
        <p>
          The factor applies only for σ_R² &lt; 1. For stronger turbulence use the all-regime σ_I²(D) (plane wave,
          Andrews &amp; Phillips, <em>Laser Beam Propagation through Random Media</em>, 2nd ed., 2005). That expression is
          an interpolation whose aperture terms fall as d⁻² instead of d^(−7/3), so for d² ≫ 1 it averages too little
          (1.8× the weak value at 10 cm, 1 km); in weak turbulence A·σ_R² is the better value. A hard circular
          aperture gives ≈ 5–11 % lower A (more averaging) than this Gaussian aperture at d² = 1–30, but a higher A at
          large d²: the ratio crosses 1 near d² ≈ 100 and tends to 1.13 as d² → ∞.
        </p>
      </div>
    </>
  );
}
