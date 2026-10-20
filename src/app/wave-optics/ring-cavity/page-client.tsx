"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c } from "../../../physics/constants";
import { airyPeakWidth } from "../../../physics/thin-film/interference";
import {
  regularRingIncidence, ringCoefficientOfFinesse, ringFinesse, ringFsr, ringPhotonLifetime, ringPlaneMode, ringResponse,
  tiltedMirrorRadius,
} from "../../../physics/wave-optics/ring-cavity";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));

export default function RingCavityPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1064); // nm
  const [lengthRaw, setLength] = useURLState("roundTripLength", 300); // mm
  const [radiusRaw, setRadius] = useURLState("mirrorR", 1000); // mm, every mirror concave
  const [mirrorsRaw, setMirrors] = useURLState("numMirrors", 3);
  const [couplerRaw, setCoupler] = useURLState("outputCouplerR", 0.95);
  const [lossRaw, setLoss] = useURLState("intracavityLoss", 0.01); // power, per round trip

  const wavelength = clamp(wavelengthRaw, 200, 11000, 1064);
  const L_mm = clamp(lengthRaw, 10, 1e5, 300);
  const R_mm = clamp(radiusRaw, 1, 1e7, 1000);
  const N = Math.round(clamp(mirrorsRaw, 3, 8, 3));
  const Roc = clamp(couplerRaw, 0.01, 0.9999, 0.95);
  const loss = clamp(lossRaw, 0, 0.99, 0.01);

  const lambda = wavelength * 1e-9;
  const L = L_mm * 1e-3;
  const d = L / N;
  const R = R_mm * 1e-3;
  const alpha = regularRingIncidence(N);
  const tan = ringPlaneMode(lambda, d, R, alpha, "tangential");
  const sag = ringPlaneMode(lambda, d, R, alpha, "sagittal");
  const stable = Number.isFinite(tan.w) && Number.isFinite(sag.w);

  const rho = Roc * (1 - loss);
  const fsr = ringFsr(L);
  const finesse = ringFinesse(rho);
  const Fcoef = ringCoefficientOfFinesse(rho);
  const fwhm = (fsr * airyPeakWidth(Fcoef)) / (2 * Math.PI); // exact Airy width; NaN when F < 1
  const tau = ringPhotonLifetime(L, rho);

  // Response over ±1.5 FSR, sampled densely near each resonance: Δν = k·FSR + (FSR/2ℱ) tan u.
  const halfWidth = fsr / (2 * finesse);
  const uMax = Math.atan(fsr / 2 / halfWidth);
  const detunings = [-1, 0, 1].flatMap((k) =>
    Array.from({ length: 121 }, (_, i) => k * fsr + halfWidth * Math.tan(-uMax + (2 * uMax * i) / 120)),
  );
  const response = [{
    name: "Intracavity power / peak",
    color: "#60a5fa",
    points: detunings.map((nu) => ({ x: round6(nu / 1e6), y: round6(ringResponse(nu, fsr, Fcoef)) })),
  }];

  const planeText = (m: typeof tan, plane: "tangential" | "sagittal") =>
    Number.isFinite(m.w) ? `${fmt(m.w * 1e6)} µm` : `Unstable: d > 2R_${plane === "tangential" ? "t" : "s"}`;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength λ (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={11000} />
        <ValidatedNumberInput label="Round-trip length L (mm)" value={lengthRaw} onChange={setLength} min={10} max={1e5} step="any" />
        <ValidatedNumberInput label="Mirror radius of curvature R (mm, concave)" value={radiusRaw} onChange={setRadius} min={1} max={1e7} step="any" />
        <ValidatedNumberInput label="Number of mirrors N (regular polygon)" value={mirrorsRaw} onChange={setMirrors} min={3} max={8} step="1" />
        <ValidatedNumberInput label="Output coupler reflectance R_oc" value={couplerRaw} onChange={setCoupler} min={0.01} max={0.9999} step="any" />
        <ValidatedNumberInput label="Other loss per round trip (power fraction)" value={lossRaw} onChange={setLoss} min={0} max={0.99} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <ResultCard label="Free spectral range c/L" value={`${fmt(fsr / 1e6)} MHz`} tone="blue" />
        <ResultCard label="Finesse ℱ = π ρ^¼/(1 − √ρ)" value={fmt(finesse)} subtext={`Round-trip power factor ρ = ${fmt(rho)}`} tone="green" />
        <ResultCard label="Linewidth (FWHM)" value={`${fmt(fwhm / 1e6)} MHz`} subtext={`Q = ν/Δν = ${fmt(c / lambda / fwhm, 3)}`} tone="cyan" />
        <ResultCard label="Photon lifetime" value={`${fmt(tau * 1e9)} ns`} subtext={`Threshold round-trip gain 1/ρ = ${fmt(1 / rho)}`} tone="orange" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Angle of incidence on each mirror" value={`${fmt((alpha * 180) / Math.PI)}°`} subtext={`Segment d = L/N = ${fmt(d * 1e3)} mm`} tone="purple" />
        <ResultCard label="Effective radius R_t / R_s" value={`${fmt(tiltedMirrorRadius(R_mm, alpha, "tangential"))} / ${fmt(tiltedMirrorRadius(R_mm, alpha, "sagittal"))} mm`} subtext="R cos α in the ring plane, R/cos α across it" tone="purple" />
        <ResultCard label="Spot on mirrors: tangential / sagittal" value={`${planeText(tan, "tangential")} / ${planeText(sag, "sagittal")}`} tone="yellow" />
        <ResultCard label="Waist mid-segment: tangential / sagittal" value={`${fmt(tan.w0 * 1e6)} / ${fmt(sag.w0 * 1e6)} µm`} subtext={`Ellipticity w_s/w_t on the mirrors ${fmt(sag.w / tan.w, 3)}`} tone="yellow" />
      </div>

      {!stable && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          No Gaussian mode: each plane needs 0 &lt; d/R<sub>eff</sub> &lt; 2. The tangential plane fails first, at d = 2R cos α.
        </p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>ρ = R<sub>oc</sub>(1 − loss); intracavity power ∝ 1/(1 + F sin²(πΔν/FSR)), F = 4√ρ/(1 − √ρ)²; τ = (L/c)/(−ln ρ).</p>
        <p>Period matrix free(d)·mirror(R<sub>eff</sub>): m = 1 − d/R<sub>eff</sub>, stable for |m| &lt; 1, spot on the mirror
          w² = (λd/π)/√(1 − m²). α = 90° − 180°/N.</p>
      </div>

      <SimpleLineChart title="Cavity resonances over ±1.5 FSR" xLabel="Detuning Δν (MHz)" yLabel="Intracavity power / peak" series={response} />
    </>
  );
}
