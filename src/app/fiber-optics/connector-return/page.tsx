import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/connector-return",
      title: 'Connector Return Loss',
  description: 'Calculates return loss (RL) and insertion loss (IL) for fiber connectors with air gaps, lateral offsets, and angular misalignment.',
};

export default function Page() {
  return <PageClient />;
}
