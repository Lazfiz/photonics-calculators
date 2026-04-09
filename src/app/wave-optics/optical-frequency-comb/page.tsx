import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/optical-frequency-comb' },
    title: 'Optical Frequency Comb',
  description: 'Precision spectroscopy and metrology using a train of equally spaced narrow spectral lines.'
};

export default function Page() {
  return <PageClient />;
}
