import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/pupil-matching' },
      title: 'Pupil Matching in Microscopy',
  description: 'Exit pupil = (2ftubeNA)/(MobjMeyepiece). Match to eye pupil (2-8mm) for optimal brightness.',
};

export default function Page() {
  return <PageClient />;
}
