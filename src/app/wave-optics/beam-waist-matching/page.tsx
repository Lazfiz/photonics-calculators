import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/beam-waist-matching' },
    title: 'Beam Waist Matching',
  description: 'Find the optimal lens for coupling one Gaussian mode into another.'
};

export default function Page() {
  return <PageClient />;
}
