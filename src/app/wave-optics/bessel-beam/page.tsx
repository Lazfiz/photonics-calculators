import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/bessel-beam' },
    title: 'Bessel Beam Calculator',
  description: 'Non-diffracting beam profiles and propagation.'
};

export default function Page() {
  return <PageClient />;
}
