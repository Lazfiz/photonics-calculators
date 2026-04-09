import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/fiber-coupler",
    title: 'Fiber Coupler',
  description: 'Interactive Fiber Coupler calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
