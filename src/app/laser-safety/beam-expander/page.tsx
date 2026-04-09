import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety/beam-expander",
    title: 'Beam Expander Safety',
  description: 'Calculate power density reduction from beam expansion. Critical for ensuring safe irradiance levels.'
};

export default function Page() {
  return <PageClient />;
}
