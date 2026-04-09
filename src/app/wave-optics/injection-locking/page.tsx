import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/injection-locking",
    title: 'Injection Locking',
  description: 'Phase-locking a slave laser to a master laser through optical injection.'
};

export default function Page() {
  return <PageClient />;
}
