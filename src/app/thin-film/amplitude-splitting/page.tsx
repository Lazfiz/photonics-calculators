import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/amplitude-splitting' },
    title: 'Amplitude Splitting',
  description: 'Multiple-beam interference from amplitude splitting at a thin film. Shows how partial reflections from each interface combine to form interference fringes.'
};

export default function Page() {
  return <PageClient />;
}
