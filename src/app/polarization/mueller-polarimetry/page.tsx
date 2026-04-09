import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/polarization/mueller-polarimetry",
    title: 'Mueller Polarimetry',
  description: 'Build optical systems using Mueller matrices and analyze polarization transformations.'
};

export default function Page() {
  return <PageClient />;
}
