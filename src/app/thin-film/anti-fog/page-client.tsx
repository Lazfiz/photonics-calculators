"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { luminousWeightedMean } from "../../../physics/cie-photometry";
import { dropletTirFraction, N_WATER, tirOnsetAngle, waterFilmResponse, waterSurfaceTension, wetting } from "../../../physics/thin-film/anti-fog";
import { stackResponse } from "../../../physics/thin-film/transfer-matrix";

const NM = 1e-9;
const DEG = Math.PI / 180;
const pct = (x: number, digits = 1) => (Number.isFinite(x) ? `${(x * 100).toFixed(digits)} %` : "—");

export default function AntiFogPage() {
  const [nCoat, setNCoat] = useURLState("nCoat", 1.33);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [thickness, setThickness] = useURLState("thickness", 120);
  const [contactAngle, setContactAngle] = useURLState("contactAngle", 15);
  const [waterTemp, setWaterTemp] = useURLState("waterTemp", 20);

  const valid = nCoat > 0 && nSub > 0 && thickness >= 0 && contactAngle >= 0 && contactAngle <= 180 && waterTemp >= -25 && waterTemp <= 100;
  const coating = useMemo(() => [{ n: nCoat, thickness: thickness * NM }], [nCoat, thickness]);

  const optics = useMemo(() => {
    if (!valid) return null;
    const dry = (lam: number) => stackResponse({ incident: 1, layers: coating, substrate: { n: nSub } }, lam);
    const underFilm = (lam: number) => waterFilmResponse(coating, nSub, lam);
    const x = Array.from({ length: 401 }, (_, i) => 380 + i);
    return {
      Tdry: luminousWeightedMean((lam) => dry(lam).T),
      Twet: luminousWeightedMean((lam) => underFilm(lam).T),
      bareT: 1 - ((nSub - 1) / (nSub + 1)) ** 2,
      x,
      dryT: x.map((w) => dry(w * NM).T),
      wetT: x.map((w) => underFilm(w * NM).T),
    };
  }, [valid, coating, nSub]);

  const gamma = waterSurfaceTension(waterTemp + 273.15);
  const wet = wetting(gamma, contactAngle * DEG);
  const tir = dropletTirFraction(contactAngle * DEG);
  const onset = tirOnsetAngle() / DEG;
  const tirCurve = useMemo(() => {
    const x = Array.from({ length: 91 }, (_, i) => i);
    return { x, y: x.map((a) => 100 * dropletTirFraction(a * DEG)) };
  }, []);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Water contact angle on the coating (°)" value={contactAngle} onChange={setContactAngle} min={0} max={180} step="1" />
        <ValidatedNumberInput label="Water temperature (°C)" value={waterTemp} onChange={setWaterTemp} min={-25} max={100} step="1" />
        <ValidatedNumberInput label={<>n<sub>coating</sub></>} value={nCoat} onChange={setNCoat} min={1} max={4} step="0.01" />
        <ValidatedNumberInput label="Coating thickness (nm)" value={thickness} onChange={setThickness} min={0} max={10000} step="1" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={1} max={4} step="0.01" />
      </div>

      {!valid && <p className="text-yellow-400 text-sm mb-6">Set positive indices, a thickness ≥ 0, a contact angle in 0–180° and water at −25 to 100 °C.</p>}

      {valid && optics && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Light transmittance τ<sub>v</sub> into the substrate</p>
            <p className="text-2xl font-bold text-blue-400">{pct(optics.Tdry)}</p>
            <p className="text-sm text-gray-500 mt-1">Under a water film: {pct(optics.Twet)}; uncoated dry: {pct(optics.bareT)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Droplet area returning light by TIR</p>
            <p className={`text-2xl font-bold ${tir > 0 ? "text-red-400" : "text-green-400"}`}>{contactAngle > 90 ? "θ > 90°: not modelled" : pct(tir)}</p>
            <p className="text-sm text-gray-500 mt-1">Zero below θ = {onset.toFixed(1)}° (n<sub>water</sub> = {N_WATER})</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Adhesion tension γ cos θ</p>
            <p className="text-2xl font-bold text-amber-400">{(wet.adhesionTension * 1e3).toFixed(1)} mN/m</p>
            <p className="text-sm text-gray-500 mt-1">Work of adhesion γ(1 + cos θ) = {(wet.workOfAdhesion * 1e3).toFixed(1)} mN/m; γ = {(gamma * 1e3).toFixed(2)} mN/m</p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300 text-xs">
          Fog is condensed water. On a surface it wets poorly it forms droplets, spherical caps that refract light away from the line of
          sight; above a contact angle of asin(1/n<sub>w</sub>) = {onset.toFixed(1)}° part of each droplet sends light back by total internal
          reflection, a fraction 1 − (1/(n<sub>w</sub> sin θ))² of its footprint (geometric optics, light crossing the window along the normal, θ ≤ 90°).
          A hydrophilic anti-fog coating makes θ small, so the water spreads into a continuous film that only adds a weak, flat
          reflection: the film is taken as thick and uneven (no fringes) and added incoherently. The contact angle sets the wetting, not the
          optics of the film. γ cos θ (Young: γ<sub>sv</sub> − γ<sub>sl</sub>) is the adhesion tension, not the coating&apos;s surface energy;
          γ is water&apos;s surface tension from IAPWS (2014). τ<sub>v</sub> weights T with D65 × V(λ); one face, lossless layers, constant
          indices (water 1.333).
        </p>
      </div>

      {optics && (
        <div className="mb-6">
          <ChartPanel title="Transmittance into the substrate" data={[
            { x: optics.x, y: optics.dryT, type: "scatter", mode: "lines", name: "Dry", line: { color: "#60a5fa" } },
            { x: optics.x, y: optics.wetT, type: "scatter", mode: "lines", name: "Water film", line: { color: "#22d3ee", dash: "dash" } },
          ]} layout={{
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "T", gridcolor: "#374151" },
            margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
          }} />
        </div>
      )}

      <ChartPanel title="Droplets: share of the footprint lost to total internal reflection" data={[
        { x: tirCurve.x, y: tirCurve.y, type: "scatter", mode: "lines", name: "TIR fraction (%)", line: { color: "#f87171" } },
        { x: contactAngle <= 90 ? [contactAngle] : [], y: contactAngle <= 90 ? [100 * tir] : [], type: "scatter", mode: "markers", name: "This coating", marker: { color: "#fbbf24", size: 9 } },
      ]} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Contact angle (°)", gridcolor: "#374151" },
        yaxis: { title: "Fraction (%)", gridcolor: "#374151", range: [0, 100] },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </>
  );
}
