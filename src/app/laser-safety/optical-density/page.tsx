import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/optical-density' },
    title: 'Optical Density (CW point-source pre-check)',
  description: 'Bounded CW point-source optical-density pre-check derived from the same MPE branch as the MPE page.'
};

export default function Page() {
  return <PageClient />;
}
