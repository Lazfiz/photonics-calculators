import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/edge-filter' },
      title: 'Edge Filter Design',
  description: '{type === "long" ? "Long-pass" : "Short-pass"} edge filter — quarter-wave stack transition region and cut-on/cut-off wavelength.',
};

export default function Page() {
  return <PageClient />;
}
