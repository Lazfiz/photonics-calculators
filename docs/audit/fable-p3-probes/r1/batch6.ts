import { run, cmp } from "./lib";
{ const r = run("cavity-mode-spacing", { n: 1.5 }); cmp("cms n=1.5 fsr", 0.999308 / 1.5, r.outputs.fsr); cmp("cms n=1.5 w0", 146.164 / Math.sqrt(1.5), r.outputs.waist); cmp("cms n=1.5 zR", 43.3013, r.outputs.rayleighRange); cmp("cms n=1.5 dnuT", 0.999308 / 1.5 * 2 / 3, r.outputs.transverseSpacing); }
function herm(n: number, x: number) { let h0 = 1, h1 = 2 * x; if (n === 0) return 1; for (let k = 1; k < n; k++) { const h2 = 2 * x * h1 - 2 * k * h0; h0 = h1; h1 = h2; } return h1; }
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
{ const m = 10, n = 7; const r = run("hermite-gaussian", { m, n }); const w = (r.outputs.beamRadius as number) * 1e-6; let mx1 = 0, mx2 = 0;
  for (let i = 0; i <= 20000; i++) { const x = i * 3 * w / 20000; const u = (k: number) => herm(k, Math.SQRT2 * x / w) ** 2 * Math.exp(-2 * x * x / w / w) / (2 ** k * fact(k));
    mx1 = Math.max(mx1, u(m)); mx2 = Math.max(mx2, u(n)); }
  cmp("HG(10,7) peak W/cm2", 1e-3 * 2 / (Math.PI * w * w) * mx1 * mx2 / 1e4, r.outputs.peakIntensity); cmp("HG(10,7) Wx", (r.outputs.beamRadius as number) * Math.sqrt(21), r.outputs.secondMomentRadiusX); }
