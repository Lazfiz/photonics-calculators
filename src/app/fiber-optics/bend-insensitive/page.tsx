import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/bend-insensitive' },
    title: 'Bend-Insensitive Fiber Design',
  description: 'Design and analyze bend-insensitive fibers with depressed cladding trenches (ITU-T G.657).',
};

export default function Page() {
  return <PageClient />;
}
