import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/wavefront-error' },
    title: 'Wavefront Error Analysis',
  description: 'Analyze wavefront error in waves RMS, compute Strehl ratio, and check diffraction-limited condition.'
};

export default function Page() {
  return <PageClient />;
}
