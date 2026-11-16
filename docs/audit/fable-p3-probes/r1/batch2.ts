import { run, cmp, show } from "./lib";
// numerical Fresnel integrals
function fres(u: number) { let C = 0, S = 0; const N = 20000; for (let i = 0; i < N; i++) { const t = (i + 0.5) * u / N; C += Math.cos(Math.PI * t * t / 2); S += Math.sin(Math.PI * t * t / 2); } return [C * u / N, S * u / N]; }
// slit on-axis: half-width a=100um, z=50mm
{ const lam = 632.8e-9, a = 100e-6, z = 0.05; const u = a * Math.sqrt(2 / (lam * z)); const [C, S] = fres(u); const I = 2 * (C * C + S * S);
  const r = run("diffraction-integral", { aperture: "slit" }); cmp("slit onAxis 2(C²+S²)", I, r.outputs.onAxis); show("slit", r); }
// cavity-mode-spacing unstable & edge
show("cms unstable L=250", run("cavity-mode-spacing", { cavityLength: 250 }), ["g1g2", "waist", "transverseSpacing", "gouyPhase"]);
show("cms concentric L=200", run("cavity-mode-spacing", { cavityLength: 200 }), ["g1g2", "waist", "transverseSpacing", "spot1"]);
// dye no flow: factor = 1 - sT kST tauT / sE
{ const r = run("dye-laser-resonator", { flowSpeed: 0 }); cmp("dye v=0 gainLeft", 100 * (1 - 3.7e-17 * 3.4e6 * 0.25e-6 / 1.1e-16), r.outputs.gainLeft); }
show("dye unstable L=101", run("dye-laser-resonator", { cavityLength: 101 }), ["g1g2", "thresholdPower", "outputPower"]);
// filamentation below Pcr & with lens
show("fil P<Pcr", run("filamentation", { pulseEnergy: 0.2 }), ["powerRatio", "collapseDistance"]);
{ const r0 = run("filamentation"); const zc = r0.outputs.collapseDistance as number; const r = run("filamentation", { lensFocal: 20 });
  cmp("fil lens 1/(1/zc+1/f)", 1 / (1 / zc + 1 / 20), r.outputs.collapseDistance); }
// FWM normal dispersion
{ const g = 9.5814e-3, P = 1, L = 500; const lam = 1550e-9, ls = 1560e-9, c = 299792458; const W = 2 * Math.PI * c * (1 / lam - 1 / ls);
  const b2 = 0.1e-27; const dk = b2 * W * W; const kap = dk + 2 * g * P; const g2 = (g * P) ** 2 - (kap / 2) ** 2;
  const G = g2 >= 0 ? 1 + (g * P / Math.sqrt(g2) * Math.sinh(Math.sqrt(g2) * L)) ** 2 : 1 + (g * P / Math.sqrt(-g2) * Math.sin(Math.sqrt(-g2) * L)) ** 2;
  const r = run("four-wave-mixing", { beta2: 0.1 }); cmp("fwm normal G", G, r.outputs.signalGain); show("fwm normal", r, ["peakGain", "peakWavelengthShift"]); }
// FEL Ming Xie fit
{ const r = run("free-electron-laser"); const ed = r.outputs.etaDiffraction as number, ee = r.outputs.etaEmittance as number, eg = r.outputs.etaEnergySpread as number;
  const a = [0.45, 0.57, 0.55, 1.6, 3, 2, 0.35, 2.9, 2.4, 51, 0.95, 3, 5.4, 0.7, 1.9, 1140, 2.2, 2.9, 3.2];
  const L = a[0]*ed**a[1] + a[2]*ee**a[3] + a[4]*eg**a[5] + a[6]*ee**a[7]*eg**a[8] + a[9]*ed**a[10]*eg**a[11] + a[12]*ed**a[13]*ee**a[14]
    + a[15]*ed**a[16]*ee**a[17]*eg**a[18];
  cmp("FEL Xie Lg", (r.outputs.gainLength1D as number) * (1 + L), r.outputs.gainLength); }
show("gas unstable R1=200", run("gas-laser-resonator", { R1: 200 }), ["g1g2", "waist", "outputPower", "thresholdGain"]);
show("gas below thr g0=0.02", run("gas-laser-resonator", { g0: 0.02 }), ["outputPower", "optimumReflectance", "optimumOutputPower"]);
// HG / LG peak intensity numerically
function herm(n: number, x: number) { let h0 = 1, h1 = 2 * x; if (n === 0) return 1; for (let k = 1; k < n; k++) { const h2 = 2 * x * h1 - 2 * k * h0; h0 = h1; h1 = h2; } return h1; }
const fact = (n: number) => (n <= 1 ? 1 : n * fact(n - 1));
function lag(p: number, l: number, x: number) { let s = 0; for (let k = 0; k <= p; k++) s += ((-1) ** k) * fact(p + l) / (fact(p - k) * fact(l + k) * fact(k)) * x ** k; return s; }
{ const r = run("hermite-gaussian"); const w = (r.outputs.beamRadius as number) * 1e-6; const P = 1e-3; let mx = 0;
  for (let i = -400; i <= 400; i++) for (let j = -400; j <= 400; j += 1) { const x = i * w / 100, y = j * w / 100;
    const ux = herm(2, Math.SQRT2 * x / w) * Math.exp(-x * x / w / w) / Math.sqrt(2 ** 2 * fact(2)); const uy = herm(1, Math.SQRT2 * y / w) * Math.exp(-y * y / w / w) / Math.sqrt(2 * fact(1));
    const I = (2 / (Math.PI * w * w)) * P * (ux * uy) ** 2; if (I > mx) mx = I; }
  cmp("HG21 peak W/cm2", mx / 1e4, r.outputs.peakIntensity); }
{ const r = run("hermite-gaussian", { family: "lg", p: 1, l: 2 }); const w = (r.outputs.beamRadius as number) * 1e-6; const P = 1e-3; let mx = 0;
  for (let i = 0; i <= 4000; i++) { const rr = i * w / 1000; const x = 2 * rr * rr / w / w;
    const I = P * 2 * fact(1) / (Math.PI * fact(1 + 2)) / (w * w) * x ** 2 * lag(1, 2, x) ** 2 * Math.exp(-x); if (I > mx) mx = I; }
  cmp("LG12 peak W/cm2", mx / 1e4, r.outputs.peakIntensity); show("LG12", r, ["m2x", "m2y", "secondMomentRadiusX", "gouyPhase", "order"]); }
// injection locking alpha=3
{ const r = run("injection-locking", { alpha: 3, detuning: -5 }); cmp("inj lower a=3", -2.451 * Math.sqrt(10) * (24.5109 / 24.51), r.outputs.lowerEdge); show("inj", r, ["locked"]); }
show("m2 below TEM00", run("m2-factor", { theta: 1 }), ["m2"]);
{ const r = run("mode-locked-laser", { shape: "gaussian", cavity: "ring" }); cmp("ML gaussian bw", 0.441271 / 100e-15 / 1e12, r.outputs.bandwidthFrequency); cmp("ML ring L", 299792458 / 80e6, r.outputs.cavityLength); cmp("ML gauss peak kW", 0.939437 * 1.25e-9 / 100e-15 / 1e3, r.outputs.peakPower); }
// OPA: exact bandwidth from G(Δk)=G0/2, Δk = 2π Δν · gvm
{ const Gam = 179.076, L = 0.02, gvm = 97.7e-15 / 1e-3; const G = (dk: number) => { const g2 = Gam * Gam - dk * dk / 4; return g2 >= 0 ? 1 + Gam * Gam / g2 * Math.sinh(Math.sqrt(g2) * L) ** 2 : 1 + Gam * Gam / -g2 * Math.sin(Math.sqrt(-g2) * L) ** 2; };
  const G0 = G(0); let lo = 0, hi = 1e5; for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (G(m) > G0 / 2) lo = m; else hi = m; }
  const dnu = 2 * lo / (2 * Math.PI * gvm); const approx = 2 * Math.sqrt(Math.LN2) / Math.PI * Math.sqrt(Gam / L) / gvm;
  const r = run("optical-parametric-amplifier"); cmp("OPA bw exact FWHM GHz", dnu / 1e9, r.outputs.bandwidth); console.log("   Cerullo approx GHz", (approx / 1e9).toFixed(1));
  const r2 = run("optical-parametric-amplifier", { deltaK: 0.2 }); cmp("OPA dk=0.2/mm gain", G(200), r2.outputs.gain); }
show("OFC fceo>frep", run("optical-frequency-comb", { fceo: 300 }), ["offsetWrapped", "toothIndex", "toothFrequency", "phaseSlip"]);
