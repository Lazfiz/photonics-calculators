const D = Math.PI / 180;
const bis = (f: (x: number) => number, a: number, b: number) => { let fa = f(a); for (let i = 0; i < 200; i++) { const m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } return (a + b) / 2; };
// Conoscopic: calcite d=100um, axis normal, NA 0.85
{ const no = 1.65836, ne = 1.48614, s = 0.85, d = 100;
  const opd = d * (Math.sqrt(no * no - s * s) - (no / ne) * Math.sqrt(ne * ne - s * s));
  console.log(`conoscopic maxR exact edge: ${opd.toFixed(4)} um (module 6.35388)  orders ${(opd / 0.589).toFixed(3)} (10.7876)`); }
// Glan-Taylor window, axis in plane of incidence parallel to entrance face; o leaks lower, e upper
{ const no = 1.65836, ne = 1.48614, a = 38.5 * D;
  const ne_th = (t: number) => 1 / Math.sqrt(Math.sin(t) ** 2 / no ** 2 + Math.cos(t) ** 2 / ne ** 2);
  const tE = bis((t) => ne_th(t) * Math.sin(a + t) - 1, -0.2, 0.3);
  const phiU = Math.asin(ne_th(tE) * Math.sin(tE)) / D;
  const tEf = bis((t) => ne * Math.sin(a + t) - 1, -0.2, 0.3); const phiUf = Math.asin(ne * Math.sin(tEf)) / D;
  const tO = Math.asin(1 / no) - a; const phiL = Math.asin(no * Math.sin(tO)) / D;
  console.log(`glan upper axis-in-plane ${phiU.toFixed(4)} | axis-perp ${phiUf.toFixed(4)} (module 5.60693); lower ${phiL.toFixed(4)} (-2.34642)`); }
// degree-polarization band average, retarder at 45, 5 waves at 550, band 500-600
{ const S1 = 0.8, S2 = 0.3, S3 = 0.2; let c1 = 0, s1 = 0, c2 = 0, s2 = 0; const N = 20000;
  for (let i = 0; i < N; i++) { const lam = 500 + 100 * (i + 0.5) / N; const G = 2 * Math.PI * 5 * 550 / lam; c1 += Math.cos(G) / N; s1 += Math.sin(G) / N;
    const sig = 1 / 600 + (1 / 500 - 1 / 600) * (i + 0.5) / N; const G2 = 2 * Math.PI * 5 * 550 * sig; c2 += Math.cos(G2) / N; s2 += Math.sin(G2) / N; }
  for (const [nm, c, s] of [["flat-lambda", c1, s1], ["flat-sigma", c2, s2]] as const) {
    const o1 = S1 * c - S3 * s, o3 = S1 * s + S3 * c; console.log(`degpol band ${nm}: S1=${o1.toFixed(5)} S3=${o3.toFixed(5)} DOP=${(100 * Math.hypot(o1, S2, o3)).toFixed(3)} (module S1 .0879631 S3 -.013983 DOP 31.2943)`); } }
// Fresnel rhomb: TIR phase 45 per reflection
{ for (const n of [1.5185, 1.51, 1.5168]) { const ph = (t: number) => 2 * Math.atan(Math.cos(t) * Math.sqrt(Math.sin(t) ** 2 - 1 / n ** 2) / Math.sin(t) ** 2);
  const tc = Math.asin(1 / n), tm = Math.acos(Math.sqrt((n * n - 1) / (n * n + 1)));
  const lo = bis((t) => ph(t) - Math.PI / 4, tc + 1e-9, tm), hi = bis((t) => ph(t) - Math.PI / 4, tm, Math.PI / 2 - 1e-9);
  console.log(`rhomb n=${n}: ${(lo / D).toFixed(3)} / ${(hi / D).toFixed(3)} (module 55.3497)`); } }
