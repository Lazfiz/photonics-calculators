import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/m2-factor' },
      title: 'Beam Quality Factor M²',
  description: 'M² = ( w₀ )/. M² = 1 for ideal Gaussian, higher for multimode beams.',
};

export default function Page() {
  return <PageClient />;
}
