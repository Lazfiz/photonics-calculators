"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  blazeWavelength, gratingOrderRange, littrowAngle, littrowBlazeEfficiency, littrowRayleighWavelengths,
} from "../../../physics/spectroscopy/spectral-resolution";

const DEG = Math.PI / 180;
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const r6 = (x: number) => Math.round(x * 1e6) / 1e6;

export default function GratingEfficiencyPage() {
  const [densityRaw, setGroovesPerMm] = useURLState("groovesPerMm", 1200);
  const [blazeRaw, setBlazeAngle] = useURLState("blazeAngle", 17.5);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 500);
  const [orderRaw, setOrder] = useURLState("order", 1);

  const groovesPerMm = clamp(densityRaw, 10, 6000, 1200);
  const blazeAngle = clamp(blazeRaw, 1, 80, 17.5);
  const wavelength = clamp(wavelengthRaw, 100, 20000, 500);
  const order = Math.round(clamp(orderRaw, 1, 20, 1));

  const d = 1e-3 / groovesPerMm; // m
  const phi = blazeAngle * DEG;
  const lambda = wavelength * 1e-9;
  const lambdaB = blazeWavelength(d, order, phi, phi); // Littrow
  const cutoff = (2 * d) / order;
  const theta = littrowAngle(lambda, d, order);
  const eff = littrowBlazeEfficiency(lambda, d, order, phi);
  const orders = Number.isFinite(theta) ? gratingOrderRange(lambda, d, theta) : null;
  const lambdaOverD = lambda / d;

  const chart = (() => {
    // Window around the blaze, widened so the input λ (marker) is inside; never past the propagation limit 2d/m.
    const lo = Math.min(0.4 * lambdaB, 0.9 * lambda);
    const hi = Math.min(cutoff, Math.max(3 * lambdaB, 1.1 * lambda));
    const x = Array.from({ length: 401 }, (_, i) => lo + ((hi - lo) * i) / 400);
    const traces: Record<string, unknown>[] = [
      { x: x.map((l) => l * 1e9), y: x.map((l) => r6(littrowBlazeEfficiency(l, d, order, phi))), type: "scatter", mode: "lines",
        name: `Order ${order} (scalar)`, line: { color: "#c084fc", width: 2 } },
    ];
    for (const l of littrowRayleighWavelengths(d, order, lo).filter((l) => l <= hi).slice(0, 3)) {
      traces.push({ x: [l * 1e9, l * 1e9], y: [0, 1.05], type: "scatter", mode: "lines", name: `Rayleigh ${(l * 1e9).toFixed(1)} nm`,
        line: { color: "#fbbf24", width: 1.5, dash: "dot" } });
    }
    if (lambda >= lo && lambda <= hi) {
      traces.push({ x: [wavelength], y: [r6(eff)], type: "scatter", mode: "markers", name: "Current",
        line: { color: "#f87171" }, marker: { color: "#f87171", size: 10 } });
    }
    return traces;
  })();

  const regime = lambdaOverD < 0.2
    ? "scalar regime (λ/d < 0.2)"
    : "λ/d ≥ 0.2: real efficiency depends on polarization";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Grooves/mm" value={densityRaw} onChange={setGroovesPerMm} min={10} max={6000} />
        <ValidatedNumberInput label="Blaze Angle φ (°)" value={blazeRaw} onChange={setBlazeAngle} min={1} max={80} step="0.1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={100} max={20000} />
        <ValidatedNumberInput label="Diffraction Order m" value={orderRaw} onChange={setOrder} min={1} max={20} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label={`Blaze Wavelength (Littrow, order ${order})`} value={`${(lambdaB * 1e9).toFixed(1)} nm`} tone="purple"
          subtext="λ_B = 2d·sin φ / m" />
        <ResultCard label="Scalar Efficiency" value={Number.isFinite(theta) ? `${(eff * 100).toFixed(1)} %` : "—"} tone="green"
          subtext={Number.isFinite(theta) ? `shared over ${orders ? orders.max - orders.min + 1 : 0} orders; × coating reflectance` : `order ${order} cut off above 2d/m = ${(cutoff * 1e9).toFixed(0)} nm`} />
        <ResultCard label="Littrow Angle θ" value={Number.isFinite(theta) ? `${(theta / DEG).toFixed(2)}°` : "—"} tone="blue"
          subtext="sin θ = mλ / (2d)" />
        <ResultCard label="Groove Spacing d" value={`${(d * 1e6).toFixed(4)} µm`} tone="cyan" />
        <ResultCard label="λ / d" value={lambdaOverD.toFixed(3)} tone={lambdaOverD < 0.2 ? "green" : "yellow"} subtext={regime} />
        <ResultCard label="Propagating Orders" value={orders ? `${orders.min} … ${orders.max}` : "—"} tone="red"
          subtext={orders ? `${orders.max - orders.min + 1} orders share the light` : undefined} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Scalar Efficiency in Littrow vs Wavelength (dotted: Rayleigh anomalies)</h3>
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Efficiency (scalar)", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">I_m = sinc²(π·d·ρ·[sin(α − φ) + sin(β_m − φ)] / λ),   ρ = cos α / cos(α − φ),   η_m = I_m / Σ I_m′,   Littrow: α = β = θ</p>
        <p>
          Scalar diffraction from a sawtooth grating with a right-angle apex, mounted in Littrow and turned to follow
          the wavelength. Each order m′ that propagates gets an envelope I_m′, largest where the facets reflect the light
          straight back (the blaze wavelength), and the envelopes are scaled to share the incident power (energy
          conservation across orders). Near the cutoff the envelopes flatten, so the light spreads over the orders. The
          coating reflectance (about 90 % for aluminium in the visible) and polarization are not included. Scalar theory
          holds for λ/d below about 0.2; at larger λ/d the TE and TM efficiencies split. At a Rayleigh anomaly an order
          grazes the grating and passes off, and the real TM efficiency jumps there. In first order, above 2d/3 only
          orders 0 and 1 propagate, the range where gratings reach their highest efficiency. Order m stops at mλ = 2d.
        </p>
        <p className="text-gray-500">
          References: R. Casini, P. G. Nelson, J. Opt. Soc. Am. A 31, 2179 (2014), eqs. 18–25; C. Palmer, E. Loewen,
          <em> Diffraction Grating Handbook</em>, 6th ed. (Newport, 2005), ch. 2; Lord Rayleigh, Proc. R. Soc. Lond. A 79,
          399 (1907).
        </p>
      </div>
    </>
  );
}
