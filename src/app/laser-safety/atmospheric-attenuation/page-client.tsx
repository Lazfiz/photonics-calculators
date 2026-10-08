"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  DB_PER_NEPER, aerosolExtinction, kimExponent, rayleighExtinction,
} from "../../../physics/free-space-comms/atmospheric-attenuation";

const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);

export default function AtmosphericAttenuationPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 10600); // nm (CO₂ laser)
  const [distance, setDistance] = useURLState("distance", 1000); // m
  const [visibility, setVisibility] = useURLState("visibility", 23); // km

  const results = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const alphaRayleigh = rayleighExtinction(lambda) * 1e3; // km⁻¹
    const alphaAerosol = aerosolExtinction(lambda, visibility * 1e3) * 1e3; // km⁻¹
    const alphaTotal = alphaRayleigh + alphaAerosol;
    const transmission = Math.exp((-alphaTotal * distance) / 1000);
    return {
      alphaRayleigh, alphaAerosol, alphaTotal, transmission,
      attenuation_dB: (alphaTotal * distance * DB_PER_NEPER) / 1000, q: kimExponent(visibility * 1e3),
    };
  }, [wavelength, distance, visibility]);

  const chartData = useMemo(() => {
    const distances = Array.from({ length: 200 }, (_, i) => (i + 1) * (distance / 200));
    return [
      { x: distances, y: distances.map((d) => Math.exp((-results.alphaTotal * d) / 1000) * 100), type: "scatter" as const, mode: "lines" as const,
        name: "Transmission (%)", yaxis: "y", line: { color: "#60a5fa", width: 2 } },
      { x: distances, y: distances.map((d) => (results.alphaTotal * d * DB_PER_NEPER) / 1000), type: "scatter" as const, mode: "lines" as const,
        name: "Attenuation (dB)", yaxis: "y2", line: { color: "#f87171", width: 2 } },
    ];
  }, [results.alphaTotal, distance]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={20000} />
        <ValidatedNumberInput label="Distance (m)" value={distance} onChange={setDistance} min={1} max={1e7} />
        <ValidatedNumberInput label="Visibility (km)" value={visibility} onChange={setVisibility} min={0.01} max={300} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Transmission" value={`${fmt(results.transmission * 100, 4)} %`} tone="blue" subtext={`at ${distance} m`} />
        <ResultCard label="Attenuation" value={`${fmt(results.attenuation_dB)} dB`} tone="yellow" />
        <ResultCard label="Total extinction α" value={`${fmt(results.alphaTotal)} km⁻¹`} tone="green" subtext={`${fmt(results.alphaTotal * DB_PER_NEPER)} dB/km`} />
        <ResultCard label="Rayleigh" value={`${fmt(results.alphaRayleigh)} km⁻¹`} tone="purple" subtext="standard air, 15 °C, 1013 hPa" />
        <ResultCard label="Aerosol (visibility)" value={`${fmt(results.alphaAerosol)} km⁻¹`} tone="red" subtext={`Kim q = ${fmt(results.q)}`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Distance (m)", gridcolor: "#374151" },
          yaxis: { title: "Transmission (%)", gridcolor: "#374151", range: [0, 105] },
          yaxis2: { title: "Attenuation (dB)", gridcolor: "#374151", overlaying: "y", side: "right", titlefont: { color: "#f87171" }, tickfont: { color: "#f87171" } },
          margin: { t: 30, r: 70, b: 50, l: 70 },
          legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0)" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold mb-1">Model</h3>
        <p className="font-mono">T = exp(−α L),   α = α_Rayleigh + α_aerosol,   attenuation (dB) = 4.343 α L</p>
        <p className="font-mono">α_aerosol = [3.912/V − α_Rayleigh(550 nm)] · (λ/550 nm)^(−q)</p>
        <p>
          Rayleigh scattering of standard sea-level air from its refractive index (Bucholtz, Appl. Opt. 34, 2765,
          1995): 0.0115 km⁻¹ at 550 nm, falling as ≈ λ⁻⁴. The visibility V fixes the total extinction at 550 nm
          (Koschmieder); the aerosol part scales with Kim&apos;s exponent q(V) (Kim et al., Proc. SPIE 4214, 26, 2001),
          fitted in the visible and near IR. For mid-IR wavelengths it is only indicative.
        </p>
        <p className="text-gray-500">
          Molecular absorption (water vapour, CO₂) is not included: real attenuation is higher in absorption bands and,
          at 10.6 µm, from the water-vapour continuum. Ignoring it overestimates the transmitted power, which is the
          conservative side for a hazard distance. Rain, snow and turbulence are not modelled either.
        </p>
      </div>
    </>
  );
}
