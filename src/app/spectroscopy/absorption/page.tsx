import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/absorption",
      title: 'Beer-Lambert Absorption',
  description: 'A = cl — absorbance from molar extinction coefficient, concentration, and path length.',
};

export default function Page() {
  return <PageClient />;
}
