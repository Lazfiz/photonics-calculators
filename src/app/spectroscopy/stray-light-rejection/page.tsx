import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/stray-light-rejection",
    title: 'Stray Light Rejection',
  description: 'Impact of stray light on photometric accuracy. Critical for high-absorbance measurements.'
};

export default function Page() {
  return <PageClient />;
}
