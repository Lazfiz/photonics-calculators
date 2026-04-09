import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/free-space-comms/atmosphere",
    title: 'Atmospheric Transmission',
  description: 'Molecular and aerosol extinction for free-space optical links.'
};

export default function Page() {
  return <PageClient />;
}
