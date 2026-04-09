import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/temporal-noise",
    title: 'Temporal Noise',
  description: '1/f noise, white (shot) noise, and read noise as functions of frequency and integration time.'
};

export default function Page() {
  return <PageClient />;
}
