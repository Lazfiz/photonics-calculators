import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/wdm-coupler",
    title: 'Wdm Coupler',
  description: 'Interactive Wdm Coupler calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
