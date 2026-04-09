import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/sensor-cmos' },
    title: 'CMOS Sensor Design',
  description: 'Pixel design parameters, dynamic range, noise floor, and sensitivity calculations.'
};

export default function Page() {
  return <PageClient />;
}
