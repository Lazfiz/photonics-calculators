import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/excess-noise' },
    title: 'Excess Noise Factor',
  description: 'APD excess noise vs gain — McIntyre model for different semiconductor materials.'
};

export default function Page() {
  return <PageClient />;
}
