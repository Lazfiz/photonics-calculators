import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/long-pass",
      title: 'Long Pass Filter',
  description: 'Quarter-wave stack (HL)N long-pass filter. Transmits > edge, reflects shorter wavelengths.',
};

export default function Page() {
  return <PageClient />;
}
