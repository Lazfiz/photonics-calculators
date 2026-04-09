import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/optical-coherence' },
    title: 'Optical Coherence Theory',
  description: 'Temporal coherence, coherence length, axial resolution, and SNR estimation for OCT systems.'
};

export default function Page() {
  return <PageClient />;
}
