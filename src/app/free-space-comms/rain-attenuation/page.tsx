import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/free-space-comms/rain-attenuation",
    title: 'Rain Attenuation',
  description: 'Interactive Rain Attenuation calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
