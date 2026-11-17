import { findSchema } from "../../../../src/schemas";
import { parseInputs, runSchema } from "../../../../src/schemas/run";
const cases: [string, string][] = [["/wave-optics/gaussian-beam","wavelength=11000&waist=1"],["/laser-safety/green-laser-pointer","divergence=0"],["/laser-safety/ultrafast-laser-safety","divergence=0"],["/spectroscopy/spectral-calibration","pixelPitch=100"],["/laser-safety/exposure-duration","power=1000000000000"],["/laser-safety/classification","wavelength=180"],["/thin-film/cold-mirror","pairs=1"],["/thin-film/anti-fog","waterTemp=-25"],["/laser-safety/scanning-mpe","power=0"],["/wave-optics/ring-cavity","outputCouplerR=0.01"],["/thin-film/solar-protection","uvPairs=40"],["/laser-safety/pulsed-mpe","prf=0"],["/wave-optics/kerr-lens","peakPower=0"]];
for (const [h, q] of cases) {
  const s = findSchema(h)!; const p = parseInputs(s, new URLSearchParams(q));
  if (!p.ok) { console.log(h, q, "REJ", p.error); continue; }
  const r = runSchema(s, p.values);
  const nulls = Object.entries(r.outputs).filter(([, v]) => v === null).map(([k]) => k);
  const some = Object.entries(r.outputs).slice(0, 4).map(([k, v]) => `${k}=${typeof v === "number" ? v.toPrecision(4) : v}`).join(",");
  console.log(`${h}?${q} nulls=[${nulls}] ${some} warn=${JSON.stringify(r.warnings).slice(0, 200)}`);
}
