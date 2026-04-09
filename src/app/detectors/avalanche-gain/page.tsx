import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/avalanche-gain' },
    title: 'Avalanche Photodiode Gain',
  description: 'APD multiplication gain, excess noise factor (McIntyre), and material comparison.'
};

export default function Page() {
  return <PageClient />;
}
