import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/dark-noise-temperature' },
    title: 'Dark Noise vs Temperature',
  description: 'Temperature dependence of dark current and dark noise in photodiodes/CCDs.'
};

export default function Page() {
  return <PageClient />;
}
