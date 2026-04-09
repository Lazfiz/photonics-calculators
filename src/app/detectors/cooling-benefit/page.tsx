import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/cooling-benefit' },
    title: 'Cooling Benefit Calculator',
  description: 'Dark current reduction and SNR improvement from thermoelectric (TEC) or cryogenic cooling.'
};

export default function Page() {
  return <PageClient />;
}
