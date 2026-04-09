import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/q-switched-laser",
    title: 'Q-Switched Laser',
  description: 'High-energy pulse generation through repetitive Q-switching of a laser cavity.'
};

export default function Page() {
  return <PageClient />;
}
