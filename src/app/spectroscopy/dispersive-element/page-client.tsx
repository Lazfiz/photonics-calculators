"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  blazeAngleFromLittrow, blazeWavelength, flatDetectorReciprocalDispersion, gratingAngularDispersion,
  gratingDiffractionAngle, gratingReciprocalLinearDispersion, overlapFreeLimit, scalarBlazeEfficiency,
} from "../../../physics/spectroscopy/spectral-resolution";

const DEG = Math.PI / 180;
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const r6 = (x: number) => (Number.isFinite(x) ? Math.round(x * 1e6) / 1e6 : NaN);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");

const chartLayout = (yTitle: string, yRange?: number[]) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
  yaxis: { title: yTitle, gridcolor: "#374151", ...(yRange ? { range: yRange } : {}) },
  margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
});

export default function DispersiveElementPage() {
  const [densityRaw, setGrooveDensity] = useURLState("grooveDensity", 1200); // lines/mm
  const [orderRaw, setOrder] = useURLState("order", 1);
  const [alphaRaw, setIncidentAngle] = useURLState("incidentAngle", 45); // degrees
  const [minRaw, setWavelengthMin] = useURLState("wavelengthMin", 400); // nm
  const [maxRaw, setWavelengthMax] = useURLState("wavelengthMax", 700); // nm
  const [blazeRaw, setBlazeWavelength] = useURLState("blazeWavelength", 550); // nm, first-order Littrow (catalogue)
  const [focalRaw, setFocalLength] = useURLState("focalLength", 100); // mm, camera focal length

  const grooveDensity = clamp(densityRaw, 10, 6000, 1200);
  const order = Math.round(clamp(orderRaw, 1, 10, 1));
  const incidentAngle = clamp(alphaRaw, 0, 85, 45);
  const lo = clamp(minRaw, 100, 20000, 400);
  const hi = Math.max(clamp(maxRaw, 100, 20000, 700), lo + 1);
  const blazeNm = clamp(blazeRaw, 100, 20000, 550);
  const focalLength = clamp(focalRaw, 10, 5000, 100);

  const d = 1e-3 / grooveDensity; // m
  const alpha = incidentAngle * DEG;
  const f = focalLength * 1e-3;
  const centre = ((lo + hi) / 2) * 1e-9;
  const betaC = gratingDiffractionAngle(centre, d, order, alpha);
  const phi = blazeAngleFromLittrow(blazeNm * 1e-9, d);
  const lambdaB = Number.isFinite(phi) ? blazeWavelength(d, order, phi, alpha) : NaN;
  const effC = Number.isFinite(phi) ? scalarBlazeEfficiency(centre, d, order, phi, alpha) : NaN;
  const cutoff = (d * (1 + Math.sin(alpha))) / order; // β = 90°
  const overlapFree = overlapFreeLimit(lo * 1e-9, order);

  const charts = (() => {
    const wls = Array.from({ length: 301 }, (_, i) => lo + ((hi - lo) * i) / 300);
    const betas = wls.map((wl) => gratingDiffractionAngle(wl * 1e-9, d, order, alpha));
    const line = (y: number[], name: string, color: string, dash?: string) =>
      ({ x: wls, y, type: "scatter", mode: "lines", name, line: { color, width: 2, ...(dash ? { dash } : {}) } });
    return {
      angle: [line(betas.map((b) => r6(b / DEG)), "β (°)", "#60a5fa")],
      dispersion: [
        line(betas.map((b) => r6(gratingReciprocalLinearDispersion(d, order, b, f) * 1e6)), "Focal plane ⟂ each ray", "#34d399"),
        line(betas.map((b) => r6(flatDetectorReciprocalDispersion(d, order, b, betaC, f) * 1e6)), "Flat detector ⟂ central ray", "#fbbf24", "dash"),
      ],
      efficiency: Number.isFinite(phi)
        ? [line(wls.map((wl) => r6(100 * scalarBlazeEfficiency(wl * 1e-9, d, order, phi, alpha))), `Order ${order} (scalar)`, "#f87171")]
        : [],
    };
  })();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Groove Density (lines/mm)" value={densityRaw} onChange={setGrooveDensity} min={10} max={6000} />
        <ValidatedNumberInput label="Diffraction Order m" value={orderRaw} onChange={setOrder} min={1} max={10} step="1" />
        <ValidatedNumberInput label="Incidence Angle α (°)" value={alphaRaw} onChange={setIncidentAngle} min={0} max={85} />
        <ValidatedNumberInput label="λ Min (nm)" value={minRaw} onChange={setWavelengthMin} min={100} max={20000} />
        <ValidatedNumberInput label="λ Max (nm)" value={maxRaw} onChange={setWavelengthMax} min={100} max={20000} />
        <ValidatedNumberInput label="Blaze Wavelength, 1st-order Littrow (nm)" value={blazeRaw} onChange={setBlazeWavelength} min={100} max={20000} />
        <ValidatedNumberInput label="Camera Focal Length (mm)" value={focalRaw} onChange={setFocalLength} min={10} max={5000} />
      </div>

      {(hi * 1e-9 > cutoff || hi * 1e-9 > overlapFree) && (
        <div className="mb-6 rounded-lg border border-yellow-800 bg-yellow-950/40 p-4 text-sm text-yellow-100 space-y-1">
          {hi * 1e-9 > cutoff && (
            <p>Order {order} grazes the grating at {fmt(cutoff * 1e9)} nm (β = 90°) and does not propagate above it.</p>
          )}
          {hi * 1e-9 > overlapFree && (
            <p>
              Order overlap: order {order + 1} light at λ lands where order {order} has {order + 1}λ/{order}, so the band from {lo} nm
              is clean only up to {fmt(overlapFree * 1e9)} nm (free spectral range λ_min/m = {fmt((lo / order))} nm). Use an
              order-sorting filter.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Groove Spacing d" value={`${(d * 1e6).toFixed(4)} µm`} tone="blue" />
        <ResultCard label={`β at ${fmt(centre * 1e9)} nm (centre)`} value={Number.isFinite(betaC) ? `${(betaC / DEG).toFixed(2)}°` : "—"}
          tone="cyan" subtext={Number.isFinite(betaC) ? "d(sin α + sin β) = mλ" : "order does not propagate at the centre"} />
        <ResultCard label="Angular Dispersion (centre)" value={`${fmt(gratingAngularDispersion(d, order, betaC) * 1e-9 / DEG)} °/nm`}
          tone="green" subtext={`${fmt(gratingAngularDispersion(d, order, betaC) * 1e-9 * 1e3)} mrad/nm`} />
        <ResultCard label="Reciprocal Linear Dispersion" value={`${fmt(gratingReciprocalLinearDispersion(d, order, betaC, f) * 1e6)} nm/mm`}
          tone="green" subtext="d·cos β / (m·f), at the centre" />
        <ResultCard label="Blaze Angle φ" value={Number.isFinite(phi) ? `${(phi / DEG).toFixed(2)}°` : "—"} tone="purple"
          subtext={Number.isFinite(phi) ? "sin φ = λ_B / (2d)" : "blaze wavelength exceeds 2d"} />
        <ResultCard label={`Blaze Wavelength at α (order ${order})`} value={Number.isFinite(lambdaB) ? `${fmt(lambdaB * 1e9)} nm` : "—"}
          tone="purple" subtext="d[sin α + sin(2φ − α)] / m" />
        <ResultCard label="Scalar Efficiency (centre)" value={Number.isFinite(effC) ? `${(effC * 100).toFixed(1)} %` : "—"} tone="yellow"
          subtext="relative; × coating reflectance" />
        <ResultCard label="Resolving Power per mm Width" value={(order * grooveDensity).toFixed(0)} tone="red"
          subtext="R = mN, N = grooves illuminated" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Diffraction Angle</h3>
        <ChartPanel data={charts.angle} layout={chartLayout("β (°)")} />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Reciprocal Linear Dispersion (f = {focalLength} mm)</h3>
        <ChartPanel data={charts.dispersion} layout={chartLayout("nm/mm")} />
      </div>
      {charts.efficiency.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Scalar Blaze Efficiency at α = {incidentAngle}°</h3>
          <ChartPanel data={charts.efficiency} layout={chartLayout("Relative efficiency (%)", [0, 105])} />
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">mλ = d(sin α + sin β),   dβ/dλ = m/(d·cos β),   dλ/dx = d·cos β/(m·f),   R = mN</p>
        <p className="font-mono">η = sinc²(π·d·ρ·[sin(α − φ) + sin(β − φ)] / λ),   ρ = cos α / cos(α − φ)</p>
        <p>
          α and β are measured from the grating normal, positive on the same side. The reciprocal linear dispersion
          d·cos β/(m·f) holds on a focal plane normal to the diffracted ray; a flat detector normal to the central ray
          sees x = f·tan(β − β₀), which multiplies it by cos²(β − β₀). The blaze wavelength is entered as the catalogue
          value (first order, Littrow); at another incidence angle the facets reflect into β = 2φ − α, which moves the
          peak. The efficiency is scalar theory for a sawtooth with a right-angle apex (with facet shadowing when
          α &lt; β), a relative envelope without coating reflectance or polarization; it is fair for λ/d below about 0.2.
          The free spectral range λ/m does not depend on the groove density.
        </p>
        <p className="text-gray-500">
          References: C. Palmer, E. Loewen, <em>Diffraction Grating Handbook</em>, 6th ed. (Newport, 2005), ch. 2;
          R. Casini, P. G. Nelson, J. Opt. Soc. Am. A 31, 2179 (2014), eqs. 18–25.
        </p>
      </div>
    </>
  );
}
