import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/dichroic' },
      title: 'Dichroic Beam Splitter',
  description: 'Dichroic beam splitter at oblique incidence. Shows s- and p-polarisation splitting characteristic of dichroic filters used at 45°.',
};

export default function Page() {
  return <PageClient />;
}
