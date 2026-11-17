// R3 parity: API handler vs MCP run_calculator vs page-mimic physics, for 10 pages.
import { NextRequest } from "next/server";
import { GET } from "../../../../src/app/api/v1/[category]/[slug]/route";
import { handleMessage } from "../../../../src/mcp/server";
import * as gb from "../../../../src/physics/wave-optics/gaussian-beam";
import * as psf from "../../../../src/physics/imaging/diffraction-psf";
import { abbeLateralFwhm } from "../../../../src/physics/imaging/super-resolution";
import { gaussianCoupling, lossDb, waistFromNA } from "../../../../src/physics/fiber-optics/gaussian-coupling";
import { gaussianGeometricCapture, toDb, topHatGeometricLoss } from "../../../../src/physics/free-space-comms/link-budget";
import { cutoffWavelength } from "../../../../src/physics/detectors/ingaas";
import { SEMICONDUCTOR_GAPS } from "../../../../src/physics/materials/bandgap";
import { brewsterAngle, refractionAngle } from "../../../../src/physics/polarization/fresnel";
import { pileOfPlates } from "../../../../src/physics/polarization/reflection-polarizers";
import { etalonOrder, fsrFrequency, fsrWavelength, fwhmFrequency, gapAngle } from "../../../../src/physics/spectroscopy/etalon";
import { airyPeakNear, coefficientOfFinesse, reflectingFinesse } from "../../../../src/physics/thin-film/interference";
import { quarterWaveArIndex, stackResponse } from "../../../../src/physics/thin-film/transfer-matrix";
import { minimumLossWavelength, silicaLossDbPerKm } from "../../../../src/physics/fiber-optics/silica-attenuation";
import { eyeLimits, T_MAX, T_MIN } from "../../../../src/physics/laser-safety/eye-exposure-limits";
import { limitSafeDiameter, nominalOcularHazardDistance, roundBeam } from "../../../../src/physics/laser-safety/hazard-distance";

type Q = Record<string, string | number>;
type Page = (q: Record<string, any>) => Record<string, number>;
const DEG = Math.PI / 180;
const pages: { path: string; defaults: Q; alt: Q; page: Page }[] = [
  { path: "wave-optics/gaussian-beam", defaults: { wavelength: 1550, waist: 10, z: 1 }, alt: { wavelength: 633, waist: 250, z: -500 },
    page: ({ wavelength, waist, z }) => { const b = { lambda: wavelength * 1e-9, w0: waist * 1e-6 }; const zz = z * 1e-3;
      return { rayleighRange: gb.rayleighRange(b) * 1e3, divergence: gb.divergenceHalfAngle(b) * 1e3, beamParameterProduct: gb.beamParameterProduct(b) * 1e6,
        confocalParameter: 2 * gb.rayleighRange(b) * 1e3, beamRadius: gb.beamRadius(b, zz) * 1e6, wavefrontRadius: gb.wavefrontRadius(b, zz) * 1e3, gouyPhase: gb.gouyPhase(b, zz) * 180 / Math.PI }; } },
  { path: "imaging/airy-disk", defaults: { wavelength: 550, na: 0.95 }, alt: { wavelength: 405, na: 1.4 },
    page: ({ wavelength, na }) => { const l = wavelength * 1e-9; const r0 = psf.airyFirstZeroRadius(l, na);
      return { airyRadius: r0 * 1e6, airyDiameter: 2 * r0 * 1e6, fwhm: psf.airyFwhm(l, na) * 1e9, abbeLimit: abbeLateralFwhm(l, na) * 1e9 }; } },
  { path: "fiber-optics/coupling-efficiency", defaults: { sourceNa: 0.22, mfd: 10.4, lateralOffset: 0, angularMisalign: 0, wavelength: 1550, mediumIndex: 1 },
    alt: { sourceNa: 0.1, mfd: 9.2, lateralOffset: 2, angularMisalign: 1.5, wavelength: 1310, mediumIndex: 1.45 },
    page: ({ sourceNa, mfd, lateralOffset, angularMisalign, wavelength, mediumIndex }) => { const l = wavelength * 1e-9; const w1 = waistFromNA(sourceNa, l); const w2 = mfd / 2 * 1e-6;
      const j = { w1, w2, lambda: l, n: mediumIndex }; const off = lateralOffset * 1e-6, tilt = angularMisalign * Math.PI / 180; const m = gaussianCoupling(j); const t = gaussianCoupling({ ...j, offset: off, tilt });
      return { total: t * 100, lossDb: lossDb(t), mismatch: m * 100, beamWaist: w1 / 1e-6, fiberModeRadius: w2 / 1e-6, fiberModeNa: l / (Math.PI * w2),
        offsetFactor: gaussianCoupling({ ...j, offset: off }) / m * 100, tiltFactor: gaussianCoupling({ ...j, tilt }) / m * 100 }; } },
  { path: "fiber-optics/attenuation", defaults: { wavelength: 1550, length: 50, rayleighA: 0.85, geO2: 4, ohPeak: 0.05 }, alt: { wavelength: 1383, length: 12.5, rayleighA: 0.7, geO2: 10, ohPeak: 1 },
    page: ({ wavelength, length, rayleighA, geO2, ohPeak }) => { const p = { rayleighA, geO2Fraction: geO2 / 100, ohPeakDbPerKm: ohPeak }; const at = silicaLossDbPerKm(p, wavelength * 1e-9); const lm = minimumLossWavelength(p);
      return { attenuation: at.total, totalLoss: at.total * length, rayleigh: at.rayleigh, infrared: at.infrared, ultraviolet: at.ultraviolet, oh: at.oh, minLossWavelength: lm * 1e9, minLoss: silicaLossDbPerKm(p, lm).total,
        at1310: silicaLossDbPerKm(p, 1310e-9).total, at1383: silicaLossDbPerKm(p, 1383e-9).total, at1550: silicaLossDbPerKm(p, 1550e-9).total }; } },
  { path: "free-space-comms/geometric-loss", defaults: { txBeamDivergence: 1, range: 1, txAperture: 5, rxAperture: 10, wavelength: 1550 }, alt: { txBeamDivergence: 0.05, range: 20, txAperture: 50, rxAperture: 20, wavelength: 850 },
    page: ({ txBeamDivergence, range, txAperture, rxAperture, wavelength }) => { const th = txBeamDivergence * 1e-3, R = range * 1e3, dT = txAperture * 1e-3, dR = rxAperture * 1e-2, l = wavelength * 1e-9;
      const g = gaussianGeometricCapture(dT, th, R, dR, l); const t = topHatGeometricLoss(dT, th, R, dR);
      return { topHatLoss: t, beamDiameter: dT + th * R, topHatCaptured: 10 ** (-t / 10) * 100, gaussianLoss: -toDb(g.fraction), gaussianRadius: g.beamRadius, gaussianCaptured: g.fraction * 100, waist: g.waist * 1e3, difference: t + toDb(g.fraction) }; } },
  { path: "materials/semiconductor-bandgap", defaults: { temperature: 300 }, alt: { temperature: 77 },
    page: ({ temperature }) => Object.fromEntries(Object.keys(SEMICONDUCTOR_GAPS).flatMap((id) => { const e = (SEMICONDUCTOR_GAPS as any)[id].bandGap(temperature); return [[`eg${id}`, e], [`edge${id}`, cutoffWavelength(e) * 1e9]]; })) },
  { path: "polarization/brewster-polarizer", defaults: { n2: 1.52, plates: 4 }, alt: { n2: 3.42, plates: 6 },
    page: ({ n2, plates }) => { const m = Math.round(plates); const tb = brewsterAngle(1, n2); const a = pileOfPlates(n2, tb, m);
      return { thetaB: tb / DEG, rs: a.rs, Tp: a.Tp, Ts: a.Ts, dop: a.dop, dopSinglePass: (a.TpSinglePass - a.TsSinglePass) / (a.TpSinglePass + a.TsSinglePass), extinction: a.extinction, extinctionDb: 10 * Math.log10(a.extinction) }; } },
  { path: "spectroscopy/etalon-fsr", defaults: { n: 1, d: 10, theta: 0, R: 0.8, wavelength: 1550 }, alt: { n: 1.444, d: 1000, theta: 10, R: 0.95, wavelength: 1064 },
    page: ({ n, d, theta, R, wavelength }) => { const dd = d * 1e-6, l = wavelength * 1e-9; const tg = gapAngle(theta * DEG, n); const c = Math.cos(tg); const F = coefficientOfFinesse(R); const nu = fsrFrequency(n, dd, c); const pk = airyPeakNear(n * dd * c, l, F);
      return { fsrWavelength: fsrWavelength(l, n, dd, c) * 1e9, fsrFrequency: nu / 1e9, finesse: reflectingFinesse(F), coefficientOfFinesse: F, fwhmFrequency: fwhmFrequency(nu, F) / 1e9, order: etalonOrder(n, dd, c, l), peakWavelength: pk.wavelength * 1e9, peakFwhm: pk.fwhm * 1e12, contrast: 1 + F, gapAngle: tg / DEG }; } },
  { path: "thin-film/single-ar", defaults: { nIncident: 1, nFilm: 1.38, nSubstrate: 1.52, designWavelength: 550, angle: 0 }, alt: { nIncident: 1.33, nFilm: 1.25, nSubstrate: 1.9, designWavelength: 1064, angle: 60 },
    page: ({ nIncident, nFilm, nSubstrate, designWavelength, angle }) => { const t0 = angle * Math.PI / 180; const t1 = refractionAngle(nIncident, nFilm, t0); const tir = Number.isNaN(t1);
      const th = tir ? 0 : designWavelength / (4 * nFilm * Math.cos(t1)); const st = { incident: nIncident, layers: [{ n: nFilm, thickness: th * 1e-9 }], substrate: { n: nSubstrate } };
      const R = 0.5 * (stackResponse(st, designWavelength * 1e-9, t0, "s").R + stackResponse(st, designWavelength * 1e-9, t0, "p").R);
      return { optimalNFilm: quarterWaveArIndex(nIncident, nSubstrate), quarterWaveThickness: tir ? NaN : th, reflectance: R * 100, filmAngle: t1 * 180 / Math.PI }; } },
  { path: "laser-safety/nohd", defaults: { power: 100, wavelength: 532, exposure: 0.25, beamDia: 2, divergence: 1, safetyFactor: 1, beamDefinition: "1/e2", beamGrowth: "linear" },
    alt: { power: 5000, wavelength: 1064, exposure: 10, beamDia: 3, divergence: 0.5, safetyFactor: 2, beamDefinition: "1/e", beamGrowth: "gaussian" },
    page: (q) => { const s = q.beamDefinition === "1/e" ? Math.SQRT2 : 1; const d = q.beamDia * 1e-3 * s, phi = q.divergence * 1e-3 * s; const P = q.power * 1e-3 * q.safetyFactor; const ex = Math.min(Math.max(q.exposure, T_MIN), T_MAX);
      const r = nominalOcularHazardDistance(q.wavelength * 1e-9, P, roundBeam(d, phi, q.beamGrowth), ex); const gov = eyeLimits(q.wavelength * 1e-9).find((l) => l.kind === r.limiting);
      const nf = Number.isFinite(r.distance) && r.distance > 0 && gov; return { nohd: r.distance, diameterAtNohd: nf ? limitSafeDiameter(gov!, P, ex) * 1e3 : NaN, rayleighRange: d / phi }; } },
];

async function api(path: string, q: Q) {
  const qs = new URLSearchParams(Object.entries(q).map(([k, v]) => [k, String(v)]));
  const req = new NextRequest(`https://photonicscalculators.com/api/v1/${path}?${qs}`);
  const [category, slug] = path.split("/");
  const res = await GET(req, { params: Promise.resolve({ category, slug }) });
  return { status: res.status, headers: Object.fromEntries(res.headers), body: await res.json() };
}
async function mcp(path: string, q: Q) {
  const r: any = await handleMessage({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "run_calculator", arguments: { slug: path, inputs: q } } }, { ip: "9.9.9.9", origin: "https://x" });
  return r.result.structuredContent;
}
const rel = (a: number | null, b: number) => (a === null ? (Number.isFinite(b) ? Infinity : 0) : !Number.isFinite(b) ? Infinity : Math.abs(a - b) / Math.max(Math.abs(b), 1e-300));
(async () => {
  for (const p of pages) for (const [label, q] of [["def", p.defaults], ["alt", p.alt]] as const) {
    const A = await api(p.path, label === "def" ? {} : q);
    if (A.status !== 200) { console.log(`${p.path} ${label} API ${A.status} ${JSON.stringify(A.body)}`); continue; }
    const M = await mcp(p.path, label === "def" ? {} : q);
    const P = p.page(q as any);
    const diffs: string[] = [];
    for (const [k, o] of Object.entries<any>(A.body.outputs)) {
      if (JSON.stringify(o) !== JSON.stringify(M.outputs[k])) diffs.push(`${k} api≠mcp`);
      if (!(k in P)) { diffs.push(`${k} not in page-mimic`); continue; }
      if (rel(o.value, P[k]) > 1e-9) diffs.push(`${k} api=${o.value} page=${P[k]}`);
    }
    console.log(`${p.path} ${label}: ${diffs.length ? diffs.join("; ") : "OK"} | warn=${JSON.stringify(A.body.warnings).slice(0, 160)}`);
    if (label === "def" && p.path.includes("gaussian")) console.log("  headers", JSON.stringify(A.headers), "pageUrl", A.body.pageUrl);
  }
})();
