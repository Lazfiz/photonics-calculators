import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/x-ray-optics' },
      title: 'X-ray Optics Materials',
  description: 'X-ray refractive index: n = 1 - - i. For hard X-rays, , ∝ ² ∝ 1/E².',
};

export default function Page() {
  return <PageClient />;
}
