import { run, cmp, show } from "./lib";
const c0 = 299792458;
// slab waveguide TE0/TM0 own solver (symmetric, half-width a), d=2 µm
function neff(n1: number, n2: number, lam: number, d: number, tm: boolean) { const k = 2 * Math.PI / lam, a = d / 2, V = k * a * Math.sqrt(n1 * n1 - n2 * n2); const r = tm ? (n1 * n1) / (n2 * n2) : 1;
  let lo = 1e-9, hi = Math.min(V, Math.PI / 2 - 1e-12); for (let i = 0; i < 200; i++) { const u = (lo + hi) / 2; const f = u * Math.tan(u) - r * Math.sqrt(V * V - u * u); if (f > 0) hi = u; else lo = u; }
  const u = lo; return Math.sqrt(n1 * n1 - (u / (k * a)) ** 2); }
function conf(n1:number,n2:number,lam:number,d:number){const k=2*Math.PI/lam,a=d/2,ne=neff(n1,n2,lam,d,false),u=k*a*Math.sqrt(n1*n1-ne*ne),w=k*a*Math.sqrt(ne*ne-n2*n2);const core=a+Math.sin(2*u)/(2*u)*a;const clad=Math.cos(u)**2*a/w;return core/(core+clad);}
for (const d of [2, 0.5]) { cmp(`wg d=${d} conf%`, 100*conf(1.5,1.45,1550e-9,d*1e-6), run("optical-waveguide",{coreWidth:d}).outputs.confinementTE0); }
for (const d of [2, 0.5]) { const r = run("optical-waveguide", { coreWidth: d }); cmp(`wg d=${d} TE0`, neff(1.5, 1.45, 1550e-9, d * 1e-6, false), r.outputs.neffTE0); cmp(`wg d=${d} TM0`, neff(1.5, 1.45, 1550e-9, d * 1e-6, true), r.outputs.neffTM0); show(" ", r, ["vNumber", "modes", "confinementTE0"]); }
show("wg d=2.05", run("optical-waveguide", { coreWidth: 2.05 }), ["vNumber", "modes"]);
// Q-switch: own normalized rate equations, FWHM of output
function qs(r: number, tc: number) { let N = r, P = 1e-9; const dt = tc / 2000; const ts: number[] = [], ps: number[] = [];
  for (let i = 0; i < 4e6; i++) { const f = (N: number, P: number) => [-N * P / tc, (N - 1) * P / tc];
    const k1 = f(N, P), k2 = f(N + k1[0] * dt / 2, P + k1[1] * dt / 2), k3 = f(N + k2[0] * dt / 2, P + k2[1] * dt / 2), k4 = f(N + k3[0] * dt, P + k3[1] * dt);
    N += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); P += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); ts.push(i * dt); ps.push(P); if (P < 1e-10 && N < 1) break; }
  let m = 0; for (const p of ps) if (p > m) m = p; const idx = ps.map((p, i) => (p >= m / 2 ? i : -1)).filter((i) => i >= 0); return [(idx[idx.length - 1] - idx[0]) * dt, N]; }
for (const r of [3, 1.5]) { const R = run("q-switched-laser", { inversionRatio: r }); const tc = (R.outputs.photonLifetime as number) * 1e-9; const [w, Nf] = qs(r, tc);
  cmp(`qs r=${r} extraction`, 100 * (1 - Nf / r), R.outputs.extraction); cmp(`qs r=${r} FWHM ns`, w * 1e9, R.outputs.pulseWidthFwhm);
  const eta = 1 - Nf / r; cmp(`qs r=${r} Degnan width`, tc * r * eta / (r - 1 - Math.log(r)) * 1e9, R.outputs.pulseWidthEstimate);
  cmp(`qs r=${r} E mJ`, 6.62607015e-34 * c0 / 1064e-9 * Math.PI * 0.25e-6 / (2 * 2.8e-23) * Math.log(1 / 0.7) * r * eta * 1e3, R.outputs.pulseEnergy); }
show("qs r=0.9", run("q-switched-laser", { inversionRatio: 0.9 }), ["pulseEnergy", "extraction", "pulseWidthFwhm"]);
{ const R = run("q-switched-laser", { pump: "gain" }); cmp("qs gain-mode r=2g0l/Ltot", 2 * 0.6 / (Math.log(1 / 0.7) - 2 * Math.log(0.98)), R.outputs.inversionRatioUsed); }
// SPM sech
{ const R = run("self-phase-modulation", { shape: "sech" }); const P = 0.881374 * 1e-6 / 100e-15; const I = 2 * P / (Math.PI * 25e-10); const phi = 2 * Math.PI / 800e-9 * 3.2e-20 * I * 2e-3; const T0 = 100e-15 / 1.762747;
  cmp("spm sech phi", phi, R.outputs.peakPhase); cmp("spm sech dfmax THz", phi * 4 / (3 * Math.sqrt(3)) / T0 / (2 * Math.PI) / 1e12, R.outputs.maxFrequencyShift); show("spm sech", R, ["rmsBroadening"]); }
// SFG off phase matching
{ const R = run("sum-frequency", { deltaK: 0.2 }); cmp("sfg dk sinc²", 72.0740 * (Math.sin(1) / 1) ** 2, R.outputs.sfgPower); }
// soliton normal dispersion; supercontinuum normal
show("sol normal", run("soliton", { beta2: 11.83 }), ["solitonOrder", "solitonPeriod", "solitonCount", "fundamentalPower"]);
show("sol N=3.5", run("soliton", { peakPower: 2827.62 * 12.25 }), ["solitonOrder", "solitonCount", "strongestSolitonPower"]);
show("sc normal", run("supercontinuum", { beta2: 11.83 }), ["solitonOrder", "fissionLength", "dispersiveWavelength"]);
show("sc beta3<0", run("supercontinuum", { beta3: -0.081038 }), ["dispersiveWavelength", "dispersiveWavelengthLeadingOrder"]);
show("thin-disk P=30W", run("thin-disk-laser", { pump: 30 }), ["thresholdPump", "outputPower"]);
{ const R = run("spatial-filter", { m2: 2 }); cmp("sf M²=2 spot", 2 * 67.7363, R.outputs.focalSpotDiameter); }
show("slow resonance", run("slow-light", { model: "resonance", gainDb: 10, resonanceWidth: 100 }), ["resonanceDelay", "delayBandwidth"]);
cmp("slow res 10dB/100MHz ns", 10 / (10 * Math.log10(Math.E)) / (2 * Math.PI * 100e6) * 1e9, run("slow-light", { model: "resonance", gainDb: 10, resonanceWidth: 100 }).outputs.resonanceDelay);
