import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/cold-mirror",
      title: 'Cold Mirror Design',
  description: 'Cold mirrors reflect visible light while transmitting infrared. Used in projector systems',
};

export default function Page() {
  return <PageClient />;
}
