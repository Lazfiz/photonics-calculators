import { createRequire as __latticeRequire } from 'node:module'; const require = __latticeRequire(import.meta.url);

// apps/mcp/src/worker.ts
import { existsSync, readFileSync } from "node:fs";
import { parentPort, workerData } from "node:worker_threads";

// packages/engine/src/version.ts
var ENGINE_VERSION = "0.1.0";

// packages/engine/src/kernel/tridiagonal.ts
function pythag(a, b) {
  const absa = Math.abs(a);
  const absb = Math.abs(b);
  if (absa > absb) {
    const r2 = absb / absa;
    return absa * Math.sqrt(1 + r2 * r2);
  }
  if (absb === 0) return 0;
  const r = absa / absb;
  return absb * Math.sqrt(1 + r * r);
}
function tql(d, e, n, zt) {
  for (let i = 1; i < n; i++) e[i - 1] = e[i];
  if (n > 0) e[n - 1] = 0;
  for (let l = 0; l < n; l++) {
    let iter = 0;
    let m;
    do {
      for (m = l; m < n - 1; m++) {
        const dd = Math.abs(d[m]) + Math.abs(d[m + 1]);
        if (Math.abs(e[m]) + dd === dd) break;
      }
      if (m !== l) {
        if (iter++ === 60) throw new Error("tql: no convergence after 60 iterations");
        let g = (d[l + 1] - d[l]) / (2 * e[l]);
        let r = pythag(g, 1);
        g = d[m] - d[l] + e[l] / (g + (g >= 0 ? r : -r));
        let s = 1;
        let c2 = 1;
        let p = 0;
        let i;
        for (i = m - 1; i >= l; i--) {
          const f = s * e[i];
          const b = c2 * e[i];
          e[i + 1] = r = pythag(f, g);
          if (r === 0) {
            d[i + 1] -= p;
            e[m] = 0;
            break;
          }
          s = f / r;
          c2 = g / r;
          g = d[i + 1] - p;
          r = (d[i] - g) * s + 2 * c2 * b;
          p = s * r;
          d[i + 1] = g + p;
          g = c2 * r - b;
          if (zt) {
            const ri = i * n;
            const ri1 = ri + n;
            for (let k = 0; k < n; k++) {
              const zk1 = zt[ri1 + k];
              const zk = zt[ri + k];
              zt[ri1 + k] = s * zk + c2 * zk1;
              zt[ri + k] = c2 * zk - s * zk1;
            }
          }
        }
        if (r === 0 && i >= l) continue;
        d[l] -= p;
        e[l] = g;
        e[m] = 0;
      }
    } while (m !== l);
  }
}
function bisectLowest(d, e, n, count) {
  const k = Math.min(count, n);
  const out = new Float64Array(k);
  if (k === 0) return out;
  const e2 = new Float64Array(n);
  let lo = Infinity;
  let hi = -Infinity;
  let maxE2 = 0;
  for (let i = 0; i < n; i++) {
    const left = i > 0 ? Math.abs(e[i]) : 0;
    const right = i < n - 1 ? Math.abs(e[i + 1]) : 0;
    lo = Math.min(lo, d[i] - left - right);
    hi = Math.max(hi, d[i] + left + right);
    if (i > 0) {
      e2[i] = e[i] * e[i];
      maxE2 = Math.max(maxE2, e2[i]);
    }
  }
  const norm = Math.max(Math.abs(lo), Math.abs(hi));
  const pivmin = Number.MIN_VALUE * 1e10 * Math.max(1, maxE2);
  const pad = 2 * Number.EPSILON * norm + 2 * pivmin;
  lo -= pad;
  hi += pad;
  const below = (x) => {
    let c2 = 0;
    let q2 = d[0] - x;
    if (Math.abs(q2) < pivmin) q2 = -pivmin;
    if (q2 < 0) c2++;
    for (let i = 1; i < n; i++) {
      q2 = d[i] - x - e2[i] / q2;
      if (Math.abs(q2) < pivmin) q2 = -pivmin;
      if (q2 < 0) c2++;
    }
    return c2;
  };
  let floor = lo;
  for (let j = 0; j < k; j++) {
    let a = floor;
    let b = hi;
    for (let it = 0; it < 200; it++) {
      const mid = 0.5 * (a + b);
      if (b - a <= 2 * Number.EPSILON * Math.max(Math.abs(a), Math.abs(b)) + pivmin || mid === a || mid === b) break;
      if (below(mid) > j) b = mid;
      else a = mid;
    }
    out[j] = 0.5 * (a + b);
    floor = a;
  }
  return out;
}

// packages/engine/src/kernel/eig-herm.ts
function reduce(re, im, n) {
  if (re.length < n * n || im.length < n * n) throw new RangeError(`matrix smaller than ${n} \xD7 ${n}`);
  const ar = new Float64Array(n * n);
  const ai = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      const xr = re[i * n + j];
      const xi = im[i * n + j];
      ar[i * n + j] = xr;
      ai[i * n + j] = xi;
      ar[j * n + i] = xr;
      ai[j * n + i] = -xi;
    }
    ar[i * n + i] = re[i * n + i];
  }
  const d = new Float64Array(n);
  const e = new Float64Array(n);
  const vr = new Float64Array(n * n);
  const vi = new Float64Array(n * n);
  const taur = new Float64Array(n);
  const taui = new Float64Array(n);
  const wr = new Float64Array(n);
  const wi = new Float64Array(n);
  for (let k = 0; k < n - 1; k++) {
    const r0 = k + 1;
    const alr = ar[r0 * n + k];
    const ali = ai[r0 * n + k];
    let xnorm = 0;
    for (let i = r0 + 1; i < n; i++) xnorm = pythag(xnorm, pythag(ar[i * n + k], ai[i * n + k]));
    const vk = k * n;
    if (xnorm === 0 && ali === 0) {
      e[k + 1] = alr;
      d[k] = ar[k * n + k];
      continue;
    }
    const beta = -(alr >= 0 ? 1 : -1) * pythag(pythag(alr, ali), xnorm);
    const tr = (beta - alr) / beta;
    const ti = -ali / beta;
    taur[k] = tr;
    taui[k] = ti;
    const dr = alr - beta;
    const di = ali;
    const den = dr * dr + di * di;
    const sr = dr / den;
    const si = -di / den;
    vr[vk + r0] = 1;
    vi[vk + r0] = 0;
    for (let i = r0 + 1; i < n; i++) {
      const xr = ar[i * n + k];
      const xi = ai[i * n + k];
      vr[vk + i] = xr * sr - xi * si;
      vi[vk + i] = xr * si + xi * sr;
    }
    e[k + 1] = beta;
    for (let i = r0; i < n; i++) {
      let sr2 = 0;
      let si2 = 0;
      const ri = i * n;
      for (let j = r0; j < n; j++) {
        const a_r = ar[ri + j];
        const a_i = ai[ri + j];
        const v_r = vr[vk + j];
        const v_i = vi[vk + j];
        sr2 += a_r * v_r - a_i * v_i;
        si2 += a_r * v_i + a_i * v_r;
      }
      wr[i] = tr * sr2 - ti * si2;
      wi[i] = tr * si2 + ti * sr2;
    }
    let pr = 0;
    let pi = 0;
    for (let i = r0; i < n; i++) {
      pr += wr[i] * vr[vk + i] + wi[i] * vi[vk + i];
      pi += wr[i] * vi[vk + i] - wi[i] * vr[vk + i];
    }
    const a2r = -0.5 * (tr * pr - ti * pi);
    const a2i = -0.5 * (tr * pi + ti * pr);
    for (let i = r0; i < n; i++) {
      const v_r = vr[vk + i];
      const v_i = vi[vk + i];
      wr[i] += a2r * v_r - a2i * v_i;
      wi[i] += a2r * v_i + a2i * v_r;
    }
    for (let i = r0; i < n; i++) {
      const ri = i * n;
      const v_r = vr[vk + i];
      const v_i = vi[vk + i];
      const w_r = wr[i];
      const w_i = wi[i];
      for (let j = r0; j < n; j++) {
        const cr = v_r * wr[j] + v_i * wi[j] + w_r * vr[vk + j] + w_i * vi[vk + j];
        const ci = v_i * wr[j] - v_r * wi[j] + w_i * vr[vk + j] - w_r * vi[vk + j];
        ar[ri + j] -= cr;
        ai[ri + j] -= ci;
      }
    }
    d[k] = ar[k * n + k];
  }
  if (n > 0) d[n - 1] = ar[(n - 1) * n + (n - 1)];
  return { d, e, vr, vi, taur, taui };
}
function eigvalsHerm(re, im, n, count) {
  if (n === 0) return new Float64Array(0);
  const { d, e } = reduce(re, im, n);
  if (count !== void 0 && count < n / 4) return bisectLowest(d, e, n, count);
  tql(d, e, n, null);
  const sorted = d.slice().sort();
  return count === void 0 ? sorted : sorted.slice(0, count);
}
function eigHerm(re, im, n) {
  const { d, e, vr, vi, taur, taui } = reduce(re, im, n);
  const zt = new Float64Array(n * n);
  for (let i = 0; i < n; i++) zt[i * n + i] = 1;
  tql(d, e, n, zt);
  const order = Array.from({ length: n }, (_, i) => i).sort((x, y) => d[x] - d[y]);
  const values = Float64Array.from(order, (i) => d[i]);
  const vectorsRe = new Float64Array(n * n);
  const vectorsIm = new Float64Array(n * n);
  const yr = new Float64Array(n);
  const yi = new Float64Array(n);
  order.forEach((src, col) => {
    for (let i = 0; i < n; i++) {
      yr[i] = zt[src * n + i];
      yi[i] = 0;
    }
    for (let k = n - 2; k >= 0; k--) {
      const tr = taur[k];
      const ti = taui[k];
      if (tr === 0 && ti === 0) continue;
      const vk = k * n;
      let sr = 0;
      let si = 0;
      for (let i = k + 1; i < n; i++) {
        sr += vr[vk + i] * yr[i] + vi[vk + i] * yi[i];
        si += vr[vk + i] * yi[i] - vi[vk + i] * yr[i];
      }
      const cr = tr * sr - ti * si;
      const ci = tr * si + ti * sr;
      for (let i = k + 1; i < n; i++) {
        yr[i] -= vr[vk + i] * cr - vi[vk + i] * ci;
        yi[i] -= vr[vk + i] * ci + vi[vk + i] * cr;
      }
    }
    for (let i = 0; i < n; i++) {
      vectorsRe[i * n + col] = yr[i];
      vectorsIm[i * n + col] = yi[i];
    }
  });
  return { values, vectorsRe, vectorsIm };
}

// packages/engine/src/kernel/eig-sym.ts
function lowerCopy(a, n) {
  if (a.length < n * n) throw new RangeError(`matrix of length ${a.length} is smaller than ${n} \xD7 ${n}`);
  const w = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    const r = i * n;
    for (let k = 0; k <= i; k++) w[r + k] = a[r + k];
  }
  return w;
}
function tridiagonalize(w, n) {
  const d = new Float64Array(n);
  const e = new Float64Array(n);
  const hs = new Float64Array(n);
  const p = new Float64Array(n);
  const u = new Float64Array(n);
  for (let i = n - 1; i > 0; i--) {
    const l = i - 1;
    const ri = i * n;
    let h2 = 0;
    if (l > 0) {
      let scale = 0;
      for (let k = 0; k <= l; k++) scale += Math.abs(w[ri + k]);
      if (scale === 0) {
        e[i] = w[ri + l];
      } else {
        const inv = 1 / scale;
        for (let k = 0; k <= l; k++) {
          const v = w[ri + k] * inv;
          w[ri + k] = v;
          h2 += v * v;
        }
        const f = w[ri + l];
        const g = f >= 0 ? -Math.sqrt(h2) : Math.sqrt(h2);
        e[i] = scale * g;
        h2 -= f * g;
        w[ri + l] = f - g;
        for (let k = 0; k <= l; k++) u[k] = w[ri + k];
        p.fill(0, 0, l + 1);
        let j = 0;
        for (; j + 1 <= l; j += 2) {
          const r0 = j * n;
          const r1 = r0 + n;
          const u0 = u[j];
          const u1 = u[j + 1];
          let s0 = 0;
          let s1 = 0;
          for (let k = 0; k < j; k++) {
            const a0 = w[r0 + k];
            const a1 = w[r1 + k];
            const uk = u[k];
            s0 += a0 * uk;
            s1 += a1 * uk;
            p[k] += a0 * u0 + a1 * u1;
          }
          const a10 = w[r1 + j];
          p[j] += s0 + w[r0 + j] * u0 + a10 * u1;
          p[j + 1] += s1 + a10 * u0 + w[r1 + j + 1] * u1;
        }
        if (j === l) {
          const r0 = j * n;
          const u0 = u[j];
          let s0 = 0;
          for (let k = 0; k < j; k++) {
            const a0 = w[r0 + k];
            s0 += a0 * u[k];
            p[k] += a0 * u0;
          }
          p[j] += s0 + w[r0 + j] * u0;
        }
        const invh = 1 / h2;
        let up = 0;
        for (let j2 = 0; j2 <= l; j2++) {
          p[j2] *= invh;
          up += p[j2] * w[ri + j2];
        }
        const hh = up / (h2 + h2);
        for (let j2 = 0; j2 <= l; j2++) p[j2] -= hh * w[ri + j2];
        j = 0;
        for (; j + 1 <= l; j += 2) {
          const r0 = j * n;
          const r1 = r0 + n;
          const u0 = u[j];
          const u1 = u[j + 1];
          const q0 = p[j];
          const q1 = p[j + 1];
          for (let k = 0; k <= j; k++) {
            const pk = p[k];
            const uk = u[k];
            w[r0 + k] -= u0 * pk + q0 * uk;
            w[r1 + k] -= u1 * pk + q1 * uk;
          }
          w[r1 + j + 1] -= u1 * q1 + q1 * u1;
        }
        if (j === l) {
          const r0 = j * n;
          const u0 = u[j];
          const q0 = p[j];
          for (let k = 0; k <= j; k++) w[r0 + k] -= u0 * p[k] + q0 * u[k];
        }
      }
    } else {
      e[i] = w[ri + l];
    }
    hs[i] = h2;
  }
  for (let i = 0; i < n; i++) d[i] = w[i * n + i];
  return { d, e, hs };
}
function sortRows(d, zt, n) {
  const order = Array.from({ length: n }, (_, i) => i).sort((x, y) => d[x] - d[y]);
  const dv = Float64Array.from(order, (i) => d[i]);
  d.set(dv);
  if (zt) {
    const copy = zt.slice();
    order.forEach((src, dst) => zt.set(copy.subarray(src * n, src * n + n), dst * n));
  }
}
function eigvalsSym(a, n, count) {
  if (n === 0) return new Float64Array(0);
  const w = lowerCopy(a, n);
  const { d, e } = tridiagonalize(w, n);
  if (count !== void 0 && count < n / 4) return bisectLowest(d, e, n, count);
  tql(d, e, n, null);
  sortRows(d, null, n);
  return count === void 0 ? d : d.slice(0, count);
}
function eigSym(a, n) {
  const w = lowerCopy(a, n);
  const { d, e, hs } = tridiagonalize(w, n);
  const zt = new Float64Array(n * n);
  for (let i = 0; i < n; i++) zt[i * n + i] = 1;
  tql(d, e, n, zt);
  for (let i = 1; i < n; i++) {
    const h2 = hs[i];
    if (h2 === 0) continue;
    const ri = i * n;
    for (let r = 0; r < n; r++) {
      const rr = r * n;
      let s = 0;
      for (let k = 0; k < i; k++) s += w[ri + k] * zt[rr + k];
      s /= h2;
      for (let k = 0; k < i; k++) zt[rr + k] -= s * w[ri + k];
    }
  }
  sortRows(d, zt, n);
  const vectors = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) vectors[k * n + i] = zt[i * n + k];
  return { values: d, vectors };
}

// vendor/continuum/packages/engine/src/fft.ts
function isPowerOfTwo(n) {
  return Number.isInteger(n) && n >= 1 && n <= 2 ** 30 && (n & n - 1) === 0;
}
var cache = /* @__PURE__ */ new Map();
function createFft(n) {
  let f = cache.get(n);
  if (!f) {
    f = build(n);
    cache.set(n, f);
  }
  return f;
}
function bitReverse(i, bits) {
  let r = 0;
  for (let b = 0; b < bits; b++) r |= (i >> b & 1) << bits - 1 - b;
  return r;
}
function build(n) {
  if (!isPowerOfTwo(n)) throw new RangeError(`createFft: length must be a power of two, got ${n}`);
  const bits = Math.round(Math.log2(n));
  const radix2First = bits % 2 === 1;
  const groups = n < 2 ? 0 : radix2First ? n / 2 : n / 4;
  const base = new Uint32Array(groups);
  for (let g = 0; g < groups; g++) base[g] = bitReverse(radix2First ? 2 * g : 4 * g, bits);
  const q1 = n >> 2, q2 = n >> 1, q3 = 3 * (n >> 2);
  const stages = [];
  for (let m = radix2First ? 2 : 4; 4 * m <= n; m *= 4) {
    const tw = new Float64Array(6 * m);
    for (let k = 0; k < m; k++) {
      for (let p = 1; p <= 3; p++) {
        const angle = 2 * Math.PI * p * k / (4 * m);
        tw[6 * k + 2 * (p - 1)] = Math.cos(angle);
        tw[6 * k + 2 * (p - 1) + 1] = -Math.sin(angle);
      }
    }
    stages.push({ m, tw });
  }
  const firstStage = (sr, si, so, dr, di, d0) => {
    if (radix2First) {
      for (let g = 0, o = d0; g < groups; g++, o += 2) {
        const a = so + base[g], b = a + q2;
        const ar = sr[a], ai = si[a], br = sr[b], bi = si[b];
        dr[o] = ar + br;
        di[o] = ai + bi;
        dr[o + 1] = ar - br;
        di[o + 1] = ai - bi;
      }
      return;
    }
    for (let g = 0, o = d0; g < groups; g++, o += 4) {
      const r = so + base[g];
      const ar = sr[r], ai = si[r], br = sr[r + q2], bi = si[r + q2];
      const cr = sr[r + q1], ci = si[r + q1], dr_ = sr[r + q3], di_ = si[r + q3];
      const s0r = ar + br, s0i = ai + bi, d0r = ar - br, d0i = ai - bi;
      const s1r = cr + dr_, s1i = ci + di_, d1r = cr - dr_, d1i = ci - di_;
      dr[o] = s0r + s1r;
      di[o] = s0i + s1i;
      dr[o + 2] = s0r - s1r;
      di[o + 2] = s0i - s1i;
      dr[o + 1] = d0r + d1i;
      di[o + 1] = d0i - d1r;
      dr[o + 3] = d0r - d1i;
      di[o + 3] = d0i + d1r;
    }
  };
  const laterStages = (re, im, offset) => {
    const end = offset + n;
    for (let s = 0; s < stages.length; s++) {
      const { m, tw } = stages[s];
      const block2 = 4 * m;
      for (let b0 = offset; b0 < end; b0 += block2) {
        for (let k = 0, t = 0; k < m; k++, t += 6) {
          const i0 = b0 + k, i1 = i0 + m, i2 = i1 + m, i3 = i2 + m;
          const w1r = tw[t], w1i = tw[t + 1], w2r = tw[t + 2], w2i = tw[t + 3], w3r = tw[t + 4], w3i = tw[t + 5];
          const ar = re[i0], ai = im[i0];
          let xr = re[i1], xi = im[i1];
          const br = xr * w2r - xi * w2i, bi = xr * w2i + xi * w2r;
          xr = re[i2];
          xi = im[i2];
          const cr = xr * w1r - xi * w1i, ci = xr * w1i + xi * w1r;
          xr = re[i3];
          xi = im[i3];
          const dr = xr * w3r - xi * w3i, di = xr * w3i + xi * w3r;
          const s0r = ar + br, s0i = ai + bi, d0r = ar - br, d0i = ai - bi;
          const s1r = cr + dr, s1i = ci + di, d1r = cr - dr, d1i = ci - di;
          re[i0] = s0r + s1r;
          im[i0] = s0i + s1i;
          re[i2] = s0r - s1r;
          im[i2] = s0i - s1i;
          re[i1] = d0r + d1i;
          im[i1] = d0i - d1r;
          re[i3] = d0r - d1i;
          im[i3] = d0i + d1r;
        }
      }
    }
  };
  const forwardTo = (sr, si, so, dr, di, d0) => {
    if (n === 1) {
      dr[d0] = sr[so];
      di[d0] = si[so];
      return;
    }
    if (sr === dr || si === di || sr === di || si === dr) throw new RangeError("Fft.forwardTo: source and destination must differ");
    firstStage(sr, si, so, dr, di, d0);
    laterStages(dr, di, d0);
  };
  const scale = 1 / n;
  const scaleRow = (re, im, offset) => {
    for (let i = offset, end = offset + n; i < end; i++) {
      re[i] *= scale;
      im[i] *= scale;
    }
  };
  const scratchRe = new Float64Array(n), scratchIm = new Float64Array(n);
  const forward = (re, im, offset = 0) => {
    if (n === 1) return;
    firstStage(re, im, offset, scratchRe, scratchIm, 0);
    laterStages(scratchRe, scratchIm, 0);
    re.set(scratchRe, offset);
    im.set(scratchIm, offset);
  };
  return {
    n,
    forward,
    inverse: (re, im, offset = 0) => {
      forward(im, re, offset);
      scaleRow(re, im, offset);
    },
    forwardTo,
    inverseTo: (sr, si, so, dr, di, d0) => {
      forwardTo(si, sr, so, di, dr, d0);
      scaleRow(dr, di, d0);
    }
  };
}

// packages/engine/src/kernel/fft2.ts
function fft2(re, im, rows, cols, inverse = false) {
  if (re.length < rows * cols || im.length < rows * cols) throw new RangeError(`fft2: arrays smaller than ${rows} \xD7 ${cols}`);
  const fr = createFft(cols);
  for (let r = 0; r < rows; r++) {
    if (inverse) fr.inverse(re, im, r * cols);
    else fr.forward(re, im, r * cols);
  }
  if (rows === 1) return;
  const fc = createFft(rows);
  const cr = new Float64Array(rows);
  const ci = new Float64Array(rows);
  for (let c2 = 0; c2 < cols; c2++) {
    for (let r = 0; r < rows; r++) {
      cr[r] = re[r * cols + c2];
      ci[r] = im[r * cols + c2];
    }
    if (inverse) fc.inverse(cr, ci);
    else fc.forward(cr, ci);
    for (let r = 0; r < rows; r++) {
      re[r * cols + c2] = cr[r];
      im[r * cols + c2] = ci[r];
    }
  }
}

// packages/engine/src/kernel/cmat.ts
function cmul(ar, ai, br, bi, n, m, p) {
  const cr = new Float64Array(n * p);
  const ci = new Float64Array(n * p);
  for (let i = 0; i < n; i++) {
    const ci0 = i * p;
    for (let k = 0; k < m; k++) {
      const xr = ar[i * m + k];
      const xi = ai[i * m + k];
      if (xr === 0 && xi === 0) continue;
      const bk = k * p;
      for (let j = 0; j < p; j++) {
        const yr = br[bk + j];
        const yi = bi[bk + j];
        cr[ci0 + j] += xr * yr - xi * yi;
        ci[ci0 + j] += xr * yi + xi * yr;
      }
    }
  }
  return { re: cr, im: ci };
}
function csolve(aRe, aIm, bRe, bIm, n, p) {
  const lr = aRe.slice(0, n * n);
  const li = aIm.slice(0, n * n);
  const xr = bRe.slice(0, n * p);
  const xi = bIm.slice(0, n * p);
  const swapRows = (r, c2, i, j) => {
    for (let k = 0; k < c2; k++) {
      const t = r[i * c2 + k];
      r[i * c2 + k] = r[j * c2 + k];
      r[j * c2 + k] = t;
    }
  };
  for (let col = 0; col < n; col++) {
    let piv = col;
    let best = -1;
    for (let i = col; i < n; i++) {
      const m = Math.abs(lr[i * n + col]) + Math.abs(li[i * n + col]);
      if (m > best) {
        best = m;
        piv = i;
      }
    }
    if (best === 0) throw new Error("csolve: singular matrix");
    if (piv !== col) {
      swapRows(lr, n, piv, col);
      swapRows(li, n, piv, col);
      swapRows(xr, p, piv, col);
      swapRows(xi, p, piv, col);
    }
    const pr = lr[col * n + col];
    const pi = li[col * n + col];
    const den = pr * pr + pi * pi;
    const ir = pr / den;
    const ii = -pi / den;
    for (let i = col + 1; i < n; i++) {
      const ar = lr[i * n + col];
      const ai = li[i * n + col];
      if (ar === 0 && ai === 0) continue;
      const fr = ar * ir - ai * ii;
      const fi = ar * ii + ai * ir;
      for (let k = col + 1; k < n; k++) {
        const ur = lr[col * n + k];
        const ui = li[col * n + k];
        lr[i * n + k] -= fr * ur - fi * ui;
        li[i * n + k] -= fr * ui + fi * ur;
      }
      for (let k = 0; k < p; k++) {
        const ur = xr[col * p + k];
        const ui = xi[col * p + k];
        xr[i * p + k] -= fr * ur - fi * ui;
        xi[i * p + k] -= fr * ui + fi * ur;
      }
    }
  }
  for (let i = n - 1; i >= 0; i--) {
    const pr = lr[i * n + i];
    const pi = li[i * n + i];
    const den = pr * pr + pi * pi;
    for (let k = 0; k < p; k++) {
      let sr = xr[i * p + k];
      let si = xi[i * p + k];
      for (let j = i + 1; j < n; j++) {
        const ur = lr[i * n + j];
        const ui = li[i * n + j];
        const yr = xr[j * p + k];
        const yi = xi[j * p + k];
        sr -= ur * yr - ui * yi;
        si -= ur * yi + ui * yr;
      }
      xr[i * p + k] = (sr * pr + si * pi) / den;
      xi[i * p + k] = (si * pr - sr * pi) / den;
    }
  }
  return { re: xr, im: xi };
}

// packages/engine/src/kernel/star.ts
function hcat(x, y, n) {
  const re = new Float64Array(2 * n * n);
  const im = new Float64Array(2 * n * n);
  for (let i = 0; i < n; i++) {
    re.set(x.re.subarray(i * n, i * n + n), 2 * n * i);
    im.set(x.im.subarray(i * n, i * n + n), 2 * n * i);
    re.set(y.re.subarray(i * n, i * n + n), 2 * n * i + n);
    im.set(y.im.subarray(i * n, i * n + n), 2 * n * i + n);
  }
  return { re, im };
}
function half(z, n, from) {
  const re = new Float64Array(n * n);
  const im = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    re.set(z.re.subarray(2 * n * i + from, 2 * n * i + from + n), i * n);
    im.set(z.im.subarray(2 * n * i + from, 2 * n * i + from + n), i * n);
  }
  return { re, im };
}
function iMinusProduct(x, y, n) {
  const p = cmul(x.re, x.im, y.re, y.im, n, n, n);
  for (let k = 0; k < n * n; k++) {
    p.re[k] = -p.re[k];
    p.im[k] = -p.im[k];
  }
  for (let i = 0; i < n; i++) p.re[i * n + i] += 1;
  return p;
}
var mul = (x, y, n) => cmul(x.re, x.im, y.re, y.im, n, n, n);
function add(x, y, n) {
  const re = new Float64Array(n * n);
  const im = new Float64Array(n * n);
  for (let k = 0; k < n * n; k++) {
    re[k] = x.re[k] + y.re[k];
    im[k] = x.im[k] + y.im[k];
  }
  return { n, re, im };
}
function starProduct(a, b) {
  const n = a.n;
  if (b.n !== n) throw new RangeError(`starProduct: sizes ${a.n} and ${b.n} differ`);
  const lhsE = iMinusProduct(b.s11, a.s22, n);
  const rhsE = hcat(mul(b.s11, a.s21, n), b.s12, n);
  const xE = csolve(lhsE.re, lhsE.im, rhsE.re, rhsE.im, n, 2 * n);
  const lhsF = iMinusProduct(a.s22, b.s11, n);
  const rhsF = hcat(a.s21, mul(a.s22, b.s12, n), n);
  const xF = csolve(lhsF.re, lhsF.im, rhsF.re, rhsF.im, n, 2 * n);
  const s11 = add(a.s11, mul(a.s12, half(xE, n, 0), n), n);
  const s12p = mul(a.s12, half(xE, n, n), n);
  const s21p = mul(b.s21, half(xF, n, 0), n);
  const s22 = add(b.s22, mul(b.s21, half(xF, n, n), n), n);
  return { n, s11, s12: { n, ...s12p }, s21: { n, ...s21p }, s22 };
}

// packages/engine/src/kernel/ts-kernel.ts
var tsKernel = Object.freeze({
  name: "ts",
  eigvalsSym,
  eigSym,
  eigvalsHerm,
  eigHerm,
  starProduct,
  fft2
});

// packages/engine/src/kernel/select.ts
var current = tsKernel;
function getKernel() {
  return current;
}
function setKernel(kernel) {
  current = kernel;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 2147483648 - 1;
  };
}
function randomSymmetric(n, r) {
  const a = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) a[i * n + j] = a[j * n + i] = r();
  return a;
}
function randomComplex(n, r, scale = 1) {
  return { n, re: Float64Array.from({ length: n * n }, () => scale * r()), im: Float64Array.from({ length: n * n }, () => scale * r()) };
}
function maxRel(a, b) {
  let num2 = 0;
  let den = 0;
  for (let i = 0; i < a.length; i++) {
    num2 = Math.max(num2, Math.abs(a[i] - b[i]));
    den = Math.max(den, Math.abs(b[i]));
  }
  return den === 0 ? num2 : num2 / den;
}
function checkKernel(candidate, reference = tsKernel, tolerance = 1e-10) {
  const r = rng(20261121);
  const failures = [];
  let worst = 0;
  const cmp = (what, got, want) => {
    if (got.length !== want.length) {
      failures.push(`${what}: length ${got.length} vs ${want.length}`);
      return;
    }
    const d = maxRel(got, want);
    worst = Math.max(worst, Number.isNaN(d) ? Infinity : d);
    if (!(d <= tolerance)) failures.push(`${what}: difference ${d}`);
  };
  try {
    const s = randomSymmetric(24, r);
    cmp("eigvalsSym", candidate.eigvalsSym(s, 24), reference.eigvalsSym(s, 24));
    cmp("eigvalsSym(count)", candidate.eigvalsSym(s, 24, 4), reference.eigvalsSym(s, 24, 4));
    cmp("eigSym.values", candidate.eigSym(s, 24).values, reference.eigSym(s, 24).values);
    const h2 = randomComplex(12, r);
    cmp("eigvalsHerm", candidate.eigvalsHerm(h2.re, h2.im, 12), reference.eigvalsHerm(h2.re, h2.im, 12));
    cmp("eigHerm.values", candidate.eigHerm(h2.re, h2.im, 12).values, reference.eigHerm(h2.re, h2.im, 12).values);
    const sm = () => ({
      n: 4,
      s11: randomComplex(4, r, 0.3),
      s12: randomComplex(4, r, 0.3),
      s21: randomComplex(4, r, 0.3),
      s22: randomComplex(4, r, 0.3)
    });
    const a = sm();
    const b = sm();
    const got = candidate.starProduct(a, b);
    const want = reference.starProduct(a, b);
    for (const k of ["s11", "s12", "s21", "s22"]) {
      cmp(`starProduct.${k}.re`, got[k].re, want[k].re);
      cmp(`starProduct.${k}.im`, got[k].im, want[k].im);
    }
    const fre = Float64Array.from({ length: 32 }, r);
    const fim = Float64Array.from({ length: 32 }, r);
    const gre = fre.slice();
    const gim = fim.slice();
    candidate.fft2(fre, fim, 8, 4);
    reference.fft2(gre, gim, 8, 4);
    cmp("fft2.re", fre, gre);
    cmp("fft2.im", fim, gim);
  } catch (err) {
    failures.push(`threw: ${err instanceof Error ? err.message : String(err)}`);
    worst = Infinity;
  }
  return { ok: failures.length === 0, maxDifference: worst, failures };
}
async function selectKernel(loaders) {
  const rejected = [];
  for (const [index, load] of loaders.entries()) {
    let k;
    try {
      k = await load();
    } catch (err) {
      rejected.push({ index, reason: `failed to load: ${err instanceof Error ? err.message : String(err)}` });
      continue;
    }
    const check = checkKernel(k);
    if (check.ok) {
      setKernel(k);
      return { kernel: k, rejected };
    }
    rejected.push({ index, name: k.name, reason: `disagrees with the TypeScript kernel: ${check.failures.join("; ")}` });
  }
  setKernel(tsKernel);
  return { kernel: tsKernel, rejected };
}

// packages/engine/src/lattice.ts
function lattice(kind) {
  let a1;
  let a2;
  if (kind === "square") {
    a1 = [1, 0];
    a2 = [0, 1];
  } else if (kind === "hex") {
    a1 = [1, 0];
    a2 = [0.5, Math.sqrt(3) / 2];
  } else {
    throw new RangeError(`unknown lattice ${String(kind)}`);
  }
  const area = Math.abs(a1[0] * a2[1] - a1[1] * a2[0]);
  const b1 = [2 * Math.PI * a2[1] / area, -2 * Math.PI * a2[0] / area];
  const b2 = [-2 * Math.PI * a1[1] / area, 2 * Math.PI * a1[0] / area];
  return { kind, a1, a2, b1, b2, area };
}
function gVectors(lat, M) {
  const side = 2 * M + 1;
  const gx = new Float64Array(side * side);
  const gy = new Float64Array(side * side);
  for (let m = -M; m <= M; m++) {
    for (let n = -M; n <= M; n++) {
      const i = (m + M) * side + (n + M);
      gx[i] = m * lat.b1[0] + n * lat.b2[0];
      gy[i] = m * lat.b1[1] + n * lat.b2[1];
    }
  }
  return { gx, gy };
}
var SYMMETRY_POINTS = {
  square: { order: ["\u0393", "X", "M", "\u0393"], points: { \u0393: [0, 0], X: [Math.PI, 0], M: [Math.PI, Math.PI] } },
  hex: {
    order: ["\u0393", "M", "K", "\u0393"],
    points: { \u0393: [0, 0], M: [0, 2 * Math.PI / Math.sqrt(3)], K: [2 * Math.PI / 3, 2 * Math.PI / Math.sqrt(3)] }
  }
};
function zonePath(kind, nPerSegment = 20) {
  const { order, points } = SYMMETRY_POINTS[kind];
  const k = [];
  const ticks = [];
  for (let s = 0; s < order.length - 1; s++) {
    const A = points[order[s]];
    const B = points[order[s + 1]];
    ticks.push({ label: order[s], index: k.length, distance: 0 });
    for (let j = 0; j < nPerSegment; j++) {
      const t = j / nPerSegment;
      k.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]);
    }
  }
  ticks.push({ label: order[order.length - 1], index: k.length, distance: 0 });
  k.push(points[order[order.length - 1]]);
  const distance = [0];
  for (let i = 1; i < k.length; i++) {
    distance.push(distance[i - 1] + Math.hypot(k[i][0] - k[i - 1][0], k[i][1] - k[i - 1][1]));
  }
  for (const t of ticks) t.distance = distance[t.index];
  return { k, distance, ticks };
}

// packages/engine/src/linalg.ts
function invertSpd(a, n) {
  const L = new Float64Array(n * n);
  for (let j = 0; j < n; j++) {
    const rj = j * n;
    let s = a[rj + j];
    for (let k = 0; k < j; k++) s -= L[rj + k] * L[rj + k];
    if (!(s > 0)) throw new Error(`invertSpd: matrix is not positive definite (pivot ${s} at ${j})`);
    const ljj = Math.sqrt(s);
    L[rj + j] = ljj;
    const inv = 1 / ljj;
    for (let i = j + 1; i < n; i++) {
      const ri = i * n;
      let t = a[ri + j];
      for (let k = 0; k < j; k++) t -= L[ri + k] * L[rj + k];
      L[ri + j] = t * inv;
    }
  }
  const W = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    const ri = i * n;
    W[ri + i] = 1 / L[ri + i];
    for (let j = 0; j < i; j++) {
      let s = 0;
      for (let k = j; k < i; k++) s -= L[ri + k] * W[k * n + j];
      W[ri + j] = s / L[ri + i];
    }
  }
  const out = new Float64Array(n * n);
  for (let k = 0; k < n; k++) {
    const rk = k * n;
    for (let i = 0; i <= k; i++) {
      const wki = W[rk + i];
      if (wki === 0) continue;
      const ri = i * n;
      for (let j = 0; j <= i; j++) out[ri + j] += wki * W[rk + j];
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) out[j * n + i] = out[i * n + j];
  return out;
}

// packages/engine/src/fourier.ts
var J1_POINTS = 512;
var TAU_SIN = Float64Array.from({ length: J1_POINTS }, (_, j) => Math.sin(2 * Math.PI * j / J1_POINTS));
var TAU = Float64Array.from({ length: J1_POINTS }, (_, j) => 2 * Math.PI * j / J1_POINTS);
function besselJ1(x) {
  let s = 0;
  for (let j = 0; j < J1_POINTS; j++) s += Math.cos(TAU[j] - x * TAU_SIN[j]);
  return s / J1_POINTS;
}
function fillFraction(lat, radius) {
  return Math.PI * radius * radius / lat.area;
}
function cylinderCoefficient(lat, radius, vIn, vOut, gx, gy) {
  const f = fillFraction(lat, radius);
  const g = Math.hypot(gx, gy);
  if (g < 1e-12) return vOut + (vIn - vOut) * f;
  const x = g * radius;
  return (vIn - vOut) * f * 2 * besselJ1(x) / x;
}
function differenceTable(lat, M, radius, vIn, vOut) {
  const side = 4 * M + 1;
  const t = new Float64Array(side * side);
  for (let dm = -2 * M; dm <= 2 * M; dm++) {
    for (let dn = -2 * M; dn <= 2 * M; dn++) {
      const gx = dm * lat.b1[0] + dn * lat.b2[0];
      const gy = dm * lat.b1[1] + dn * lat.b2[1];
      t[(dm + 2 * M) * side + (dn + 2 * M)] = cylinderCoefficient(lat, radius, vIn, vOut, gx, gy);
    }
  }
  return t;
}
function toeplitzFromTable(table, M) {
  const side = 2 * M + 1;
  const tside = 4 * M + 1;
  const N = side * side;
  const out = new Float64Array(N * N);
  for (let m = 0; m < side; m++) {
    for (let n = 0; n < side; n++) {
      const row = (m * side + n) * N;
      for (let m2 = 0; m2 < side; m2++) {
        const base = (m - m2 + 2 * M) * tside + 2 * M + n;
        const col = m2 * side;
        for (let n2 = 0; n2 < side; n2++) out[row + col + n2] = table[base - n2];
      }
    }
  }
  return out;
}
function inverseEpsilon(c2, M) {
  if (!(Number.isInteger(M) && M >= 0)) throw new RangeError(`M must be a non-negative integer, got ${M}`);
  if (!(c2.epsIn > 0 && c2.epsOut > 0)) throw new RangeError("permittivities must be positive (lossless dielectrics)");
  if (!(c2.radius >= 0)) throw new RangeError(`radius must be \u2265 0, got ${c2.radius}`);
  const lat = lattice(c2.lattice);
  const { gx, gy } = gVectors(lat, M);
  const n = gx.length;
  const epsilon = toeplitzFromTable(differenceTable(lat, M, c2.radius, c2.epsIn, c2.epsOut), M);
  const eta = invertSpd(epsilon, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      const v = 0.5 * (eta[i * n + j] + eta[j * n + i]);
      eta[i * n + j] = v;
      eta[j * n + i] = v;
    }
  }
  return { lattice: lat, M, n, gx, gy, epsilon, eta };
}

// packages/engine/src/gaps.ts
function findGaps(bands, options = {}) {
  const nk = bands.length;
  if (nk === 0) return [];
  const nb = Math.min(options.maxBand ?? bands[0].length, bands[0].length);
  const minRel = options.minRelativeWidth ?? 1e-3;
  const out = [];
  for (let j = 0; j < nb - 1; j++) {
    let bottom = -Infinity;
    let top = Infinity;
    let bottomAt = 0;
    let topAt = 0;
    for (let i = 0; i < nk; i++) {
      if (bands[i][j] > bottom) {
        bottom = bands[i][j];
        bottomAt = i;
      }
      if (bands[i][j + 1] < top) {
        top = bands[i][j + 1];
        topAt = i;
      }
    }
    if (top - bottom > minRel * top) {
      out.push({ betweenBands: [j + 1, j + 2], bottom, top, gapMidgap: 2 * (top - bottom) / (top + bottom), bottomAt, topAt });
    }
  }
  return out;
}
function completeGaps(te, tm) {
  const out = [];
  for (const a of te) {
    for (const b of tm) {
      const bottom = Math.max(a.bottom, b.bottom);
      const top = Math.min(a.top, b.top);
      if (top > bottom) out.push({ bottom, top, gapMidgap: 2 * (top - bottom) / (top + bottom) });
    }
  }
  return out.sort((x, y) => x.bottom - y.bottom);
}

// packages/engine/src/pwe2d.ts
function operatorMatrix(eps, k, pol) {
  const { n, gx, gy, eta } = eps;
  const kx = new Float64Array(n);
  const ky = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    kx[i] = k[0] + gx[i];
    ky[i] = k[1] + gy[i];
  }
  const h2 = new Float64Array(n * n);
  if (pol === "TM") {
    const mag = Float64Array.from({ length: n }, (_, i) => Math.hypot(kx[i], ky[i]));
    for (let i = 0; i < n; i++) {
      const r = i * n;
      const mi = mag[i];
      for (let j = 0; j < n; j++) h2[r + j] = mi * eta[r + j] * mag[j];
    }
  } else if (pol === "TE") {
    for (let i = 0; i < n; i++) {
      const r = i * n;
      for (let j = 0; j < n; j++) h2[r + j] = (kx[i] * kx[j] + ky[i] * ky[j]) * eta[r + j];
    }
  } else {
    throw new RangeError(`unknown polarisation ${String(pol)}`);
  }
  return h2;
}
function mirrors(kind) {
  const n = kind === "square" ? 4 : 6;
  return Array.from({ length: n }, (_, j) => {
    const th = Math.PI * j / n;
    return [Math.cos(2 * th), Math.sin(2 * th), Math.sin(2 * th), -Math.cos(2 * th)];
  });
}
var permutationCache = /* @__PURE__ */ new WeakMap();
function mirrorPermutation(eps, op) {
  let list2 = permutationCache.get(eps);
  if (!list2) {
    list2 = [];
    permutationCache.set(eps, list2);
  }
  if (list2[op] !== void 0) return list2[op];
  const [a, b, c2, d] = mirrors(eps.lattice.kind)[op];
  const { b1, b2 } = eps.lattice;
  const det = b1[0] * b2[1] - b1[1] * b2[0];
  const M = eps.M;
  const side = 2 * M + 1;
  const perm = new Int32Array(eps.n);
  let ok = true;
  for (let i = 0; i < eps.n && ok; i++) {
    const x = a * eps.gx[i] + b * eps.gy[i];
    const y = c2 * eps.gx[i] + d * eps.gy[i];
    const m = (x * b2[1] - y * b2[0]) / det;
    const n = (b1[0] * y - b1[1] * x) / det;
    const mi = Math.round(m);
    const ni = Math.round(n);
    if (Math.abs(m - mi) > 1e-9 || Math.abs(n - ni) > 1e-9 || Math.abs(mi) > M || Math.abs(ni) > M) ok = false;
    else perm[i] = (mi + M) * side + (ni + M);
  }
  list2[op] = ok ? perm : null;
  return list2[op];
}
function mirrorFixing(eps, k) {
  const ops = mirrors(eps.lattice.kind);
  const scale = Math.max(1, Math.hypot(k[0], k[1]));
  for (let op = 0; op < ops.length; op++) {
    const [a, b, c2, d] = ops[op];
    if (Math.abs(a * k[0] + b * k[1] - k[0]) > 1e-12 * scale || Math.abs(c2 * k[0] + d * k[1] - k[1]) > 1e-12 * scale) continue;
    const perm = mirrorPermutation(eps, op);
    if (perm) return perm;
  }
  return null;
}
function eigvalsByMirror(h2, n, perm, count, kernel) {
  const fixed = [];
  const pairs = [];
  for (let i = 0; i < n; i++) {
    if (perm[i] === i) fixed.push(i);
    else if (perm[i] > i) pairs.push(i);
  }
  const ne = fixed.length + pairs.length;
  const no = pairs.length;
  const even = new Float64Array(ne * ne);
  const odd = new Float64Array(no * no);
  const r2 = Math.SQRT1_2;
  const nf = fixed.length;
  for (let a = 0; a < ne; a++) {
    for (let b = 0; b <= a; b++) {
      let v;
      if (a < nf && b < nf) v = h2[fixed[a] * n + fixed[b]];
      else if (b < nf) {
        const i = pairs[a - nf];
        v = (h2[i * n + fixed[b]] + h2[perm[i] * n + fixed[b]]) * r2;
      } else {
        const i = pairs[a - nf];
        const j = pairs[b - nf];
        v = h2[i * n + j] + h2[i * n + perm[j]];
      }
      even[a * ne + b] = v;
    }
  }
  for (let a = 0; a < no; a++) {
    const i = pairs[a];
    for (let b = 0; b <= a; b++) {
      const j = pairs[b];
      odd[a * no + b] = h2[i * n + j] - h2[i * n + perm[j]];
    }
  }
  const we = kernel.eigvalsSym(even, ne, Math.min(count, ne));
  const wo = no > 0 ? kernel.eigvalsSym(odd, no, Math.min(count, no)) : new Float64Array(0);
  const merged = Float64Array.from([...we, ...wo]).sort();
  return merged.slice(0, count);
}
function frequenciesAt(eps, k, pol, nBands, kernel = getKernel(), useSymmetry = true) {
  const h2 = operatorMatrix(eps, k, pol);
  const perm = useSymmetry ? mirrorFixing(eps, k) : null;
  const w2 = perm ? eigvalsByMirror(h2, eps.n, perm, nBands, kernel) : kernel.eigvalsSym(h2, eps.n, nBands);
  return w2.map((v) => Math.sqrt(Math.max(v, 0)) / (2 * Math.PI));
}
function* bandStream(request, kernel = getKernel()) {
  const nb = request.nBands ?? 8;
  const eps = inverseEpsilon(request.structure, request.M);
  const path = zonePath(request.structure.lattice, request.nPerSegment ?? 20);
  for (let i = 0; i < path.k.length; i++) {
    const f = frequenciesAt(eps, path.k[i], request.polarisation, nb, kernel);
    yield { index: i, k: path.k[i], distance: path.distance[i], frequencies: Array.from(f) };
  }
}
function bandStructure(request, kernel = getKernel()) {
  const path = zonePath(request.structure.lattice, request.nPerSegment ?? 20);
  const bands = [];
  for (const p of bandStream(request, kernel)) bands.push(p.frequencies);
  return {
    request,
    engineVersion: ENGINE_VERSION,
    kernel: kernel.name,
    planeWaves: (2 * request.M + 1) ** 2,
    path,
    bands,
    gaps: findGaps(bands)
  };
}

// packages/engine/src/pwe1d.ts
function epsilonCoefficients1D(layers, M) {
  const period = layers.reduce((s, l) => s + l.thickness, 0);
  if (!(period > 0) || layers.some((l) => !(l.n > 0) || !(l.thickness >= 0))) {
    throw new RangeError("layers need n > 0, thickness \u2265 0 and a positive period");
  }
  const size = 4 * M + 1;
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  const z = [-layers[0].thickness / (2 * period)];
  for (const l of layers) z.push(z[z.length - 1] + l.thickness / period);
  for (let q2 = -2 * M; q2 <= 2 * M; q2++) {
    let sr = 0;
    let si = 0;
    for (let i = 0; i < layers.length; i++) {
      const eps = layers[i].n * layers[i].n;
      if (q2 === 0) {
        sr += eps * (z[i + 1] - z[i]);
      } else {
        const g = 2 * Math.PI * q2;
        const c1 = Math.cos(g * z[i + 1]);
        const s1 = -Math.sin(g * z[i + 1]);
        const c0 = Math.cos(g * z[i]);
        const s0 = -Math.sin(g * z[i]);
        const a = c1 - c0;
        const b = s1 - s0;
        sr += eps * -b / g;
        si += eps * a / g;
      }
    }
    re[q2 + 2 * M] = sr;
    im[q2 + 2 * M] = si;
  }
  return { re, im };
}
function bands1D(layers, ks, M = 40, nBands = 4, kernel = getKernel()) {
  const N = 2 * M + 1;
  const c2 = epsilonCoefficients1D(layers, M);
  const er = new Float64Array(N * N);
  const ei = new Float64Array(N * N);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      er[i * N + j] = c2.re[i - j + 2 * M];
      ei[i * N + j] = c2.im[i - j + 2 * M];
    }
  }
  const id = new Float64Array(N * N);
  for (let i = 0; i < N; i++) id[i * N + i] = 1;
  const eta = csolve(er, ei, id, new Float64Array(N * N), N, N);
  const out = [];
  const hr = new Float64Array(N * N);
  const hi = new Float64Array(N * N);
  for (const k of ks) {
    const mag = Float64Array.from({ length: N }, (_, i) => Math.abs(k + 2 * Math.PI * (i - M)));
    for (let i = 0; i < N; i++) {
      for (let j = 0; j <= i; j++) {
        const vr = 0.5 * (eta.re[i * N + j] + eta.re[j * N + i]);
        const vi = 0.5 * (eta.im[i * N + j] - eta.im[j * N + i]);
        hr[i * N + j] = mag[i] * vr * mag[j];
        hi[i * N + j] = mag[i] * vi * mag[j];
      }
    }
    const w2 = kernel.eigvalsHerm(hr, hi, N, nBands);
    out.push(Array.from(w2, (v) => Math.sqrt(Math.max(v, 0)) / (2 * Math.PI)));
  }
  return out;
}

// packages/engine/src/tmm1d.ts
function response1D(stack, wavelength) {
  if (!(wavelength > 0 && stack.incident > 0 && stack.exit > 0)) throw new RangeError("need \u03BB > 0 and positive media indices");
  let m11r = 1, m11i = 0, m12r = 0, m12i = 0, m21r = 0, m21i = 0, m22r = 1, m22i = 0;
  for (const { n, thickness } of stack.layers) {
    if (!(n > 0 && thickness >= 0)) throw new RangeError("layers need n > 0 and thickness \u2265 0");
    const delta = 2 * Math.PI * n * thickness / wavelength;
    const c2 = Math.cos(delta);
    const s = Math.sin(delta);
    const a11r = m11r * c2 + m12i * n * s, a11i = m11i * c2 - m12r * n * s;
    const a12r = m11i * (s / n) + m12r * c2, a12i = -m11r * (s / n) + m12i * c2;
    const a21r = m21r * c2 + m22i * n * s, a21i = m21i * c2 - m22r * n * s;
    const a22r = m21i * (s / n) + m22r * c2, a22i = -m21r * (s / n) + m22i * c2;
    m11r = a11r;
    m11i = a11i;
    m12r = a12r;
    m12i = a12i;
    m21r = a21r;
    m21i = a21i;
    m22r = a22r;
    m22i = a22i;
  }
  const n0 = stack.incident;
  const ns = stack.exit;
  const Br = m11r + m12r * ns, Bi = m11i + m12i * ns;
  const Cr = m21r + m22r * ns, Ci = m21i + m22i * ns;
  const dr = n0 * Br + Cr, di = n0 * Bi + Ci;
  const den = dr * dr + di * di;
  const t = [2 * n0 * dr / den, -2 * n0 * di / den];
  const nr = n0 * Br - Cr, ni = n0 * Bi - Ci;
  const r = [(nr * dr + ni * di) / den, (ni * dr - nr * di) / den];
  return { r, t, R: r[0] * r[0] + r[1] * r[1], T: ns / n0 * (t[0] * t[0] + t[1] * t[1]) };
}
function periodicLayers(cell, periods) {
  const out = [];
  for (let p = 0; p < periods; p++) out.push(...cell);
  return out;
}
function quarterWaveCell(nH, nL, lambda0) {
  return [{ n: nH, thickness: lambda0 / (4 * nH) }, { n: nL, thickness: lambda0 / (4 * nL) }];
}

// packages/engine/src/rcwa.ts
function gratingCoefficients(segments, epsIn, epsOut, M) {
  const size = 4 * M + 1;
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  re[2 * M] = epsOut;
  for (const { center, width } of segments) {
    for (let m = -2 * M; m <= 2 * M; m++) {
      if (m === 0) {
        re[2 * M] += (epsIn - epsOut) * width;
        continue;
      }
      const amp = (epsIn - epsOut) * Math.sin(Math.PI * m * width) / (Math.PI * m);
      const ph = -2 * Math.PI * m * center;
      re[m + 2 * M] += amp * Math.cos(ph);
      im[m + 2 * M] += amp * Math.sin(ph);
    }
  }
  return { re, im };
}
function rodRowLayers(radius, epsRod, epsBg, M, slices = 16, center = 0.5) {
  const out = [];
  for (let j = 0; j < slices; j++) {
    const zc = (j + 0.5) / slices - 0.5;
    const half2 = Math.sqrt(Math.max(radius * radius - zc * zc, 0));
    const segments = half2 > 0 ? [{ center, width: 2 * half2 }] : [];
    const { re, im } = gratingCoefficients(segments, epsRod, epsBg, M);
    out.push({ key: `w${(2 * half2).toPrecision(17)}c${center}e${epsRod}/${epsBg}d${1 / slices}`, thickness: 1 / slices, re, im });
  }
  return out;
}
var zeros = (n) => ({ re: new Float64Array(n * n), im: new Float64Array(n * n) });
var mul2 = (a, b, n, p = n) => cmul(a.re, a.im, b.re, b.im, n, n, p);
function sub(a, b) {
  const out = { re: a.re.slice(), im: a.im.slice() };
  for (let k = 0; k < out.re.length; k++) {
    out.re[k] -= b.re[k];
    out.im[k] -= b.im[k];
  }
  return out;
}
function diagMul(dr, di, a, n, cols = n) {
  const o = { re: new Float64Array(n * cols), im: new Float64Array(n * cols) };
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < cols; j++) {
      const ar = a.re[i * cols + j];
      const ai = a.im[i * cols + j];
      o.re[i * cols + j] = dr[i] * ar - di[i] * ai;
      o.im[i * cols + j] = dr[i] * ai + di[i] * ar;
    }
  }
  return o;
}
function hcat2(blocks, n) {
  const w = blocks.length * n;
  const out = { re: new Float64Array(n * w), im: new Float64Array(n * w) };
  blocks.forEach((b, k) => {
    for (let i = 0; i < n; i++) {
      out.re.set(b.re.subarray(i * n, i * n + n), i * w + k * n);
      out.im.set(b.im.subarray(i * n, i * n + n), i * w + k * n);
    }
  });
  return out;
}
function block(z, n, k, count) {
  const w = count * n;
  const out = zeros(n);
  for (let i = 0; i < n; i++) {
    out.re.set(z.re.subarray(i * w + k * n, i * w + k * n + n), i * n);
    out.im.set(z.im.subarray(i * w + k * n, i * w + k * n + n), i * n);
  }
  return out;
}
function harmonics(M, omega, thetaRad, nRef) {
  const n = 2 * M + 1;
  const k0 = 2 * Math.PI * omega;
  const kx = new Float64Array(n);
  const kzRe = new Float64Array(n);
  const kzIm = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    kx[i] = k0 * nRef * Math.sin(thetaRad) + 2 * Math.PI * (i - M);
    const q2 = (k0 * nRef) ** 2 - kx[i] * kx[i];
    if (q2 >= 0) kzRe[i] = Math.sqrt(q2);
    else kzIm[i] = Math.sqrt(-q2);
  }
  return { M, n, k0, kx, kzRe, kzIm };
}
function layerSMatrix(layer, h2, kernel = getKernel()) {
  const { M, n, k0, kx, kzRe, kzIm } = h2;
  const aRe = new Float64Array(n * n);
  const aIm = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      aRe[i * n + j] = k0 * k0 * layer.re[i - j + 2 * M];
      aIm[i * n + j] = k0 * k0 * layer.im[i - j + 2 * M];
    }
    aRe[i * n + i] -= kx[i] * kx[i];
  }
  const eig = kernel.eigHerm(aRe, aIm, n);
  const qRe = new Float64Array(n);
  const qIm = new Float64Array(n);
  const tiny = 1e-12 * k0 * k0;
  for (let i = 0; i < n; i++) {
    let q2 = eig.values[i];
    if (Math.abs(q2) < tiny) q2 = q2 >= 0 ? tiny : -tiny;
    if (q2 >= 0) qRe[i] = Math.sqrt(q2);
    else qIm[i] = Math.sqrt(-q2);
  }
  const wh = zeros(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      wh.re[i * n + j] = eig.vectorsRe[j * n + i];
      wh.im[i * n + j] = -eig.vectorsIm[j * n + i];
    }
  }
  const whKz = zeros(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const ar = wh.re[i * n + j];
      const ai = wh.im[i * n + j];
      whKz.re[i * n + j] = ar * kzRe[j] - ai * kzIm[j];
      whKz.im[i * n + j] = ar * kzIm[j] + ai * kzRe[j];
    }
  }
  const invqRe = new Float64Array(n);
  const invqIm = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const d = qRe[i] * qRe[i] + qIm[i] * qIm[i];
    invqRe[i] = qRe[i] / d;
    invqIm[i] = -qIm[i] / d;
  }
  const viVg = diagMul(invqRe, invqIm, whKz, n);
  const Aa = { re: wh.re.slice(), im: wh.im.slice() };
  const Ba = { re: wh.re.slice(), im: wh.im.slice() };
  for (let k = 0; k < n * n; k++) {
    Aa.re[k] += viVg.re[k];
    Aa.im[k] += viVg.im[k];
    Ba.re[k] -= viVg.re[k];
    Ba.im[k] -= viVg.im[k];
  }
  const xRe = new Float64Array(n);
  const xIm = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const mag = Math.exp(-qIm[i] * layer.thickness);
    xRe[i] = mag * Math.cos(qRe[i] * layer.thickness);
    xIm[i] = mag * Math.sin(qRe[i] * layer.thickness);
  }
  const XBa = diagMul(xRe, xIm, Ba, n);
  const XAa = diagMul(xRe, xIm, Aa, n);
  const rhs1 = hcat2([XBa, XAa, Ba], n);
  const sol1 = csolve(Aa.re, Aa.im, rhs1.re, rhs1.im, n, 3 * n);
  const P1 = block(sol1, n, 0, 3);
  const P2 = block(sol1, n, 1, 3);
  const P3 = block(sol1, n, 2, 3);
  const T1 = sub(Aa, mul2(XBa, P1, n));
  const r11 = sub(mul2(XBa, P2, n), Ba);
  const r12 = diagMul(xRe, xIm, sub(Aa, mul2(Ba, P3, n)), n);
  const rhs2 = hcat2([r11, r12], n);
  const sol2 = csolve(T1.re, T1.im, rhs2.re, rhs2.im, n, 2 * n);
  const s11 = { n, ...block(sol2, n, 0, 2) };
  const s12 = { n, ...block(sol2, n, 1, 2) };
  return { n, s11, s12, s21: s12, s22: s11 };
}
function starPower(s, count, kernel = getKernel()) {
  if (!(Number.isInteger(count) && count >= 1)) throw new RangeError(`count must be a positive integer, got ${count}`);
  let result = null;
  let base = s;
  let k = count;
  while (k > 0) {
    if (k & 1) result = result ? kernel.starProduct(result, base) : base;
    k >>= 1;
    if (k > 0) base = kernel.starProduct(base, base);
  }
  return result;
}
function slabPoint(row, rows, M, omega, thetaRad = 0, nRef = 1, kernel = getKernel()) {
  const h2 = harmonics(M, omega, thetaRad, nRef);
  const cache3 = /* @__PURE__ */ new Map();
  let rowS = null;
  for (const layer of row) {
    let s = cache3.get(layer.key);
    if (!s) {
      s = layerSMatrix(layer, h2, kernel);
      cache3.set(layer.key, s);
    }
    rowS = rowS ? kernel.starProduct(rowS, s) : s;
  }
  const S = starPower(rowS, rows, kernel);
  return pointOf(S, h2, omega);
}
function pointOf(S, h2, omega) {
  const { n, M } = h2;
  const kz0 = h2.kzRe[M];
  let R = 0;
  let T = 0;
  const Tm = [];
  for (let i = 0; i < n; i++) {
    const w = h2.kzRe[i] / kz0;
    const r2 = S.s11.re[i * n + M] ** 2 + S.s11.im[i * n + M] ** 2;
    const t2 = S.s21.re[i * n + M] ** 2 + S.s21.im[i * n + M] ** 2;
    R += w * r2;
    T += w * t2;
    Tm.push(w * t2);
  }
  return { omega, R, T, Tm };
}
var HEX_ROW_SPACING = Math.sqrt(3) / 2;
var HEX_GK_PERIOD = Math.sqrt(3);
var HEX_GK_PLANE_SPACING = 1 / (2 * Math.sqrt(3));
function hexSlabLayout(radius, epsRod, epsBg, M, rows, slices = 16, cut = "GM") {
  if (!(Number.isInteger(rows) && rows >= 1)) throw new RangeError(`rows must be a positive integer, got ${rows}`);
  if (!(radius >= 0 && radius <= 0.5 + 1e-12)) throw new RangeError(`r/a must be in [0, 0.5] for a hexagonal slab, got ${radius}`);
  if (cut === "GK") return staggeredPlanes(radius / HEX_GK_PERIOD, epsRod, epsBg, M, 2 * rows, slices, HEX_GK_PLANE_SPACING, HEX_GK_PERIOD);
  return staggeredPlanes(radius, epsRod, epsBg, M, rows, slices, HEX_ROW_SPACING, 1);
}
function staggeredPlanes(radius, epsRod, epsBg, M, rows, slices, h2, period) {
  const e = Math.max(0, radius - h2 / 2);
  const centres = Array.from({ length: rows }, (_, j2) => [j2 % 2 === 0 ? 0.5 : 0, e + (j2 + 0.5) * h2]);
  const segmentsAt = (j2, u) => {
    const segments = [];
    for (const [dj, dz] of [[-1, u + h2], [0, u], [1, u - h2]]) {
      const row = j2 + dj;
      if (row < 0 || row >= rows || Math.abs(dz) >= radius) continue;
      segments.push({ center: row % 2 === 0 ? 0.5 : 0, width: 2 * Math.sqrt(radius * radius - dz * dz) });
    }
    return segments.sort((a, b) => a.center - b.center);
  };
  const layersOf = (slicesOf) => {
    const out = [];
    let last = "";
    let run = null;
    const flush = () => {
      if (!run) return;
      const { re, im } = gratingCoefficients(run.segments, epsRod, epsBg, M);
      out.push({ key: `hex|${last}|e${epsRod}/${epsBg}|d${run.d.toPrecision(17)}`, thickness: run.d, re, im });
    };
    for (const { j: j2, u, d } of slicesOf) {
      const segments = segmentsAt(j2, u);
      const id = segments.map((g) => `${g.center}:${g.width.toPrecision(17)}`).join(",");
      if (run && id === last) run.d += d;
      else {
        flush();
        run = { segments, d };
        last = id;
      }
    }
    flush();
    return out;
  };
  const nCap = e > 0 ? Math.max(2, Math.ceil(slices * e / h2)) : 0;
  const rowLayers = [];
  for (let j2 = 0; j2 < rows; j2++) {
    const list2 = [];
    if (j2 === 0) for (let c2 = 0; c2 < nCap; c2++) list2.push({ j: 0, u: -h2 / 2 - e + (c2 + 0.5) * e / nCap, d: e / nCap });
    for (let k = 0; k < slices; k++) list2.push({ j: j2, u: (2 * k + 1 - slices) * h2 / (2 * slices), d: h2 / slices });
    if (j2 === rows - 1) for (let c2 = 0; c2 < nCap; c2++) list2.push({ j: rows - 1, u: h2 / 2 + (c2 + 0.5) * e / nCap, d: e / nCap });
    rowLayers.push(layersOf(list2));
  }
  const keyOf = (j2) => rowLayers[j2].map((l) => l.key).join(";");
  const parts = [];
  let j = 0;
  while (j < rows) {
    let k = 0;
    while (j + 2 * k + 3 < rows && keyOf(j + 2 * k + 2) === keyOf(j) && keyOf(j + 2 * k + 3) === keyOf(j + 1)) k++;
    if (k > 0) {
      parts.push({ layers: [...rowLayers[j], ...rowLayers[j + 1]], repeat: k + 1 });
      j += 2 * (k + 1);
    } else {
      parts.push({ layers: rowLayers[j], repeat: 1 });
      j += 1;
    }
  }
  const layers = rowLayers.flat();
  const starts = [];
  let z = 0;
  for (const l of layers) {
    starts.push(z);
    z += l.thickness;
  }
  return { parts, layers, starts, thickness: rows * h2 + 2 * e, rows: centres, period };
}
function layoutPoint(parts, M, omega, thetaRad = 0, nRef = 1, kernel = getKernel()) {
  const h2 = harmonics(M, omega, thetaRad, nRef);
  const cache3 = /* @__PURE__ */ new Map();
  let total = null;
  for (const part of parts) {
    let unit = null;
    for (const layer of part.layers) {
      let s = cache3.get(layer.key);
      if (!s) {
        s = layerSMatrix(layer, h2, kernel);
        cache3.set(layer.key, s);
      }
      unit = unit ? kernel.starProduct(unit, s) : s;
    }
    const S = starPower(unit, part.repeat, kernel);
    total = total ? kernel.starProduct(total, S) : S;
  }
  return pointOf(total, h2, omega);
}
function hexPoint(layout, M, omega, thetaRad = 0, nRef = 1, kernel = getKernel()) {
  if (layout.period === 1) return layoutPoint(layout.parts, M, omega, thetaRad, nRef, kernel);
  return { ...layoutPoint(layout.parts, M, omega * layout.period, thetaRad, nRef, kernel), omega };
}

// packages/engine/src/isofreq.ts
var SQ2 = Math.SQRT1_2;
var U = [SQ2, SQ2];
var V = [SQ2, -SQ2];
var GAMMA_M = Math.PI * Math.SQRT2;
function bandAt(eps, k, pol, band, kernel = getKernel()) {
  return frequenciesAt(eps, k, pol, band + 1, kernel)[band];
}
function curvatureAlongGM(eps, pol, band, opts = {}, kernel = getKernel()) {
  if (eps.lattice.kind !== "square") throw new RangeError("curvature along \u0393\u2013M is defined for the square lattice");
  const n = opts.n ?? 47;
  const d = opts.d ?? 0.02;
  const from = opts.from ?? 0.04;
  const to = opts.to ?? 0.96;
  const out = { sOverGM: [], omega: [], omegaPar: [], omegaPerp2: [], omegaPar2: [], D: [] };
  for (let i = 0; i < n; i++) {
    const frac = n === 1 ? from : from + (to - from) * i / (n - 1);
    const s = frac * GAMMA_M;
    const c2 = [s * U[0], s * U[1]];
    const at = (du, dv) => bandAt(eps, [c2[0] + du * U[0] + dv * V[0], c2[1] + du * U[1] + dv * V[1]], pol, band, kernel);
    const w0 = at(0, 0);
    const wp = at(d, 0);
    const wm = at(-d, 0);
    const wtp = at(0, d);
    const wtm = at(0, -d);
    const par = (wp - wm) / (2 * d);
    const perp2 = (wtp - 2 * w0 + wtm) / (d * d);
    out.sOverGM.push(frac);
    out.omega.push(w0);
    out.omegaPar.push(par);
    out.omegaPerp2.push(perp2);
    out.omegaPar2.push((wp - 2 * w0 + wm) / (d * d));
    out.D.push(perp2 / par);
  }
  return out;
}
function selfCollimationPoints(c2) {
  const out = [];
  for (let i = 0; i < c2.sOverGM.length - 1; i++) {
    const y0 = c2.omegaPerp2[i];
    const y1 = c2.omegaPerp2[i + 1];
    if (y0 * y1 < 0) {
      const t = y0 / (y0 - y1);
      const s = c2.sOverGM[i] + t * (c2.sOverGM[i + 1] - c2.sOverGM[i]);
      const omega = c2.omega[i] + t * (c2.omega[i + 1] - c2.omega[i]);
      let j = 0;
      c2.sOverGM.forEach((x, k) => {
        if (Math.abs(x - s) < Math.abs(c2.sOverGM[j] - s)) j = k;
      });
      out.push({ sOverGM: s, omega, omegaPar: c2.omegaPar[j], groupVelocity: 2 * Math.PI * c2.omegaPar[j] });
    }
  }
  return out;
}
function contourFlatness(eps, pol, band, omega0, tmax = 1, nt = 11, kernel = getKernel()) {
  const t = [];
  const kPar = [];
  for (let i = 0; i < nt; i++) {
    const ti = nt === 1 ? 0 : tmax * i / (nt - 1);
    const f = (s) => bandAt(eps, [s * U[0] + ti * V[0], s * U[1] + ti * V[1]], pol, band, kernel) - omega0;
    const lo = 0.02 * GAMMA_M;
    const hi = 0.98 * GAMMA_M;
    let a = lo;
    let b = hi;
    let fa;
    let fb;
    const prevRoot = kPar.length ? kPar[kPar.length - 1] : NaN;
    const local = Number.isNaN(prevRoot) ? null : [Math.max(lo, prevRoot - 0.01 * GAMMA_M), Math.min(hi, prevRoot + 0.03 * GAMMA_M)];
    if (local) {
      a = local[0];
      b = local[1];
      fa = f(a);
      fb = f(b);
      if (fa * fb > 0) {
        a = lo;
        b = hi;
        fa = f(a);
        fb = f(b);
      }
    } else {
      fa = f(a);
      fb = f(b);
    }
    let root;
    if (fa * fb > 0) {
      root = Math.abs(fa) < Math.abs(fb) ? a : b;
    } else {
      let side = 0;
      root = a;
      let prev = Infinity;
      for (let it = 0; it < 100; it++) {
        const c2 = (a * fb - b * fa) / (fb - fa);
        if (Math.abs(c2 - prev) < 1e-12) {
          root = c2;
          break;
        }
        prev = c2;
        const fc = f(c2);
        root = c2;
        if (fc === 0) break;
        if (fc * fb > 0) {
          b = c2;
          fb = fc;
          if (side === -1) fa /= 2;
          side = -1;
        } else {
          a = c2;
          fa = fc;
          if (side === 1) fb /= 2;
          side = 1;
        }
        if (Math.abs(b - a) < 1e-12) break;
      }
    }
    t.push(ti);
    kPar.push(root);
  }
  const kParOverGM = kPar.map((k) => k / GAMMA_M);
  let flat = 0;
  t.forEach((ti, i) => {
    if (Math.abs(kPar[i] - kPar[0]) / GAMMA_M < 0.01) flat = Math.max(flat, ti);
  });
  return { t, kPar, kParOverGM, flatHalfWidth: flat };
}
function pointGroup(kind) {
  const ops = [];
  const n = kind === "square" ? 4 : 6;
  for (let j = 0; j < n; j++) {
    const th = 2 * Math.PI * j / n;
    const c2 = Math.cos(th);
    const s = Math.sin(th);
    ops.push([c2, -s, s, c2]);
    ops.push([c2, s, s, -c2]);
  }
  return ops;
}
function foldToZone(kind, k) {
  const L = lattice(kind);
  let best = k;
  let bestN = Math.hypot(k[0], k[1]);
  for (let m = -2; m <= 2; m++) {
    for (let n = -2; n <= 2; n++) {
      const q2 = [k[0] - m * L.b1[0] - n * L.b2[0], k[1] - m * L.b1[1] - n * L.b2[1]];
      const nq = Math.hypot(q2[0], q2[1]);
      if (nq < bestN - 1e-12) {
        best = q2;
        bestN = nq;
      }
    }
  }
  return best;
}
function inZone(kind, k) {
  const f = foldToZone(kind, k);
  return Math.abs(f[0] - k[0]) < 1e-9 && Math.abs(f[1] - k[1]) < 1e-9;
}
function wedgeKey(kind, k) {
  const f = foldToZone(kind, k);
  let bestK = f;
  let bestScore = -Infinity;
  for (const [a, b, c2, d] of pointGroup(kind)) {
    const q2 = [a * f[0] + b * f[1], c2 * f[0] + d * f[1]];
    const inWedge = kind === "square" ? q2[1] >= -1e-12 && q2[0] >= q2[1] - 1e-12 : q2[0] >= -1e-12 && q2[1] >= Math.sqrt(3) * q2[0] - 1e-12;
    if (!inWedge) continue;
    const score = kind === "square" ? q2[0] * 1e6 + q2[1] : q2[1] * 1e6 + q2[0];
    if (score > bestScore) {
      bestScore = score;
      bestK = q2;
    }
  }
  const r = (x) => (Math.abs(x) < 5e-10 ? 0 : x).toFixed(9);
  return { key: `${r(bestK[0])},${r(bestK[1])}`, k: bestK };
}
function isofreqGrid(kind, nk = 41) {
  const L = lattice(kind);
  const kmaxX = kind === "square" ? Math.PI : 4 * Math.PI / 3;
  const kmaxY = kind === "square" ? Math.PI : Math.hypot(L.b2[0], L.b2[1]) / 2;
  const kx = Array.from({ length: nk }, (_, i) => -kmaxX + 2 * kmaxX * i / (nk - 1));
  const ky = Array.from({ length: nk }, (_, i) => -kmaxY + 2 * kmaxY * i / (nk - 1));
  const keys = [];
  const wedge = /* @__PURE__ */ new Map();
  for (let iy = 0; iy < nk; iy++) {
    for (let ix = 0; ix < nk; ix++) {
      const k = [kx[ix], ky[iy]];
      if (!inZone(kind, k)) {
        keys.push("");
        continue;
      }
      const w = wedgeKey(kind, k);
      keys.push(w.key);
      if (!wedge.has(w.key)) wedge.set(w.key, w.k);
    }
  }
  return { kx, ky, keys, wedge };
}
function* isofreqStream(req, kernel = getKernel()) {
  const nk = req.nk ?? 41;
  const nb = req.nBands ?? 2;
  const eps = inverseEpsilon(req.structure, req.M);
  const { kx, ky, keys, wedge } = isofreqGrid(req.structure.lattice, nk);
  const values = /* @__PURE__ */ new Map();
  let done = 0;
  for (const [key, k] of wedge) {
    const f = Array.from(frequenciesAt(eps, k, req.polarisation, nb, kernel));
    values.set(key, f);
    done++;
    yield { done, total: wedge.size, k, frequencies: f };
  }
  const bands = Array.from({ length: nb }, (_, b) => keys.map((key) => key ? values.get(key)[b] : NaN));
  return { nk, kx, ky, bands, solved: wedge.size };
}
function traceContour(kx, ky, values, level2) {
  const nx = kx.length;
  const ny = ky.length;
  const segs = [];
  const v = (ix, iy) => values[iy * nx + ix];
  const lerp = (a, b, fa, fb) => a + (level2 - fa) / (fb - fa) * (b - a);
  for (let iy = 0; iy < ny - 1; iy++) {
    for (let ix = 0; ix < nx - 1; ix++) {
      const f00 = v(ix, iy), f10 = v(ix + 1, iy), f11 = v(ix + 1, iy + 1), f01 = v(ix, iy + 1);
      if ([f00, f10, f11, f01].some(Number.isNaN)) continue;
      const x0 = kx[ix], x1 = kx[ix + 1], y0 = ky[iy], y1 = ky[iy + 1];
      const pts = [];
      if (f00 < level2 !== f10 < level2) pts.push([lerp(x0, x1, f00, f10), y0]);
      if (f10 < level2 !== f11 < level2) pts.push([x1, lerp(y0, y1, f10, f11)]);
      if (f01 < level2 !== f11 < level2) pts.push([lerp(x0, x1, f01, f11), y1]);
      if (f00 < level2 !== f01 < level2) pts.push([x0, lerp(y0, y1, f00, f01)]);
      if (pts.length === 2) segs.push([pts[0], pts[1]]);
      else if (pts.length === 4) {
        const centre = (f00 + f10 + f11 + f01) / 4;
        if (centre < level2 === f00 < level2) {
          segs.push([pts[0], pts[1]], [pts[2], pts[3]]);
        } else {
          segs.push([pts[0], pts[3]], [pts[1], pts[2]]);
        }
      }
    }
  }
  return segs;
}

// packages/engine/src/hash.ts
function canonicalJson(value) {
  if (value === null || value === void 0) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? JSON.stringify(value) : JSON.stringify(String(value));
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (ArrayBuffer.isView(value)) return canonicalJson(Array.from(value));
  if (Array.isArray(value)) return `[${value.map((v) => canonicalJson(v)).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([, v]) => v !== void 0 && typeof v !== "function").sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  throw new TypeError(`cannot serialise ${typeof value}`);
}
var K = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
function sha256Bytes(data) {
  const h2 = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]);
  const len = data.length;
  const total = Math.ceil((len + 9) / 64) * 64;
  const buf = new Uint8Array(total);
  buf.set(data);
  buf[len] = 128;
  const bits = len * 8;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, Math.floor(bits / 2 ** 32));
  dv.setUint32(total - 4, bits >>> 0);
  const w = new Uint32Array(64);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + 4 * i);
    for (let i = 16; i < 64; i++) {
      const a2 = w[i - 15], b2 = w[i - 2];
      const s0 = (a2 >>> 7 | a2 << 25) ^ (a2 >>> 18 | a2 << 14) ^ a2 >>> 3;
      const s1 = (b2 >>> 17 | b2 << 15) ^ (b2 >>> 19 | b2 << 13) ^ b2 >>> 10;
      w[i] = w[i - 16] + s0 + w[i - 7] + s1 >>> 0;
    }
    let [a, b, c2, d, e, f, g, hh] = h2;
    for (let i = 0; i < 64; i++) {
      const S1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
      const ch = e & f ^ ~e & g;
      const t1 = hh + S1 + ch + K[i] + w[i] >>> 0;
      const S0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
      const maj = a & b ^ a & c2 ^ b & c2;
      const t2 = S0 + maj >>> 0;
      hh = g;
      g = f;
      f = e;
      e = d + t1 >>> 0;
      d = c2;
      c2 = b;
      b = a;
      a = t1 + t2 >>> 0;
    }
    h2[0] += a;
    h2[1] += b;
    h2[2] += c2;
    h2[3] += d;
    h2[4] += e;
    h2[5] += f;
    h2[6] += g;
    h2[7] += hh;
  }
  return Array.from(h2, (x) => x.toString(16).padStart(8, "0")).join("");
}
var sha256 = (text) => sha256Bytes(new TextEncoder().encode(text));
var hashOf = (value) => sha256(canonicalJson(value));
function base64urlEncode(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// packages/engine/src/trust.ts
function level(value, green, amber) {
  if (!Number.isFinite(value)) return "red";
  return value < green ? "green" : value < amber ? "amber" : "red";
}
var sci = (x) => x === 0 ? "0" : x.toExponential(1);
function fillFactorRow(s) {
  const F = fillFraction(lattice(s.lattice), s.radius);
  const greenBelow = s.lattice === "square" ? 0.78 : 0.9;
  const lvl = s.radius > 0.5 + 1e-12 ? "red" : F < greenBelow ? "green" : "amber";
  return {
    id: "pwe-fill",
    label: "Fill factor F",
    value: F,
    display: F.toFixed(3),
    level: lvl,
    detail: lvl === "red" ? "inclusions overlap (r > a/2): refused" : `green below ${greenBelow} (${s.lattice}); amber when the inclusions touch (r = a/2)`
  };
}
function structureProblem(s) {
  if (!(s.radius >= 0)) return "the radius must be \u2265 0";
  if (s.radius > 0.5 + 1e-12) return "the inclusions overlap (r > a/2)";
  if (!(s.epsIn > 0 && s.epsOut > 0)) return "permittivities must be positive";
  return null;
}
function gammaZeroRow(lowestEigenvalue) {
  const v = Math.abs(lowestEigenvalue);
  return {
    id: "pwe-gamma",
    label: "Lowest eigenvalue at \u0393",
    value: v,
    display: sci(v),
    level: level(v, 1e-10, 1e-6),
    detail: "must be 0 (the uniform field); green below 1e-10, amber below 1e-6"
  };
}
function gapRuleRow(hidden) {
  return {
    id: "pwe-gap-rule",
    label: "Gaps narrower than 1e-3",
    value: hidden,
    display: hidden === 0 ? "none" : `${hidden} hidden`,
    level: "info",
    detail: "a band separation below 1e-3 \xB7 \u03C9 is a degeneracy, not a gap, and is not shown as one"
  };
}
function bandEdges(bands) {
  const col = (j) => bands.map((r) => r[j]);
  return [Math.max(...col(0)), Math.min(...col(1)), Math.max(...col(1)), Math.min(...col(2))];
}
function pweConvergenceRow(edges, edgesMore, M) {
  if (!edges || !edgesMore) {
    return {
      id: "pwe-conv",
      label: `Band edges, M \u2192 M + 3`,
      value: null,
      display: "not run",
      level: "info",
      detail: "press \u201CCheck convergence\u201D to rerun with M + 3"
    };
  }
  const v = Math.max(...edges.map((e, i) => Math.abs(edgesMore[i] - e) / Math.abs(edgesMore[i])));
  return {
    id: "pwe-conv",
    label: `Band edges, M = ${M} \u2192 ${M + 3}`,
    value: v,
    display: sci(v),
    level: level(v, 1e-3, 0.01),
    detail: "largest relative change of the 4 lowest band edges; green below 1e-3, amber below 1e-2"
  };
}
function energyRow(points) {
  const v = points.reduce((m, p) => Math.max(m, Math.abs(p.R + p.T - 1)), 0);
  return {
    id: "rcwa-energy",
    label: "R + T \u2212 1",
    value: v,
    display: sci(v),
    level: level(v, 1e-10, 1e-6),
    detail: "energy conservation of the lossless slab, max over the spectrum; green below 1e-10, amber below 1e-6"
  };
}
function slicesRow(t, tMore) {
  if (!t || !tMore) {
    return {
      id: "rcwa-slices",
      label: "T, 16 \u2192 32 slices",
      value: null,
      display: "not run",
      level: "info",
      detail: "press \u201CCheck convergence\u201D to rerun three frequencies with 32 slices per row"
    };
  }
  const v = Math.max(...t.map((x, i) => Math.abs(tMore[i] - x) / Math.abs(tMore[i])));
  return {
    id: "rcwa-slices",
    label: "T, 16 \u2192 32 slices",
    value: v,
    display: `${(100 * v).toFixed(2)} %`,
    level: level(v, 0.02, 0.1),
    detail: "staircase error: largest relative change of T at three frequencies; green below 2 %, amber below 10 %"
  };
}
function harmonicsRow(t, tMore, M) {
  if (!t || !tMore) {
    return {
      id: "rcwa-harmonics",
      label: "T, M \u2192 M + 4",
      value: null,
      display: "not run",
      level: "info",
      detail: "press \u201CCheck convergence\u201D to rerun three frequencies with M + 4 harmonics"
    };
  }
  const v = Math.max(...t.map((x, i) => Math.abs(tMore[i] - x) / Math.abs(tMore[i])));
  return {
    id: "rcwa-harmonics",
    label: `T, M = ${M} \u2192 ${M + 4}`,
    value: v,
    display: sci(v),
    level: level(v, 1e-3, 0.01),
    detail: "truncation error: largest relative change of T at three frequencies; green below 1e-3, amber below 1e-2"
  };
}
function couplingRow(f) {
  return {
    id: "par-f",
    label: "Coupling f",
    value: f,
    display: f.toPrecision(3),
    level: level(f, 0.06, 0.6),
    detail: "paraxial validity against full-wave RCWA (SPEC \xA73.10): green below 0.06, amber below 0.6, red above: outside the validated range"
  };
}
function obliquityRow(kxOverK) {
  return {
    id: "par-kx",
    label: "Largest |k\u2093|/k",
    value: kxOverK,
    display: kxOverK.toFixed(3),
    level: level(kxOverK, 0.2, 0.4),
    detail: "steepest wave on the angular grid; the paraxial equation assumes |k\u2093| \u226A k: green below 0.2, amber below 0.4"
  };
}
function modalEnergyRow(err) {
  return {
    id: "par-energy",
    label: "Energy conservation",
    value: err,
    display: sci(err),
    level: level(err, 1e-9, 1e-6),
    detail: "max |\u03A3|A_l|\xB2 \u2212 1| of the modal solver over the angles; green below 1e-9, amber below 1e-6"
  };
}
function paraxialConvergenceRow(diff) {
  if (diff === null) {
    return {
      id: "par-conv",
      label: "T0, n_l + 2 and dZ / 4",
      value: null,
      display: "not run",
      level: "info",
      detail: "press \u201CCheck convergence\u201D to rerun with two more harmonics and a quarter of the step"
    };
  }
  return {
    id: "par-conv",
    label: "T0, n_l + 2 and dZ / 4",
    value: diff,
    display: sci(diff),
    level: level(diff, 1e-6, 1e-3),
    detail: "largest change of T0 over the angles; green below 1e-6, amber below 1e-3"
  };
}

// packages/engine/src/state.ts
var VIEWS = ["crystal", "bands", "gapmap", "isofreq", "slab", "filter"];
var SWEEP_PARAMS = ["dPerpUm", "dnRel", "N", "chirpSpan"];
var DEFAULT_STATE = {
  v: 1,
  view: "crystal",
  mode: "2d",
  stack: { nH: 2.3, nL: 1.45, lambda0Nm: 1e3, dHNm: null, dLNm: null, periods: 20, incident: 1, exit: 1 },
  gapmap: { param: "radius", from: 0.05, to: 0.5, count: 32, M: 5 },
  structure: { lattice: "square", radius: 0.2, epsIn: 8.9, epsOut: 1 },
  polarisation: "both",
  M: 7,
  latticeConstantNm: null,
  isofreq: { band: 1, nk: 41, omega: null },
  slab: { rows: 8, thetaDeg: 0, nRef: 1, omegaMin: 0.2, omegaMax: 0.55, points: 141, harmonics: 12, slices: 16 },
  // Gailevičius, Purlys & Staliunas 2019 (SPEC §3.8): N-BK7 at 633 nm, d⊥ = 3 µm, chirp 1.2 → 2.0, 30 periods, f = 0.05
  filter: {
    n0: 1.515,
    lambdaNm: 633,
    dPerpUm: 3,
    Q0: 1.2,
    Q1: 2,
    dnRel: 0.0019397226851398,
    N: 30,
    outside: true,
    voxel: null,
    beam: { sigmaX: 40, noiseRms: 0.6, noiseWidth: 0.25, seed: 1, aperture: 0.6 },
    sweep: { param: "dnRel", values: [5e-4, 1e-3, 15e-4, 2e-3, 3e-3, 5e-3] }
  }
};
var LIMITS = {
  radius: [0, 0.5],
  eps: [1, 30],
  M: [2, 15],
  latticeConstantNm: [1, 1e7],
  band: [1, 4],
  nk: [21, 61],
  omega: [5e-3, 1.5],
  rows: [1, 32],
  thetaDeg: [0, 85],
  nRef: [1, 4],
  points: [8, 256],
  harmonics: [2, 20],
  slices: [4, 32],
  n0: [1, 4],
  lambdaNm: [100, 2e4],
  dPerpUm: [0.2, 200],
  Q: [0.05, 20],
  dnRel: [1e-6, 0.5],
  N: [1, 2e3],
  nStack: [1, 5],
  lambda0Nm: [100, 2e4],
  dNm: [0, 1e6],
  periods: [1, 200],
  gmCount: [2, 32],
  gmM: [2, 10],
  gmEps: [1, 30],
  dnPeak: [1e-6, 0.5],
  duty: [0.01, 0.99],
  sigmaX: [5, 200],
  noiseRms: [0, 2],
  noiseWidth: [0.01, 1],
  seed: [0, 4294967295],
  aperture: [0.05, 1.9]
};
var clamp = (x, [lo, hi], fallback, integer = false) => {
  const n = typeof x === "number" ? x : typeof x === "string" ? Number(x) : NaN;
  if (!Number.isFinite(n)) return fallback;
  const c2 = Math.min(hi, Math.max(lo, n));
  return integer ? Math.round(c2) : c2;
};
var pick = (x, options, fallback) => options.includes(x) ? x : fallback;
var obj = (x) => x && typeof x === "object" ? x : {};
function normaliseState(raw) {
  const r = obj(raw);
  const d = DEFAULT_STATE;
  const s = obj(r.structure);
  const iso = obj(r.isofreq);
  const sl = obj(r.slab);
  const omegaMin = clamp(sl.omegaMin, LIMITS.omega, d.slab.omegaMin);
  let omegaMax = clamp(sl.omegaMax, LIMITS.omega, d.slab.omegaMax);
  if (!(omegaMax > omegaMin)) omegaMax = Math.min(LIMITS.omega[1], omegaMin + 0.1);
  const nk = clamp(iso.nk, LIMITS.nk, d.isofreq.nk, true);
  const st = obj(r.stack);
  const gm = obj(r.gapmap);
  const gmParam = pick(gm.param, ["radius", "epsIn"], d.gapmap.param);
  const gmRange = gmParam === "radius" ? LIMITS.radius : LIMITS.gmEps;
  const gmDefaults = gmParam === d.gapmap.param ? d.gapmap : { ...d.gapmap, from: 2, to: 14 };
  let gmFrom = clamp(gm.from, gmRange, gmDefaults.from);
  let gmTo = clamp(gm.to, gmRange, gmDefaults.to);
  if (gmTo < gmFrom) [gmFrom, gmTo] = [gmTo, gmFrom];
  if (gmTo === gmFrom) gmTo = Math.min(gmRange[1], gmFrom + (gmParam === "radius" ? 0.05 : 1));
  const dNull = (x) => x === null || x === void 0 ? null : clamp(x, LIMITS.dNm, 100);
  const fl = obj(r.filter);
  const fd = d.filter;
  const vx = fl.voxel === null || fl.voxel === void 0 ? null : obj(fl.voxel);
  const bm = obj(fl.beam);
  const sw = obj(fl.sweep);
  const swParam = pick(sw.param, SWEEP_PARAMS, fd.sweep.param);
  const swValues = Array.isArray(sw.values) ? sw.values.map(Number).filter(Number.isFinite).slice(0, 16) : [...fd.sweep.values];
  return {
    v: 1,
    view: pick(r.view, VIEWS, d.view),
    mode: pick(r.mode, ["2d", "1d"], d.mode),
    stack: {
      nH: clamp(st.nH, LIMITS.nStack, d.stack.nH),
      nL: clamp(st.nL, LIMITS.nStack, d.stack.nL),
      lambda0Nm: clamp(st.lambda0Nm, LIMITS.lambda0Nm, d.stack.lambda0Nm),
      dHNm: dNull(st.dHNm),
      dLNm: dNull(st.dLNm),
      periods: clamp(st.periods, LIMITS.periods, d.stack.periods, true),
      incident: clamp(st.incident, LIMITS.nStack, d.stack.incident),
      exit: clamp(st.exit, LIMITS.nStack, d.stack.exit)
    },
    gapmap: { param: gmParam, from: gmFrom, to: gmTo, count: clamp(gm.count, LIMITS.gmCount, d.gapmap.count, true), M: clamp(gm.M, LIMITS.gmM, d.gapmap.M, true) },
    structure: {
      lattice: pick(s.lattice, ["square", "hex"], d.structure.lattice),
      radius: clamp(s.radius, LIMITS.radius, d.structure.radius),
      epsIn: clamp(s.epsIn, LIMITS.eps, d.structure.epsIn),
      epsOut: clamp(s.epsOut, LIMITS.eps, d.structure.epsOut)
    },
    polarisation: pick(r.polarisation, ["TM", "TE", "both"], d.polarisation),
    M: clamp(r.M, LIMITS.M, d.M, true),
    latticeConstantNm: r.latticeConstantNm === null || r.latticeConstantNm === void 0 ? null : clamp(r.latticeConstantNm, LIMITS.latticeConstantNm, 500),
    isofreq: {
      band: clamp(iso.band, LIMITS.band, d.isofreq.band, true),
      nk: nk % 2 === 1 ? nk : nk + 1,
      omega: iso.omega === null || iso.omega === void 0 ? null : clamp(iso.omega, LIMITS.omega, 0.3)
    },
    slab: {
      rows: clamp(sl.rows, LIMITS.rows, d.slab.rows, true),
      thetaDeg: clamp(sl.thetaDeg, LIMITS.thetaDeg, d.slab.thetaDeg),
      nRef: clamp(sl.nRef, LIMITS.nRef, d.slab.nRef),
      omegaMin,
      omegaMax,
      points: clamp(sl.points, LIMITS.points, d.slab.points, true),
      harmonics: clamp(sl.harmonics, LIMITS.harmonics, d.slab.harmonics, true),
      slices: clamp(sl.slices, LIMITS.slices, d.slab.slices, true),
      ...sl.cut === "GK" && s.lattice === "hex" ? { cut: "GK" } : {}
    },
    filter: {
      n0: clamp(fl.n0, LIMITS.n0, fd.n0),
      lambdaNm: clamp(fl.lambdaNm, LIMITS.lambdaNm, fd.lambdaNm),
      dPerpUm: clamp(fl.dPerpUm, LIMITS.dPerpUm, fd.dPerpUm),
      Q0: clamp(fl.Q0, LIMITS.Q, fd.Q0),
      Q1: clamp(fl.Q1, LIMITS.Q, fd.Q1),
      dnRel: clamp(fl.dnRel, LIMITS.dnRel, fd.dnRel),
      N: clamp(fl.N, LIMITS.N, fd.N, true),
      outside: typeof fl.outside === "boolean" ? fl.outside : fd.outside,
      voxel: vx ? { dnPeak: clamp(vx.dnPeak, LIMITS.dnPeak, 5e-3), dutyX: clamp(vx.dutyX, LIMITS.duty, 0.5), dutyZ: clamp(vx.dutyZ, LIMITS.duty, 0.256) } : null,
      beam: {
        sigmaX: clamp(bm.sigmaX, LIMITS.sigmaX, fd.beam.sigmaX),
        noiseRms: clamp(bm.noiseRms, LIMITS.noiseRms, fd.beam.noiseRms),
        noiseWidth: clamp(bm.noiseWidth, LIMITS.noiseWidth, fd.beam.noiseWidth),
        seed: clamp(bm.seed, LIMITS.seed, fd.beam.seed, true),
        aperture: clamp(bm.aperture, LIMITS.aperture, fd.beam.aperture)
      },
      sweep: { param: swParam, values: swValues.length ? swValues : [...fd.sweep.values] }
    }
  };
}
function encodeState(state) {
  return base64urlEncode(canonicalJson(normaliseState(state)));
}
function stateQuery(state) {
  const enc = encodeState(state);
  return enc === encodeState(DEFAULT_STATE) ? "" : `s=${enc}`;
}

// packages/engine/src/solve.ts
function assertStructure(s) {
  const problem = structureProblem(s);
  if (problem) throw new RangeError(problem);
}
function withHash(body) {
  return { ...body, hash: hashOf(body) };
}
function solveIsofreq(state, opts = {}) {
  const kernel = opts.kernel ?? getKernel();
  assertStructure(state.structure);
  const pol = state.polarisation === "TE" ? "TE" : "TM";
  const band = state.isofreq.band - 1;
  const req = { structure: state.structure, polarisation: pol, M: state.M, nBands: Math.max(2, band + 1), nk: state.isofreq.nk };
  const it = isofreqStream(req, kernel);
  let map;
  for (; ; ) {
    const r = it.next();
    if (r.done) {
      map = r.value;
      break;
    }
    opts.onProgress?.({ phase: "map", ...r.value });
  }
  let curvature = null;
  let sc = [];
  let flatness = null;
  if (state.structure.lattice === "square") {
    const eps = inverseEpsilon(state.structure, state.M);
    const n = 47;
    const parts = [];
    for (let i = 0; i < n; i++) {
      const frac = 0.04 + 0.92 * i / (n - 1);
      parts.push(curvatureAlongGM(eps, pol, band, { n: 1, from: frac, to: frac }, kernel));
      opts.onProgress?.({ phase: "curvature", done: i + 1, total: n });
    }
    curvature = {
      sOverGM: parts.flatMap((p) => p.sOverGM),
      omega: parts.flatMap((p) => p.omega),
      omegaPar: parts.flatMap((p) => p.omegaPar),
      omegaPerp2: parts.flatMap((p) => p.omegaPerp2),
      omegaPar2: parts.flatMap((p) => p.omegaPar2),
      D: parts.flatMap((p) => p.D)
    };
    sc = selfCollimationPoints(curvature);
    if (sc.length) {
      flatness = contourFlatness(eps, pol, band, sc[0].omega, 1, 11, kernel);
      opts.onProgress?.({ phase: "flatness", done: 1, total: 1 });
    }
  }
  const values = map.bands[band];
  const finite = values.filter(Number.isFinite);
  const level2 = state.isofreq.omega ?? sc[0]?.omega ?? 0.5 * (Math.min(...finite) + Math.max(...finite));
  return withHash({
    kind: "isofreq",
    request: { structure: state.structure, polarisation: pol, M: state.M, band: state.isofreq.band, nk: state.isofreq.nk, omega: state.isofreq.omega },
    engineVersion: ENGINE_VERSION,
    kernel: kernel.name,
    map,
    curvature,
    selfCollimation: sc,
    flatness,
    level: level2,
    contour: traceContour(map.kx, map.ky, values, level2),
    trust: [fillFactorRow(state.structure)]
  });
}
function projectedAllowed(eps, kx, omega, pol = "TM", nkz = 25, nBands = 4, kernel = getKernel(), kzMax = Math.PI) {
  let kxf = (kx % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  kxf = Math.min(kxf, 2 * Math.PI - kxf);
  const rows = [];
  for (let j = 0; j < nkz; j++) rows.push(Array.from(frequenciesAt(eps, [kxf, kzMax * j / (nkz - 1)], pol, nBands, kernel)));
  return bandsReach(rows, nBands, omega);
}
function bandsReach(rows, nBands, omega) {
  for (let b = 0; b < nBands; b++) {
    const col = rows.map((r) => r[b]);
    if (col.some((v) => Math.abs(v - omega) <= 2e-3)) return true;
    if (Math.min(...col) <= omega && Math.max(...col) >= omega) return true;
  }
  return false;
}
function projectedAllowedGK(eps, kpar, omega, pol = "TM", nk = 25, nBands = 6, kernel = getKernel()) {
  const period = 2 * Math.PI / Math.sqrt(3);
  let kf = (kpar % period + period) % period;
  kf = Math.min(kf, period - kf);
  const rows = [];
  for (let j = 0; j < nk; j++) rows.push(Array.from(frequenciesAt(eps, [2 * Math.PI * j / (nk - 1), kf], pol, nBands, kernel)));
  return bandsReach(rows, nBands, omega);
}
function slabCut(state) {
  return state.structure.lattice === "hex" && state.slab.cut === "GK" ? "GK" : "GM";
}
function slabSettings(state) {
  const sl = state.slab;
  if (sl.cut === void 0 || sl.cut === "GK" && slabCut(state) === "GK") return sl;
  const { cut: _cut, ...rest } = sl;
  return rest;
}
var linspace = (a, b, n) => Array.from({ length: n }, (_, i) => n === 1 ? a : a + (b - a) * i / (n - 1));
var OVERLAY_M = 5;
var OVERLAY_POINTS = 57;
var OVERLAY_GK_STEPS = 25;
function projectedForbidden(s, sl, theta, kernel, eps, onPoint, cut = "GM") {
  const grid = linspace(sl.omegaMin, sl.omegaMax, OVERLAY_POINTS);
  const allowed = grid.map((w, i) => {
    const a = s.lattice === "hex" ? cut === "GK" ? projectedAllowedGK(eps, 2 * Math.PI * w * sl.nRef * Math.sin(theta), w, "TM", OVERLAY_GK_STEPS, 6, kernel) : projectedAllowed(eps, 2 * Math.PI * w * sl.nRef * Math.sin(theta), w, "TM", 17, 6, kernel, 2 * Math.PI / Math.sqrt(3)) : projectedAllowed(eps, 2 * Math.PI * w * sl.nRef * Math.sin(theta), w, "TM", 17, 6, kernel);
    onPoint?.(i + 1, grid.length);
    return a;
  });
  const forbidden = [];
  let start = null;
  grid.forEach((w, i) => {
    if (!allowed[i] && start === null) start = w;
    if (allowed[i] && start !== null) {
      forbidden.push([start, grid[i - 1]]);
      start = null;
    }
  });
  if (start !== null) forbidden.push([start, grid[grid.length - 1]]);
  return forbidden;
}
function slabSolver(state, kernel) {
  const s = state.structure;
  const sl = state.slab;
  if (s.lattice === "hex") {
    const layout = hexSlabLayout(s.radius, s.epsIn, s.epsOut, sl.harmonics, sl.rows, sl.slices, slabCut(state));
    return (w, theta) => hexPoint(layout, sl.harmonics, w, theta, sl.nRef, kernel);
  }
  const row = rodRowLayers(s.radius, s.epsIn, s.epsOut, sl.harmonics, sl.slices);
  return (w, theta) => slabPoint(row, sl.rows, sl.harmonics, w, theta, sl.nRef, kernel);
}
function solveSlab(state, opts = {}) {
  const kernel = opts.kernel ?? getKernel();
  const s = state.structure;
  assertStructure(s);
  const sl = slabSettings(state);
  const theta = sl.thetaDeg * Math.PI / 180;
  const at = slabSolver(state, kernel);
  const omegas = linspace(sl.omegaMin, sl.omegaMax, sl.points);
  const points = [];
  omegas.forEach((w, i) => {
    const p = at(w, theta);
    points.push(p);
    opts.onProgress?.({ phase: "spectrum", done: i + 1, total: omegas.length, point: p });
  });
  const forbidden = projectedForbidden(
    s,
    sl,
    theta,
    kernel,
    inverseEpsilon(s, OVERLAY_M),
    (done, total) => opts.onProgress?.({ phase: "overlay", done, total }),
    slabCut(state)
  );
  const overlayM = OVERLAY_M;
  return withHash({
    kind: "slab",
    request: { structure: s, slab: sl },
    engineVersion: ENGINE_VERSION,
    kernel: kernel.name,
    points,
    forbidden,
    overlayM,
    trust: [fillFactorRow(s), energyRow(points), slicesRow(null, null), harmonicsRow(null, null, sl.harmonics)]
  });
}

// packages/engine/src/gapmap.ts
function gapMapValues(g) {
  return Array.from({ length: g.count }, (_, i) => g.count === 1 ? g.from : g.from + (g.to - g.from) * i / (g.count - 1));
}
function gapMapColumn(s, M, value, kernel = getKernel()) {
  const path = zonePath(s.lattice, 20);
  const eps = inverseEpsilon(s, M);
  const run = (pol) => path.k.map((k) => Array.from(frequenciesAt(eps, k, pol, 8, kernel)));
  const tm = run("TM");
  const te = run("TE");
  const TM = findGaps(tm);
  const TE = findGaps(te);
  const top = Math.min(Math.max(...tm.map((r) => r[7])), Math.max(...te.map((r) => r[7])));
  return { value, TM, TE, complete: completeGaps(TE, TM), top };
}
function solveGapMap(state, opts = {}) {
  const kernel = opts.kernel ?? getKernel();
  const g = state.gapmap;
  const values = gapMapValues(g);
  const columns = [];
  values.forEach((v, i) => {
    const s = g.param === "radius" ? { ...state.structure, radius: v } : { ...state.structure, epsIn: v };
    if (structureProblem(s)) return;
    const c2 = gapMapColumn(s, g.M, v, kernel);
    columns.push(c2);
    opts.onProgress?.(c2, i, values.length);
  });
  const body = { kind: "gapmap", request: { structure: state.structure, gapmap: g }, engineVersion: ENGINE_VERSION, kernel: kernel.name, values, columns };
  return { ...body, hash: hashOf(body) };
}

// vendor/pc/src/physics/constants.ts
var c = 299792458;
var h = 662607015e-42;
var q = 1602176634e-28;
var k_B = 1380649e-29;
var N_A = 602214076e15;
var hbar = h / (2 * Math.PI);
var R_gas = N_A * k_B;
var F_faraday = N_A * q;
var sigma_SB = 2 * Math.PI ** 5 * k_B ** 4 / (15 * h ** 3 * c ** 2);
var c1_radiation = 2 * Math.PI * h * c ** 2;
var c2_radiation = h * c / k_B;
var WIEN_X = 4.965114231744276;
var b_Wien = c2_radiation / WIEN_X;
var hc_eV_nm = h * c / q * 1e9;
var k_B_eV = k_B / q;
var ATM = 101325;
var TORR = ATM / 760;

// vendor/pc/src/physics/math.ts
var SQRT_PI = Math.sqrt(Math.PI);
var GAUSSIAN_FWHM_PER_SIGMA = 2 * Math.sqrt(2 * Math.LN2);
var DB_PER_E_FOLD = 10 / Math.LN10;
var LN_FACTORIAL_TABLE = [0];
for (let k = 1; k <= 256; k++) LN_FACTORIAL_TABLE.push(LN_FACTORIAL_TABLE[k - 1] + Math.log(k));

// vendor/pc/src/physics/thin-film/quarter-wave-stack.ts
function stopBandHalfWidth(nH, nL) {
  if (!(nH > 0 && nL > 0)) return NaN;
  return 2 / Math.PI * Math.asin(Math.abs(nH - nL) / (nH + nL));
}

// vendor/pc/src/physics/thin-film/photonic-crystal.ts
function bilayerBlochCos(nH, dH, nL, dL, lambda) {
  if (!(nH > 0 && nL > 0 && dH >= 0 && dL >= 0 && lambda > 0)) return NaN;
  const dhPhase = 2 * Math.PI * nH * dH / lambda;
  const dlPhase = 2 * Math.PI * nL * dL / lambda;
  return Math.cos(dhPhase) * Math.cos(dlPhase) - 0.5 * (nH / nL + nL / nH) * Math.sin(dhPhase) * Math.sin(dlPhase);
}
function quarterWaveGapMidgap(nH, nL) {
  return 2 * stopBandHalfWidth(nH, nL);
}

// vendor/pc/src/physics/random.ts
function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = state + 1831565813 >>> 0;
    let z = state;
    z = Math.imul(z ^ z >>> 15, z | 1);
    z ^= z + Math.imul(z ^ z >>> 7, z | 61);
    return ((z ^ z >>> 14) >>> 0) / 4294967296;
  };
}
function gaussian(rng2) {
  const u = 1 - rng2();
  const v = rng2();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// packages/engine/src/dft.ts
var chirps = /* @__PURE__ */ new Map();
function bluesteinPlan(n) {
  let p = chirps.get(n);
  if (p) return p;
  let L = 1;
  while (L < 2 * n - 1) L *= 2;
  const wr = new Float64Array(n);
  const wi = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    const ang = Math.PI * (j * j % (2 * n)) / n;
    wr[j] = Math.cos(ang);
    wi[j] = -Math.sin(ang);
  }
  const br = new Float64Array(L);
  const bi = new Float64Array(L);
  for (let m = 0; m < n; m++) {
    br[m] = wr[m];
    bi[m] = -wi[m];
    if (m > 0) {
      br[L - m] = wr[m];
      bi[L - m] = -wi[m];
    }
  }
  createFft(L).forward(br, bi);
  p = { L, wr, wi, br, bi };
  chirps.set(n, p);
  return p;
}
function dft(re, im, inverse = false) {
  const n = re.length;
  if (n <= 1) return;
  if (isPowerOfTwo(n)) {
    const f = createFft(n);
    if (inverse) f.inverse(re, im);
    else f.forward(re, im);
    return;
  }
  if (inverse) for (let i = 0; i < n; i++) im[i] = -im[i];
  const { L, wr, wi, br, bi } = bluesteinPlan(n);
  const ar = new Float64Array(L);
  const ai = new Float64Array(L);
  for (let j = 0; j < n; j++) {
    ar[j] = re[j] * wr[j] - im[j] * wi[j];
    ai[j] = re[j] * wi[j] + im[j] * wr[j];
  }
  const fft = createFft(L);
  fft.forward(ar, ai);
  for (let k = 0; k < L; k++) {
    const xr = ar[k] * br[k] - ai[k] * bi[k];
    const xi = ar[k] * bi[k] + ai[k] * br[k];
    ar[k] = xr;
    ai[k] = xi;
  }
  fft.inverse(ar, ai);
  for (let k = 0; k < n; k++) {
    re[k] = ar[k] * wr[k] - ai[k] * wi[k];
    im[k] = ar[k] * wi[k] + ai[k] * wr[k];
  }
  if (inverse) for (let i = 0; i < n; i++) {
    re[i] /= n;
    im[i] = -im[i] / n;
  }
}
function fftshift(re, im, inverse = false) {
  const n = re.length;
  const s = inverse ? n - Math.floor(n / 2) : Math.floor(n / 2);
  const r = re.slice();
  const i2 = im.slice();
  for (let i = 0; i < n; i++) {
    re[(i + s) % n] = r[i];
    im[(i + s) % n] = i2[i];
  }
}

// packages/engine/src/paraxial.ts
var constantQ = (Q) => () => Q;
var linearChirp = (Q0, Q1, Zend) => (Z) => Q0 + (Q1 - Q0) * Z / Zend;
function propagateModal(K2, f, qpar, Zend, opts = {}, onStep) {
  const nl = opts.nl ?? 3;
  const n = 2 * nl + 1;
  const nz = Math.max(1, Math.round(Zend / (opts.dZ ?? 0.05)));
  const dZ = Zend / nz;
  const nK = K2.length;
  const lam = new Float64Array(n);
  const U2 = new Float64Array(n * n);
  for (let j = 0; j < n; j++) {
    lam[j] = 2 * Math.cos((j + 1) * Math.PI / (n + 1));
    for (let i = 0; i < n; i++) U2[i * n + j] = Math.sqrt(2 / (n + 1)) * Math.sin((i + 1) * (j + 1) * Math.PI / (n + 1));
  }
  const re = new Float64Array(nK * n);
  const im = new Float64Array(nK * n);
  const hr = new Float64Array(nK * n);
  const hi = new Float64Array(nK * n);
  for (let k = 0; k < nK; k++) {
    re[k * n + nl] = 1;
    for (let i = 0; i < n; i++) {
      const D = (K2[k] + i - nl) ** 2;
      hr[k * n + i] = Math.cos(-D * dZ / 2);
      hi[k * n + i] = Math.sin(-D * dZ / 2);
    }
  }
  const Pr = new Float64Array(n * n);
  const Pi = new Float64Array(n * n);
  const tr = new Float64Array(n);
  const ti = new Float64Array(n);
  let cumQ = 0;
  const every = Math.max(1, Math.floor(nz / 50));
  for (let s = 0; s < nz; s++) {
    const Zm = (s + 0.5) * dZ;
    const Q = qpar(Zm);
    cumQ += Q;
    const phi = cumQ * dZ - 0.5 * Q * dZ;
    const theta = 2 * f * Math.cos(phi) * dZ;
    for (let a = 0; a < n; a++) {
      for (let b = a; b < n; b++) {
        let sr = 0;
        let si = 0;
        for (let j = 0; j < n; j++) {
          const w = U2[a * n + j] * U2[b * n + j];
          sr += w * Math.cos(theta * lam[j]);
          si += w * Math.sin(theta * lam[j]);
        }
        Pr[a * n + b] = Pr[b * n + a] = sr;
        Pi[a * n + b] = Pi[b * n + a] = si;
      }
    }
    for (let k = 0; k < nK; k++) {
      const o = k * n;
      for (let i = 0; i < n; i++) {
        const xr = re[o + i];
        const xi = im[o + i];
        tr[i] = xr * hr[o + i] - xi * hi[o + i];
        ti[i] = xr * hi[o + i] + xi * hr[o + i];
      }
      for (let a = 0; a < n; a++) {
        let sr = 0;
        let si = 0;
        for (let b = 0; b < n; b++) {
          const pr = Pr[a * n + b];
          const pi = Pi[a * n + b];
          sr += pr * tr[b] - pi * ti[b];
          si += pr * ti[b] + pi * tr[b];
        }
        re[o + a] = sr * hr[o + a] - si * hi[o + a];
        im[o + a] = sr * hi[o + a] + si * hr[o + a];
      }
    }
    if (onStep && (s % every === 0 || s === nz - 1)) onStep((s + 1) / nz);
  }
  const T = new Float64Array(nK);
  let energyError = 0;
  for (let k = 0; k < nK; k++) {
    let e = 0;
    for (let i = 0; i < n; i++) e += re[k * n + i] ** 2 + im[k * n + i] ** 2;
    energyError = Math.max(energyError, Math.abs(e - 1));
    T[k] = re[k * n + nl] ** 2 + im[k * n + nl] ** 2;
  }
  return { nl, re, im, T, energyError, steps: nz };
}
function bandBelow(K2, T, level2) {
  const Kp = [];
  const Tp = [];
  for (let i = 0; i < K2.length; i++) if (K2[i] > 0) {
    Kp.push(K2[i]);
    Tp.push(T[i]);
  }
  const out = [];
  let start = null;
  for (let i = 0; i < Kp.length; i++) {
    const m = Tp[i] < level2;
    if (m && start === null) start = Kp[i];
    if ((!m || i === Kp.length - 1) && start !== null) {
      out.push([start, m ? Kp[i] : Kp[i - 1]]);
      start = null;
    }
  }
  return out;
}
function twoLevelTransfer(beta, smax = 60, ds = 4e-3) {
  const n = Math.ceil((smax - -smax) / ds);
  let a1r = 1, a1i = 0, a2r = 0, a2i = 0;
  const bx = 1 / beta;
  for (let i = 0; i < n; i++) {
    const s = -smax + i * ds + ds / 2;
    const a = s / 2 / beta;
    const bz = -s / 2 / beta;
    const bn = Math.sqrt(bx * bx + bz * bz) * ds;
    const c2 = Math.cos(bn);
    const sn = Math.sin(bn) / (bn / ds);
    const pr = Math.cos(a * ds);
    const pi = Math.sin(a * ds);
    const u1r = c2 * a1r - sn * bz * a1i - sn * bx * a2i;
    const u1i = c2 * a1i + sn * bz * a1r + sn * bx * a2r;
    const u2r = -sn * bx * a1i + c2 * a2r + sn * bz * a2i;
    const u2i = sn * bx * a1r + c2 * a2i - sn * bz * a2r;
    a1r = pr * u1r - pi * u1i;
    a1i = pr * u1i + pi * u1r;
    a2r = pr * u2r - pi * u2i;
    a2i = pr * u2i + pi * u2r;
  }
  return a2r * a2r + a2i * a2i;
}
function threshold(betas, P, level2) {
  for (let i = 0; i < betas.length - 1; i++) {
    if ((P[i] - level2) * (P[i + 1] - level2) < 0) {
      const t = (P[i] - level2) / (P[i] - P[i + 1]);
      return Math.exp(Math.log(betas[i]) + t * (Math.log(betas[i + 1]) - Math.log(betas[i])));
    }
  }
  return null;
}
var landauZenerBeta = (P) => 2 * Math.PI / -Math.log(1 - P);
function normalised(g, dParUm, dnRel) {
  const k = 2 * Math.PI * g.n0 / g.lambdaUm;
  const qp = 2 * Math.PI / g.dPerpUm;
  const ql = 2 * Math.PI / dParUm;
  return { f: k * k * dnRel / (2 * qp * qp), Qpar: 2 * k * ql / (qp * qp), zPerPeriod: qp * qp * dParUm / (2 * k), k, qPerp: qp };
}
var dParFromQ = (g, Q) => 2 * g.n0 * g.dPerpUm ** 2 / (g.lambdaUm * Q);
var qFromDPar = (g, dParUm) => 2 * g.n0 * g.dPerpUm ** 2 / (g.lambdaUm * dParUm);
var couplingF = (g, dnRel) => normalised(g, 1, dnRel).f;
function filterAngles(g, Q) {
  const s = g.lambdaUm / g.n0 * (Q - 1) / (2 * g.dPerpUm);
  return { internalDeg: Math.asin(s) * 180 / Math.PI, externalDeg: Math.asin(g.n0 * s) * 180 / Math.PI };
}
function angleFromK(g, K2, external = true) {
  const k = 2 * Math.PI * g.n0 / g.lambdaUm;
  let s = K2 * (2 * Math.PI / g.dPerpUm) / k;
  if (external) s = Math.min(1, Math.max(-1, g.n0 * s));
  return Math.asin(s) * 180 / Math.PI;
}
function voxelDn(dnPeak, n0, dutyX, dutyZ) {
  const factor = 2 * Math.sin(Math.PI * dutyX) / Math.PI * (2 * Math.sin(Math.PI * dutyZ) / Math.PI);
  return { factor, dnRel: dnPeak / n0 * factor };
}
var zEnd = (s) => 4 * Math.PI * s.N / (s.Q0 + s.Q1);
var lengthUm = (s) => s.N * dParFromQ(s, 0.5 * (s.Q0 + s.Q1));
var linspace2 = (a, b, n) => Array.from({ length: n }, (_, i) => n === 1 ? a : a + (b - a) * i / (n - 1));
function filterTransfer(s, nK = 241, Kmax = 0.6, opts = {}, onStep) {
  const f = couplingF(s, s.dnRel);
  const Ze = zEnd(s);
  const K2 = linspace2(-Kmax, Kmax, nK);
  const r = propagateModal(K2, f, linearChirp(s.Q0, s.Q1, Ze), Ze, opts, onStep);
  const T = Array.from(r.T);
  let iMin = 0;
  T.forEach((t, i) => {
    if (t < T[iMin]) iMin = i;
  });
  const ext = (k) => angleFromK(s, k, true);
  const half2 = bandBelow(K2, T, 0.5);
  const rej = bandBelow(K2, T, 0.1);
  return {
    f,
    Zend: Ze,
    lengthUm: lengthUm(s),
    K: K2,
    T,
    internalDeg: K2.map((k) => angleFromK(s, k, false)),
    externalDeg: K2.map(ext),
    TOnAxis: T[Math.floor(nK / 2)],
    minT: T[iMin],
    kAtMinT: Math.abs(K2[iMin]),
    externalAtMinTDeg: Math.abs(ext(K2[iMin])),
    halfTBandsK: half2,
    halfTBandsExtDeg: half2.map(([a, b]) => [ext(a), ext(b)]),
    rejection10dBExtDeg: rej.map(([a, b]) => [ext(a), ext(b)]),
    beta: (s.Q1 - s.Q0) / Ze / (f * f),
    energyError: r.energyError,
    nl: r.nl
  };
}
function resonanceT(f, Q, N, opts = {}) {
  const Kres = (Q - 1) / 2;
  return propagateModal([Kres], f, constantQ(Q), N * 2 * Math.PI / Q, opts).T[0];
}
function fitCoupling(Q, series, fMin = 5e-3, fMax = 0.5) {
  if (series.length === 0) throw new RangeError("fit_coupling needs at least one (N, T) pair");
  const cost = (f2) => series.reduce((s, p) => s + (resonanceT(f2, Q, p.N, { dZ: 0.05 }) - p.T) ** 2, 0);
  const grid = Array.from({ length: 81 }, (_, i) => fMin * (fMax / fMin) ** (i / 80));
  let best = 0;
  const costs = grid.map(cost);
  costs.forEach((c3, i) => {
    if (c3 < costs[best]) best = i;
  });
  let a = grid[Math.max(0, best - 1)];
  let b = grid[Math.min(grid.length - 1, best + 1)];
  const g = (Math.sqrt(5) - 1) / 2;
  let c2 = b - g * (b - a);
  let d = a + g * (b - a);
  let fc = cost(c2);
  let fd = cost(d);
  for (let i = 0; i < 60 && b - a > 1e-10 * b; i++) {
    if (fc < fd) {
      b = d;
      d = c2;
      fd = fc;
      c2 = b - g * (b - a);
      fc = cost(c2);
    } else {
      a = c2;
      c2 = d;
      fc = fd;
      d = a + g * (b - a);
      fd = cost(d);
    }
  }
  const f = 0.5 * (a + b);
  return { f, rms: Math.sqrt(cost(f) / series.length), nFullTransfer: Q / (4 * f) };
}

// packages/engine/src/beam.ts
function spectrumOf(re, im) {
  const r = re.slice();
  const i = im.slice();
  fftshift(r, i, true);
  dft(r, i);
  fftshift(r, i);
  for (let k = 0; k < r.length; k++) {
    r[k] /= r.length;
    i[k] /= r.length;
  }
  return { re: r, im: i };
}
function fieldOf(re, im) {
  const r = re.slice();
  const i = im.slice();
  fftshift(r, i, true);
  dft(r, i, true);
  fftshift(r, i);
  for (let k = 0; k < r.length; k++) {
    r[k] *= r.length;
    i[k] *= r.length;
  }
  return { re: r, im: i };
}
function noisyBeam(spec = {}) {
  const dK = spec.dK ?? 5e-3;
  const Kmax = spec.Kmax ?? 2;
  const sigX = spec.sigmaX ?? 40;
  const rms = spec.noiseRms ?? 0.6;
  const w = spec.noiseWidth ?? 0.12;
  const n = Math.round(2 * Kmax / dK);
  const K2 = Float64Array.from({ length: n }, (_, i) => (i - Math.floor(n / 2)) * dK);
  const X2 = Float64Array.from({ length: n }, (_, i) => (i - Math.floor(n / 2)) * (2 * Math.PI / (n * dK)));
  const rng2 = createRng(spec.seed ?? 1);
  const nr = Float64Array.from({ length: n }, () => gaussian(rng2));
  const ni = Float64Array.from({ length: n }, () => gaussian(rng2));
  dft(nr, ni);
  fftshift(nr, ni);
  for (let i = 0; i < n; i++) {
    const g = Math.exp(-(K2[i] * K2[i]) / (2 * w * w));
    nr[i] *= g;
    ni[i] *= g;
  }
  fftshift(nr, ni, true);
  dft(nr, ni, true);
  let p = 0;
  for (let i = 0; i < n; i++) p += nr[i] * nr[i] + ni[i] * ni[i];
  const scale = rms / Math.sqrt(p / n);
  const fieldRe = new Float64Array(n);
  const fieldIm = new Float64Array(n);
  const cleanFieldRe = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const b = Math.exp(-(X2[i] * X2[i]) / (2 * sigX * sigX));
    cleanFieldRe[i] = b;
    fieldRe[i] = b * (1 + nr[i] * scale);
    fieldIm[i] = b * ni[i] * scale;
  }
  const s = spectrumOf(fieldRe, fieldIm);
  const c2 = spectrumOf(cleanFieldRe, new Float64Array(n));
  return { n, dK, K: K2, X: X2, fieldRe, fieldIm, specRe: s.re, specIm: s.im, cleanRe: c2.re, cleanIm: c2.im };
}
function filterSpectrum(beam, f, qpar, Zend, opts = {}, onStep) {
  const P = Math.round(1 / beam.dK);
  if (Math.abs(P * beam.dK - 1) > 1e-9) throw new RangeError("1/dK must be an integer so that the orders K + l land on the grid");
  const m = propagateModal(beam.K, f, qpar, Zend, opts, onStep);
  const n = beam.n;
  const nl = m.nl;
  const w = 2 * nl + 1;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let j = 0; j < w; j++) {
    const shift = (j - nl) * P;
    for (let i = 0; i < n; i++) {
      const ar = m.re[i * w + j];
      const ai = m.im[i * w + j];
      const t = ((i + shift) % n + n) % n;
      re[t] += ar * beam.specRe[i] - ai * beam.specIm[i];
      im[t] += ar * beam.specIm[i] + ai * beam.specRe[i];
    }
  }
  return { re, im, modal: m };
}
function gradient(re, im, h2) {
  const n = re.length;
  const gr = new Float64Array(n);
  const gi = new Float64Array(n);
  for (let i = 1; i < n - 1; i++) {
    gr[i] = (re[i + 1] - re[i - 1]) / (2 * h2);
    gi[i] = (im[i + 1] - im[i - 1]) / (2 * h2);
  }
  gr[0] = (re[1] - re[0]) / h2;
  gi[0] = (im[1] - im[0]) / h2;
  gr[n - 1] = (re[n - 1] - re[n - 2]) / h2;
  gi[n - 1] = (im[n - 1] - im[n - 2]) / h2;
  return { re: gr, im: gi };
}
function secondMoments(re, im, K2, zMin = -400, zMax = 400, nZ = 81) {
  const n = K2.length;
  const dK = K2[1] - K2[0];
  let norm = 0;
  let k1 = 0;
  for (let i = 0; i < n; i++) {
    const p = re[i] * re[i] + im[i] * im[i];
    norm += p;
    k1 += K2[i] * p;
  }
  const Kc = k1 / norm;
  let k2 = 0;
  for (let i = 0; i < n; i++) k2 += (K2[i] - Kc) ** 2 * (re[i] * re[i] + im[i] * im[i]);
  const sK = Math.sqrt(k2 / norm);
  let best = { sX: Infinity, Z: 0 };
  const zr = new Float64Array(n);
  const zi = new Float64Array(n);
  for (let s = 0; s < nZ; s++) {
    const Z = nZ === 1 ? zMin : zMin + (zMax - zMin) * s / (nZ - 1);
    for (let i = 0; i < n; i++) {
      const ph = -K2[i] * K2[i] * Z;
      const c2 = Math.cos(ph);
      const sn = Math.sin(ph);
      zr[i] = re[i] * c2 - im[i] * sn;
      zi[i] = re[i] * sn + im[i] * c2;
    }
    const d = gradient(zr, zi, dK);
    let x2 = 0;
    let x1 = 0;
    for (let i = 0; i < n; i++) {
      x2 += d.re[i] * d.re[i] + d.im[i] * d.im[i];
      x1 += zi[i] * d.re[i] - zr[i] * d.im[i];
    }
    x2 /= norm;
    x1 /= norm;
    const sX = Math.sqrt(Math.max(x2 - x1 * x1, 0));
    if (sX < best.sX) best = { sX, Z };
  }
  return { sigmaK: sK, sigmaX: best.sX, zWaist: best.Z, M2: 2 * sK * best.sX };
}
var masked = (re, im, m) => ({
  re: re.map((v, i) => m(i) ? v : 0),
  im: im.map((v, i) => m(i) ? v : 0)
});
function cleaningMetrics(beam, out, aperture = 0.5, band = [0.05, 0.185]) {
  const { K: K2 } = beam;
  const ap = (i) => Math.abs(K2[i]) < aperture;
  const inBand = (i) => Math.abs(K2[i]) > band[0] && Math.abs(K2[i]) < band[1];
  let pin = 0, pkept = 0, bandIn = 0, bandOut = 0;
  for (let i = 0; i < beam.n; i++) {
    const a = beam.specRe[i] ** 2 + beam.specIm[i] ** 2;
    const b = out.re[i] ** 2 + out.im[i] ** 2;
    pin += a;
    if (ap(i)) pkept += b;
    if (inBand(i)) {
      bandIn += a;
      bandOut += b;
    }
  }
  const sIn = masked(beam.specRe, beam.specIm, ap);
  const sOut = masked(out.re, out.im, ap);
  const sClean = masked(beam.cleanRe, beam.cleanIm, ap);
  const before = secondMoments(sIn.re, sIn.im, K2);
  const after = secondMoments(sOut.re, sOut.im, K2);
  const clean = secondMoments(sClean.re, sClean.im, K2);
  return {
    energyKeptInAperture: pkept / pin,
    energyInBandBefore: bandIn / pin,
    energyInBandAfter: bandOut / pin,
    M2In: before.M2,
    M2Out: after.M2,
    M2CleanGaussian: clean.M2,
    before,
    after
  };
}

// packages/engine/src/filter-rcwa.ts
function harmonicLayer(c2, dn, n0, M, thickness, key) {
  const size = 4 * M + 1;
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  const e = n0 * n0;
  re[2 * M] = e * (1 + dn * dn * c2 * c2 / 2);
  if (M >= 1) re[2 * M + 1] = re[2 * M - 1] = e * dn * c2;
  if (M >= 1) re[2 * M + 2] = re[2 * M - 2] = e * dn * dn * c2 * c2 / 4;
  return { key, thickness, re, im };
}
function harmonicCrystalLayers(s, M = 8, slicesPerPeriod = 16) {
  const dn = s.dnRel;
  if (s.Q0 === s.Q1) {
    const dPar = dParFromQ(s, s.Q0) / s.dPerpUm;
    const period2 = Array.from({ length: slicesPerPeriod }, (_, j) => {
      const c2 = Math.cos(2 * Math.PI * (j + 0.5) / slicesPerPeriod);
      return harmonicLayer(c2, dn, s.n0, M, dPar / slicesPerPeriod, `h${c2.toPrecision(17)}`);
    });
    return { period: period2, repeats: s.N };
  }
  const nrm = normalised(s, 1, dn);
  const Ze = zEnd(s);
  const lengthD = Ze * 2 * nrm.k / (nrm.qPerp * nrm.qPerp) / s.dPerpUm;
  const nSlices = Math.max(slicesPerPeriod, Math.round(s.N * slicesPerPeriod));
  const dz = lengthD / nSlices;
  const period = Array.from({ length: nSlices }, (_, j) => {
    const Z = (j + 0.5) / nSlices * Ze;
    const phi = s.Q0 * Z + (s.Q1 - s.Q0) * Z * Z / (2 * Ze);
    return harmonicLayer(Math.cos(phi), dn, s.n0, M, dz, `c${j}`);
  });
  return { period, repeats: 1 };
}
function rcwaFilterT0(s, thetasRad, M = 8, slicesPerPeriod = 16, kernel = getKernel(), onPoint) {
  const { period, repeats } = harmonicCrystalLayers(s, M, slicesPerPeriod);
  const w = s.dPerpUm / s.lambdaUm;
  const T0 = [];
  const T = [];
  const R = [];
  for (const th of thetasRad) {
    const p = slabPoint(period, repeats, M, w, th, s.n0, kernel);
    T0.push(p.Tm[M]);
    T.push(p.T);
    R.push(p.R);
    onPoint?.({ ...p, T0: p.Tm[M], theta: th });
  }
  return { T0, T, R };
}

// packages/engine/src/filter-solve.ts
function filterSpecOf(s) {
  const fl = s.filter;
  const dn = fl.voxel ? voxelDn(fl.voxel.dnPeak, fl.n0, fl.voxel.dutyX, fl.voxel.dutyZ).dnRel : fl.dnRel;
  return { n0: fl.n0, lambdaUm: fl.lambdaNm / 1e3, dPerpUm: fl.dPerpUm, Q0: fl.Q0, Q1: fl.Q1, dnRel: dn, N: fl.N };
}
function kMaxFor(s) {
  const edge = Math.max(Math.abs(s.Q0 - 1), Math.abs(s.Q1 - 1)) / 2;
  const kq = 2 * Math.PI * s.n0 / s.lambdaUm / (2 * Math.PI / s.dPerpUm);
  return Math.min(Math.max(0.3, 1.5 * edge + 0.1), 0.35 * kq);
}
var intDeg = (s, k) => angleFromK(s, k, false);
function refineDip(s, tr, opts = {}) {
  const Ze = zEnd(s);
  const q2 = linearChirp(s.Q0, s.Q1, Ze);
  const T = (K3) => propagateModal([K3], tr.f, q2, Ze, opts).T[0];
  let i = -1;
  tr.K.forEach((k, j) => {
    if (k >= 0 && (i < 0 || tr.T[j] < tr.T[i])) i = j;
  });
  let a = tr.K[Math.max(i - 1, 0)];
  let b = tr.K[Math.min(i + 1, tr.K.length - 1)];
  a = Math.max(a, 0);
  const g = (Math.sqrt(5) - 1) / 2;
  let c2 = b - g * (b - a);
  let d = a + g * (b - a);
  let fc = T(c2);
  let fd = T(d);
  for (let it = 0; it < 40 && b - a > 1e-9; it++) {
    if (fc < fd) {
      b = d;
      d = c2;
      fd = fc;
      c2 = b - g * (b - a);
      fc = T(c2);
    } else {
      a = c2;
      c2 = d;
      fc = fd;
      d = a + g * (b - a);
      fd = T(d);
    }
  }
  const K2 = fc < fd ? c2 : d;
  const best = Math.min(fc, fd, tr.T[i]);
  const Kb = best === tr.T[i] ? tr.K[i] : K2;
  return { K: Kb, T: best, internalDeg: angleFromK(s, Kb, false), externalDeg: angleFromK(s, Kb, true) };
}
function transferSummary(s, tr) {
  const pos = tr.K.map((k, i) => [k, tr.T[i]]).filter(([k]) => k >= 0);
  const dip = pos.reduce((a, b) => b[1] < a[1] ? b : a);
  const aI = filterAngles(s, s.Q0);
  const aE = filterAngles(s, s.Q1);
  return {
    f: tr.f,
    beta: tr.beta,
    lengthMm: tr.lengthUm / 1e3,
    dParUm: [dParFromQ(s, s.Q0), dParFromQ(s, s.Q1)],
    dipInternalDeg: intDeg(s, dip[0]),
    dipExternalDeg: angleFromK(s, dip[0], true),
    dipT: dip[1],
    TOnAxis: tr.TOnAxis,
    predicted: { internalDeg: [aI.internalDeg, aE.internalDeg], externalDeg: [aI.externalDeg, aE.externalDeg] },
    halfTBandsExtDeg: tr.halfTBandsExtDeg,
    rejection10dBExtDeg: tr.rejection10dBExtDeg,
    halfTBandsIntDeg: tr.halfTBandsK.map(([a, b]) => [intDeg(s, a), intDeg(s, b)])
  };
}
function solveFilter(state, opts = {}) {
  const kernel = opts.kernel ?? getKernel();
  const s = filterSpecOf(state);
  const Kmax = kMaxFor(s);
  const tr = filterTransfer(s, 241, Kmax, {}, (fraction) => opts.onProgress?.({ phase: "transfer", fraction }));
  const summary = transferSummary(s, tr);
  const b = state.filter.beam;
  const beam = noisyBeam({ sigmaX: b.sigmaX, noiseRms: b.noiseRms, noiseWidth: b.noiseWidth, seed: b.seed });
  const Ze = zEnd(s);
  const out = filterSpectrum(beam, tr.f, linearChirp(s.Q0, s.Q1, Ze), Ze, {}, (fraction) => opts.onProgress?.({ phase: "beam", fraction }));
  const bandK = [Math.min(s.Q0, s.Q1) / 2 - 0.5, Math.max(s.Q0, s.Q1) / 2 - 0.5].map(Math.abs).sort((x, y) => x - y);
  const metrics = cleaningMetrics(beam, out, b.aperture, bandK[1] > bandK[0] + 1e-9 ? bandK : [Math.max(0, bandK[0] - 0.02), bandK[0] + 0.02]);
  const qp = 2 * Math.PI / s.dPerpUm;
  const apMask = (re, im) => ({
    re: re.map((v, i) => Math.abs(beam.K[i]) < b.aperture ? v : 0),
    im: im.map((v, i) => Math.abs(beam.K[i]) < b.aperture ? v : 0)
  });
  const waist = (spec, Z) => {
    const m = apMask(spec.re, spec.im);
    for (let i = 0; i < beam.n; i++) {
      const ph = -beam.K[i] * beam.K[i] * Z;
      const c2 = Math.cos(ph);
      const sn = Math.sin(ph);
      const r = m.re[i];
      m.re[i] = r * c2 - m.im[i] * sn;
      m.im[i] = r * sn + m.im[i] * c2;
    }
    return fieldOf(m.re, m.im);
  };
  const nb = waist({ re: beam.specRe, im: beam.specIm }, metrics.before.zWaist);
  const na = waist(out, metrics.after.zWaist);
  const step = 2;
  const idx = Array.from({ length: Math.floor(beam.n / step) }, (_, i) => i * step);
  const xr = 4 * b.sigmaX;
  const xi = idx.filter((i) => Math.abs(beam.X[i]) <= xr);
  const ki = Array.from({ length: beam.n }, (_, i) => i).filter((i) => Math.abs(beam.K[i]) <= Math.max(b.aperture, Kmax));
  const p2 = (re, im, i) => re[i] * re[i] + im[i] * im[i];
  const result = {
    kind: "filter",
    request: { spec: s, beam: b },
    engineVersion: ENGINE_VERSION,
    kernel: kernel.name,
    transfer: tr,
    summary,
    beam: {
      metrics,
      xUm: xi.map((i) => beam.X[i] / qp),
      nearBefore: xi.map((i) => p2(nb.re, nb.im, i)),
      nearAfter: xi.map((i) => p2(na.re, na.im, i)),
      angleDeg: ki.map((i) => angleFromK(s, beam.K[i], true)),
      farBefore: ki.map((i) => p2(beam.specRe, beam.specIm, i)),
      farAfter: ki.map((i) => p2(out.re, out.im, i)),
      bandK
    },
    trust: [
      couplingRow(tr.f),
      obliquityRow(Kmax * (2 * Math.PI / s.dPerpUm) / (2 * Math.PI * s.n0 / s.lambdaUm)),
      modalEnergyRow(Math.max(tr.energyError, out.modal.energyError)),
      paraxialConvergenceRow(null)
    ]
  };
  return { ...result, hash: hashOf(result) };
}
function filterSweep(state, param, values, onRow) {
  const base = filterSpecOf(state);
  return values.slice(0, 16).map((v, i) => {
    const mid = 0.5 * (base.Q0 + base.Q1);
    const s = param === "dPerpUm" ? { ...base, dPerpUm: v } : param === "dnRel" ? { ...base, dnRel: v } : param === "N" ? { ...base, N: Math.round(v) } : { ...base, Q0: mid - v / 2, Q1: mid + v / 2 };
    const t = filterTransfer(s, 161, kMaxFor(s), { dZ: 0.1 });
    const row = {
      value: v,
      f: t.f,
      beta: t.beta,
      lengthMm: t.lengthUm / 1e3,
      minT: t.minT,
      TOnAxis: t.TOnAxis,
      width10dBExtDeg: t.rejection10dBExtDeg.reduce((a, [lo, hi]) => a + hi - lo, 0),
      halfTBandsExtDeg: t.halfTBandsExtDeg
    };
    onRow?.(row, i);
    return row;
  });
}
function filterFit(state, series) {
  const s = filterSpecOf(state);
  const fit = fitCoupling(0.5 * (s.Q0 + s.Q1), series);
  return { ...fit, dnRel: fit.f / couplingF(s, 1) };
}

// packages/engine/src/validation-data.ts
var VALIDATION_DATA = { "convergence": { "reference": { "TM_b1": 0.2747065704339872, "TM_b2": 0.5488375551550362, "TE_b2": 0.4614167998310336, "TE_b1": 0.5488493838763122 }, "rows": { "M5": { "TM_b1": 0.27474077399429997, "TM_b2": 0.5492358352159673, "TE_b2": 0.4607257225713044, "TE_b1": 0.5492469443222723 }, "M7": { "TM_b1": 0.27471870758984557, "TM_b2": 0.5489825675781639, "TE_b2": 0.4609733307007028, "TE_b1": 0.5489931646049757 }, "M10": { "TM_b1": 0.2747108931945537, "TM_b2": 0.5488825403956622, "TE_b2": 0.4611673062896883, "TE_b1": 0.5488936272366506 } } }, "limits": { "thetaDeg": [0, 0.125, 0.25, 0.37500000000000006, 0.5, 0.625, 0.7500000000000001, 0.875, 1, 1.125, 1.25, 1.375, 1.5000000000000002, 1.625, 1.75, 1.8749999999999998, 2, 2.125, 2.25, 2.375, 2.5, 2.625, 2.75, 2.875, 3.0000000000000004, 3.125, 3.25, 3.375, 3.5, 3.6250000000000004, 3.7499999999999996, 3.875, 4, 4.125, 4.25, 4.375, 4.5, 4.625, 4.75, 4.875, 5], "rows": [{ "dnRel": 1e-3, "f": 0.025776880573212643, "rcwa": [1, 0.998, 0.9935, 0.9903, 0.9912, 0.9957, 0.9997, 0.9982, 0.9895, 0.9785, 0.9737, 0.9808, 0.9949, 0.998, 0.9661, 0.883, 0.7544, 0.6126, 0.5056, 0.4747, 0.5335, 0.6595, 0.8059, 0.9245, 0.9879, 0.999, 0.9824, 0.966, 0.9654, 0.9786, 0.9936, 1, 0.9963, 0.9891, 0.986, 0.9893, 0.9958, 0.9998, 0.9988, 0.9949, 0.9923], "paraxial": [1, 0.9981, 0.9939, 0.9906, 0.991, 0.995, 0.9993, 0.999, 0.9919, 0.9811, 0.974, 0.9776, 0.9905, 0.9996, 0.9824, 0.9192, 0.8071, 0.6682, 0.5441, 0.4789, 0.498, 0.5951, 0.7345, 0.8687, 0.9606, 0.9979, 0.994, 0.9752, 0.9641, 0.9689, 0.9835, 0.9963, 0.9999, 0.995, 0.9883, 0.9862, 0.9901, 0.9962, 0.9998, 0.9989, 0.9952] }, { "dnRel": 2e-3, "f": 0.051553761146425285, "rcwa": [0.9989, 0.9921, 0.9764, 0.9637, 0.9643, 0.9787, 0.9956, 0.9972, 0.9729, 0.9314, 0.8993, 0.9029, 0.9438, 0.9878, 0.9758, 0.8525, 0.609, 0.3114, 0.0755, 5e-3, 0.1349, 0.4085, 0.709, 0.9234, 0.9993, 0.9636, 0.892, 0.8556, 0.8794, 0.9386, 0.9879, 0.9989, 0.9771, 0.9509, 0.9453, 0.9634, 0.9882, 0.9999, 0.9925, 0.9769, 0.9688], "paraxial": [0.998, 0.9919, 0.978, 0.9658, 0.9644, 0.9762, 0.9929, 0.9982, 0.9802, 0.9427, 0.906, 0.896, 0.9254, 0.9756, 0.9926, 0.9134, 0.7115, 0.4277, 0.1578, 0.0106, 0.0521, 0.2659, 0.5624, 0.8263, 0.9746, 0.9942, 0.9354, 0.8729, 0.8587, 0.8974, 0.956, 0.9948, 0.9961, 0.9717, 0.9488, 0.9472, 0.9663, 0.9896, 1, 0.9928, 0.9779] }, { "dnRel": 5e-3, "f": 0.12888440286606323, "rcwa": [0.844, 0.8723, 0.931, 0.9631, 0.9279, 0.8468, 0.7926, 0.8131, 0.89, 0.9721, 0.9806, 0.818, 0.5596, 0.3923, 0.3237, 0.2919, 0.2966, 0.3461, 0.3994, 0.3999, 0.3599, 0.2909, 0.2102, 0.1728, 0.2284, 0.3942, 0.6348, 0.866, 0.9906, 0.9679, 0.84, 0.707, 0.6662, 0.7444, 0.8821, 0.9835, 0.9888, 0.9145, 0.8337, 0.8157, 0.8725], "paraxial": [0.8436, 0.8717, 0.9349, 0.9733, 0.9387, 0.8572, 0.7952, 0.7954, 0.8689, 0.9696, 0.9597, 0.7804, 0.593, 0.4857, 0.3875, 0.3078, 0.2989, 0.3486, 0.3946, 0.4076, 0.3935, 0.3378, 0.2552, 0.1904, 0.1883, 0.2856, 0.4829, 0.7252, 0.9216, 0.9991, 0.9415, 0.8057, 0.6918, 0.6765, 0.7665, 0.8988, 0.9884, 0.9872, 0.9142, 0.8364, 0.8168] }, { "dnRel": 0.01, "f": 0.25776880573212646, "rcwa": [0.6621, 0.6534, 0.6872, 0.7524, 0.7349, 0.7125, 0.7632, 0.7533, 0.7363, 0.9014, 0.7252, 0.1149, 0.1407, 0.6098, 0.6238, 0.4323, 0.3167, 0.2573, 0.2962, 0.2473, 0.0746, 43e-4, 0.0153, 0.0504, 0.1628, 0.3061, 0.5127, 0.7432, 0.9049, 0.9928, 0.9397, 0.7568, 0.5377, 0.3709, 0.3458, 0.4881, 0.7293, 0.9357, 0.988, 0.8727, 0.6981], "paraxial": [0.6322, 0.6672, 0.7216, 0.7278, 0.7357, 0.7556, 0.7097, 0.6702, 0.8197, 0.8358, 0.3022, 0.0277, 0.5059, 0.7806, 0.6154, 0.471, 0.3625, 0.323, 0.3288, 0.2055, 0.0511, 0.0117, 59e-4, 0.0236, 0.0936, 0.1972, 0.3769, 0.587, 0.7834, 0.9491, 0.9943, 0.9083, 0.7307, 0.5149, 0.3644, 0.3602, 0.5096, 0.7391, 0.9259, 0.9767, 0.8965] }, { "dnRel": 0.02, "f": 0.5155376114642529 }, { "dnRel": 0.05, "f": 1.2888440286606322 }, { "dnRel": 0.1, "f": 2.5776880573212644 }, { "dnRel": 0.2, "f": 5.155376114642529 }] }, "noisySeed1": { "energyKeptInAperture": 0.7996316257582936, "energyInBandBefore": 0.04331505561270586, "energyInBandAfter": 0.004506935414011695, "M2In": 1.9822795733556944, "M2Out": 1.8726934422024182, "M2CleanGaussian": 0.9900828355203224 }, "supercollimation": { "eps12.1_bulkSi_r0.25": { "omega": 0.19070912294331535, "sOverGM": 0.8198255845668433 }, "eps12.1_bulkSi_r0.3": { "omega": 0.18802782012062805, "sOverGM": 0.7512982800577814 }, "eps12.1_bulkSi_r0.35": { "omega": 0.19097014608944057, "sOverGM": 0.6957105641764847 }, "eps8.4_slab_effective_r0.25": { "omega": 0.23043555488828968, "sOverGM": 0.8331781830216733 }, "eps8.4_slab_effective_r0.3": { "omega": 0.227635693139667, "sOverGM": 0.7688229148754588 }, "eps8.4_slab_effective_r0.35": { "omega": 0.23105482615909675, "sOverGM": 0.7162875135118283 } } };

// packages/engine/src/validation.ts
var fmt = (x, digits = 6) => {
  if (!Number.isFinite(x)) return String(x);
  const a = Math.abs(x);
  return a !== 0 && (a < 1e-3 || a >= 1e5) ? x.toExponential(3) : Number(x.toFixed(digits)).toString();
};
function near(name2, got, want, tol, expected = `${fmt(want)} \xB1 ${fmt(tol)}`) {
  return { name: name2, raw: got, value: fmt(got), expected, pass: Math.abs(got - want) <= tol };
}
function rel(name2, got, want, r) {
  return { name: name2, raw: got, value: fmt(got, 9), expected: `${fmt(want, 9)} to ${fmt(r)} relative`, pass: Math.abs(got - want) <= r * Math.abs(want) };
}
function atMost(name2, got, bound, expected = `\u2264 ${fmt(bound)}`) {
  return { name: name2, raw: got, value: fmt(got), expected, pass: got <= bound };
}
function atLeast(name2, got, bound, expected = `\u2265 ${fmt(bound)}`) {
  return { name: name2, raw: got, value: fmt(got), expected, pass: got >= bound };
}
function same(name2, got, want) {
  return { name: name2, value: got, expected: want, pass: got === want };
}
var linspace3 = (a, b, n) => Array.from({ length: n }, (_, i) => n === 1 ? a : a + (b - a) * i / (n - 1));
var RODS = { lattice: "square", radius: 0.2, epsIn: 8.9, epsOut: 1 };
var X = [Math.PI, 0];
var M_PT = [Math.PI, Math.PI];
var rodsGap = {
  id: "3.1",
  section: "\xA73.1",
  title: "Square lattice of \u03B5 = 8.9 rods: the TM gap",
  estimateSeconds: 2.9,
  usesKernel: true,
  run(kernel, record = () => {
  }) {
    const tm = bandStructure({ structure: RODS, polarisation: "TM", M: 10 }, kernel);
    const te = bandStructure({ structure: RODS, polarisation: "TE", M: 10 }, kernel);
    record("TM bands, M = 10", tm.bands.flat());
    record("TE bands, M = 10", te.bands.flat());
    const gaps = findGaps(tm.bands, { maxBand: 4 });
    const g = gaps[0];
    const label = (i) => tm.path.ticks.find((t) => t.index === i)?.label ?? "between points";
    return [
      same("TM gaps among bands 1\u20134 (M = 10)", String(gaps.length), "1"),
      near("TM gap bottom (a/\u03BB)", g?.bottom ?? NaN, 0.3224, 5e-4),
      near("TM gap top (a/\u03BB)", g?.top ?? NaN, 0.4425, 5e-4),
      near("gap/midgap (%)", 100 * (g?.gapMidgap ?? NaN), 31.4, 0.1),
      same("band-1 maximum at", label(g?.bottomAt), "M"),
      same("band-2 minimum at", label(g?.topAt), "X"),
      same("TE gaps among bands 1\u20134", String(findGaps(te.bands, { maxBand: 4 }).length), "0")
    ];
  }
};
var convergence = {
  id: "3.2",
  section: "\xA73.2",
  title: "Plane-wave convergence with the inverse-\u03B5 rule",
  estimateSeconds: 0.2,
  usesKernel: true,
  run(kernel) {
    const edges = [["TM_b1", "TM", X, 0], ["TM_b2", "TM", M_PT, 1], ["TE_b2", "TE", X, 1], ["TE_b1", "TE", M_PT, 0]];
    const out = [];
    for (const M of [5, 7, 10]) {
      const eps = inverseEpsilon(RODS, M);
      const row = VALIDATION_DATA.convergence.rows[`M${M}`];
      for (const [key, pol, k, j] of edges) {
        const got = frequenciesAt(eps, k, pol, 4, kernel)[j];
        const want = row[key];
        out.push(rel(`M = ${M}, ${key.replace("_b", " band ")}: inverse-rule column`, got, want, 1e-8));
        if (M === 7) {
          const ref = VALIDATION_DATA.convergence.reference[key];
          out.push(atMost(`M = 7, ${key.replace("_b", " band ")}: error against M = 20`, Math.abs(got - ref) / ref, pol === "TM" ? 3e-4 : 1e-3));
        }
      }
    }
    return out;
  }
};
var hexHoles = {
  id: "3.3",
  section: "\xA73.3",
  title: "Hexagonal lattice of air holes in \u03B5 = 13: TE and complete gaps",
  estimateSeconds: 2.8,
  usesKernel: true,
  run(kernel, record = () => {
  }) {
    const bs = (r, pol) => {
      const b = bandStructure({ structure: { lattice: "hex", radius: r, epsIn: 1, epsOut: 13 }, polarisation: pol, M: 8, nPerSegment: 24 }, kernel);
      record(`${pol} bands, r = ${r}`, b.bands.flat());
      return b;
    };
    const te = findGaps(bs(0.48, "TE").bands, { maxBand: 4 });
    const tm = findGaps(bs(0.48, "TM").bands, { maxBand: 4 });
    const te12 = te.find((x) => x.betweenBands[0] === 1);
    const tm23 = tm.find((x) => x.betweenBands[0] === 2);
    const complete = completeGaps(te, tm);
    return [
      near("r = 0.48: TE gap bottom", te12?.bottom ?? NaN, 0.36058, 5e-4),
      near("r = 0.48: TE gap top", te12?.top ?? NaN, 0.52438, 5e-4),
      near("r = 0.48: TM gap bottom (bands 2\u20133)", tm23?.bottom ?? NaN, 0.42977, 5e-4),
      near("r = 0.48: TM gap top", tm23?.top ?? NaN, 0.52006, 5e-4),
      near("r = 0.48: complete gap/midgap (%)", 100 * (complete[0]?.gapMidgap ?? NaN), 19, 0.1),
      same("r = 0.30: TM gaps among bands 1\u20134", String(findGaps(bs(0.3, "TM").bands, { maxBand: 4 }).length), "0")
    ];
  }
};
var bragg = {
  id: "3.4",
  section: "\xA73.4",
  title: "1D Bragg stack against the analytic dispersion",
  estimateSeconds: 0.05,
  usesKernel: true,
  run(kernel, record = () => {
  }) {
    const nH = 2.3, nL = 1.45;
    const cell = quarterWaveCell(nH, nL, 1);
    const L = cell[0].thickness + cell[1].thickness;
    const f = (nu) => bilayerBlochCos(nH, cell[0].thickness, nL, cell[1].thickness, L / nu) + 1;
    const root = (a, b) => {
      let fa = f(a);
      for (let i = 0; i < 200 && b - a > 1e-16; i++) {
        const m = 0.5 * (a + b);
        const fm = f(m);
        if (fm * fa > 0) {
          a = m;
          fa = fm;
        } else b = m;
      }
      return 0.5 * (a + b);
    };
    const lo = root(0.15, L);
    const hi = root(L, 0.45);
    const [atPi] = bands1D(cell, [Math.PI], 40, 4, kernel);
    const T = response1D({ incident: 1, layers: periodicLayers(cell, 20), exit: 1 }, 1).T;
    record("1D PWE bands at k = \u03C0/\u039B and 0.7, M = 40", [...atPi, ...bands1D(cell, [0.7], 40, 4, kernel)[0]]);
    return [
      near("quarterWaveGapMidgap(2.3, 1.45), vendored", quarterWaveGapMidgap(nH, nL), 0.291131, 5e-7),
      rel("1D PWE (M = 40) lower edge vs analytic", atPi[0], lo, 1e-5),
      rel("1D PWE upper edge vs analytic", atPi[1], hi, 1e-5),
      rel("TMM midgap T, 20 periods", T, 387e-10, 0.01)
    ];
  }
};
var slab = {
  id: "3.5",
  section: "\xA73.5",
  title: "PWE against RCWA on 8 rows of the rod lattice: normal incidence",
  estimateSeconds: 3.2,
  usesKernel: true,
  run(kernel, record = () => {
  }) {
    const row = rodRowLayers(0.2, 8.9, 1, 12, 16);
    const ws = linspace3(0.2, 0.55, 176);
    const pts = ws.map((w) => slabPoint(row, 8, 12, w, 0, 1, kernel));
    record("T, normal incidence, 8 rows", pts.map((p) => p.T));
    record("R, normal incidence, 8 rows", pts.map((p) => p.R));
    const below = ws.filter((_, i) => pts[i].T < 0.01);
    const fX = frequenciesAt(inverseEpsilon(RODS, 10), X, "TM", 2, kernel);
    const energy = Math.max(...pts.map((p) => Math.abs(p.R + p.T - 1)));
    return [
      same("frequencies with T < 1e-2 form one range", String(below.length === ws.filter((w) => w >= Math.min(...below) && w <= Math.max(...below)).length), "true"),
      near("stop band (T < 1e-2) lower edge vs band 1 at X", Math.min(...below), fX[0], 0.01, `${fmt(fX[0], 5)} \xB1 0.01`),
      near("stop band upper edge vs band 2 at X", Math.max(...below), fX[1], 0.01, `${fmt(fX[1], 5)} \xB1 0.01`),
      atMost("max |R + T \u2212 1|", energy, 1e-10)
    ];
  }
};
var slab30 = {
  id: "3.5b",
  section: "\xA73.5",
  title: "PWE against RCWA on 8 rows: projected bands at 30\xB0",
  estimateSeconds: 21,
  usesKernel: true,
  run(kernel, record = () => {
  }) {
    const row = rodRowLayers(0.2, 8.9, 1, 12, 16);
    const th = Math.PI / 6;
    const w30 = linspace3(0.22, 0.5, 113);
    const eps7 = inverseEpsilon(RODS, 7);
    const pts = w30.map((w) => slabPoint(row, 8, 12, w, th, 1, kernel));
    const allowed = w30.map((w) => projectedAllowed(eps7, 2 * Math.PI * w * Math.sin(th), w, "TM", 25, 4, kernel));
    const T30 = pts.map((p) => p.T);
    record("T at 30\xB0, 8 rows", T30);
    record("projected-band mask at 30\xB0", allowed.map(Number));
    const forb = T30.filter((_, i) => !allowed[i]);
    const allw = T30.filter((_, i) => allowed[i]);
    return [
      same("forbidden \u03C9 with T < 0.05", `${forb.filter((t) => t < 0.05).length} of ${forb.length}`, `${forb.length} of ${forb.length}`),
      atLeast("allowed \u03C9 with T > 0.05 (fraction)", allw.filter((t) => t > 0.05).length / allw.length, 0.85),
      atMost("max |R + T \u2212 1|", Math.max(...pts.map((p) => Math.abs(p.R + p.T - 1))), 1e-10)
    ];
  }
};
var selfCollimation = {
  id: "3.6",
  section: "\xA73.6",
  title: "Self-collimation of the rod lattice, TM band 1",
  estimateSeconds: 8.9,
  usesKernel: true,
  run(kernel, record = () => {
  }) {
    const eps = inverseEpsilon(RODS, 10);
    const c2 = curvatureAlongGM(eps, "TM", 0, {}, kernel);
    record("\u03C9 along \u0393\u2013M", c2.omega);
    record("\u03C9\u2225 along \u0393\u2013M", c2.omegaPar);
    record("\u03C9\u22A5\u22A5 along \u0393\u2013M", c2.omegaPerp2);
    const sc = selfCollimationPoints(c2);
    const fl = sc.length ? contourFlatness(eps, "TM", 0, sc[0].omega, 1, 11, kernel) : null;
    if (fl) record("contour k\u2225(t) at \u03C9_sc", fl.kPar);
    const flat = fl ? fl.flatHalfWidth : NaN;
    const free = curvatureAlongGM(inverseEpsilon({ lattice: "square", radius: 0.2, epsIn: 1, epsOut: 1 }, 4), "TM", 0, { n: 5 }, kernel);
    const freeErr = Math.max(...free.sOverGM.map((s, i) => {
      const w = s * Math.PI * Math.SQRT2 / (2 * Math.PI);
      return Math.abs(free.omega[i] - w) / w;
    }));
    return [
      same("zeros of \u03C9\u22A5\u22A5 on \u0393\u2013M", String(sc.length), "1"),
      near("\u03C9_sc (a/\u03BB)", sc[0]?.omega ?? NaN, 0.2986, 1e-3),
      near("s/|\u0393M|", sc[0]?.sOverGM ?? NaN, 0.728, 0.01),
      atLeast("flat half-width (1/a)", flat, 0.7),
      atMost("free space: \u03C9\u0303 against |k|/2\u03C0 (relative)", freeErr, 1e-12)
    ];
  }
};
var staliunas = {
  id: "3.7",
  section: "\xA73.7",
  title: "Staliunas & S\xE1nchez-Morcillo 2009: the chirped filter",
  estimateSeconds: 3.5,
  usesKernel: false,
  run(_kernel, record = () => {
  }) {
    const K2 = Array.from({ length: 401 }, (_, i2) => -0.5 + i2 * 25e-4);
    const a = propagateModal(K2, 0.022, constantQ(0.92), 500);
    let i = 0;
    a.T.forEach((t, j) => {
      if (t < a.T[i]) i = j;
    });
    const b = propagateModal(K2, 0.022, linearChirp(0.61, 0.92, 500), 500);
    record("T(K), unchirped", a.T);
    record("T(K), chirped", b.T);
    const band = bandBelow(K2, b.T, 0.5);
    const betas = Array.from({ length: 120 }, (_, j) => Math.exp(Math.log(0.3) + j * (Math.log(40) - Math.log(0.3)) / 119));
    const P = betas.map((x) => twoLevelTransfer(x, 600));
    const out = [
      near("(a) dip at |K|", Math.abs(K2[i]), 0.04, 25e-4),
      same("(b) half-T bands", String(band.length), "1"),
      near("(b) half-T band start", band[0]?.[0] ?? NaN, 0.045, 0.01),
      near("(b) half-T band end", band[0]?.[1] ?? NaN, 0.1925, 0.01),
      near("(b) T(0)", b.T[200], 0.83, 0.01),
      atMost("energy conservation", Math.max(a.energyError, b.energyError), 1e-9)
    ];
    for (const level2 of [0.99, 0.9, 0.5]) {
      const got = threshold(betas, P, level2) ?? NaN;
      out.push(near(
        `two-level threshold for ${level2 * 100} % (sweep \xB1600) vs Landau\u2013Zener`,
        got,
        landauZenerBeta(level2),
        0.03 * landauZenerBeta(level2),
        `${fmt(landauZenerBeta(level2), 4)} \xB1 3 %`
      ));
    }
    return out;
  }
};
var glass = {
  id: "3.8",
  section: "\xA73.8",
  title: "Gailevi\u010Dius 2019: filters in glass",
  estimateSeconds: 0.2,
  usesKernel: false,
  run(_kernel, record = () => {
  }) {
    const geo = { n0: 1.515, lambdaUm: 0.633, dPerpUm: 3 };
    const out = [];
    for (const [Q, want] of [[1.2, 0.8], [1.6, 2.39], [2, 3.99]]) {
      out.push(near(`internal angle, Q\u2225 = ${Q} (\xB0)`, filterAngles(geo, Q).internalDeg, want, 0.01));
    }
    const T = Array.from({ length: 30 }, (_, j) => resonanceT(0.05, 1.6, j + 1));
    const iMin = T.indexOf(Math.min(...T));
    const after = T.slice(iMin);
    out.push(same("dip vs N (f = 0.05): first minimum at N", String(iMin + 1), "8"));
    out.push(same("dip vs N: revival at N", String(iMin + after.indexOf(Math.max(...after)) + 1), "16"));
    const s = { ...geo, dnRel: 0.001939722685139801, N: 30, Q0: 1.2, Q1: 2 };
    const t = filterTransfer(s, 241, 0.6);
    record("dip vs N", T);
    record("T0, chirped N = 30", t.T);
    out.push(atLeast("chirped 1.2 \u2192 2.0, N = 30: T(0)", t.TOnAxis, 0.9));
    out.push(atMost("chirped: min T0", t.minT, 1e-3));
    return out;
  }
};
function filteredBy(modal, beam) {
  const n = beam.n;
  const w = 2 * modal.nl + 1;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let j = 0; j < w; j++) {
    const sh = (j - modal.nl) * 200;
    for (let i = 0; i < n; i++) {
      const t = ((i + sh) % n + n) % n;
      re[t] += modal.re[i * w + j] * beam.specRe[i] - modal.im[i * w + j] * beam.specIm[i];
      im[t] += modal.re[i * w + j] * beam.specIm[i] + modal.im[i * w + j] * beam.specRe[i];
    }
  }
  return { re, im };
}
var noisy = {
  id: "3.9",
  section: "\xA73.9",
  title: "Cleaning a noisy beam; M\xB2",
  estimateSeconds: 1.8,
  usesKernel: false,
  run(_kernel, record = () => {
  }) {
    const modal = propagateModal(noisyBeam().K, 0.022, linearChirp(0.61, 0.92, 500), 500);
    const metrics = (seed) => {
      const beam = noisyBeam({ seed });
      return cleaningMetrics(beam, filteredBy(modal, beam));
    };
    const m1 = metrics(1);
    record("seed 1 metrics", [m1.energyKeptInAperture, m1.energyInBandBefore, m1.energyInBandAfter, m1.M2In, m1.M2Out, m1.M2CleanGaussian]);
    const again = metrics(1);
    const ratios = Array.from({ length: 16 }, (_, i) => {
      const m = i === 0 ? m1 : metrics(i + 1);
      return m.energyInBandBefore / m.energyInBandAfter;
    }).sort((x, y) => x - y);
    const ref = VALIDATION_DATA.noisySeed1;
    const worstRef = Math.max(...Object.keys(ref).map((k) => Math.abs(m1[k] - ref[k])));
    return [
      near("M\xB2 of the clean Gaussian", m1.M2CleanGaussian, 1, 0.02),
      same("seed 1 twice: identical numbers", JSON.stringify(again) === JSON.stringify(m1) ? "identical" : "different", "identical"),
      atMost("seed 1 against the Python port of the generator", worstRef, 1e-6),
      atLeast("band energy before/after, median of seeds 1\u201316", 0.5 * (ratios[7] + ratios[8]), 10)
    ];
  }
};
var limits = {
  id: "3.10",
  section: "\xA73.10",
  title: "Where the paraxial model stops: RCWA at increasing \u0394n",
  estimateSeconds: 2,
  usesKernel: true,
  run(kernel, record = () => {
  }) {
    const th = VALIDATION_DATA.limits.thetaDeg.map((d) => d * Math.PI / 180);
    const out = [];
    for (const row of VALIDATION_DATA.limits.rows.slice(0, 4)) {
      const s = { n0: 1.515, lambdaUm: 0.633, dPerpUm: 3, dnRel: row.dnRel, N: 8, Q0: 1.6, Q1: 1.6 };
      const r = rcwaFilterT0(s, th, 8, 16, kernel);
      const nrm = normalised(s, dParFromQ(s, 1.6), s.dnRel);
      const K2 = th.map((x) => nrm.k * Math.sin(x) / nrm.qPerp);
      const p = propagateModal(K2, nrm.f, constantQ(nrm.Qpar), 8 * 2 * Math.PI / nrm.Qpar, { nl: 4, dZ: 0.02 });
      record(`RCWA T0, \u0394n = ${row.dnRel}`, r.T0);
      record(`RCWA R, \u0394n = ${row.dnRel}`, r.R);
      const rc = "rcwa" in row ? row.rcwa : [];
      const px = "paraxial" in row ? row.paraxial : [];
      out.push(atMost(`\u0394n = ${row.dnRel}: RCWA T0, max difference over 41 angles`, Math.max(...r.T0.map((t, i) => Math.abs(t - rc[i]))), 0.01));
      out.push(atMost(`\u0394n = ${row.dnRel}: paraxial T0, max difference`, Math.max(...p.T.map((t, i) => Math.abs(t - px[i]))), 0.01));
    }
    const levels = VALIDATION_DATA.limits.rows.map((row) => {
      const s = { n0: 1.515, lambdaUm: 0.633, dPerpUm: 3 };
      return couplingRow(normalised(s, dParFromQ(s, 1.6), row.dnRel).f).level;
    });
    out.push(same("validity flags of the eight rows", levels.join(", "), "green, green, amber, amber, amber, red, red, red"));
    return out;
  }
};
var supercollimation = {
  id: "3.11",
  section: "\xA73.11",
  title: "Supercollimation proxy: air holes in silicon, TE band 1",
  estimateSeconds: 3.6,
  usesKernel: true,
  run(kernel, record = () => {
  }) {
    const out = [];
    for (const [key, ref] of Object.entries(VALIDATION_DATA.supercollimation)) {
      const m = /^eps([\d.]+)_.*_r([\d.]+)$/.exec(key);
      const eps = inverseEpsilon({ lattice: "square", radius: Number(m[2]), epsIn: 1, epsOut: Number(m[1]) }, 10);
      const j = Math.floor((ref.sOverGM - 0.04) / 0.02);
      const c2 = curvatureAlongGM(eps, "TE", 0, { n: 4, from: 0.04 + 0.02 * (j - 1), to: 0.04 + 0.02 * (j + 2) }, kernel);
      record(`\u03C9\u22A5\u22A5 samples, ${key}`, c2.omegaPerp2);
      record(`\u03C9 samples, ${key}`, c2.omega);
      const sc = selfCollimationPoints(c2);
      out.push(near(`\u03B5 = ${m[1]}, r/a = ${m[2]}: \u03C9_sc`, sc.length === 1 ? sc[0].omega : NaN, ref.omega, 1e-3));
    }
    return out;
  }
};
var VALIDATION_CASES = [
  rodsGap,
  convergence,
  hexHoles,
  bragg,
  slab,
  slab30,
  selfCollimation,
  staliunas,
  glass,
  noisy,
  limits,
  supercollimation
];
function runValidationCase(c2, kernel = getKernel(), record) {
  const t0 = performance.now();
  try {
    const checks = c2.run(kernel, record);
    return { id: c2.id, section: c2.section, title: c2.title, pass: checks.every((x) => x.pass), checks, seconds: (performance.now() - t0) / 1e3 };
  } catch (err) {
    return {
      id: c2.id,
      section: c2.section,
      title: c2.title,
      pass: false,
      checks: [],
      seconds: (performance.now() - t0) / 1e3,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
function runValidation(ids, kernel = getKernel(), onCase) {
  const t0 = performance.now();
  const list2 = ids ? VALIDATION_CASES.filter((c2) => ids.includes(c2.id)) : VALIDATION_CASES;
  const cases = list2.map((c2, i) => {
    const r = runValidationCase(c2, kernel);
    onCase?.(r, i, list2.length);
    return r;
  });
  const passed = cases.filter((c2) => c2.pass).length;
  return {
    kind: "validation",
    engineVersion: ENGINE_VERSION,
    kernel: kernel.name,
    pass: passed === cases.length && cases.length > 0,
    passed,
    total: cases.length,
    cases,
    seconds: (performance.now() - t0) / 1e3
  };
}

// vendor/pc/src/physics/materials/sellmeier.ts
function fromResonanceWavelengths(A, B, lambdas_um, range_um) {
  return { A, B, C: lambdas_um.map((l) => l * l), range: [range_um[0] * 1e-6, range_um[1] * 1e-6] };
}
function fromPoleForm(Aprime, Bprime, C, range_um, K2 = 0) {
  const B = Bprime.map((b, i) => b / C[i]);
  const model = { A: Aprime - B.reduce((s, b) => s + b, 0), B, C, range: [range_um[0] * 1e-6, range_um[1] * 1e-6] };
  return K2 === 0 ? model : { ...model, K: K2 };
}
function fromSquaredForm(A, B, C, range_um) {
  return { A, B, C, range: [range_um[0] * 1e-6, range_um[1] * 1e-6] };
}

// vendor/pc/src/physics/materials/sellmeier-data.ts
var MATERIALS = {
  fusedSilica: {
    name: "Fused silica (SiO\u2082)",
    // Malitson measured 0.21–3.71 µm; the fit is not validated beyond (review 2026-11 P2-M7).
    model: fromResonanceWavelengths(1, [0.6961663, 0.4079426, 0.8974794], [0.0684043, 0.1162414, 9.896161], [0.21, 3.71]),
    reference: "I. H. Malitson, J. Opt. Soc. Am. 55, 1205 (1965)",
    temperature_C: 20
  },
  caf2: {
    name: "Calcium fluoride (CaF\u2082)",
    model: fromResonanceWavelengths(1, [0.5675888, 0.4710914, 3.8484723], [0.050263605, 0.1003909, 34.64904], [0.23, 9.7]),
    reference: "I. H. Malitson, Appl. Opt. 2, 1103 (1963)",
    temperature_C: 24
  },
  baf2: {
    name: "Barium fluoride (BaF\u2082)",
    model: fromResonanceWavelengths(1, [0.643356, 0.506762, 3.8261], [0.057789, 0.10968, 46.3864], [0.2652, 10.346]),
    reference: "I. H. Malitson, J. Opt. Soc. Am. 54, 628 (1964)",
    temperature_C: 25
  },
  mgf2: {
    name: "Magnesium fluoride (MgF\u2082, ordinary)",
    model: fromResonanceWavelengths(1, [0.48755108, 0.39875031, 2.3120353], [0.04338408, 0.09461442, 23.793604], [0.2, 7]),
    reference: "M. J. Dodge, Appl. Opt. 23, 1980 (1984)",
    temperature_C: 19
  },
  nacl: {
    name: "Sodium chloride (NaCl)",
    model: fromResonanceWavelengths(
      1.00055,
      [0.198, 0.48398, 0.38696, 0.25998, 0.08796, 3.17064, 0.30038],
      [0.05, 0.1, 0.128, 0.158, 40.5, 60.98, 120.34],
      [0.2, 30]
    ),
    reference: "H. H. Li, J. Phys. Chem. Ref. Data 5, 329 (1976)",
    temperature_C: 24
  },
  lif: {
    name: "Lithium fluoride (LiF)",
    model: fromResonanceWavelengths(1, [0.92549, 6.96747], [0.07376, 32.79], [0.1, 11]),
    reference: "H. H. Li, J. Phys. Chem. Ref. Data 5, 329 (1976), doi:10.1063/1.555536",
    temperature_C: 24
  },
  kbr: {
    name: "Potassium bromide (KBr)",
    model: fromResonanceWavelengths(
      1.39408,
      [0.79221, 0.01981, 0.15587, 0.17673, 2.06217],
      [0.146, 0.173, 0.187, 60.61, 87.72],
      [0.2, 42]
    ),
    reference: "H. H. Li, J. Phys. Chem. Ref. Data 5, 329 (1976), doi:10.1063/1.555536",
    temperature_C: 24
  },
  csi: {
    name: "Caesium iodide (CsI)",
    model: fromResonanceWavelengths(
      1.27587,
      [0.68689, 0.2609, 0.06256, 0.06527, 0.14991, 0.51818, 0.01918, 3.38229],
      [0.13, 0.147, 0.163, 0.177, 0.185, 0.206, 0.218, 161.29],
      [0.25, 67]
    ),
    reference: "H. H. Li, J. Phys. Chem. Ref. Data 5, 329 (1976), doi:10.1063/1.555536",
    temperature_C: 24
  },
  krs5: {
    // Table III, 25 °C; fitted to their measurements from 0.5770 to 39.38 µm (Table I residuals ≤ 2e-4).
    name: "Thallium bromide iodide (KRS-5)",
    model: fromSquaredForm(
      1,
      [1.8293958, 1.6675593, 1.1210424, 0.04513366, 12.380234],
      [0.0225, 0.0625, 0.1225, 0.2025, 27089.737],
      [0.577, 39.38]
    ),
    reference: "W. S. Rodney, I. H. Malitson, J. Opt. Soc. Am. 46, 956 (1956), doi:10.1364/JOSA.46.000956",
    temperature_C: 25
  },
  as2s3: {
    name: "Arsenic trisulfide glass (As\u2082S\u2083)",
    model: fromSquaredForm(
      1,
      [1.8983678, 1.9222979, 0.8765134, 0.1188704, 0.9569903],
      [0.0225, 0.0625, 0.1225, 0.2025, 750],
      [0.57, 11.8]
    ),
    reference: "W. S. Rodney, I. H. Malitson, T. A. King, J. Opt. Soc. Am. 48, 633 (1958), doi:10.1364/JOSA.48.000633",
    temperature_C: 25
  },
  zblan: {
    name: "ZBLAN fluoride glass",
    model: fromResonanceWavelengths(1, [1.22514, 1.52898], [0.08969, 21.3825], [0.365, 3.5]),
    reference: "F. Gan, J. Non-Cryst. Solids 184, 9 (1995), doi:10.1016/0022-3093(94)00592-3",
    temperature_C: null
  },
  amtir1: {
    name: "AMTIR-1 chalcogenide glass (Ge\u2083\u2083As\u2081\u2082Se\u2085\u2085)",
    model: fromSquaredForm(1, [4.80213322, 0.503764838, 1.02792518], [0.054171865, 0.25030573, 1488.91047], [1, 14]),
    reference: "Amorphous Materials Inc., AMTIR-1 data sheet (2024-11-21), Sellmeier fit of M3-MSI data",
    temperature_C: 22
  },
  ge: {
    name: "Germanium (Ge)",
    model: fromSquaredForm(1, [0.4886331, 14.5142535, 91224e-7], [1.393959, 0.1626427, 752.19], [2, 14]),
    reference: "J. H. Burnett et al., Proc. SPIE 9974, 99740X (2016)",
    temperature_C: 22
  },
  si: {
    name: "Silicon (Si)",
    model: fromResonanceWavelengths(1, [10.6684293, 0.0030434748, 1.54133408], [0.301516485, 1.13475115, 1104], [1.357, 11.04]),
    reference: "C. D. Salzberg, J. J. Villa, J. Opt. Soc. Am. 47, 244 (1957); fit by B. Tatian, Appl. Opt. 23, 4477 (1984)",
    temperature_C: 26
  },
  znse: {
    name: "Zinc selenide (ZnSe, CVD)",
    model: fromResonanceWavelengths(1, [4.45813734, 0.467216334, 2.8956629], [0.200859853, 0.391371166, 47.1362108], [0.54, 18.2]),
    reference: "J. Connolly et al., Proc. SPIE 181, 141 (1979); fit by B. Tatian, Appl. Opt. 23, 4477 (1984)",
    temperature_C: 23
  },
  zns: {
    name: "Zinc sulfide (ZnS, cubic CVD)",
    // Published as n² = 8.393 + 0.14383/(λ² − 0.2421²) + 4430.99/(λ² − 36.71²).
    model: fromPoleForm(8.393, [0.14383, 4430.99], [0.2421 ** 2, 36.71 ** 2], [0.405, 13]),
    reference: "M. Debenham, Appl. Opt. 23, 2238 (1984)",
    temperature_C: 20
  },
  diamond: {
    name: "Diamond (C)",
    // Peter measured 226–644 nm; the formula is not defined past that.
    model: fromResonanceWavelengths(1, [0.3306, 4.3356], [0.175, 0.106], [0.226, 0.644]),
    reference: "F. Peter, Z. Phys. 15, 358 (1923), doi:10.1007/BF01330487",
    temperature_C: null
  }
};
var SCHOTT_REFERENCE = "SCHOTT optical glass catalog (Zemax AGF 2017-01-20)";
function schott(name2, B, C, range_um, nd, vd, density, thermal) {
  return { name: name2, model: fromSquaredForm(1, B, C, range_um), reference: SCHOTT_REFERENCE, temperature_C: 20, nd, vd, density, thermal };
}
var SCHOTT_GLASSES = {
  "N-BK7": schott(
    "N-BK7",
    [1.03961212, 0.231792344, 1.01046945],
    [0.00600069867, 0.0200179144, 103.560653],
    [0.3, 2.5],
    1.5168,
    64.17,
    2510,
    [186e-8, 131e-10, -137e-13, 434e-9, 627e-12, 0.17]
  ),
  "N-FK5": schott(
    "N-FK5",
    [0.844309338, 0.344147824, 0.910790213],
    [0.00475111955, 0.0149814849, 97.8600293],
    [0.26, 2.5],
    1.48749,
    70.41,
    2450,
    [-724e-8, 158e-10, -951e-14, 351e-9, 461e-12, 0.156]
  ),
  "N-BAK4": schott(
    "N-BAK4",
    [1.28834642, 0.132817724, 0.945395373],
    [0.00779980626, 0.0315631177, 105.965875],
    [0.334, 2.5],
    1.56883,
    55.98,
    3046,
    [306e-8, 144e-10, -223e-13, 546e-9, 605e-12, 0.189]
  ),
  "N-SK16": schott(
    "N-SK16",
    [1.34317774, 0.241144399, 0.994317969],
    [0.00704687339, 0.0229005, 92.7508526],
    [0.31, 2.5],
    1.62041,
    60.32,
    3580,
    [-237e-10, 132e-10, -129e-13, 409e-9, 517e-12, 0.17]
  ),
  "N-LAK9": schott(
    "N-LAK9",
    [1.46231905, 0.344399589, 1.15508372],
    [0.00724270156, 0.0243353131, 85.4686868],
    [0.3, 2.5],
    1.691,
    54.71,
    3510,
    [211e-8, 111e-10, 182e-14, 474e-9, -347e-12, 0.146]
  ),
  LLF1: schott(
    "LLF1",
    [1.21640125, 0.13366454, 0.883399468],
    [0.00857807248, 0.0420143003, 107.59306],
    [0.31, 2.5],
    1.54814,
    45.75,
    2940,
    [325e-9, 174e-10, -612e-13, 653e-9, 258e-12, 0.233]
  ),
  F2: schott(
    "F2",
    [1.34533359, 0.209073176, 0.937357162],
    [0.00997743871, 0.0470450767, 111.886764],
    [0.32, 2.5],
    1.62004,
    36.37,
    3599,
    [151e-8, 156e-10, -278e-13, 934e-9, 104e-11, 0.25]
  ),
  "N-LASF9": schott(
    "N-LASF9",
    [2.00029547, 0.298926886, 1.80691843],
    [0.0121426017, 0.0538736236, 156.530829],
    [0.365, 2.5],
    1.85025,
    32.17,
    4410,
    [105e-8, 102e-10, -238e-13, 919e-9, 118e-11, 0.257]
  ),
  "N-SF11": schott(
    "N-SF11",
    [1.73759695, 0.313747346, 1.89878101],
    [0.013188707, 0.0623068142, 155.23629],
    [0.37, 2.5],
    1.78472,
    25.68,
    3224,
    [-356e-8, 92e-10, -21e-12, 965e-9, 144e-11, 0.294]
  ),
  "N-SF6": schott(
    "N-SF6",
    [1.77931763, 0.338149866, 2.08734474],
    [0.0133714182, 0.0617533621, 174.01759],
    [0.37, 2.5],
    1.80518,
    25.36,
    3369,
    [-493e-8, 702e-11, -24e-12, 984e-9, 154e-11, 0.29]
  )
};

// packages/engine/src/records.ts
var DOI = /^10\.\d{4,9}\/\S+$/;
function validateRecord(r) {
  const e = [];
  const o = r ?? {};
  if (typeof o.id !== "string" || !/^[a-z0-9-]+$/.test(o.id)) e.push("id: lower-case letters, digits and dashes");
  if (typeof o.name !== "string" || !o.name) e.push("name: required");
  if (o.kind !== "material" && o.kind !== "preset") e.push("kind: material or preset");
  if (!Array.isArray(o.sources)) e.push("sources: an array");
  for (const [i, s] of (o.sources ?? []).entries()) {
    if (typeof s.citation !== "string" || !s.citation) e.push(`sources[${i}].citation: required`);
    if (s.doi !== null && !(typeof s.doi === "string" && DOI.test(s.doi))) e.push(`sources[${i}].doi: null or a DOI (10.xxxx/\u2026)`);
    if (typeof s.verified !== "boolean") e.push(`sources[${i}].verified: boolean`);
    if (s.verified && !s.checked_on) e.push(`sources[${i}]: verified without checked_on`);
    if (s.checked_on !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(s.checked_on))) e.push(`sources[${i}].checked_on: null or YYYY-MM-DD`);
    if (typeof s.what_it_supports !== "string") e.push(`sources[${i}].what_it_supports: required`);
  }
  if (o.kind === "preset") {
    if (!VIEWS.includes(o.screen)) e.push("screen: one of the views");
    if (typeof o.available !== "boolean") e.push("available: boolean");
    if (!o.state || typeof o.state !== "object") e.push("state: an object");
    if (!Array.isArray(o.parameters)) e.push("parameters: an array");
    if (!Array.isArray(o.sources) || o.sources.length === 0) e.push("a preset needs at least one source");
    for (const [i, p] of (o.parameters ?? []).entries()) {
      if (typeof p.name !== "string" || typeof p.value !== "string" || typeof p.verified !== "boolean") e.push(`parameters[${i}]: name, value, verified`);
    }
  }
  if (o.kind === "material") {
    const m = o.material ?? {};
    if (!(typeof m.eps === "number" || typeof m.n === "number" || typeof m.sellmeier === "string")) e.push("material: eps, n or sellmeier");
  }
  return e;
}
function badges(r) {
  const withDoi = r.sources.filter((s) => s.doi);
  return {
    doiChecked: withDoi.length > 0 && withDoi.every((s) => s.verified),
    hasSourceWithoutDoi: r.sources.some((s) => !s.doi),
    unverifiedSources: r.sources.filter((s) => !s.verified).length,
    unverifiedParameters: r.kind === "preset" ? r.parameters.filter((p) => !p.verified).length : 0
  };
}
function merge(base, patch) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return patch === void 0 ? base : patch;
  const out = { ...base && typeof base === "object" ? base : {} };
  for (const [k, v] of Object.entries(patch)) out[k] = merge(out[k], v);
  return out;
}
function presetState(p, from = DEFAULT_STATE) {
  const mode = p.state.mode ?? (p.screen === "filter" ? from.mode : "2d");
  return normaliseState(merge({ ...from, mode }, { ...p.state, view: p.screen === "crystal" && mode === "1d" ? "crystal" : p.screen }));
}

// packages/kernel-wasm/pkg/lattice_kernel.js
function eig_herm(re, im, n) {
  const ptr0 = passArrayF64ToWasm0(re, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(im, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.eig_herm(ptr0, len0, ptr1, len1, n);
  if (ret[3]) {
    throw takeFromExternrefTable0(ret[2]);
  }
  var v3 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v3;
}
function eig_sym(a, n) {
  const ptr0 = passArrayF64ToWasm0(a, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.eig_sym(ptr0, len0, n);
  if (ret[3]) {
    throw takeFromExternrefTable0(ret[2]);
  }
  var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v2;
}
function eigvals_herm(re, im, n, count) {
  const ptr0 = passArrayF64ToWasm0(re, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(im, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.eigvals_herm(ptr0, len0, ptr1, len1, n, isLikeNone(count) ? Number.MAX_SAFE_INTEGER : count >>> 0);
  if (ret[3]) {
    throw takeFromExternrefTable0(ret[2]);
  }
  var v3 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v3;
}
function eigvals_sym(a, n, count) {
  const ptr0 = passArrayF64ToWasm0(a, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.eigvals_sym(ptr0, len0, n, isLikeNone(count) ? Number.MAX_SAFE_INTEGER : count >>> 0);
  if (ret[3]) {
    throw takeFromExternrefTable0(ret[2]);
  }
  var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v2;
}
function fft22(re, im, rows, cols, inverse) {
  var ptr0 = passArrayF64ToWasm0(re, wasm.__wbindgen_malloc);
  var len0 = WASM_VECTOR_LEN;
  var ptr1 = passArrayF64ToWasm0(im, wasm.__wbindgen_malloc);
  var len1 = WASM_VECTOR_LEN;
  const ret = wasm.fft2(ptr0, len0, re, ptr1, len1, im, rows, cols, inverse);
  if (ret[1]) {
    throw takeFromExternrefTable0(ret[0]);
  }
}
function star_product(a, b, n) {
  const ptr0 = passArrayF64ToWasm0(a, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(b, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.star_product(ptr0, len0, ptr1, len1, n);
  if (ret[3]) {
    throw takeFromExternrefTable0(ret[2]);
  }
  var v3 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v3;
}
function __wbg_get_imports() {
  const import0 = {
    __proto__: null,
    __wbg_Error_30c8987f7c2ed4e2: function(arg0, arg1) {
      const ret = Error(getStringFromWasm0(arg0, arg1));
      return ret;
    },
    __wbg___wbindgen_copy_to_typed_array_88899a52af046901: function(arg0, arg1, arg2) {
      new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(getArrayU8FromWasm0(arg0, arg1));
    },
    __wbindgen_init_externref_table: function() {
      const table = wasm.__wbindgen_externrefs;
      const offset = table.grow(4);
      table.set(0, void 0);
      table.set(offset + 0, void 0);
      table.set(offset + 1, null);
      table.set(offset + 2, true);
      table.set(offset + 3, false);
    }
  };
  return {
    __proto__: null,
    "./lattice_kernel_bg.js": import0
  };
}
function getArrayF64FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}
function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}
var cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
  if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
    cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
  }
  return cachedFloat64ArrayMemory0;
}
function getStringFromWasm0(ptr, len) {
  return decodeText(ptr >>> 0, len);
}
var cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
  if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}
function isLikeNone(x) {
  return x === void 0 || x === null;
}
function passArrayF64ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 8, 8) >>> 0;
  getFloat64ArrayMemory0().set(arg, ptr / 8);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}
function takeFromExternrefTable0(idx) {
  const value = wasm.__wbindgen_externrefs.get(idx);
  wasm.__externref_table_dealloc(idx);
  return value;
}
var cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
var MAX_SAFARI_DECODE_BYTES = 2146435072;
var numBytesDecoded = 0;
function decodeText(ptr, len) {
  numBytesDecoded += len;
  if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
    cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
    cachedTextDecoder.decode();
    numBytesDecoded = len;
  }
  return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
var WASM_VECTOR_LEN = 0;
var wasmModule;
var wasmInstance;
var wasm;
function __wbg_finalize_init(instance, module) {
  wasmInstance = instance;
  wasm = instance.exports;
  wasmModule = module;
  cachedFloat64ArrayMemory0 = null;
  cachedUint8ArrayMemory0 = null;
  wasm.__wbindgen_start();
  return wasm;
}
function initSync(module) {
  if (wasm !== void 0) return wasm;
  if (module !== void 0) {
    if (Object.getPrototypeOf(module) === Object.prototype) {
      ({ module } = module);
    } else {
      console.warn("using deprecated parameters for `initSync()`; pass a single object instead");
    }
  }
  const imports = __wbg_get_imports();
  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module);
  }
  const instance = new WebAssembly.Instance(module, imports);
  return __wbg_finalize_init(instance, module);
}

// packages/kernel-wasm/src/index.ts
function pack(s) {
  const nn = s.n * s.n;
  const out = new Float64Array(8 * nn);
  [s.s11, s.s12, s.s21, s.s22].forEach((m, i) => {
    out.set(m.re.subarray(0, nn), 2 * i * nn);
    out.set(m.im.subarray(0, nn), (2 * i + 1) * nn);
  });
  return out;
}
function unpack(buf, n) {
  const nn = n * n;
  const m = (i) => ({ n, re: buf.subarray(2 * i * nn, (2 * i + 1) * nn), im: buf.subarray((2 * i + 1) * nn, (2 * i + 2) * nn) });
  return { n, s11: m(0), s12: m(1), s21: m(2), s22: m(3) };
}
var wasmKernel = Object.freeze({
  name: "wasm",
  eigvalsSym: (a, n, count) => eigvals_sym(a, n, count),
  eigSym: (a, n) => {
    const out = eig_sym(a, n);
    return { values: out.subarray(0, n), vectors: out.subarray(n, n + n * n) };
  },
  eigvalsHerm: (re, im, n, count) => eigvals_herm(re, im, n, count),
  eigHerm: (re, im, n) => {
    const out = eig_herm(re, im, n);
    return { values: out.subarray(0, n), vectorsRe: out.subarray(n, n + n * n), vectorsIm: out.subarray(n + n * n, n + 2 * n * n) };
  },
  starProduct: (a, b) => {
    if (a.n !== b.n) throw new RangeError(`starProduct: sizes ${a.n} and ${b.n} differ`);
    return unpack(star_product(pack(a), pack(b), a.n), a.n);
  },
  fft2: (re, im, rows, cols, inverse = false) => fft22(re, im, rows, cols, inverse)
});
function wasmKernelFromBytes(bytes) {
  const module = bytes instanceof WebAssembly.Module ? bytes : new WebAssembly.Module(bytes);
  initSync({ module });
  return wasmKernel;
}

// apps/mcp/src/limits.ts
var LIMITS2 = {
  /** N = (2M+1)² plane waves: M ≤ 15. */
  planeWaves: 961,
  kPoints: 121,
  bands: 8,
  gapMapValues: 32,
  /** The gap map solves count × 2 polarisations × 61 k-points: N ≤ 441 (M ≤ 10) keeps it inside the time limit. */
  gapMapPlaneWaves: 441,
  /** The isofrequency tool solves the 231-point wedge and the Γ–M curvature: N ≤ 441 (M ≤ 10). */
  isofrequencyPlaneWaves: 441,
  /** 2M + 1 RCWA harmonics. */
  rcwaHarmonics: 41,
  rcwaRows: 32,
  rcwaSlices: 32,
  slabPoints: 256,
  sweepValues: 16,
  fitSeries: 64,
  periods: 2e3,
  /** The sum of the case estimates of one get_validation_report call. */
  validationSeconds: 50,
  timeoutSeconds: 60
};
var APP_URL = "https://lattice.photonicscalculators.com";
var REPO_URL = "https://github.com/Lazfiz/lattice-sim";
function permalink(state) {
  const q2 = stateQuery(state);
  return q2 ? `${APP_URL}/?${q2}` : `${APP_URL}/`;
}
var stateFrom = (patch) => normaliseState({ ...DEFAULT_STATE, ...patch });
var InputError = class extends Error {
};
var Refusal = class extends Error {
  constructor(reason, link) {
    super(`Refused: ${reason} This endpoint's limits are those of SPEC \xA74.3. The permalink opens the same structure in the browser app, which runs the computation on your machine: ${link}`);
    this.reason = reason;
    this.link = link;
  }
  reason;
  link;
};
function num(args2, key, spec = {}) {
  const raw = args2[key];
  if (raw === void 0 || raw === null) {
    if (spec.default !== void 0) return spec.default;
    throw new InputError(`${key} is required.`);
  }
  if (typeof raw !== "number" || !Number.isFinite(raw)) throw new InputError(`${key} must be a finite number.`);
  if (spec.integer && !Number.isInteger(raw)) throw new InputError(`${key} must be an integer.`);
  const lo = spec.min ?? -Infinity;
  const hi = spec.max ?? Infinity;
  if ((spec.exclusiveMin ? raw <= lo : raw < lo) || raw > hi) {
    throw new InputError(`${key} must be ${spec.exclusiveMin ? "greater than" : "at least"} ${lo}${Number.isFinite(hi) ? ` and at most ${hi}` : ""} (got ${raw}).`);
  }
  return raw;
}
var optNum = (args2, key, spec = {}) => args2[key] === void 0 || args2[key] === null ? null : num(args2, key, spec);
function choice(args2, key, options, fallback) {
  const raw = args2[key];
  if (raw === void 0 || raw === null) {
    if (fallback !== void 0) return fallback;
    throw new InputError(`${key} is required: one of ${options.join(", ")}.`);
  }
  if (typeof raw !== "string" || !options.includes(raw)) throw new InputError(`${key} must be one of ${options.join(", ")}.`);
  return raw;
}
function bool(args2, key, fallback) {
  const raw = args2[key];
  if (raw === void 0 || raw === null) return fallback;
  if (typeof raw !== "boolean") throw new InputError(`${key} must be true or false.`);
  return raw;
}
function list(args2, key) {
  const raw = args2[key];
  if (raw === void 0 || raw === null) return null;
  if (!Array.isArray(raw)) throw new InputError(`${key} must be an array.`);
  return raw;
}
var round = (x, digits) => Number.isFinite(x) ? Number(x.toFixed(digits)) : x;
var sig = (x, digits = 4) => Number.isFinite(x) && x !== 0 ? Number(x.toPrecision(digits)) : x;
var roundT = (x) => Math.abs(x) < 1e-3 ? sig(x, 4) : round(x, 4);

// data/presets/index.json
var presets_default = {
  note: "The presets of SPEC \xA75.3, in the order shown. Written with the records; scripts/crossref.ts updates the sources.",
  presets: [
    "square-rods-tm-gap",
    "hex-holes-complete-gap",
    "hex-holes-te-gap",
    "quarter-wave-bragg",
    "eight-rows",
    "self-collimation-rods",
    "supercollimation-si-slab",
    "chirped-filter-normalised",
    "glass-633",
    "glass-970",
    "paraxial-fails"
  ]
};

// data/presets/square-rods-tm-gap.json
var square_rods_tm_gap_default = {
  id: "square-rods-tm-gap",
  name: "Square rods, TM gap",
  kind: "preset",
  available: true,
  screen: "bands",
  state: {
    structure: {
      lattice: "square",
      radius: 0.2,
      epsIn: 8.9,
      epsOut: 1
    },
    polarisation: "both",
    M: 7
  },
  look_at: "The TM gap between bands 1 and 2, bounded by band 1 at M and band 2 at X; no TE gap among the lowest bands.",
  parameters: [
    {
      name: "lattice",
      value: "square, a",
      verified: true,
      note: "SPEC \xA73.1"
    },
    {
      name: "r/a",
      value: "0.2",
      verified: true,
      note: "SPEC \xA73.1"
    },
    {
      name: "\u03B5 (rods)",
      value: "8.9",
      verified: true,
      note: "SPEC \xA73.1"
    },
    {
      name: "book's gap/midgap",
      value: "not yet read",
      verified: false,
      note: "SPEC \xA78 item 1: the book value is (verify); the computed 31.4 % stands on its own"
    }
  ],
  sources: [
    {
      citation: "J. D. Joannopoulos, S. G. Johnson, J. N. Winn, R. D. Meade, Photonic Crystals: Molding the Flow of Light, 2nd ed. (Princeton University Press, 2008), ch. 5",
      doi: null,
      url: null,
      isbn: "978-0-691-12456-8",
      what_it_supports: "the structure and its TM gap (the book's figure of the square lattice of dielectric columns)",
      verified: false,
      checked_on: null,
      expect: {
        title: "Photonic Crystals: Molding the Flow of Light",
        year: 2008,
        first_author: "Joannopoulos"
      },
      note: "A book: Crossref may hold a DOI for it (the script searches by title and reports candidates); none is recorded until one is checked."
    }
  ],
  published: "0.32 to 0.44 c/a (the owner's note); computed 0.3224 to 0.4425, 31.4 %"
};

// data/presets/hex-holes-complete-gap.json
var hex_holes_complete_gap_default = {
  id: "hex-holes-complete-gap",
  name: "Triangular holes, complete gap",
  kind: "preset",
  available: true,
  screen: "bands",
  state: {
    structure: {
      lattice: "hex",
      radius: 0.48,
      epsIn: 1,
      epsOut: 13
    },
    polarisation: "both",
    M: 7
  },
  look_at: "A frequency range forbidden for both polarisations: the TE gap of bands 1\u20132 overlaps the TM gap of bands 2\u20133.",
  parameters: [
    {
      name: "lattice",
      value: "hexagonal (triangular)",
      verified: true
    },
    {
      name: "r/a",
      value: "0.48",
      verified: true,
      note: "SPEC \xA73.3"
    },
    {
      name: "\u03B5 (background)",
      value: "13",
      verified: true,
      note: "SPEC \xA73.3"
    },
    {
      name: "book's complete-gap width",
      value: "not yet read",
      verified: false,
      note: "SPEC \xA78 item 1"
    }
  ],
  sources: [
    {
      citation: "J. D. Joannopoulos, S. G. Johnson, J. N. Winn, R. D. Meade, Photonic Crystals: Molding the Flow of Light, 2nd ed. (Princeton University Press, 2008), ch. 5",
      doi: null,
      url: null,
      isbn: "978-0-691-12456-8",
      what_it_supports: "the triangular lattice of air columns with a complete gap",
      verified: false,
      checked_on: null,
      expect: {
        title: "Photonic Crystals: Molding the Flow of Light",
        year: 2008,
        first_author: "Joannopoulos"
      },
      note: "A book: Crossref may hold a DOI for it (the script searches by title and reports candidates); none is recorded until one is checked."
    }
  ],
  published: "computed 0.4298 to 0.5201 (19.0 %) at M = 8"
};

// data/presets/hex-holes-te-gap.json
var hex_holes_te_gap_default = {
  id: "hex-holes-te-gap",
  name: "Triangular holes, TE gap",
  kind: "preset",
  available: true,
  screen: "bands",
  state: {
    structure: {
      lattice: "hex",
      radius: 0.3,
      epsIn: 1,
      epsOut: 13
    },
    polarisation: "TE",
    M: 7
  },
  look_at: "The TE gap used by slab devices; no TM gap at this radius.",
  parameters: [
    {
      name: "r/a",
      value: "0.30",
      verified: true,
      note: "SPEC \xA73.3"
    },
    {
      name: "\u03B5 (background)",
      value: "13",
      verified: true,
      note: "SPEC \xA73.3"
    }
  ],
  sources: [
    {
      citation: "J. D. Joannopoulos, S. G. Johnson, J. N. Winn, R. D. Meade, Photonic Crystals: Molding the Flow of Light, 2nd ed. (Princeton University Press, 2008), ch. 5",
      doi: null,
      url: null,
      isbn: "978-0-691-12456-8",
      what_it_supports: "the triangular lattice of air columns, TE gap",
      verified: false,
      checked_on: null,
      expect: {
        title: "Photonic Crystals: Molding the Flow of Light",
        year: 2008,
        first_author: "Joannopoulos"
      },
      note: "A book: Crossref may hold a DOI for it (the script searches by title and reports candidates); none is recorded until one is checked."
    }
  ],
  published: "computed 0.1990 to 0.2644 (28.2 %) at M = 8"
};

// data/presets/quarter-wave-bragg.json
var quarter_wave_bragg_default = {
  id: "quarter-wave-bragg",
  name: "Quarter-wave Bragg mirror",
  kind: "preset",
  available: true,
  screen: "crystal",
  state: {
    mode: "1d",
    stack: {
      nH: 2.3,
      nL: 1.45,
      lambda0Nm: 1e3,
      periods: 20,
      incident: 1,
      exit: 1
    }
  },
  look_at: "|cos K\u039B| > 1 inside the first gap; T at the design wavelength falls by (nL/nH)\xB2 per period.",
  parameters: [
    {
      name: "nH, nL",
      value: "2.3, 1.45",
      verified: true,
      note: "SPEC \xA73.4"
    },
    {
      name: "quarter-wave at \u03BB0",
      value: "yes",
      verified: true,
      note: "SPEC \xA73.4"
    }
  ],
  sources: [
    {
      citation: "P. Yeh, A. Yariv, C.-S. Hong, J. Opt. Soc. Am. 67, 423 (1977)",
      doi: "10.1364/JOSA.67.000423",
      url: null,
      isbn: null,
      what_it_supports: "the Bloch dispersion of a periodic bilayer",
      verified: true,
      checked_on: "2026-11-21",
      expect: {
        journal: "Journal of the Optical Society of America",
        volume: "67",
        page: "423",
        year: 1977,
        first_author: "Yeh"
      },
      note: "The DOI is the one recorded in the vendored photonics-calculators file thin-film/photonic-crystal.ts."
    }
  ],
  published: "first gap/midgap (4/\u03C0) asin(0.85/3.75) = 0.291131; T(20 periods, midgap) = 3.87e-8"
};

// data/presets/eight-rows.json
var eight_rows_default = {
  id: "eight-rows",
  name: "Eight rows of rods",
  kind: "preset",
  available: true,
  screen: "slab",
  state: {
    structure: {
      lattice: "square",
      radius: 0.2,
      epsIn: 8.9,
      epsOut: 1
    },
    slab: {
      rows: 8,
      thetaDeg: 0,
      nRef: 1,
      omegaMin: 0.2,
      omegaMax: 0.55,
      points: 141,
      harmonics: 12,
      slices: 16
    }
  },
  look_at: "Transmission against the projected bands: the stop band runs from band 1 at X to band 2 at X.",
  parameters: [
    {
      name: "rows",
      value: "8",
      verified: true,
      note: "SPEC \xA73.5"
    },
    {
      name: "harmonics, slices",
      value: "25, 16 per row",
      verified: true,
      note: "SPEC \xA72.5"
    }
  ],
  sources: [
    {
      citation: "M. G. Moharam, T. K. Gaylord, J. Opt. Soc. Am. 71, 811 (1981)",
      doi: "10.1364/josa.71.000811",
      url: null,
      isbn: null,
      what_it_supports: "RCWA of planar gratings",
      verified: true,
      checked_on: "2026-11-21",
      expect: {
        journal: "Journal of the Optical Society of America",
        volume: "71",
        page: "811",
        year: 1981,
        first_author: "Moharam"
      }
    },
    {
      citation: "J. D. Joannopoulos, S. G. Johnson, J. N. Winn, R. D. Meade, Photonic Crystals: Molding the Flow of Light, 2nd ed. (Princeton University Press, 2008), ch. 5",
      doi: null,
      url: null,
      isbn: "978-0-691-12456-8",
      what_it_supports: "the crystal (SPEC \xA73.1)",
      verified: false,
      checked_on: null,
      expect: {
        title: "Photonic Crystals: Molding the Flow of Light",
        year: 2008,
        first_author: "Joannopoulos"
      },
      note: "A book: Crossref may hold a DOI for it (the script searches by title and reports candidates); none is recorded until one is checked."
    }
  ],
  published: "this document, SPEC \xA73.5: T < 1e-2 from 0.280 to 0.442"
};

// data/presets/self-collimation-rods.json
var self_collimation_rods_default = {
  id: "self-collimation-rods",
  name: "Self-collimation in rods",
  kind: "preset",
  available: true,
  screen: "isofreq",
  state: {
    structure: {
      lattice: "square",
      radius: 0.2,
      epsIn: 8.9,
      epsOut: 1
    },
    polarisation: "TM",
    M: 7,
    isofreq: {
      band: 1,
      nk: 41,
      omega: null
    }
  },
  look_at: "The contour at \u03C9_sc is a straight line across \u0393\u2013M: D = 0, the crystal cancels diffraction.",
  parameters: [
    {
      name: "structure",
      value: "SPEC \xA73.1 rods",
      verified: true
    },
    {
      name: "published \u03C9_sc for this lattice",
      value: "not yet read",
      verified: false,
      note: "SPEC \xA78 item 11 (Witzens, Lon\u010Dar & Scherer 2002 is the likely source)"
    }
  ],
  sources: [
    {
      citation: "H. Kosaka et al., Appl. Phys. Lett. 74, 1212 (1999)",
      doi: "10.1063/1.123502",
      url: null,
      isbn: null,
      what_it_supports: "self-collimation in photonic crystals (the effect)",
      verified: true,
      checked_on: "2026-11-21",
      expect: {
        journal: "Applied Physics Letters",
        volume: "74",
        page: "1212",
        year: 1999,
        first_author: "Kosaka"
      }
    }
  ],
  published: "computed \u03C9_sc = 0.2986 at s/|\u0393M| = 0.728 (M = 10)"
};

// data/presets/supercollimation-si-slab.json
var supercollimation_si_slab_default = {
  id: "supercollimation-si-slab",
  name: "Supercollimation in a silicon slab (2D proxy)",
  kind: "preset",
  available: true,
  screen: "isofreq",
  state: {
    structure: {
      lattice: "square",
      radius: 0.3,
      epsIn: 1,
      epsOut: 8.4
    },
    polarisation: "TE",
    M: 7,
    isofreq: {
      band: 1,
      nk: 41,
      omega: null
    }
  },
  look_at: "A 2D TE proxy of a slab device: holes in an effective-index background of \u03B5 = 8.4. It brackets the published a/\u03BB \u2248 0.233; it does not reproduce a slab.",
  parameters: [
    {
      name: "a",
      value: "\u2248 350 nm",
      verified: false,
      note: "SPEC \xA73.11 (verify)"
    },
    {
      name: "\u03BB",
      value: "\u2248 1500 nm",
      verified: false,
      note: "SPEC \xA73.11 (verify)"
    },
    {
      name: "r/a",
      value: "0.30",
      verified: false,
      note: "chosen for the proxy (SPEC \xA73.11 table); the paper's value is (verify)"
    },
    {
      name: "slab thickness, effective \u03B5",
      value: "\u03B5 = 8.4 assumed",
      verified: false,
      note: "SPEC \xA78 item 2"
    }
  ],
  sources: [
    {
      citation: "P. T. Rakich et al., Nat. Mater. 5, 93 (2006)",
      doi: "10.1038/nmat1568",
      url: null,
      isbn: null,
      what_it_supports: "supercollimation of light in a silicon photonic crystal",
      verified: true,
      checked_on: "2026-11-21",
      expect: {
        journal: "Nature Materials",
        volume: "5",
        page: "93",
        year: 2006,
        first_author: "Rakich"
      }
    }
  ],
  published: "a/\u03BB \u2248 0.233 (verify); 2D proxy \u03C9_sc = 0.2276 at r = 0.30, \u03B5 = 8.4"
};

// data/presets/chirped-filter-normalised.json
var chirped_filter_normalised_default = {
  id: "chirped-filter-normalised",
  name: "Chirped filter, normalised",
  kind: "preset",
  available: true,
  screen: "filter",
  state: {
    filter: {
      n0: 1.515,
      lambdaNm: 633,
      dPerpUm: 3,
      Q0: 0.61,
      Q1: 0.92,
      N: 61,
      dnRel: 8534779814615124e-19,
      outside: false,
      voxel: null
    }
  },
  look_at: "One dip (Q\u2225 = 0.92) against a rejection band (chirp 0.61 \u2192 0.92): f = 0.022, Z \u2248 500.",
  parameters: [
    {
      name: "f",
      value: "0.022",
      verified: true,
      note: "read from the paper's text (SPEC \xA73.7)"
    },
    {
      name: "Q\u2225",
      value: "0.61 \u2192 0.92",
      verified: true,
      note: "SPEC \xA73.7"
    },
    {
      name: "definition of f",
      value: "f = k\xB2\u0394n/(2q\u22A5\xB2)",
      verified: false,
      note: "derived from Eq. (1) (SPEC \xA78 item 3)"
    },
    {
      name: "physical units",
      value: "N-BK7 at 633 nm, d\u22A5 = 3 \xB5m, N = 61",
      verified: false,
      note: "an illustration: the figure is in normalised units"
    }
  ],
  sources: [
    {
      citation: "K. Staliunas, V. J. S\xE1nchez-Morcillo, Phys. Rev. A 79, 053807 (2009)",
      doi: "10.1103/PhysRevA.79.053807",
      url: null,
      isbn: null,
      what_it_supports: "the paraxial model and the chirped filter, Fig. 3",
      verified: true,
      checked_on: "2026-11-21",
      expect: {
        journal: "Physical Review A",
        volume: "79",
        page: "053807",
        year: 2009,
        first_author: "Staliunas"
      }
    }
  ],
  published: "dip at K = 0.04; \u03B2 \u2248 1.24"
};

// data/presets/glass-633.json
var glass_633_default = {
  id: "glass-633",
  name: "Filters in glass, 633 nm",
  kind: "preset",
  available: true,
  screen: "filter",
  state: {
    filter: {
      n0: 1.515,
      lambdaNm: 633,
      dPerpUm: 3,
      Q0: 1.2,
      Q1: 2,
      N: 30,
      dnRel: 0.0019397226851398,
      voxel: null
    }
  },
  look_at: "Dip depth oscillating with the number of periods; the chirp 1.2 \u2192 2.0 rejects a band of about 4\xB0.",
  parameters: [
    {
      name: "\u03BB, d\u22A5",
      value: "633 nm, 3 \xB5m",
      verified: true,
      note: "read from the paper (SPEC \xA73.8)"
    },
    {
      name: "Q\u2225",
      value: "1.2, 1.6, 2.0; chirp 1.2 \u2192 2.0",
      verified: true,
      note: "SPEC \xA73.8"
    },
    {
      name: "n0",
      value: "1.515",
      verified: false,
      note: "SPEC \xA78 item 4"
    },
    {
      name: "\u0394n",
      value: "1.94e-3 (f = 0.05 from the deepest dip at N = 8)",
      verified: false,
      note: "inferred; the voxel estimate gives half (SPEC \xA73.8)"
    },
    {
      name: "angles inside or outside",
      value: "outside assumed",
      verified: false,
      note: "SPEC \xA78 item 4"
    }
  ],
  sources: [
    {
      citation: "D. Gailevi\u010Dius, V. Purlys, K. Staliunas, Opt. Lett. 44, 4969 (2019)",
      doi: "10.1364/OL.44.004969",
      url: null,
      isbn: null,
      what_it_supports: "the filters in glass, angles and dip versus N",
      verified: true,
      checked_on: "2026-11-21",
      expect: {
        journal: "Optics Letters",
        volume: "44",
        page: "4969",
        year: 2019,
        first_author: "Gailevi\u010Dius"
      }
    }
  ],
  published: "predicted 0.8 / 2.4 / 4.0\xB0, measured 1.08 / 3.2 / 5.5\xB0; deepest dip at 8 periods, revival at 14"
};

// data/presets/glass-970.json
var glass_970_default = {
  id: "glass-970",
  name: "Filter at 970 nm, M\xB2 47 \u2192 28",
  kind: "preset",
  available: true,
  screen: "filter",
  state: {
    filter: {
      n0: 1.52,
      lambdaNm: 970,
      dPerpUm: 3,
      Q0: 1.15,
      Q1: 1.27,
      N: 80,
      dnRel: 1e-3,
      voxel: null
    }
  },
  look_at: "Beam cleaning in physical units: a rejected band of 1.5\xB0 to 2.5\xB0 outside the glass.",
  parameters: [
    {
      name: "\u03BB",
      value: "970 nm",
      verified: true,
      note: "SPEC \xA73.8"
    },
    {
      name: "n0",
      value: "1.52",
      verified: false,
      note: "SPEC \xA78 item 5"
    },
    {
      name: "d\u22A5, Q\u2225",
      value: "3 \xB5m; 1.15 \u2192 1.27",
      verified: false,
      note: "SPEC \xA78 item 5"
    },
    {
      name: "\u0394n",
      value: "1e-3",
      verified: false,
      note: "assumed: not given in SPEC"
    },
    {
      name: "N",
      value: "80",
      verified: false,
      note: "assumed"
    }
  ],
  sources: [
    {
      citation: "S. Gawali et al., Appl. Phys. Lett. 115, 141104 (2019)",
      doi: "10.1063/1.5113780",
      url: null,
      isbn: null,
      what_it_supports: "the 970 nm filter and its M\xB2 reduction",
      verified: true,
      checked_on: "2026-11-21",
      expect: {
        journal: "Applied Physics Letters",
        volume: "115",
        page: "141104",
        year: 2019,
        first_author: "Gawali"
      }
    }
  ],
  published: "rejected band 1.5\xB0 to 2.5\xB0; M\xB2 from 47 to 28"
};

// data/presets/paraxial-fails.json
var paraxial_fails_default = {
  id: "paraxial-fails",
  name: "Low-contrast crystal where paraxial fails",
  kind: "preset",
  available: true,
  screen: "filter",
  state: {
    filter: {
      n0: 1.515,
      lambdaNm: 633,
      dPerpUm: 3,
      Q0: 1.6,
      Q1: 1.6,
      N: 8,
      dnRel: 0.05,
      voxel: null,
      outside: false
    }
  },
  look_at: "At \u0394n = 5e-2 (f \u2248 1.3) the paraxial model is qualitatively wrong: press \u201CCross-check with RCWA\u201D. The trust panel shows the coupling in red.",
  parameters: [
    {
      name: "\u0394n",
      value: "5e-2",
      verified: true,
      note: "SPEC \xA73.10"
    },
    {
      name: "geometry",
      value: "Gailevi\u010Dius-like, Q\u2225 = 1.6, 8 periods",
      verified: true,
      note: "SPEC \xA73.10"
    }
  ],
  sources: [
    {
      citation: "K. Staliunas, V. J. S\xE1nchez-Morcillo, Phys. Rev. A 79, 053807 (2009)",
      doi: "10.1103/PhysRevA.79.053807",
      url: null,
      isbn: null,
      what_it_supports: "the paraxial model whose limit is shown",
      verified: true,
      checked_on: "2026-11-21",
      expect: {
        journal: "Physical Review A",
        volume: "79",
        page: "053807",
        year: 2009,
        first_author: "Staliunas"
      }
    },
    {
      citation: "M. G. Moharam, T. K. Gaylord, J. Opt. Soc. Am. 71, 811 (1981)",
      doi: "10.1364/josa.71.000811",
      url: null,
      isbn: null,
      what_it_supports: "the full-wave RCWA",
      verified: true,
      checked_on: "2026-11-21",
      expect: {
        journal: "Journal of the Optical Society of America",
        volume: "71",
        page: "811",
        year: 1981,
        first_author: "Moharam"
      }
    }
  ],
  published: "this document, SPEC \xA73.10"
};

// apps/mcp/src/presets.ts
var RECORDS = {
  "square-rods-tm-gap": square_rods_tm_gap_default,
  "hex-holes-complete-gap": hex_holes_complete_gap_default,
  "hex-holes-te-gap": hex_holes_te_gap_default,
  "quarter-wave-bragg": quarter_wave_bragg_default,
  "eight-rows": eight_rows_default,
  "self-collimation-rods": self_collimation_rods_default,
  "supercollimation-si-slab": supercollimation_si_slab_default,
  "chirped-filter-normalised": chirped_filter_normalised_default,
  "glass-633": glass_633_default,
  "glass-970": glass_970_default,
  "paraxial-fails": paraxial_fails_default
};
var cache2 = null;
function presets() {
  if (cache2) return cache2;
  cache2 = presets_default.presets.map((id) => {
    const record = RECORDS[id];
    if (!record) throw new Error(`data/presets/index.json lists ${id}, which is not imported in apps/mcp/src/presets.ts`);
    const problems = validateRecord(record);
    if (problems.length) throw new Error(`data/presets/${id}.json: ${problems.join("; ")}`);
    return record;
  });
  return cache2;
}

// apps/mcp/src/tools.ts
var fail = (error) => ({ ok: false, error });
function guarded(fn) {
  return async (args2, ctx) => {
    try {
      return { ok: true, data: await fn(args2, ctx) };
    } catch (err) {
      if (err instanceof InputError || err instanceof Refusal) return fail(err.message);
      throw err;
    }
  };
}
function envelope(tool2, request, body, trust, state) {
  const out = {
    tool: tool2,
    engine_version: ENGINE_VERSION,
    kernel: getKernel().name,
    request,
    ...body,
    trust: trust.map((t) => ({ id: t.id, label: t.label, level: t.level, value: t.value === null ? null : sig(t.value, 3), display: t.display, detail: t.detail })),
    permalink: permalink(state)
  };
  return { ...out, hash: hashOf(out) };
}
var TWO_PI = 2 * Math.PI;
var deg = (rad) => rad * 180 / Math.PI;
var STRUCTURE_PROPS = {
  lattice: { type: "string", enum: ["square", "hex"], default: "square", description: "square (\u0393\u2013X\u2013M\u2013\u0393) or hex, the triangular lattice (\u0393\u2013M\u2013K\u2013\u0393)." },
  radius_over_a: { type: "number", exclusiveMinimum: 0, maximum: 0.5, description: "Radius of the rods or holes over the lattice constant a." },
  eps_in: { type: "number", minimum: 1, maximum: 30, description: "Permittivity inside the circles (rods: high; holes: 1)." },
  eps_out: { type: "number", minimum: 1, maximum: 30, description: "Permittivity of the background." }
};
var M_PROP = (dflt, maxN) => ({
  type: "integer",
  minimum: 2,
  maximum: (Math.sqrt(maxN) - 1) / 2,
  default: dflt,
  description: `Plane-wave order M: N = (2M+1)\xB2 plane waves, at most ${maxN} here (SPEC \xA72.2: 7 interactive, 10 accurate, 15 export).`
});
function structureOf(args2, skip) {
  const s = {
    lattice: choice(args2, "lattice", ["square", "hex"], "square"),
    radius: skip === "radius" ? 0.2 : num(args2, "radius_over_a", { min: 0, exclusiveMin: true, max: 0.5 }),
    epsIn: skip === "epsIn" ? 1 : num(args2, "eps_in", { min: 1, max: 30 }),
    epsOut: num(args2, "eps_out", { min: 1, max: 30 })
  };
  if (!skip) {
    const problem = structureProblem(s);
    if (problem) throw new InputError(problem);
  }
  return s;
}
function orderOf(args2, dflt, maxN, state, what = "this tool") {
  const M = num(args2, "plane_wave_order", { min: 2, integer: true, default: dflt });
  const N = (2 * M + 1) ** 2;
  if (N > maxN) throw new Refusal(`plane_wave_order ${M} means N = ${N} plane waves; ${what} takes at most ${maxN}.`, permalink(state(Math.min(M, 15))));
  return M;
}
function gapsOut(gaps, labels) {
  return gaps.map((g) => ({
    bands: g.betweenBands,
    bottom_a_over_lambda: round(g.bottom, 5),
    top_a_over_lambda: round(g.top, 5),
    gap_midgap_percent: round(100 * g.gapMidgap, 2),
    bottom_at: labels(g.bottomAt),
    top_at: labels(g.topAt)
  }));
}
var bandsTool = {
  name: "bands",
  title: "Photonic band structure (2D plane-wave expansion)",
  description: "Band frequencies a/\u03BB of a 2D photonic crystal of circular rods or holes (square or triangular lattice), TM (E along the rods) and/or TE (H along the rods), by plane-wave expansion with the inverse-\u03B5 rule. Default: the standard path (\u0393\u2013X\u2013M\u2013\u0393 or \u0393\u2013M\u2013K\u2013\u0393, 61 points); or your own k_points. Returns up to 8 bands at up to 121 k-points, the gaps (gap/midgap, the k-points where the edges sit), complete gaps on the path, the trust flags and a permalink.",
  inputSchema: {
    type: "object",
    properties: {
      ...STRUCTURE_PROPS,
      polarisation: { type: "string", enum: ["TM", "TE", "both"], default: "both" },
      plane_wave_order: M_PROP(7, LIMITS2.planeWaves),
      n_bands: { type: "integer", minimum: 1, maximum: LIMITS2.bands, default: 8 },
      points_per_segment: { type: "integer", minimum: 1, maximum: 40, default: 20, description: "Points per path segment: 3n + 1 k-points." },
      k_points: {
        type: "array",
        maxItems: LIMITS2.kPoints,
        items: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
        description: "Bloch vectors [kx, ky] in units of 2\u03C0/a (X of the square lattice is [0.5, 0]). Replaces the path; gaps are then over these points only."
      },
      check_convergence: { type: "boolean", default: false, description: "Also solve the path with M + 3 and report the change of the 4 lowest band edges (SPEC \xA72.7)." }
    },
    required: ["radius_over_a", "eps_in", "eps_out"]
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  stateOf(args2) {
    try {
      return stateFrom({ view: "bands", structure: structureOf(args2), polarisation: choice(args2, "polarisation", ["TM", "TE", "both"], "both"), M: args2.plane_wave_order });
    } catch {
      return null;
    }
  },
  call: guarded((args2) => {
    const structure = structureOf(args2);
    const polarisation = choice(args2, "polarisation", ["TM", "TE", "both"], "both");
    const stateAt = (M2) => stateFrom({ view: "bands", structure, polarisation, M: M2 });
    const M = orderOf(args2, 7, LIMITS2.planeWaves, stateAt, "bands");
    const state = stateAt(M);
    const nBandsRaw = num(args2, "n_bands", { min: 1, integer: true, default: 8 });
    if (nBandsRaw > LIMITS2.bands) throw new Refusal(`n_bands ${nBandsRaw} is over the limit of ${LIMITS2.bands} bands.`, permalink(state));
    const kRaw = list(args2, "k_points");
    let ks;
    let labels;
    let distance = null;
    if (kRaw) {
      if (kRaw.length === 0) throw new InputError("k_points must hold at least one [kx, ky].");
      if (kRaw.length > LIMITS2.kPoints) throw new Refusal(`${kRaw.length} k-points is over the limit of ${LIMITS2.kPoints}.`, permalink(state));
      ks = kRaw.map((k, i) => {
        if (!Array.isArray(k) || k.length !== 2 || !k.every((x) => typeof x === "number" && Number.isFinite(x) && Math.abs(x) <= 10)) {
          throw new InputError(`k_points[${i}] must be [kx, ky], two numbers in units of 2\u03C0/a with |k| \u2264 10.`);
        }
        return [TWO_PI * k[0], TWO_PI * k[1]];
      });
      labels = () => null;
    } else {
      const n = num(args2, "points_per_segment", { min: 1, integer: true, default: 20 });
      if (3 * n + 1 > LIMITS2.kPoints) throw new Refusal(`points_per_segment ${n} gives ${3 * n + 1} k-points; the limit is ${LIMITS2.kPoints}.`, permalink(state));
      const path = zonePath(structure.lattice, n);
      ks = path.k;
      distance = path.distance;
      labels = (i) => path.ticks.find((t) => t.index === i)?.label ?? null;
    }
    const checkConv = bool(args2, "check_convergence", false);
    if (checkConv && kRaw) throw new InputError("check_convergence works on the standard path; leave k_points out.");
    if (checkConv && (2 * (M + 3) + 1) ** 2 > LIMITS2.planeWaves) {
      throw new Refusal(`check_convergence solves with M + 3 = ${M + 3}, over the limit of ${LIMITS2.planeWaves} plane waves; use plane_wave_order \u2264 12.`, permalink(state));
    }
    const kernel = getKernel();
    const eps = inverseEpsilon(structure, M);
    const pols = polarisation === "both" ? ["TM", "TE"] : [polarisation];
    const bands = {};
    const gaps = {};
    let hidden = 0;
    let gammaWorst = 0;
    for (const pol of pols) {
      const rows = ks.map((k) => Array.from(frequenciesAt(eps, k, pol, nBandsRaw, kernel)));
      bands[pol] = rows;
      gaps[pol] = findGaps(rows);
      hidden += findGaps(rows, { minRelativeWidth: 0 }).length - gaps[pol].length;
      gammaWorst = Math.max(gammaWorst, Math.abs(kernel.eigvalsSym(operatorMatrix(eps, [0, 0], pol), eps.n, 1)[0]));
    }
    let convergence2 = pweConvergenceRow(null, null, M);
    if (checkConv) {
      const more = inverseEpsilon(structure, M + 3);
      for (const pol of pols) {
        const row = pweConvergenceRow(bandEdges(bands[pol]), bandEdges(ks.map((k) => Array.from(frequenciesAt(more, k, pol, nBandsRaw, kernel)))), M);
        if (convergence2.value === null || (row.value ?? 0) > convergence2.value) convergence2 = row;
      }
    }
    const complete = bands.TM && bands.TE ? completeGaps(gaps.TE, gaps.TM) : [];
    return envelope("bands", {
      lattice: structure.lattice,
      radius_over_a: structure.radius,
      eps_in: structure.epsIn,
      eps_out: structure.epsOut,
      polarisation,
      plane_wave_order: M,
      n_bands: nBandsRaw,
      k_points: kRaw ? "given" : "standard path"
    }, {
      plane_waves: eps.n,
      k: ks.map((k, i) => ({
        kx_2pi_over_a: round(k[0] / TWO_PI, 6),
        ky_2pi_over_a: round(k[1] / TWO_PI, 6),
        label: labels(i),
        ...distance ? { distance_2pi_over_a: round(distance[i] / TWO_PI, 6) } : {}
      })),
      bands_a_over_lambda: Object.fromEntries(Object.entries(bands).map(([p, rows]) => [p, rows.map((r) => r.map((w) => round(w, 5)))])),
      gaps: Object.fromEntries(Object.entries(gaps).map(([p, g]) => [p, gapsOut(g, labels)])),
      complete_gaps: complete.map((g) => ({ bottom_a_over_lambda: round(g.bottom, 5), top_a_over_lambda: round(g.top, 5), gap_midgap_percent: round(100 * g.gapMidgap, 2) })),
      note: kRaw ? "Gaps are taken over the given k-points only; a gap of the crystal needs the whole zone boundary." : "Gaps are taken over the standard path (SPEC \xA71.1); edges narrower than 1e-3 relative are degeneracies, not gaps."
    }, [fillFactorRow(structure), gammaZeroRow(gammaWorst), gapRuleRow(hidden), convergence2], state);
  })
};
var gapMapTool = {
  name: "gap_map",
  title: "Gap map against r/a or \u03B5",
  description: `TE, TM and complete gaps of a 2D crystal as a function of the radius r/a or of \u03B5 inside the circles, at most ${LIMITS2.gapMapValues} values, each a band calculation on the standard path with 8 bands. Gaps narrower than 1e-3 relative are ignored.`,
  inputSchema: {
    type: "object",
    properties: {
      ...STRUCTURE_PROPS,
      parameter: { type: "string", enum: ["radius_over_a", "eps_in"], default: "radius_over_a", description: "The swept quantity; its fixed value is then not needed." },
      from: { type: "number", description: "First value of the parameter." },
      to: { type: "number", description: "Last value of the parameter." },
      count: { type: "integer", minimum: 2, maximum: LIMITS2.gapMapValues, default: 32 },
      plane_wave_order: M_PROP(5, LIMITS2.gapMapPlaneWaves)
    },
    required: ["from", "to", "eps_out"]
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  stateOf(args2) {
    try {
      return gapMapState(args2).state;
    } catch {
      return null;
    }
  },
  call: guarded((args2) => {
    const { state, param } = gapMapState(args2);
    const count = num(args2, "count", { min: 2, integer: true, default: 32 });
    if (count > LIMITS2.gapMapValues) throw new Refusal(`count ${count} is over the limit of ${LIMITS2.gapMapValues} values.`, permalink(state));
    const M = orderOf(args2, 5, LIMITS2.gapMapPlaneWaves, (m) => stateFrom({ ...state, gapmap: { ...state.gapmap, M: Math.min(m, 10) } }), "gap_map");
    const s = stateFrom({ ...state, gapmap: { ...state.gapmap, count, M } });
    const r = solveGapMap(s);
    const g = (x) => ({
      ...x.betweenBands ? { bands: x.betweenBands } : {},
      bottom_a_over_lambda: round(x.bottom, 5),
      top_a_over_lambda: round(x.top, 5),
      gap_midgap_percent: round(100 * x.gapMidgap, 2)
    });
    return envelope("gap_map", {
      lattice: s.structure.lattice,
      parameter: param,
      from: s.gapmap.from,
      to: s.gapmap.to,
      count,
      plane_wave_order: M,
      ...param === "radius_over_a" ? { eps_in: s.structure.epsIn } : { radius_over_a: s.structure.radius },
      eps_out: s.structure.epsOut
    }, {
      plane_waves: (2 * M + 1) ** 2,
      columns: r.columns.map((c2) => ({ [param]: round(c2.value, 6), TM: c2.TM.map(g), TE: c2.TE.map(g), complete: c2.complete.map(g) }))
    }, [], s);
  })
};
function gapMapState(args2) {
  const param = choice(args2, "parameter", ["radius_over_a", "eps_in"], "radius_over_a");
  const structure = structureOf(args2, param === "radius_over_a" ? "radius" : "epsIn");
  const range = param === "radius_over_a" ? { min: 0, exclusiveMin: true, max: 0.5 } : { min: 1, max: 30 };
  const from = num(args2, "from", range);
  const to = num(args2, "to", range);
  if (!(to > from)) throw new InputError("to must be greater than from.");
  return {
    param,
    state: stateFrom({ view: "gapmap", structure, gapmap: { param: param === "radius_over_a" ? "radius" : "epsIn", from, to, count: 32, M: 5 } })
  };
}
var isofrequencyTool = {
  name: "isofrequency",
  title: "Isofrequency contours, curvature and self-collimation",
  description: "One band's \u03C9(k) over the whole zone (41 \xD7 41 grid from the 231-point irreducible wedge), the contour at a frequency, and along \u0393\u2013M of the square lattice the curvature: \u03C9_\u2225 (group velocity), \u03C9_\u22A5\u22A5 and the diffraction coefficient D = \u03C9_\u22A5\u22A5/\u03C9_\u2225, with the self-collimation frequencies \u03C9_sc (D = 0) and the flat half-width of the contour there.",
  inputSchema: {
    type: "object",
    properties: {
      ...STRUCTURE_PROPS,
      polarisation: { type: "string", enum: ["TM", "TE"], default: "TM" },
      band: { type: "integer", minimum: 1, maximum: 4, default: 1 },
      plane_wave_order: M_PROP(7, LIMITS2.isofrequencyPlaneWaves),
      omega_a_over_lambda: { type: "number", minimum: 5e-3, maximum: 1.5, description: "Frequency of the contour; default \u03C9_sc, else the band's middle." },
      include_map: { type: "boolean", default: false, description: "Also return the 41 \xD7 41 map (5 decimals; NaN outside the zone as null)." }
    },
    required: ["radius_over_a", "eps_in", "eps_out"]
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  stateOf(args2) {
    try {
      return isoState(args2, 7);
    } catch {
      return null;
    }
  },
  call: guarded((args2) => {
    const M = orderOf(args2, 7, LIMITS2.isofrequencyPlaneWaves, (m) => isoState(args2, m), "isofrequency");
    const state = isoState(args2, M);
    const r = solveIsofreq(state);
    const k2 = (x) => round(x / TWO_PI, 5);
    const nk = r.map.nk;
    return envelope("isofrequency", {
      lattice: state.structure.lattice,
      radius_over_a: state.structure.radius,
      eps_in: state.structure.epsIn,
      eps_out: state.structure.epsOut,
      polarisation: r.request.polarisation,
      band: state.isofreq.band,
      plane_wave_order: M,
      omega_a_over_lambda: state.isofreq.omega
    }, {
      self_collimation: r.selfCollimation.map((p) => ({
        omega_a_over_lambda: round(p.omega, 5),
        s_over_GM: round(p.sOverGM, 4),
        group_velocity_c: round(p.groupVelocity, 4)
      })),
      flat_halfwidth_1_over_a: r.flatness ? round(r.flatness.flatHalfWidth, 3) : null,
      curvature_along_GM: r.curvature ? r.curvature.sOverGM.map((s, i) => ({
        s_over_GM: round(s, 3),
        omega_a_over_lambda: round(r.curvature.omega[i], 5),
        omega_par: sig(r.curvature.omegaPar[i], 5),
        omega_perp2: sig(r.curvature.omegaPerp2[i], 5),
        D_a: sig(r.curvature.D[i], 5)
      })) : null,
      contour: {
        omega_a_over_lambda: round(r.level, 5),
        segments_2pi_over_a: r.contour.map(([p, q2]) => [[k2(p[0]), k2(p[1])], [k2(q2[0]), k2(q2[1])]])
      },
      ...bool(args2, "include_map", false) ? { map: {
        nk,
        kx_2pi_over_a: r.map.kx.map(k2),
        ky_2pi_over_a: r.map.ky.map(k2),
        note: "values[iy][ix]; null outside the first zone",
        values_a_over_lambda: Array.from({ length: nk }, (_, iy) => r.map.bands[state.isofreq.band - 1].slice(iy * nk, iy * nk + nk).map((w) => Number.isFinite(w) ? round(w, 5) : null))
      } } : {},
      note: state.structure.lattice === "hex" ? "The \u0393\u2013M curvature is defined for the square lattice; the hexagonal map and contour are returned." : void 0
    }, r.trust, state);
  })
};
function isoState(args2, M) {
  const structure = structureOf(args2);
  const pol = choice(args2, "polarisation", ["TM", "TE"], "TM");
  const band = num(args2, "band", { min: 1, max: 4, integer: true, default: 1 });
  const omega = optNum(args2, "omega_a_over_lambda", { min: 5e-3, max: 1.5 });
  return stateFrom({ view: "isofreq", structure, polarisation: pol, M, isofreq: { band, nk: 41, omega } });
}
var slabTool = {
  name: "slab_transmission",
  title: "Transmission of a finite slab of rods (RCWA, TM)",
  description: "T(\u03C9) of N rows of rods or holes of the square or hexagonal lattice, TM, by RCWA with S-matrices, at one or several angles of incidence (T(\u03C9, \u03B8)); at most 256 points in all. Returns T and R per frequency, max |R + T \u2212 1|, and the PWE-forbidden ranges of \u03C9 at the same k_x (the projected-band overlay, M = 5: a guide, not a measurement).",
  inputSchema: {
    type: "object",
    properties: {
      ...STRUCTURE_PROPS,
      lattice: { type: "string", enum: ["square", "hex"], default: "square", description: "Rows of the square lattice, or (v1.1) of the hexagonal lattice cut along a1: rows \u221A3/2 a apart, alternately shifted by a/2, so that normal incidence is along \u0393\u2013M (or along \u0393\u2013K: see cut)." },
      cut: { type: "string", enum: ["GM", "GK"], default: "GM", description: "Hexagonal rows only (v1.2): GM, the rows along a1 above; GK, the face perpendicular to a1 (period \u221A3 a; each row is two planes of rods a/2 apart, a thick in all, and slices_per_row counts per plane), normal incidence along \u0393\u2013K, with the projected bands scanned along \u0393\u2013K\u2013M. Ignored for square rows." },
      rows: { type: "integer", minimum: 1, maximum: LIMITS2.rcwaRows, default: 8 },
      angles_rad: { type: "array", items: { type: "number", minimum: 0, maximum: 1.4835 }, default: [0], description: "Angles of incidence (radians) in the medium of index n_ref." },
      n_ref: { type: "number", minimum: 1, maximum: 4, default: 1, description: "Index of the medium on both sides." },
      omega_min_a_over_lambda: { type: "number", minimum: 5e-3, maximum: 1.5, default: 0.2 },
      omega_max_a_over_lambda: { type: "number", minimum: 5e-3, maximum: 1.5, default: 0.55 },
      omega_points: { type: "integer", minimum: 8, default: 141, description: "Frequencies per angle; angles \xD7 points \u2264 256." },
      harmonics_order: { type: "integer", minimum: 2, maximum: (LIMITS2.rcwaHarmonics - 1) / 2, default: 12, description: "M: 2M + 1 harmonics (SPEC \xA72.5: 12 for rod slabs)." },
      slices_per_row: { type: "integer", minimum: 4, maximum: LIMITS2.rcwaSlices, default: 16 }
    },
    required: ["radius_over_a", "eps_in", "eps_out"]
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  stateOf(args2) {
    try {
      return slabState(args2).state;
    } catch {
      return null;
    }
  },
  call: guarded((args2) => {
    const { state, angles } = slabState(args2);
    const link = permalink(state);
    const sl = state.slab;
    const rows = num(args2, "rows", { min: 1, integer: true, default: 8 });
    if (rows > LIMITS2.rcwaRows) throw new Refusal(`${rows} rows is over the limit of ${LIMITS2.rcwaRows}.`, link);
    const M = num(args2, "harmonics_order", { min: 2, integer: true, default: 12 });
    if (2 * M + 1 > LIMITS2.rcwaHarmonics) throw new Refusal(`harmonics_order ${M} means ${2 * M + 1} harmonics; the limit is ${LIMITS2.rcwaHarmonics}.`, link);
    const slices = num(args2, "slices_per_row", { min: 4, integer: true, default: 16 });
    if (slices > LIMITS2.rcwaSlices) throw new Refusal(`${slices} slices per row is over the limit of ${LIMITS2.rcwaSlices}.`, link);
    const points = num(args2, "omega_points", { min: 8, integer: true, default: 141 });
    if (points * angles.length > LIMITS2.slabPoints) {
      throw new Refusal(`${angles.length} angles \xD7 ${points} frequencies = ${points * angles.length} points; the limit is ${LIMITS2.slabPoints}.`, link);
    }
    const runs = angles.map((a) => solveSlab(stateFrom({ ...state, slab: { ...sl, rows, harmonics: M, slices, points, thetaDeg: deg(a) } })));
    const all = runs.flatMap((r) => r.points);
    const worst = Math.max(...all.map((p) => Math.abs(p.R + p.T - 1)));
    const trust = [fillFactorRow(state.structure), energyRow(all), slicesRow(null, null), harmonicsRow(null, null, M)];
    return envelope("slab_transmission", {
      lattice: state.structure.lattice,
      radius_over_a: state.structure.radius,
      eps_in: state.structure.epsIn,
      eps_out: state.structure.epsOut,
      ...sl.cut ? { cut: sl.cut } : {},
      rows,
      angles_rad: angles,
      n_ref: sl.nRef,
      omega_min_a_over_lambda: sl.omegaMin,
      omega_max_a_over_lambda: sl.omegaMax,
      omega_points: points,
      harmonics_order: M,
      slices_per_row: slices
    }, {
      max_energy_error: sig(worst, 3),
      spectra: runs.map((r, i) => ({
        angle_rad: angles[i],
        angle_deg: round(deg(angles[i]), 2),
        omega_a_over_lambda: r.points.map((p) => round(p.omega, 5)),
        T: r.points.map((p) => roundT(p.T)),
        R: r.points.map((p) => roundT(p.R)),
        pwe_forbidden_a_over_lambda: r.forbidden.map(([a, b]) => [round(a, 4), round(b, 4)])
      }))
    }, trust, stateFrom({ ...state, slab: { ...sl, rows, harmonics: M, slices, points } }));
  })
};
function slabState(args2) {
  const structure = structureOf(args2);
  const raw = list(args2, "angles_rad") ?? [0];
  if (raw.length === 0) throw new InputError("angles_rad must hold at least one angle.");
  const angles = raw.map((a, i) => {
    if (typeof a !== "number" || !Number.isFinite(a) || a < 0 || a > 85 * Math.PI / 180) throw new InputError(`angles_rad[${i}] must be between 0 and 1.4835 (85\xB0).`);
    return a;
  });
  const omegaMin = num(args2, "omega_min_a_over_lambda", { min: 5e-3, max: 1.5, default: 0.2 });
  const omegaMax = num(args2, "omega_max_a_over_lambda", { min: 5e-3, max: 1.5, default: 0.55 });
  if (!(omegaMax > omegaMin)) throw new InputError("omega_max_a_over_lambda must be greater than omega_min_a_over_lambda.");
  const nRef = num(args2, "n_ref", { min: 1, max: 4, default: 1 });
  const cut = choice(args2, "cut", ["GM", "GK"], "GM");
  return {
    angles,
    state: stateFrom({
      view: "slab",
      structure,
      polarisation: "TM",
      slab: {
        rows: args2.rows ?? 8,
        thetaDeg: deg(angles[0]),
        nRef,
        omegaMin,
        omegaMax,
        points: args2.omega_points ?? 141,
        harmonics: args2.harmonics_order ?? 12,
        slices: args2.slices_per_row ?? 16,
        ...cut === "GK" ? { cut } : {}
      }
    })
  };
}
var FILTER_PROPS = {
  n0: { type: "number", minimum: 1, maximum: 4, description: "Refractive index of the glass." },
  wavelength_m: { type: "number", minimum: 1e-7, maximum: 2e-5, description: "Vacuum wavelength (m), e.g. 6.33e-7." },
  period_perp_m: { type: "number", minimum: 2e-7, maximum: 2e-4, description: "Transverse period d\u22A5 (m), e.g. 3e-6." },
  Q_par: { type: "number", minimum: 0.05, maximum: 20, description: "Q\u2225 = 2 n0 d\u22A5\xB2/(\u03BB d\u2225) at the entrance. Give this or period_par_m." },
  period_par_m: { type: "number", exclusiveMinimum: 0, description: "Longitudinal period d\u2225 (m) at the entrance, instead of Q_par." },
  Q_par_end: { type: "number", minimum: 0.05, maximum: 20, description: "Q\u2225 at the exit (a linear chirp); default: unchirped." },
  period_par_end_m: { type: "number", exclusiveMinimum: 0, description: "d\u2225 at the exit (m), instead of Q_par_end." },
  dn_rel: { type: "number", minimum: 1e-6, maximum: 0.5, description: "Relative first-harmonic index modulation \u0394n (n = n0[1 + \u0394n cos q\u22A5x cos q\u2225z]). Give this or voxel." },
  voxel: {
    type: "object",
    description: "Rectangular laser-written voxels instead of dn_rel: \u0394n = (\u0394n_peak/n0)(2 sin \u03C0D_x/\u03C0)(2 sin \u03C0D_z/\u03C0) (SPEC \xA71.7).",
    properties: { dn_peak: { type: "number", minimum: 1e-6, maximum: 0.5 }, duty_x: { type: "number", minimum: 0.01, maximum: 0.99 }, duty_z: { type: "number", minimum: 0.01, maximum: 0.99 } },
    required: ["dn_peak", "duty_x", "duty_z"]
  },
  periods: { type: "integer", minimum: 1, maximum: LIMITS2.periods, description: "Number of longitudinal periods N (the mean number for a chirp)." }
};
var FILTER_REQUIRED = ["n0", "wavelength_m", "period_perp_m", "periods"];
function filterOf(args2, base = {}) {
  const n0 = num(args2, "n0", { min: 1, max: 4 });
  const lambdaM = num(args2, "wavelength_m", { min: 1e-7, max: 2e-5 });
  const dPerpM = num(args2, "period_perp_m", { min: 2e-7, max: 2e-4 });
  const g = { n0, lambdaUm: lambdaM * 1e6, dPerpUm: dPerpM * 1e6 };
  const q2 = (qKey, dKey, fallback) => {
    const Q = optNum(args2, qKey, { min: 0.05, max: 20 });
    const d = optNum(args2, dKey, { min: 0, exclusiveMin: true });
    if (Q !== null && d !== null) throw new InputError(`Give ${qKey} or ${dKey}, not both.`);
    const v = Q ?? (d !== null ? qFromDPar(g, d * 1e6) : fallback);
    if (v === null) throw new InputError(`${qKey} (or ${dKey}) is required.`);
    if (!(v >= 0.05 && v <= 20)) throw new InputError(`${dKey} gives Q\u2225 = ${v.toPrecision(4)}, outside 0.05 to 20.`);
    return v;
  };
  const Q0 = q2("Q_par", "period_par_m", null);
  const Q1 = q2("Q_par_end", "period_par_end_m", Q0);
  let dnRel;
  let voxel = null;
  const vx = args2.voxel;
  if (vx !== void 0 && vx !== null) {
    if (args2.dn_rel !== void 0) throw new InputError("Give dn_rel or voxel, not both.");
    if (typeof vx !== "object" || Array.isArray(vx)) throw new InputError("voxel must be an object {dn_peak, duty_x, duty_z}.");
    const v = vx;
    voxel = { dnPeak: num(v, "dn_peak", { min: 1e-6, max: 0.5 }), dutyX: num(v, "duty_x", { min: 0.01, max: 0.99 }), dutyZ: num(v, "duty_z", { min: 0.01, max: 0.99 }) };
    dnRel = voxelDn(voxel.dnPeak, n0, voxel.dutyX, voxel.dutyZ).dnRel;
  } else {
    dnRel = num(args2, "dn_rel", { min: 1e-6, max: 0.5 });
  }
  const N = num(args2, "periods", { min: 1, integer: true });
  const state = stateFrom({
    view: "filter",
    filter: { ...stateFrom({}).filter, ...base, n0, lambdaNm: lambdaM * 1e9, dPerpUm: dPerpM * 1e6, Q0, Q1, dnRel, N: Math.min(N, LIMITS2.periods), outside: true, voxel }
  });
  if (N > LIMITS2.periods) throw new Refusal(`${N} periods is over the limit of ${LIMITS2.periods}.`, permalink(state));
  const spec = filterSpecOf(state);
  return {
    spec,
    state,
    request: { n0, wavelength_m: lambdaM, period_perp_m: dPerpM, Q_par: Q0, Q_par_end: Q1, dn_rel: spec.dnRel, ...voxel ? { voxel: { dn_peak: voxel.dnPeak, duty_x: voxel.dutyX, duty_z: voxel.dutyZ } } : {}, periods: N }
  };
}
var filterStateOf = (args2) => {
  try {
    return filterOf(args2).state;
  } catch {
    return null;
  }
};
var bandsDeg = (b) => b.map(([x, y]) => [round(x, 2), round(y, 2)]);
var filterTool = {
  name: "filter_transfer",
  title: "Low-contrast spatial filter: angular transfer T0(\u03B8)",
  description: "The paraxial (Staliunas) model of a weakly modulated glass crystal, n = n0[1 + \u0394n cos q\u22A5x cos q\u2225z], unchirped or linearly chirped Q0 \u2192 Q1, from physical inputs (SPEC \xA71.7). Returns T0 against the angle inside and outside the glass, the predicted filtering angles, the dip angle and depth, the half-T and 10 dB bands, \u03B2, the crystal length, the coupling f and its validity flag (f < 0.06 green, < 0.6 amber, else outside the validated range).",
  inputSchema: { type: "object", properties: FILTER_PROPS, required: FILTER_REQUIRED },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  stateOf: filterStateOf,
  call: guarded((args2) => {
    const { spec, state, request } = filterOf(args2);
    const Kmax = kMaxFor(spec);
    const tr = filterTransfer(spec, 241, Kmax);
    const sm = transferSummary(spec, tr);
    const dip = refineDip(spec, tr);
    const half2 = tr.K.map((k, i) => i).filter((i) => tr.K[i] >= 0);
    const flag = couplingRow(tr.f);
    return envelope("filter_transfer", request, {
      coupling_f: sig(tr.f, 4),
      validity: flag.level,
      beta: sig(tr.beta, 4),
      length_m: sig(tr.lengthUm * 1e-6, 4),
      period_par_m: sm.dParUm.map((d) => sig(d * 1e-6, 5)),
      predicted_angle_inside_deg: sm.predicted.internalDeg.map((a) => round(a, 2)),
      predicted_angle_outside_deg: sm.predicted.externalDeg.map((a) => round(a, 2)),
      dip: {
        angle_inside_deg: round(dip.internalDeg, 2),
        angle_outside_deg: round(dip.externalDeg, 2),
        T0: roundT(dip.T),
        K: round(dip.K, 5),
        note: "The minimum of T0 for K \u2265 0, refined between grid points (golden section on the same model)."
      },
      T0_on_axis: roundT(sm.TOnAxis),
      half_T_bands_inside_deg: bandsDeg(sm.halfTBandsIntDeg),
      half_T_bands_outside_deg: bandsDeg(sm.halfTBandsExtDeg),
      rejection_10dB_bands_outside_deg: bandsDeg(sm.rejection10dBExtDeg),
      transfer: {
        note: "T0(K) is even in K; the K \u2265 0 half is returned. K = k_x/q\u22A5.",
        K: half2.map((i) => round(tr.K[i], 5)),
        angle_inside_deg: half2.map((i) => round(tr.internalDeg[i], 3)),
        angle_outside_deg: half2.map((i) => round(tr.externalDeg[i], 3)),
        T0: half2.map((i) => roundT(tr.T[i]))
      }
    }, [flag, obliquityRow(Kmax * TWO_PI / spec.dPerpUm / (TWO_PI * spec.n0 / spec.lambdaUm)), modalEnergyRow(tr.energyError), paraxialConvergenceRow(null)], state);
  })
};
var cleanBeamTool = {
  name: "clean_beam",
  title: "Clean a noisy beam with a filter: energies and M\xB2",
  description: "The noisy-beam metrics of SPEC \xA73.9 for a filter given as in filter_transfer: a Gaussian with multiplicative noise (seeded: the same seed gives the same numbers) through the complex zero-order transfer function, then to its waist. Returns the energy kept in the aperture, the energy in the rejected band before and after, and M\xB2 before and after.",
  inputSchema: {
    type: "object",
    properties: {
      ...FILTER_PROPS,
      beam_sigma_m: { type: "number", exclusiveMinimum: 0, description: "Gaussian width \u03C3 (m) of the field; default 40/q\u22A5 (19.1 \xB5m for d\u22A5 = 3 \xB5m)." },
      noise_rms_rel: { type: "number", minimum: 0, maximum: 2, default: 0.6, description: "Relative rms of the multiplicative noise." },
      noise_width_K: { type: "number", minimum: 0.01, maximum: 1, default: 0.25, description: "Spectral width of the noise in K = k_x/q\u22A5." },
      seed: { type: "integer", minimum: 0, maximum: 4294967295, default: 1 },
      aperture_K: { type: "number", minimum: 0.05, maximum: 1.9, default: 0.6, description: "Aperture in K for the kept energy and M\xB2." }
    },
    required: FILTER_REQUIRED
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  stateOf: filterStateOf,
  call: guarded((args2) => {
    const f0 = filterOf(args2);
    const qPerp = TWO_PI / (f0.spec.dPerpUm * 1e-6);
    const sigmaM = optNum(args2, "beam_sigma_m", { min: 0, exclusiveMin: true });
    const sigmaX = sigmaM === null ? 40 : sigmaM * qPerp;
    if (sigmaX < 5 || sigmaX > 200) {
      throw new InputError(`beam_sigma_m must be between ${(5 / qPerp).toPrecision(3)} and ${(200 / qPerp).toPrecision(3)} m here (5 to 200 in units of 1/q\u22A5).`);
    }
    const beam = {
      sigmaX,
      noiseRms: num(args2, "noise_rms_rel", { min: 0, max: 2, default: 0.6 }),
      noiseWidth: num(args2, "noise_width_K", { min: 0.01, max: 1, default: 0.25 }),
      seed: num(args2, "seed", { min: 0, max: 4294967295, integer: true, default: 1 }),
      aperture: num(args2, "aperture_K", { min: 0.05, max: 1.9, default: 0.6 })
    };
    const state = stateFrom({ ...f0.state, filter: { ...f0.state.filter, beam } });
    const r = solveFilter(state);
    const m = r.beam.metrics;
    return envelope("clean_beam", {
      ...f0.request,
      beam_sigma_m: sig(sigmaX / qPerp, 5),
      noise_rms_rel: beam.noiseRms,
      noise_width_K: beam.noiseWidth,
      seed: beam.seed,
      aperture_K: beam.aperture
    }, {
      rejected_band_K: r.beam.bandK.map((k) => round(k, 4)),
      energy_kept_in_aperture: round(m.energyKeptInAperture, 4),
      energy_in_band_before: sig(m.energyInBandBefore, 4),
      energy_in_band_after: sig(m.energyInBandAfter, 4),
      band_energy_ratio: sig(m.energyInBandBefore / m.energyInBandAfter, 4),
      M2_before: round(m.M2In, 3),
      M2_after: round(m.M2Out, 3),
      M2_clean_gaussian_check: round(m.M2CleanGaussian, 3),
      note: "M\xB2 = 2\u03C3_X\u03C3_K within the aperture, \u03C3_X at the waist (SPEC \xA71.8). One noise realization: see SPEC \xA73.9 on the spread between seeds."
    }, r.trust, state);
  })
};
var fitTool = {
  name: "fit_coupling",
  title: "Fit the coupling f (effective \u0394n) to a measured dip series",
  description: "The coupling f, hence the effective first-harmonic \u0394n, that best reproduces a measured series of resonance transmission (dip depth) against the number of periods N of an unchirped filter, by least squares on the same modal model as filter_transfer. Give the geometry as in filter_transfer (Q_par or period_par_m; no \u0394n).",
  inputSchema: {
    type: "object",
    properties: {
      n0: FILTER_PROPS.n0,
      wavelength_m: FILTER_PROPS.wavelength_m,
      period_perp_m: FILTER_PROPS.period_perp_m,
      Q_par: FILTER_PROPS.Q_par,
      period_par_m: FILTER_PROPS.period_par_m,
      series: {
        type: "array",
        minItems: 2,
        maxItems: LIMITS2.fitSeries,
        description: "Measured points: transmission at the resonance angle after N periods.",
        items: { type: "object", properties: { periods: { type: "integer", minimum: 1, maximum: LIMITS2.periods }, transmission: { type: "number", minimum: 0, maximum: 1 } }, required: ["periods", "transmission"] }
      }
    },
    required: ["n0", "wavelength_m", "period_perp_m", "series"]
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  stateOf: (args2) => filterStateOf({ ...args2, dn_rel: 1e-3, periods: 8 }),
  call: guarded((args2) => {
    const raw = list(args2, "series");
    if (!raw || raw.length < 2) throw new InputError("series must hold at least two points {periods, transmission}.");
    const { state, request } = filterOf({ ...args2, dn_rel: 1e-3, periods: 8 });
    if (raw.length > LIMITS2.fitSeries) throw new Refusal(`${raw.length} points is over the limit of ${LIMITS2.fitSeries}.`, permalink(state));
    const series = raw.map((p, i) => {
      if (!p || typeof p !== "object") throw new InputError(`series[${i}] must be {periods, transmission}.`);
      const o = p;
      const N = num(o, "periods", { min: 1, integer: true });
      if (N > LIMITS2.periods) throw new Refusal(`series[${i}] has ${N} periods, over the limit of ${LIMITS2.periods}.`, permalink(state));
      return { N, T: num(o, "transmission", { min: 0, max: 1 }) };
    });
    const fit = filterFit(state, series);
    const flag = couplingRow(fit.f);
    const { n0, wavelength_m, period_perp_m, Q_par } = request;
    return envelope("fit_coupling", { n0, wavelength_m, period_perp_m, Q_par, series: series.map((s) => ({ periods: s.N, transmission: s.T })) }, {
      coupling_f: sig(fit.f, 5),
      dn_rel: sig(fit.dnRel, 5),
      rms_residual: sig(fit.rms, 3),
      periods_full_transfer: round(fit.nFullTransfer, 2),
      validity: flag.level,
      note: "f is fitted on [0.005, 0.5] (log scan, then golden section). dn_rel = f / (k\xB2/2q\u22A5\xB2)."
    }, [flag], stateFrom({ ...state, filter: { ...state.filter, dnRel: fit.dnRel } }));
  })
};
var SWEEP_MAP = {
  period_perp_m: { param: "dPerpUm", scale: 1e6, spec: { min: 2e-7, max: 2e-4 } },
  dn_rel: { param: "dnRel", scale: 1, spec: { min: 1e-6, max: 0.5 } },
  periods: { param: "N", scale: 1, spec: { min: 1, max: LIMITS2.periods, integer: true } },
  chirp_span: { param: "chirpSpan", scale: 1, spec: { min: 0, max: 10 } }
};
var sweepTool = {
  name: "sweep",
  title: "Sweep one filter parameter",
  description: `One parameter of a filter (given as in filter_transfer) over at most ${LIMITS2.sweepValues} values: d\u22A5, \u0394n, N or the chirp span Q1 \u2212 Q0 about the mean Q\u2225. Each row: the 10 dB rejection width outside the glass (the metric of screen 6), min T0, T0 on axis, f, \u03B2, crystal length and the half-T bands. 161 angles and dZ = 0.1 per row, as the reference sweeps.`,
  inputSchema: {
    type: "object",
    properties: {
      ...FILTER_PROPS,
      parameter: { type: "string", enum: Object.keys(SWEEP_MAP) },
      values: { type: "array", items: { type: "number" }, minItems: 1, maxItems: LIMITS2.sweepValues }
    },
    required: [...FILTER_REQUIRED, "parameter", "values"]
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  stateOf: filterStateOf,
  call: guarded((args2) => {
    const key = choice(args2, "parameter", Object.keys(SWEEP_MAP));
    const m = SWEEP_MAP[key];
    const raw = list(args2, "values");
    if (!raw || raw.length === 0) throw new InputError("values must hold at least one number.");
    const values = raw.map((v, i) => num({ [`values[${i}]`]: v }, `values[${i}]`, m.spec));
    const { state, request } = filterOf(args2, { sweep: { param: m.param, values: values.slice(0, LIMITS2.sweepValues).map((v) => v * m.scale) } });
    if (values.length > LIMITS2.sweepValues) throw new Refusal(`${values.length} values is over the limit of ${LIMITS2.sweepValues}.`, permalink(state));
    const rows = filterSweep(state, m.param, values.map((v) => v * m.scale));
    return envelope("sweep", { ...request, parameter: key, values }, {
      rows: rows.map((r, i) => ({
        [key]: values[i],
        width_10dB_outside_deg: round(r.width10dBExtDeg, 2),
        min_T0: roundT(r.minT),
        T0_on_axis: roundT(r.TOnAxis),
        coupling_f: sig(r.f, 4),
        validity: couplingRow(r.f).level,
        beta: sig(r.beta, 4),
        length_m: sig(r.lengthMm * 1e-3, 4),
        half_T_bands_outside_deg: bandsDeg(r.halfTBandsExtDeg)
      }))
    }, [], state);
  })
};
var crystalArgs = (s) => ({ lattice: s.structure.lattice, radius_over_a: s.structure.radius, eps_in: s.structure.epsIn, eps_out: s.structure.epsOut });
function toolRequestFor(p) {
  const s = presetState(p);
  if (s.mode === "1d") return null;
  switch (p.screen) {
    case "bands":
    case "crystal":
      return { tool: "bands", arguments: { ...crystalArgs(s), polarisation: s.polarisation, plane_wave_order: s.M } };
    case "gapmap":
      return { tool: "gap_map", arguments: { ...crystalArgs(s), parameter: s.gapmap.param === "radius" ? "radius_over_a" : "eps_in", from: s.gapmap.from, to: s.gapmap.to, count: s.gapmap.count, plane_wave_order: s.gapmap.M } };
    case "isofreq":
      return { tool: "isofrequency", arguments: { ...crystalArgs(s), polarisation: s.polarisation === "TE" ? "TE" : "TM", band: s.isofreq.band, plane_wave_order: Math.min(s.M, 10) } };
    case "slab":
      return {
        tool: "slab_transmission",
        arguments: {
          ...crystalArgs(s),
          rows: s.slab.rows,
          angles_rad: [s.slab.thetaDeg * Math.PI / 180],
          n_ref: s.slab.nRef,
          omega_min_a_over_lambda: s.slab.omegaMin,
          omega_max_a_over_lambda: s.slab.omegaMax,
          omega_points: s.slab.points,
          harmonics_order: s.slab.harmonics,
          slices_per_row: s.slab.slices,
          ...s.slab.cut ? { cut: s.slab.cut } : {}
        }
      };
    case "filter": {
      const f = s.filter;
      return {
        tool: "filter_transfer",
        arguments: {
          n0: f.n0,
          wavelength_m: f.lambdaNm * 1e-9,
          period_perp_m: f.dPerpUm * 1e-6,
          Q_par: f.Q0,
          Q_par_end: f.Q1,
          ...f.voxel ? { voxel: { dn_peak: f.voxel.dnPeak, duty_x: f.voxel.dutyX, duty_z: f.voxel.dutyZ } } : { dn_rel: f.dnRel },
          periods: f.N
        }
      };
    }
    default:
      return null;
  }
}
function presetSummary(p) {
  const b = badges(p);
  return {
    id: p.id,
    name: p.name,
    available: p.available,
    screen: p.screen,
    look_at: p.look_at,
    citations: p.sources.map((s) => ({ citation: s.citation, doi: s.doi, doi_verified: s.verified })),
    badges: { doi_checked: b.doiChecked, unverified_sources: b.unverifiedSources, unverified_parameters: b.unverifiedParameters }
  };
}
var listPresetsTool = {
  name: "list_presets",
  title: "List the classic experiments",
  description: "The presets of SPEC \xA75.3 (Joannopoulos rods and holes, Bragg stack, self-collimation, supercollimation, the Staliunas and Gailevi\u010Dius filters, ...) with their citations, whether each DOI has been checked, and how many parameters are still unverified. get_preset gives one in full with the tool call that reproduces it.",
  inputSchema: { type: "object", properties: {} },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  inline: true,
  call: () => ({ ok: true, data: { presets: presets().map(presetSummary) } })
};
var getPresetTool = {
  name: "get_preset",
  title: "One classic experiment in full",
  description: "A preset of SPEC \xA75.3 in full: its sources (citation, DOI, what each supports, verified or not), its parameters with their verification status, the published numbers, the app permalink, and the tool call (tool and arguments) that reproduces it here.",
  inputSchema: { type: "object", properties: { id: { type: "string", description: 'A preset id from list_presets, e.g. "square-rods-tm-gap".' } }, required: ["id"] },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  inline: true,
  call(args2) {
    const p = presets().find((x) => x.id === args2.id);
    if (!p) return fail(`No preset "${String(args2.id)}". Ids: ${presets().map((x) => x.id).join(", ")}.`);
    return {
      ok: true,
      data: {
        ...presetSummary(p),
        published: p.published ?? null,
        note: p.note ?? null,
        parameters: p.parameters,
        sources: p.sources,
        permalink: p.available ? permalink(presetState(p)) : null,
        request: p.available ? toolRequestFor(p) : null,
        ...p.available ? {} : { unavailable: "Listed with its citation; its parameters have not been read from the source yet (SPEC \xA78)." }
      }
    };
  }
};
var DEFAULT_CASES = VALIDATION_CASES.filter((c2) => c2.id !== "3.5b").map((c2) => c2.id);
var validationTool = {
  name: "get_validation_report",
  title: "Validation report: the cases of SPEC \xA73, run now",
  description: `Runs the validation cases of SPEC \xA73 on this server's engine and reports each check against the documented numbers (pass or fail), with timings. Default: every case except 3.5b (the 30\xB0 projected bands, about 20 s), which you can ask for by id. One call runs at most about ${LIMITS2.validationSeconds} s of estimated work.`,
  inputSchema: {
    type: "object",
    properties: {
      cases: { type: "array", items: { type: "string", enum: VALIDATION_CASES.map((c2) => c2.id) }, description: `Case ids; default ${DEFAULT_CASES.join(", ")}.` }
    }
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  stateOf: () => stateFrom({}),
  call: guarded((args2) => {
    const raw = list(args2, "cases");
    const ids = raw ? raw.map(String) : DEFAULT_CASES;
    const unknown = ids.filter((id) => !VALIDATION_CASES.some((c2) => c2.id === id));
    if (unknown.length) throw new InputError(`Unknown case ${unknown.join(", ")}. Cases: ${VALIDATION_CASES.map((c2) => c2.id).join(", ")}.`);
    const estimate = VALIDATION_CASES.filter((c2) => ids.includes(c2.id)).reduce((a, c2) => a + c2.estimateSeconds, 0);
    if (estimate > LIMITS2.validationSeconds) {
      throw new Refusal(
        `those cases take about ${Math.round(estimate)} s, over the ${LIMITS2.validationSeconds} s a call may use; split them over two calls.`,
        `${APP_URL}/?validation`
      );
    }
    const r = runValidation(ids);
    return {
      engine_version: r.engineVersion,
      kernel: r.kernel,
      pass: r.pass,
      passed: r.passed,
      total: r.total,
      seconds: round(r.seconds, 2),
      cases: r.cases.map((c2) => ({ ...c2, seconds: round(c2.seconds, 2) })),
      not_run: VALIDATION_CASES.filter((c2) => !ids.includes(c2.id)).map((c2) => c2.id),
      spec: "docs/SPEC.md \xA73 states each case and its acceptance criteria."
    };
  })
};
var RateLimiter = class {
  constructor(max, windowMs) {
    this.max = max;
    this.windowMs = windowMs;
  }
  max;
  windowMs;
  hits = /* @__PURE__ */ new Map();
  allow(key, now = Date.now()) {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
};
var reportLimiter = new RateLimiter(5, 60 * 60 * 1e3);
var EMAIL = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;
var reportTool = {
  name: "report_problem",
  title: "Report a problem",
  description: "Sends the maintainer a report about a result that looks wrong: one that disagrees with a published value, an independent calculation or another tool, a unit, a limit, or a missing caveat. Say what you expected, why (a source or your calculation) and what the tool gave; include the arguments or the permalink. Don't include personal data; contact is optional and only used to reply.",
  inputSchema: {
    type: "object",
    properties: {
      tool: { type: "string", description: 'The tool whose result is in question, or "general".' },
      message: { type: "string", minLength: 10, maxLength: 4e3, description: "What is wrong and why you think so." },
      arguments: { type: "object", description: "The arguments of the call that shows the problem." },
      permalink: { type: "string", description: `A permalink from a result (${APP_URL}/?s=\u2026).` },
      contact: { type: "string", maxLength: 200, description: "Optional e-mail address for a reply." }
    },
    required: ["tool", "message"]
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  inline: true,
  async call(args2, ctx) {
    const names = ["general", ...tools.map((t) => t.name)];
    if (typeof args2.tool !== "string" || !names.includes(args2.tool)) return fail(`tool must be one of ${names.join(", ")}.`);
    const message = typeof args2.message === "string" ? args2.message.trim() : "";
    if (message.length < 10 || message.length > 4e3) return fail("message must be 10 to 4000 characters.");
    const argText = args2.arguments === void 0 ? "" : JSON.stringify(args2.arguments);
    if (argText.length > 4e3) return fail("arguments are too long (4000 characters of JSON at most).");
    const link = typeof args2.permalink === "string" ? args2.permalink.trim() : "";
    if (link && !link.startsWith(`${APP_URL}/`)) return fail(`permalink must be a link to ${APP_URL}.`);
    if (link.length > 4e3) return fail("permalink is too long.");
    const contact = typeof args2.contact === "string" ? args2.contact.trim() : "";
    if (contact && (contact.length > 200 || !EMAIL.test(contact))) return fail("contact must be an e-mail address (or left out).");
    if (!ctx.sendReport) {
      return fail(`Reports can't be sent from this deployment. Please open an issue at ${REPO_URL}/issues with the message, the arguments and the permalink.`);
    }
    if (!reportLimiter.allow(ctx.ip)) return fail("Too many reports from this address; please try again in an hour.");
    const sent = await ctx.sendReport({ tool: args2.tool, message, arguments: argText, permalink: link, contact });
    if (!sent.ok) return fail(`The report couldn't be sent just now. Please try again later or open an issue at ${REPO_URL}/issues.`);
    return { ok: true, data: { sent: true, note: "Thank you; the report was sent to the maintainer." } };
  }
};
var tools = [
  listPresetsTool,
  getPresetTool,
  bandsTool,
  gapMapTool,
  isofrequencyTool,
  slabTool,
  filterTool,
  cleanBeamTool,
  fitTool,
  sweepTool,
  validationTool,
  reportTool
];

// apps/mcp/src/worker.ts
var { name, args } = workerData;
var tool = tools.find((t) => t.name === name);
var WASM_CANDIDATES = [
  new URL("./lattice_kernel_bg.wasm", import.meta.url),
  new URL("../../../packages/kernel-wasm/pkg/lattice_kernel_bg.wasm", import.meta.url)
];
(async () => {
  if (!tool) throw new Error(`no tool ${name}`);
  const wasm2 = WASM_CANDIDATES.find((u) => existsSync(u));
  await selectKernel(wasm2 ? [() => wasmKernelFromBytes(readFileSync(wasm2))] : []);
  return tool.call(args, { ip: "worker" });
})().then(
  (result) => parentPort.postMessage({ result }),
  (err) => parentPort.postMessage({ error: err instanceof Error ? err.stack ?? err.message : String(err) })
);
