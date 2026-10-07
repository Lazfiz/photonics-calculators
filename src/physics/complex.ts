// Complex arithmetic helpers ({ re, im } objects) for the physics modules
export interface Complex {
  re: number;
  im: number;
}

export function complex(re: number, im: number = 0): Complex {
  return { re, im };
}

export function add(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function sub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function mul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

export function div(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / denom, im: (a.im * b.re - a.re * b.im) / denom };
}

export function exp(c: Complex): Complex {
  const mag = Math.exp(c.re);
  return { re: mag * Math.cos(c.im), im: mag * Math.sin(c.im) };
}

export function abs(c: Complex): number {
  return Math.hypot(c.re, c.im);
}

/** |c|². */
export function abs2(c: Complex): number {
  return c.re * c.re + c.im * c.im;
}

export function scale(c: Complex, s: number): Complex {
  return { re: c.re * s, im: c.im * s };
}

/**
 * Principal square root (Re ≥ 0), computed without cancellation. On the branch cut (negative real
 * axis, including im = −0) it returns +i√|re|: the decaying root for e^(−iωt) waves.
 */
export function sqrt(c: Complex): Complex {
  const r = Math.hypot(c.re, c.im);
  if (r === 0) return { re: 0, im: 0 };
  if (c.re >= 0) {
    const t = Math.sqrt((r + c.re) / 2);
    return { re: t, im: c.im / (2 * t) };
  }
  const t = Math.sqrt((r - c.re) / 2);
  return { re: Math.abs(c.im) / (2 * t), im: c.im < 0 ? -t : t };
}

export function conj(c: Complex): Complex {
  return { re: c.re, im: -c.im };
}

// Create complex from imaginary: 1j * x -> im(x)
export function im(x: number): Complex {
  return { re: 0, im: x };
}

// Real and imaginary parts as scalars for plotting
export function realPart(c: Complex): number {
  return c.re;
}

export function imagPart(c: Complex): number {
  return c.im;
}
