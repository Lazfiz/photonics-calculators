import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/wavefront-sensor",
    title: 'Shack-Hartmann Wavefront Sensor Calculator',
  description: 'Design parameters for Shack-Hartmann wavefront sensors including spot size, sensitivity, and dynamic range.'
};

export default function Page() {
  return <PageClient />;
}
