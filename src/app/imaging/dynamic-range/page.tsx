import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/dynamic-range' },
    title: 'Dynamic Range Calculator',
  description: 'Imaging system dynamic range, noise floor, and ADC-limited performance analysis.'
};

export default function Page() {
  return <PageClient />;
}
