import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/electron-multiplying' },
    title: 'EMCCD vs sCMOS',
  description: 'Compare electron-multiplying CCD with sCMOS for low-light imaging.'
};

export default function Page() {
  return <PageClient />;
}
