import { stack, qw, L } from "./tmm";
const nm = 1e-9;
function design(nH: number, nL: number, nS: number, p: number, cav: number, l0: number): L[] {
  const H = qw(nH, l0 * nm), Lq = qw(nL, l0 * nm), S = qw(nS, l0 * nm, 2);
  const mir: L[] = []; for (let i = 0; i < p; i++) mir.push(H, Lq);
  const K = [...mir, S, ...[...mir].reverse()];
  const out: L[] = []; for (let c = 0; c < cav; c++) { if (c) out.push(Lq); out.push(...K); } return out;
}
function fwhm(Ls: L[], l0: number, span: number) {
  const N = 40000; let pk = 0; const T: number[] = [], lam: number[] = [];
  for (let i = 0; i <= N; i++) { const l = l0 - span + 2 * span * i / N; lam.push(l); const t = stack(1, Ls, 1.52, 0, l * nm).T; T.push(t); pk = Math.max(pk, t); }
  const cross = (lev: number) => { let a = NaN, b = NaN; for (let i = 0; i < N; i++) { if (T[i] < lev && T[i + 1] >= lev && isNaN(a)) a = lam[i]; if (T[i] >= lev && T[i + 1] < lev) b = lam[i]; } return [a, b]; };
  const [a, b] = cross(pk / 2); return { pk, n: Ls.length, a, b, w: b - a };
}
const r1 = fwhm(design(2.35, 1.45, 2.1, 3, 2, 1550), 1550, 60); console.log("bandpass", r1.n, "peak", (100 * r1.pk).toFixed(3), "edges", r1.a.toFixed(2), r1.b.toFixed(2), "FWHM", r1.w.toFixed(3), "(module 98.8915, 1540.49-1559.63, 19.1376)");
const r2 = fwhm(design(2.35, 1.45, 2.1, 6, 3, 1550), 1550, 4); console.log("narrow", r2.n, "peak", (100 * r2.pk).toFixed(3), "edges", r2.a.toFixed(3), r2.b.toFixed(3), "FWHM", r2.w.toFixed(4), "(module 99.6913, 1549.43-1550.57, 1.13437)");
