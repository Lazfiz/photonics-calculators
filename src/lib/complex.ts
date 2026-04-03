// Simple complex number utilities for photonics calculations
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
  return Math.sqrt(c.re * c.re + c.im * c.im);
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
