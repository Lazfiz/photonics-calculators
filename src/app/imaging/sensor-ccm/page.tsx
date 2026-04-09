import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/sensor-ccm",
    title: 'CCD/CCM Sensor Design',
  description: 'CCD sensor parameters, cooling requirements, dark current, and dynamic range analysis.'
};

export default function Page() {
  return <PageClient />;
}
