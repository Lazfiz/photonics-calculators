import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/gain-temperature' },
    title: 'Gain vs Temperature',
  description: 'Temperature dependence of detector gain for APDs and PMTs.'
};

export default function Page() {
  return <PageClient />;
}
